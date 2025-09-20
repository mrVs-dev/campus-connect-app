
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
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, Admission } from "../types";

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

export async function addStudent(studentData: Omit<Student, 'studentId' | 'enrollmentDate'>): Promise<Student> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    
    const studentsCollection = collection(db, 'students');
    
    // Prepare the data for Firestore, ensuring avatarUrl is handled correctly.
    const studentForFirestore = {
        ...studentData,
        avatarUrl: studentData.avatarUrl || "", // Ensure avatarUrl is at least an empty string
        enrollmentDate: serverTimestamp() 
    };
    
    const dataWithTimestamps = convertDatesToTimestamps(studentForFirestore);

    const docRef = await addDoc(studentsCollection, dataWithTimestamps);
    
    // To avoid race conditions with serverTimestamp, we are optimistic
    // and return the new student object with a client-side date.
    // The actual server date will be correct in the database.
    const newStudent: Student = {
      ...studentData,
      studentId: docRef.id,
      enrollmentDate: new Date(), // Use client-side date for immediate UI update
    };
    
    return newStudent;
}


export async function updateStudent(studentId: string, dataToUpdate: Partial<Student>): Promise<void> {
    if (!db || !db.app) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const studentDoc = doc(db, 'students', studentId);
    const dataWithTimestamps = convertDatesToTimestamps(dataToUpdate);
    await updateDoc(studentDoc, dataWithTimestamps);
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
