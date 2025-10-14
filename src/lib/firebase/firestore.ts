

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  Timestamp,
  addDoc,
  serverTimestamp,
  getDoc,
  runTransaction,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  where
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { Student, Admission, Assessment, Teacher, StudentAdmission, Enrollment, StudentStatusHistory, AttendanceRecord, Subject, AssessmentCategory, Fee, Invoice, Payment, InventoryItem, UserRole, Permissions, LetterGrade, AddressData } from "../types";
import { startOfDay, endOfDay, isEqual } from 'date-fns';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

// Type guards to check for Firestore Timestamps
const isTimestamp = (value: any): value is Timestamp => {
    return value && typeof value.toDate === 'function';
};

// Converts Firestore Timestamps in an object to JS Date objects
const convertTimestampsToDates = (data: any): any => {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(item => convertTimestampsToDates(item));
    }

    if (typeof data === 'object' && data !== null) {
        const newData: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (isTimestamp(value)) {
                    newData[key] = value.toDate();
                } else if (typeof value === 'object' && value !== null) { // Recurse into nested objects
                    newData[key] = convertTimestampsToDates(value);
                } else {
                    newData[key] = value;
                }
            }
        }
        return newData;
    }
    
    return data;
};

// Converts JS Date objects in an object to Firestore Timestamps
const convertDatesToTimestamps = (data: any): any => {
    if (!data) return data;

    if (Array.isArray(data)) {
        return data.map(item => convertDatesToTimestamps(item));
    }

    if (typeof data === 'object' && data !== null) {
        // Handle nested objects recursively
        const newData: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (value instanceof Date) {
                    newData[key] = Timestamp.fromDate(value);
                } else if (typeof value === 'object' && value !== null && !isTimestamp(value)) {
                    newData[key] = convertDatesToTimestamps(value);
                } else {
                    newData[key] = value;
                }
            }
        }
        return newData;
    }
    
    return data;
};

// --- Users Collection (for auth approval) ---
export async function getOrCreateUser(user: User) {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const userRef = doc(db, 'users', user.uid);
    
    const userDoc = await getDoc(userRef).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'get',
      }));
      throw serverError; // Re-throw to stop execution
    });

    if (!userDoc.exists()) {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            approved: false, // Default to not approved
            createdAt: serverTimestamp(),
        };
        setDoc(userRef, userData).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'create',
                requestResourceData: userData,
            }));
        });
    }
}


export async function deleteMainUser(uid: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const userDoc = doc(db, 'users', uid);
    deleteDoc(userDoc).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDoc.path,
        operation: 'delete',
      }));
    });
}


// --- App Metadata ---
const STARTING_STUDENT_ID = 1832;

export async function peekNextStudentId(): Promise<string> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const metadataRef = doc(db, 'metadata', 'studentCounter');
  
  try {
    const metadataDoc = await getDoc(metadataRef);
    if (metadataDoc.exists() && metadataDoc.data().lastId) {
      return `STU${metadataDoc.data().lastId + 1}`;
    } else {
      return `STU${STARTING_STUDENT_ID}`;
    }
  } catch (e) {
    console.error("Could not peek next student ID, returning default start:", e);
    // This is a safe fallback for display purposes if the doc doesn't exist yet.
    return `STU${STARTING_STUDENT_ID}`;
  }
}

export const getNextStudentId = async (): Promise<string> => {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const metadataRef = doc(db, 'metadata', 'studentCounter');
    
    try {
        const newIdNumber = await runTransaction(db, async (transaction) => {
            const metadataDoc = await transaction.get(metadataRef);
            let currentId = 0;
            if (metadataDoc.exists() && metadataDoc.data().lastId) {
                currentId = metadataDoc.data().lastId;
            }
            
            // If counter is uninitialized or has fallen behind, reset it
            if (currentId < STARTING_STUDENT_ID -1) {
                currentId = STARTING_STUDENT_ID -1;
            }

            const newId = currentId + 1;
            transaction.set(metadataRef, { lastId: newId }, { merge: true });
            return newId;
        });
        return `STU${newIdNumber}`;
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: metadataRef.path,
                operation: 'update',
            }));
        }
        console.error("Transaction failed to get next student ID: ", e);
        throw new Error("Could not generate a new student ID.");
    }
};


