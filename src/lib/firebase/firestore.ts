
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
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, Admission, Assessment } from "../types";

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

export async function importStudents(studentsData: Omit<Student, 'studentId' | 'avatarUrl'>[]): Promise<Student[]> {
  if (!db || !db.app) throw new Error("Firestore is not initialized.");
  
  const batch = writeBatch(db);
  const newStudents: Student[] = [];

  for (const student of studentsData) {
    const newDocRef = doc(collection(db, 'students'));
    const studentId = newDocRef.id;

    const studentForFirestore: Omit<Student, 'enrollmentDate'> & { enrollmentDate: any } = {
      ...student,
      studentId, 
      status: 'Active',
      enrollmentDate: serverTimestamp(),
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
      ...student,
      studentId: studentId,
      status: 'Active',
      enrollmentDate: new Date(),
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

export async function deleteStudent(studentId: string): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const studentDoc = doc(db, 'students', studentId);
    await deleteDoc(studentDoc);
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

export async function saveAdmission(admissionData: Admission): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const admissionDoc = doc(db, 'admissions', admissionData.admissionId);
    const cleanedAdmission = JSON.parse(JSON.stringify(admissionData));
    await setDoc(admissionDoc, cleanedAdmission);
}

// --- Assessments Collection ---

export async function getAssessments(): Promise<Assessment[]> {
    if (!db || !db.app) throw new Error("Firestore is not initialized.");
    const assessmentsCollection = collection(db, 'assessments');
    const snapshot = await getDocs(assessmentsCollection);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        assessmentId: doc.id,
    } as Assessment));
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
        });
        return {
            ...assessmentData,
            assessmentId: newDocRef.id,
            teacherId: "T001",
        };
    }
}
