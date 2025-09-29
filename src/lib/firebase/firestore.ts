

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
  orderBy
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { Student, Admission, Assessment, Teacher, StudentAdmission, Enrollment, StudentStatusHistory } from "../types";

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

// --- App Metadata ---
const getNextStudentId = async (): Promise<string> => {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const metadataRef = doc(db, 'metadata', 'studentCounter');
    const startingId = 1831; // Start counting from here, so first student is 1832
    
    let nextId = startingId + 1;

    try {
        await runTransaction(db, async (transaction) => {
            const metadataDoc = await transaction.get(metadataRef);
            if (!metadataDoc.exists() || !metadataDoc.data().lastId || metadataDoc.data().lastId < startingId) {
                // If it doesn't exist or is lower than our new starting point, set it.
                 transaction.set(metadataRef, { lastId: nextId });
            } else {
                const currentId = metadataDoc.data().lastId;
                nextId = currentId + 1;
                transaction.update(metadataRef, { lastId: nextId });
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw new Error("Could not generate a new student ID.");
    }

    return `STU${nextId}`;
};


// --- Students Collection ---

export async function getStudents(): Promise<Student[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const studentsCollection = collection(db, 'students');
    const snapshot = await getDocs(studentsCollection);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const studentDataWithDates = convertTimestampsToDates(data);
        return {
            ...studentDataWithDates,
            studentId: doc.id,
        } as Student;
    });
}

export async function addStudent(studentData: Omit<Student, 'studentId' | 'enrollmentDate' | 'status'>): Promise<Student> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    
    const newStudentId = await getNextStudentId();
    const studentDocRef = doc(db, 'students', newStudentId);

    const studentForFirestore = {
        ...studentData,
        status: "Active",
        enrollmentDate: serverTimestamp() 
    };
    
    const dataWithTimestamps = convertDatesToTimestamps(studentForFirestore);
    await setDoc(studentDocRef, dataWithTimestamps);
    
    const newStudent: Student = {
        ...studentData,
        studentId: newStudentId,
        enrollmentDate: new Date(),
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
  
  await batch.commit();
  return newStudents;
}

export async function updateStudent(studentId: string, dataToUpdate: Partial<Student>): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const studentDoc = doc(db, 'students', studentId);
    const dataWithTimestamps = convertDatesToTimestamps(dataToUpdate);
    await updateDoc(studentDoc, dataWithTimestamps);
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
    
    const studentUpdateData: Partial<Student> = {
        status: newStatus
    };

    if (newStatus === 'Active') {
        studentUpdateData.deactivationDate = undefined;
        studentUpdateData.deactivationReason = undefined;
    } else {
        studentUpdateData.deactivationDate = new Date();
        studentUpdateData.deactivationReason = reason;
    }

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
    
    batch.update(studentDocRef, convertDatesToTimestamps(studentUpdateData));
    batch.set(historyDocRef, historyEntry);

    await batch.commit();
}


export async function deleteStudent(studentId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const studentDoc = doc(db, 'students', studentId);
    await deleteDoc(studentDoc);
}

export async function deleteSelectedStudents(studentIds: string[]): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    if (studentIds.length === 0) return;

    const batch = writeBatch(db);
    studentIds.forEach(id => {
        const studentDoc = doc(db, 'students', id);
        batch.delete(studentDoc);
    });

    await batch.commit();
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

    await batch.commit();
}

// --- Student Status History ---
export async function getStudentStatusHistory(): Promise<StudentStatusHistory[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const historyCollection = collection(db, 'student_status_history');
    const q = query(historyCollection, orderBy("changeDate", "desc"));
    const snapshot = await getDocs(q);
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
    const snapshot = await getDocs(admissionsCollection);
    return snapshot.docs.map(doc => {
        return {
            ...doc.data(),
            admissionId: doc.id
        } as Admission
    });
}