// --- Students Collection ---

export async function getStudents(): Promise<Student[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const studentsCollection = collection(db, 'students');
    const snapshot = await getDocs(studentsCollection).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: studentsCollection.path,
            operation: 'list',
        }));
        throw serverError;
    });
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const studentDataWithDates = convertTimestampsToDates(data);
        return {
            ...studentDataWithDates,
            studentId: doc.id,
        } as Student;
    });
}

export async function addStudent(studentData: Omit<Student, 'studentId' | 'status'>): Promise<Student> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    
    const newStudentId = await getNextStudentId();
    const studentDocRef = doc(db, 'students', newStudentId);

    const studentForFirestore: Partial<Student> & { status: string; enrollmentDate: Date | Timestamp } = {
        ...studentData,
        status: "Active",
        enrollmentDate: studentData.enrollmentDate ? Timestamp.fromDate(studentData.enrollmentDate) : serverTimestamp()
    };
    
    // Explicitly include familyId even if it's an empty string or null
    if ('familyId' in studentData) {
      studentForFirestore.familyId = studentData.familyId;
    }

    const dataWithTimestamps = convertDatesToTimestamps(studentForFirestore);
    
    setDoc(studentDocRef, dataWithTimestamps).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'create',
            requestResourceData: dataWithTimestamps,
        }));
    });
    
    const newStudent: Student = {
        ...(studentData as Omit<Student, 'studentId' | 'status'>),
        studentId: newStudentId,
        enrollmentDate: studentData.enrollmentDate || new Date(),
        status: "Active",
    };
    
    return newStudent;
}


export async function importStudents(studentsData: Partial<Student>[]): Promise<Student[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  
  const batch = writeBatch(db);
  const newStudents: Student[] = [];
  const studentsCollection = collection(db, "students");

  for (const student of studentsData) {
    const studentId = student.studentId || doc(studentsCollection).id;
    const newDocRef = doc(studentsCollection, studentId);

    const studentForFirestore = {
      ...student,
      enrollmentDate: student.enrollmentDate ? student.enrollmentDate : serverTimestamp(),
      status: student.status || "Active",
    };
  
    const cleanedStudentData = Object.entries(studentForFirestore).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as Partial<Student>);
    
    const dataWithTimestamps = convertDatesToTimestamps(cleanedStudentData);
    batch.set(newDocRef, dataWithTimestamps);
    
    newStudents.push({
      ...(cleanedStudentData as Student),
      studentId: newDocRef.id,
      enrollmentDate: student.enrollmentDate || new Date(),
    });
  }
  
  batch.commit().catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: studentsCollection.path,
          operation: 'create', // Batch write can be 'create' or 'update'
      }));
  });
  return newStudents;
}

export async function updateStudent(studentId: string, dataToUpdate: Partial<Student>): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const studentDoc = doc(db, 'students', studentId);
    
    const dataWithTimestamps = convertDatesToTimestamps(dataToUpdate);
    updateDoc(studentDoc, dataWithTimestamps).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: studentDoc.path,
            operation: 'update',
            requestResourceData: dataWithTimestamps,
        }));
    });
}



export async function updateStudentStatus(
    student: Student, 
    newStatus: Student['status'], 
    reason: string, 
    currentUser: User | null
): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    if (student.status === newStatus) return;
    if (!currentUser) throw new Error("User must be authenticated to change status.");

    const batch = writeBatch(db);

    const studentDocRef = doc(db, 'students', student.studentId);
    const historyDocRef = doc(collection(db, 'student_status_history'));
    
    let studentUpdateData: Partial<Student> = {
        status: newStatus
    };

    if (newStatus === 'Active') {
        studentUpdateData.deactivationDate = undefined;
        studentUpdateData.deactivationReason = undefined;
    } else {
        studentUpdateData.deactivationDate = new Date();
        studentUpdateData.deactivationReason = reason;
    }

    const cleanedStudentUpdateData = Object.fromEntries(
        Object.entries(studentUpdateData).filter(([_, v]) => v !== undefined)
    );

    const historyEntry = {
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        previousStatus: student.status,
        newStatus: newStatus,
        reason: reason,
        changedBy: {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName
        },
        changeDate: serverTimestamp()
    };
    
    batch.update(studentDocRef, convertDatesToTimestamps(cleanedStudentUpdateData));
    batch.set(historyDocRef, historyEntry);

    batch.commit().catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: studentDocRef.path, // Path of one of the docs in batch
            operation: 'update', 
        }));
    });
}


