

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
import type { Student, Admission, Assessment, Teacher, StudentAdmission, Enrollment, StudentStatusHistory, AttendanceRecord, Subject, AssessmentCategory, Fee, Invoice, Payment, InventoryItem, UserRole, Permissions } from "../types";
import { startOfDay, endOfDay, isEqual } from 'date-fns';

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

// --- Users Collection (for auth approval) ---
export async function getOrCreateUser(user: User) {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            approved: false, // Default to not approved
            createdAt: serverTimestamp(),
        });
    }
}

export async function getUsers(): Promise<User[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => convertTimestampsToDates(doc.data()) as User);
}


// --- App Metadata ---
const STARTING_STUDENT_ID = 1831;

export async function peekNextStudentId(): Promise<string> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const metadataRef = doc(db, 'metadata', 'studentCounter');
    
    try {
        const metadataDoc = await getDoc(metadataRef);
        let lastId = STARTING_STUDENT_ID;
        if (metadataDoc.exists() && metadataDoc.data().lastId) {
            lastId = metadataDoc.data().lastId;
        }
        return `STU${lastId + 1}`;
    } catch (e) {
        console.error("Could not peek next student ID: ", e);
        throw new Error("Could not peek next student ID.");
    }
}


export const getNextStudentId = async (): Promise<string> => {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const metadataRef = doc(db, 'metadata', 'studentCounter');
    
    try {
        const newIdNumber = await runTransaction(db, async (transaction) => {
            const metadataDoc = await transaction.get(metadataRef);
            let currentId = STARTING_STUDENT_ID;
            if (metadataDoc.exists() && metadataDoc.data().lastId) {
                currentId = metadataDoc.data().lastId;
            }
            const newId = currentId + 1;
            transaction.set(metadataRef, { lastId: newId }, { merge: true });
            return newId;
        });
        return `STU${newIdNumber}`;
    } catch (e) {
        console.error("Transaction failed to get next student ID: ", e);
        throw new Error("Could not generate a new student ID.");
    }
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
        const dataToSave = {
            ...assessmentData,
            teacherId: "T001", // Placeholder teacher ID
            creationDate: serverTimestamp(),
        };
        const newDocRef = await addDoc(assessmentsCollection, dataToSave);
        const docSnapshot = await getDoc(newDocRef);
        const newAssessmentData = docSnapshot.data();

        const newAssessment: Assessment = {
            ...convertTimestampsToDates(newAssessmentData),
            assessmentId: newDocRef.id,
        } as Assessment;
        
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

// --- Attendance Collection ---

export async function getAttendanceForClass(classId: string, date: Date): Promise<AttendanceRecord[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");

    const attendanceCollection = collection(db, 'attendance');
    const q = query(
        attendanceCollection,
        where("classId", "==", classId)
    );

    const snapshot = await getDocs(q);
    const allRecords = snapshot.docs.map(doc => {
        const data = doc.data();
        const dataWithDates = convertTimestampsToDates(data);
        return {
            ...dataWithDates,
            attendanceId: doc.id,
        } as AttendanceRecord;
    });

    // Filter by date on the client
    const targetDateStart = startOfDay(date);
    return allRecords.filter(record => isEqual(startOfDay(record.date), targetDateStart));
}


export async function saveAttendance(records: Omit<AttendanceRecord, 'attendanceId'>[]): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const batch = writeBatch(db);
    const attendanceCollection = collection(db, 'attendance');

    for (const record of records) {
        // Find existing record for this student, class, and day to update it
        const startOfDay = new Date(record.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(record.date);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(
            attendanceCollection,
            where("classId", "==", record.classId),
            where("studentId", "==", record.studentId),
            where("date", ">=", Timestamp.fromDate(startOfDay)),
            where("date", "<=", Timestamp.fromDate(endOfDay))
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            // No existing record, create a new one
            const newDocRef = doc(attendanceCollection);
            batch.set(newDocRef, convertDatesToTimestamps(record));
        } else {
            // Existing record found, update it
            const docToUpdate = snapshot.docs[0].ref;
            batch.update(docToUpdate, convertDatesToTimestamps(record));
        }
    }

    await batch.commit();
}

// --- FCM Tokens ---
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const tokenRef = doc(db, 'fcmTokens', token);
  await setDoc(tokenRef, {
    userId: userId,
    token: token,
    createdAt: serverTimestamp(),
  }, { merge: true });
}


// --- Fees Collection ---

export async function getFees(): Promise<Fee[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const feesCollection = collection(db, 'fees');
    const snapshot = await getDocs(feesCollection);
    return snapshot.docs.map(doc => ({
        ...(doc.data() as Omit<Fee, 'feeId'>),
        feeId: doc.id,
    }));
}