export async function saveAdmission(admissionData: Admission, isNewClass: boolean = false): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");
    const admissionDocRef = doc(db, 'admissions', admissionData.schoolYear);

    const cleanedData = JSON.parse(JSON.stringify(admissionData));

    // When adding a new class, we must merge to avoid overwriting the whole year.
    // When editing a roster (not a new class), we overwrite the whole document.
    if (isNewClass) {
        await setDoc(admissionDocRef, cleanedData, { merge: true });
    } else {
        await setDoc(admissionDocRef, cleanedData);
    }
}


export async function moveStudentsToClass(studentIds: string[], schoolYear: string, fromClass: Enrollment | null, toClass: Enrollment): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const admissionRef = doc(db, 'admissions', schoolYear);

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
                
                // 1. Remove from the 'from' class if specified
                if (fromClass) {
                    enrollments = enrollments.filter(e => 
                        !(e.programId === fromClass.programId && e.level === fromClass.level)
                    );
                }

                // 2. Add to the 'to' class if not already there
                const alreadyEnrolled = enrollments.some(e => 
                    e.programId === toClass.programId && e.level === toClass.level
                );
                if (!alreadyEnrolled) {
                    enrollments.push(toClass);
                }
                
                studentAdmission.enrollments = enrollments;
                studentSet.delete(studentAdmission.studentId); // Mark as processed
            }
        });

        // Add students who were not in the admission year at all
        studentSet.forEach(studentId => {
            admissionData.students.push({
                studentId: studentId,
                enrollments: [toClass]
            });
        });

        transaction.set(admissionRef, admissionData);
    });
}

// --- Assessments Collection ---

export async function getAssessments(): Promise<Assessment[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const assessmentsCollection = collection(db, 'assessments');
    const snapshot = await getDocs(assessmentsCollection);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const dataWithDates = convertTimestampsToDates(data);
        return {
            ...dataWithDates,
            assessmentId: doc.id,
        } as Assessment;
    });
}

export async function saveAssessment(assessmentData: Omit<Assessment, 'assessmentId' | 'teacherId'> | Assessment): Promise<Assessment> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    if ('assessmentId' in assessmentData) {
        // Update existing assessment
        const assessmentDoc = doc(db, 'assessments', assessmentData.assessmentId);
        await setDoc(assessmentDoc, assessmentData, { merge: true });
        return assessmentData;
    } else {
        // Create new assessment
        const assessmentsCollection = collection(db, 'assessments');
        const newDocRef = await addDoc(assessmentsCollection, {
            ...assessmentData,
            teacherId: "T001", // Placeholder teacher ID
            creationDate: serverTimestamp(),
        });
        const newAssessment: Assessment = {
            ...assessmentData,
            assessmentId: newDocRef.id,
            teacherId: "T001",
            creationDate: new Date(),
        };
        return newAssessment;
    }
}

// --- Teachers Collection ---

export async function getTeachers(): Promise<Teacher[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const teachersCollection = collection(db, 'teachers');
    const snapshot = await getDocs(teachersCollection);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const dataWithDates = convertTimestampsToDates(data);
        return {
            ...dataWithDates,
            teacherId: doc.id,
        } as Teacher;
    });
}

export async function addTeacher(teacherData: Omit<Teacher, 'teacherId' | 'status' | 'joinedDate'>): Promise<Teacher> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const teachersCollection = collection(db, 'teachers');
    const teacherForFirestore = {
        ...teacherData,
        status: 'Active' as const,
        joinedDate: serverTimestamp(),
    };

    const docRef = await addDoc(teachersCollection, teacherForFirestore);
    
    const newTeacher: Teacher = {
        ...teacherData,
        teacherId: docRef.id,
        status: 'Active',
        joinedDate: new Date(),
    };
    return newTeacher;
}


export async function updateTeacher(teacherId: string, dataToUpdate: Partial<Teacher>): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const teacherDoc = doc(db, 'teachers', teacherId);
    const dataWithTimestamps = convertDatesToTimestamps(dataToUpdate);
    await updateDoc(teacherDoc, dataWithTimestamps);
}

    