export async function deleteStudent(studentId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const studentDoc = doc(db, 'students', studentId);
    deleteDoc(studentDoc).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: studentDoc.path,
            operation: 'delete',
        }));
    });
}

export async function deleteSelectedStudents(studentIds: string[]): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    if (studentIds.length === 0) return;

    const batch = writeBatch(db);
    studentIds.forEach(id => {
        const studentDoc = doc(db, 'students', id);
        batch.delete(studentDoc);
    });

    batch.commit().catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'students', // Path of the collection
            operation: 'delete', 
        }));
    });
}

export async function deleteAllStudents(): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const studentsCollection = collection(db, 'students');
    const snapshot = await getDocs(studentsCollection);
    
    if (snapshot.empty) {
        return;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    batch.commit().catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: studentsCollection.path,
            operation: 'delete', 
        }));
    });
}

export async function swapLegacyStudentNames(): Promise<number> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");

    const studentsCollection = collection(db, 'students');
    const snapshot = await getDocs(studentsCollection);
    
    const batch = writeBatch(db);
    let updatedCount = 0;

    snapshot.docs.forEach(docSnap => {
        const student = { ...docSnap.data(), studentId: docSnap.id } as Student;
        const idNumberStr = student.studentId.replace('STU', '');
        
        if (idNumberStr) {
            const idNumber = parseInt(idNumberStr, 10);
            if (!isNaN(idNumber) && idNumber <= 1831) {
                const tempFirstName = student.firstName;
                const newFirstName = student.lastName;
                const newLastName = tempFirstName;

                const studentRef = doc(db, 'students', student.studentId);
                batch.update(studentRef, {
                    firstName: newFirstName,
                    lastName: newLastName
                });
                updatedCount++;
            }
        }
    });

    if (updatedCount > 0) {
        await batch.commit().catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: studentsCollection.path,
                operation: 'update', 
            }));
        });
    }

    return updatedCount;
}


// --- Student Status History ---
export async function getStudentStatusHistory(): Promise<StudentStatusHistory[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const historyCollection = collection(db, 'student_status_history');
    const q = query(historyCollection, orderBy("changeDate", "desc"));
    const snapshot = await getDocs(q).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: historyCollection.path,
            operation: 'list',
        }));
        throw serverError;
    });
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const historyDataWithDates = convertTimestampsToDates(data);
        return {
            ...historyDataWithDates,
            historyId: doc.id,
        } as StudentStatusHistory;
    });
}


// --- Admissions Collection ---

export async function getAdmissions(): Promise<Admission[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const admissionsCollection = collection(db, 'admissions');
    const snapshot = await getDocs(admissionsCollection).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: admissionsCollection.path,
            operation: 'list',
        }));
        throw serverError;
    });
    return snapshot.docs.map(doc => {
        return {
            ...doc.data(),
            admissionId: doc.id
        } as Admission
    });
}

export async function saveAdmission(admissionData: Admission, isNewClass: boolean = false): Promise<boolean> {
    if (!db) throw new Error("Firestore is not initialized");
    
    // Create a deep copy to avoid modifying the original object from the component state
    const cleanedData = JSON.parse(JSON.stringify(admissionData));
    const admissionDocRef = doc(db, 'admissions', cleanedData.schoolYear);

    const operation = isNewClass ? 'update' : 'create';

    const promise = isNewClass 
        ? setDoc(admissionDocRef, cleanedData, { merge: true })
        : setDoc(admissionDocRef, cleanedData);

    promise.catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: admissionDocRef.path,
            operation: operation,
            requestResourceData: cleanedData
        }));
    });
    
    // Assuming success unless an error is thrown
    return true;
}