export async function saveFee(feeData: Omit<Fee, 'feeId'> | Fee): Promise<Fee> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    if ('feeId' in feeData) {
        // Update existing fee
        const feeDoc = doc(db, 'fees', feeData.feeId);
        await setDoc(feeDoc, feeData, { merge: true });
        return feeData;
    } else {
        // Create new fee
        const feesCollection = collection(db, 'fees');
        const newDocRef = await addDoc(feesCollection, feeData);
        return {
            ...feeData,
            feeId: newDocRef.id,
        };
    }
}

export async function deleteFee(feeId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const feeDoc = doc(db, 'fees', feeId);
    await deleteDoc(feeDoc);
}

// --- Invoicing Collection ---

export async function getInvoices(): Promise<Invoice[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const invoicesCollection = collection(db, 'invoices');
    const q = query(invoicesCollection, orderBy("issueDate", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return convertTimestampsToDates({
            ...data,
            invoiceId: doc.id,
        }) as Invoice;
    });
}

export async function saveInvoice(invoiceData: Omit<Invoice, 'invoiceId'> | Invoice): Promise<Invoice> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    const dataWithTimestamps = convertDatesToTimestamps(invoiceData);

    if ('invoiceId' in invoiceData) {
        const invoiceDoc = doc(db, 'invoices', invoiceData.invoiceId);
        await setDoc(invoiceDoc, dataWithTimestamps, { merge: true });
        return invoiceData;
    } else {
        const invoicesCollection = collection(db, 'invoices');
        const newDocRef = await addDoc(invoicesCollection, dataWithTimestamps);
        return {
            ...invoiceData,
            invoiceId: newDocRef.id,
        };
    }
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const invoiceDoc = doc(db, 'invoices', invoiceId);
    await deleteDoc(invoiceDoc);
}

// --- Inventory Collection ---

export async function getInventoryItems(): Promise<InventoryItem[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const inventoryCollection = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryCollection);
    return snapshot.docs.map(doc => ({
        ...(doc.data() as Omit<InventoryItem, 'itemId'>),
        itemId: doc.id,
    }));
}

export async function saveInventoryItem(itemData: Omit<InventoryItem, 'itemId'> | InventoryItem): Promise<InventoryItem> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    
    if ('itemId' in itemData) {
        // Update existing item
        const itemDoc = doc(db, 'inventory', itemData.itemId);
        await setDoc(itemDoc, itemData, { merge: true });
        return itemData;
    } else {
        // Create new item
        const inventoryCollection = collection(db, 'inventory');
        const newDocRef = await addDoc(inventoryCollection, itemData);
        return {
            ...itemData,
            itemId: newDocRef.id,
        };
    }
}

export async function deleteInventoryItem(itemId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const itemDoc = doc(db, 'inventory', itemId);
await deleteDoc(itemDoc);
}

// --- Settings Collections ---

export async function getSubjects(): Promise<Subject[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'subjects');
  const docSnap = await getDoc(settingsDocRef);
  
  if (docSnap.exists() && docSnap.data().list) {
    return docSnap.data().list;
  } else {
    // If no subjects in DB, return mock data
    return [
        { subjectId: 'SUB001', subjectName: 'Mathematics' },
        { subjectId: 'SUB002', subjectName: 'Physics' },
        { subjectId: 'SUB003', subjectName: 'English Literature' },
        { subjectId: 'SUB004', subjectName: 'History' },
    ];
  }
}

export async function saveSubjects(subjects: Subject[]): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'subjects');
  await setDoc(settingsDocRef, { list: subjects });
}

export async function getAssessmentCategories(): Promise<AssessmentCategory[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'assessmentCategories');
  const docSnap = await getDoc(settingsDocRef);

  if (docSnap.exists() && docSnap.data().list) {
    return docSnap.data().list;
  } else {
    // Default values if not set
    return [
      { name: 'Classwork', weight: 25 },
      { name: 'Participation', weight: 5 },
      { name: 'Homework', weight: 5 },
      { name: 'Unit Assessment', weight: 30 },
      { name: 'End-Semester', weight: 35 },
    ];
  }
}

export async function saveAssessmentCategories(categories: AssessmentCategory[]): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'assessmentCategories');
  await setDoc(settingsDocRef, { list: categories });
}

export async function getRoles(): Promise<UserRole[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'roles');
  const docSnap = await getDoc(settingsDocRef);
  
  if (docSnap.exists() && docSnap.data().list) {
    return docSnap.data().list;
  } else {
    // Default roles if none are set in the database
    return ['Admin', 'Receptionist', 'Head of Department', 'Teacher'];
  }
}

export async function saveRoles(roles: UserRole[]): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'roles');
  await setDoc(settingsDocRef, { list: roles });
}

export async function getPermissions(): Promise<Permissions> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'permissions');
  const docSnap = await getDoc(settingsDocRef);
  
  if (docSnap.exists() && docSnap.data().config) {
    return docSnap.data().config;
  }
  // Return a default if not found, we can define this elsewhere
  return {} as Permissions;
}

export async function savePermissions(permissions: Permissions): Promise<void> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  const settingsDocRef = doc(db, 'settings', 'permissions');
  await setDoc(settingsDocRef, { config: permissions });
}
