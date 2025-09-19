
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  Timestamp,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, Admission, StudentAdmission, Enrollment } from "../types";

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
                } else if (typeof value === 'object') {
                    newData[key] = convertTimestampsToDates(value);
                }
                 else {
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
                } else if (typeof value === 'object' && !isTimestamp(value)) {
                    newData[key] = convertDatesToTimestamps(value);
                }
                 else {
                    newData[key] = value;
                }
            }
        }
        return newData;
    }
    
    return data;
};

// --- Students Collection ---

export async function getStudents(): Promise<Student[]> {
    if (!db) throw new Error("Firestore is not initialized");
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

export async function addStudent(studentData: Omit<Student, 'studentId' | 'enrollmentDate'>): Promise<Student> {
    if (!db) throw new Error("Firestore is not initialized");
    const studentsCollection = collection(db, 'students');
    const studentWithTimestamps = convertDatesToTimestamps({
        ...studentData,
        enrollmentDate: serverTimestamp() // Use server timestamp for creation
    });
    
    const docRef = await addDoc(studentsCollection, studentWithTimestamps);
    
    // We can be optimistic and not fetch the doc again for the enrollmentDate
    const newStudent: Student = {
        ...studentData,
        studentId: docRef.id,
        enrollmentDate: new Date(),
    };
    return newStudent;
}


export async function updateStudent(studentId: string, dataToUpdate: Partial<Student>): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized");
    const studentDoc = doc(db, 'students', studentId);
    const dataWithTimestamps = convertDatesToTimestamps(dataToUpdate);
    await updateDoc(studentDoc, dataWithTimestamps);
}

// --- Admissions Collection ---

export async function getAdmissions(): Promise<Admission[]> {
    if (!db) throw new Error("Firestore is not initialized");
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
    if (!db) throw new Error("Firestore is not initialized");
    const admissionsCollection = collection(db, 'admissions');
    const admissionDoc = doc(admissionsCollection, admissionData.admissionId);
    // Firestore doesn't like undefined values, so let's clean the object
    const cleanedAdmission = JSON.parse(JSON.stringify(admissionData));
    await setDoc(admissionDoc, cleanedAdmission);
}