export async function importAdmissions(importedData: { studentId: string; schoolYear: string; programId: string; level: string; }[]): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const admissionsByYear: Record<string, Admission> = {};

    // Group imported data by school year
    for (const row of importedData) {
        if (!admissionsByYear[row.schoolYear]) {
            admissionsByYear[row.schoolYear] = {
                admissionId: row.schoolYear,
                schoolYear: row.schoolYear,
                students: [],
                classes: [],
            };
        }
        
        let studentAdmission = admissionsByYear[row.schoolYear].students.find(s => s.studentId === row.studentId);
        if (studentAdmission) {
            studentAdmission.enrollments.push({ programId: row.programId, level: row.level });
        } else {
            admissionsByYear[row.schoolYear].students.push({
                studentId: row.studentId,
                enrollments: [{ programId: row.programId, level: row.level }],
            });
        }
    }

    const batch = writeBatch(db);

    for (const schoolYear in admissionsByYear) {
        const admissionDocRef = doc(db, 'admissions', schoolYear);
        // We use merge: true to avoid overwriting existing class definitions for that year
        batch.set(admissionDocRef, admissionsByYear[schoolYear], { merge: true });
    }

    await batch.commit().catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'admissions',
            operation: 'update',
        }));
    });
}


export async function moveStudentsToClass(studentIds: string[], schoolYear: string, fromClass: Enrollment | null, toClass: Enrollment): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const admissionRef = doc(db, 'admissions', schoolYear);

    try {
        await runTransaction(db, async (transaction) => {
            const admissionDoc = await transaction.get(admissionRef);
            let admissionData: Admission;

            if (!admissionDoc.exists()) {
                admissionData = {
                    admissionId: schoolYear,
                    schoolYear: schoolYear,
                    students: [],
                    classes: [],
                };
            } else {
                admissionData = { admissionId: admissionDoc.id, ...admissionDoc.data() } as Admission;
            }

            const studentSet = new Set(studentIds);
            
            // Update existing student admissions
            admissionData.students.forEach(studentAdmission => {
                if (studentSet.has(studentAdmission.studentId)) {
                    let enrollments = studentAdmission.enrollments || [];
                    
                    if (fromClass) {
                        enrollments = enrollments.filter(e => 
                            !(e.programId === fromClass.programId && e.level === fromClass.level)
                        );
                    }

                    const alreadyEnrolled = enrollments.some(e => 
                        e.programId === toClass.programId && e.level === toClass.level
                    );
                    if (!alreadyEnrolled) {
                        enrollments.push(toClass);
                    }
                    
                    studentAdmission.enrollments = enrollments;
                    studentSet.delete(studentAdmission.studentId);
                }
            });

            studentSet.forEach(studentId => {
                admissionData.students.push({
                    studentId: studentId,
                    enrollments: [toClass]
                });
            });

            transaction.set(admissionRef, admissionData);
        });
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: admissionRef.path,
                operation: 'update',
            }));
        }
        throw e;
    }
}

// --- Assessments Collection ---

export async function getAssessments(): Promise<Assessment[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const assessmentsCollection = collection(db, 'assessments');
    try {
        const snapshot = await getDocs(assessmentsCollection);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const dataWithDates = convertTimestampsToDates(data);
            return {
                ...dataWithDates,
                assessmentId: doc.id,
            } as Assessment;
        });
    } catch (serverError) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: assessmentsCollection.path,
            operation: 'list',
        }));
        console.error("Permission error fetching assessments, returning empty array.", serverError);
        return []; // Return empty array to prevent app crash
    }
}

export async function saveAssessment(assessmentData: Omit<Assessment, 'assessmentId'> | Assessment): Promise<Assessment | null> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    let promise: Promise<any>;
    const operation: 'create' | 'update' = 'assessmentId' in assessmentData ? 'update' : 'create';

    if (operation === 'update') {
        const assessmentDoc = doc(db, 'assessments', (assessmentData as Assessment).assessmentId);
        promise = setDoc(assessmentDoc, assessmentData);
    } else {
        const assessmentsCollection = collection(db, 'assessments');
        const dataToSave = {
            ...assessmentData,
            creationDate: serverTimestamp(),
        };
        promise = addDoc(assessmentsCollection, dataToSave).then(docRef => getDoc(docRef));
    }
    
    return promise.then(result => {
        if (operation === 'create') {
            return {
                ...convertTimestampsToDates(result.data()),
                assessmentId: result.id,
            } as Assessment;
        }
        return assessmentData as Assessment;
    }).catch(serverError => {
        const path = operation === 'update' ? `assessments/${(assessmentData as Assessment).assessmentId}` : 'assessments';
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: path,
            operation: operation,
            requestResourceData: assessmentData
        }));
        return null;
    });
}

// --- Teachers Collection ---

export async function getTeachers(): Promise<Teacher[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const teachersCollection = collection(db, 'teachers');

    try {
        const snapshot = await getDocs(teachersCollection);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const dataWithDates = convertTimestampsToDates(data);
            return { ...dataWithDates, teacherId: doc.id } as Teacher;
        });
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: teachersCollection.path,
            operation: 'list',
        }));
        throw error;
    }
}

export async function getTeacherForUser(userUid: string): Promise<Teacher | null> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    // First, get the user's email from the 'users' collection
    const userDocRef = doc(db, 'users', userUid);
    const userDoc = await getDoc(userDocRef).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
      }));
      throw serverError;
    });

    if (!userDoc.exists() || !userDoc.data()?.email) {
        return null;
    }
    const userEmail = userDoc.data()?.email;

    // Now, find the teacher record with that email
    const teachersCollection = collection(db, 'teachers');
    const q = query(teachersCollection, where("email", "==", userEmail));
    
    try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return null;
        }
        const teacherDoc = snapshot.docs[0];
        const data = teacherDoc.data();
        const dataWithDates = convertTimestampsToDates(data);
        return { ...dataWithDates, teacherId: teacherDoc.id } as Teacher;
    } catch (error) {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: teachersCollection.path,
            operation: 'list' // Query involves reading
        }));
        throw error;
    }
}


export async function addTeacher(teacherData: Omit<Teacher, 'teacherId' | 'status'>): Promise<Teacher | null> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const teachersCollection = collection(db, 'teachers');
    const q = query(teachersCollection, where("email", "==", teacherData.email));
    
    const existingTeacherSnapshot = await getDocs(q).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: teachersCollection.path,
            operation: 'list' // Query involves reading
        }));
        throw serverError;
    });

    if (!existingTeacherSnapshot.empty) {
        const existingTeacherDoc = existingTeacherSnapshot.docs[0];
        const teacherId = existingTeacherDoc.id;
        const dataToUpdate = { ...teacherData, status: 'Active' as const };
        const cleanedData = Object.fromEntries(Object.entries(dataToUpdate).filter(([_, v]) => v !== undefined));

        await updateDoc(existingTeacherDoc.ref, cleanedData).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: existingTeacherDoc.ref.path,
                operation: 'update',
                requestResourceData: cleanedData
            }));
        });
        
        return { ...existingTeacherDoc.data(), ...cleanedData, teacherId } as Teacher;
    } else {
        const teacherForFirestore = { ...teacherData, status: 'Active' as const, joinedDate: serverTimestamp() };
        const docRef = await addDoc(teachersCollection, teacherForFirestore).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: teachersCollection.path,
                operation: 'create',
                requestResourceData: teacherForFirestore
            }));
            throw serverError;
        });
        const newDoc = await getDoc(docRef);
        return { ...newDoc.data(), teacherId: docRef.id } as Teacher;
    }
}


export async function updateTeacher(teacherId: string, dataToUpdate: Partial<Teacher>): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const teacherDoc = doc(db, 'teachers', teacherId);

    const cleanedData = Object.fromEntries(Object.entries(dataToUpdate).filter(([_, v]) => v !== undefined));

    const dataWithTimestamps = convertDatesToTimestamps(cleanedData);
    updateDoc(teacherDoc, dataWithTimestamps).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: teacherDoc.path,
            operation: 'update',
            requestResourceData: dataWithTimestamps
        }));
    });
}

export async function deleteTeacher(teacherId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const teacherDoc = doc(db, 'teachers', teacherId);
    deleteDoc(teacherDoc).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: teacherDoc.path,
            operation: 'delete',
        }));
    });
}

// --- Attendance Collection ---

export async function getAttendanceForClass(classId: string, date: Date): Promise<AttendanceRecord[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");

    const attendanceCollection = collection(db, 'attendance');
    const q = query(
        attendanceCollection,
        where("classId", "==", classId)
    );

    const snapshot = await getDocs(q).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: attendanceCollection.path,
            operation: 'list'
        }));
        throw serverError;
    });

    const allRecords = snapshot.docs.map(doc => {
        const data = doc.data();
        const dataWithDates = convertTimestampsToDates(data);
        return {
            ...dataWithDates,
            attendanceId: doc.id,
        } as AttendanceRecord;
    });
    
    const targetDateStart = startOfDay(date);
    return allRecords.filter(record => isEqual(startOfDay(record.date), targetDateStart));
}


export async function saveAttendance(records: Omit<AttendanceRecord, 'attendanceId'>[]): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const batch = writeBatch(db);
    const attendanceCollection = collection(db, 'attendance');

    for (const record of records) {
        const startOfDayDate = startOfDay(record.date);
        const endOfDayDate = endOfDay(record.date);

        const q = query(
            attendanceCollection,
            where("classId", "==", record.classId),
            where("studentId", "==", record.studentId),
            where("date", ">=", Timestamp.fromDate(startOfDayDate)),
            where("date", "<=", Timestamp.fromDate(endOfDayDate))
        );
        const snapshot = await getDocs(q).catch(serverError => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: attendanceCollection.path,
                operation: 'list'
            }));
            throw serverError;
        });

        if (snapshot.empty) {
            const newDocRef = doc(attendanceCollection);
            batch.set(newDocRef, convertDatesToTimestamps(record));
        } else {
            const docToUpdate = snapshot.docs[0].ref;
            batch.update(docToUpdate, convertDatesToTimestamps(record));
        }
    }

    batch.commit().catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: attendanceCollection.path,
            operation: 'update'
        }));
    });
}

// --- FCM Tokens ---
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const tokenRef = doc(db, 'fcmTokens', token);
  const data = {
    userId: userId,
    token: token,
    createdAt: serverTimestamp(),
  };
  setDoc(tokenRef, data, { merge: true }).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: tokenRef.path,
          operation: 'create',
          requestResourceData: data,
      }));
  });
}


// --- Fees Collection ---

export async function getFees(): Promise<Fee[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const feesCollection = collection(db, 'fees');
    const snapshot = await getDocs(feesCollection).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: feesCollection.path,
            operation: 'list'
        }));
        throw serverError;
    });
    return snapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Fee, 'feeId'>),
        feeId: doc.id,
    }));
}

export async function saveFee(feeData: Omit<Fee, 'feeId'> | Fee): Promise<boolean> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const operation = 'feeId' in feeData ? 'update' : 'create';
    const collectionRef = collection(db, 'fees');
    const docRef = 'feeId' in feeData ? doc(collectionRef, feeData.feeId) : doc(collectionRef);
    
    const promise = setDoc(docRef, feeData, { merge: true });
    
    promise.catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: operation,
        requestResourceData: feeData,
      }));
    });

    return promise.then(() => true).catch(() => false);
}

export async function deleteFee(feeId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const feeDoc = doc(db, 'fees', feeId);
    deleteDoc(feeDoc).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: feeDoc.path,
            operation: 'delete',
        }));
    });
}

// --- Invoicing Collection ---

export async function getInvoices(): Promise<Invoice[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const invoicesCollection = collection(db, 'invoices');
    const q = query(invoicesCollection, orderBy("issueDate", "desc"));
    const snapshot = await getDocs(q).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: invoicesCollection.path,
            operation: 'list',
        }));
        throw serverError;
    });
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestampsToDates({
            ...data,
            invoiceId: doc.id,
        }) as Invoice;
    });
}

export async function saveInvoice(invoiceData: Omit<Invoice, 'invoiceId'> | Invoice): Promise<boolean> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const dataWithTimestamps = convertDatesToTimestamps(invoiceData);
    const operation = 'invoiceId' in invoiceData ? 'update' : 'create';
    const collectionRef = collection(db, 'invoices');
    const docRef = 'invoiceId' in invoiceData ? doc(collectionRef, invoiceData.invoiceId) : doc(collectionRef);

    const promise = setDoc(docRef, dataWithTimestamps, { merge: true });
    
    promise.catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: operation,
        requestResourceData: dataWithTimestamps,
      }));
    });

    return promise.then(() => true).catch(() => false);
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const invoiceDoc = doc(db, 'invoices', invoiceId);
    deleteDoc(invoiceDoc).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: invoiceDoc.path,
            operation: 'delete',
        }));
    });
}

// --- Inventory Collection ---

export async function getInventoryItems(): Promise<InventoryItem[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const inventoryCollection = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryCollection).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: inventoryCollection.path,
            operation: 'list',
        }));
        throw serverError;
    });
    return snapshot.docs.map(doc => ({
        ...(doc.data() as Omit<InventoryItem, 'itemId'>),
        itemId: doc.id,
    }));
}

export async function saveInventoryItem(itemData: Omit<InventoryItem, 'itemId'> | InventoryItem): Promise<boolean> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const dataWithTimestamps = convertDatesToTimestamps(itemData);
    const operation = 'itemId' in itemData ? 'update' : 'create';
    const collectionRef = collection(db, 'inventory');
    const docRef = 'itemId' in itemData ? doc(collectionRef, itemData.itemId) : doc(collectionRef);

    const promise = setDoc(docRef, dataWithTimestamps, { merge: true });

    promise.catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: operation,
            requestResourceData: dataWithTimestamps,
        }));
    });

    return promise.then(() => true).catch(() => false);
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const itemDoc = doc(db, 'inventory', itemId);
    deleteDoc(itemDoc).catch(serverError => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: itemDoc.path,
            operation: 'delete',
        }));
    });
}

// --- Settings Collections ---

export async function getSubjects(): Promise<Subject[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'subjects');
  const docSnap = await getDoc(settingsDocRef).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'get'
      }));
      throw serverError;
  });
  
  if (docSnap.exists() && docSnap.data().list) {
    return docSnap.data().list;
  }
  return [];
}

export async function saveSubjects(subjects: Subject[]): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'subjects');
  const data = { list: subjects };
  setDoc(settingsDocRef, data).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
  });
}

export async function getAssessmentCategories(): Promise<AssessmentCategory[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'assessmentCategories');
  const docSnap = await getDoc(settingsDocRef).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'get'
      }));
      throw serverError;
  });

  if (docSnap.exists() && docSnap.data().list) {
    return docSnap.data().list;
  }
  return [];
}

export async function saveAssessmentCategories(categories: AssessmentCategory[]): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'assessmentCategories');
  const data = { list: categories };
  setDoc(settingsDocRef, data).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
  });
}

export async function getRoles(): Promise<UserRole[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'roles');
  const docSnap = await getDoc(settingsDocRef).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'get'
      }));
      throw serverError;
  });
  
  if (docSnap.exists() && docSnap.data().list) {
    return docSnap.data().list;
  }
  return ['Admin', 'Receptionist', 'Head of Department', 'Teacher'];
}

export async function saveRoles(roles: UserRole[]): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'roles');
  const data = { list: roles };
  setDoc(settingsDocRef, data).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
  });
}

export async function getPermissions(): Promise<Permissions> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'permissions');
  const docSnap = await getDoc(settingsDocRef).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'get'
      }));
      throw serverError;
  });
  
  if (docSnap.exists() && docSnap.data().config) {
    return docSnap.data().config;
  }
  return {} as Permissions;
}

export async function savePermissions(permissions: Permissions): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'permissions');
  const data = { config: permissions };
  setDoc(settingsDocRef, data).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
  });
}

export async function getGradeScale(): Promise<LetterGrade[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'gradeScale');
  const docSnap = await getDoc(settingsDocRef).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'get'
      }));
      throw serverError;
  });
  
  if (docSnap.exists() && docSnap.data().grades) {
    return docSnap.data().grades;
  }
  return [];
}

export async function saveGradeScale(grades: LetterGrade[]): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'gradeScale');
  const data = { grades: grades };
  setDoc(settingsDocRef, data).catch(serverError => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: settingsDocRef.path,
        operation: 'update',
        requestResourceData: data,
      }));
  });
}
    

    

