
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

    const convert = (obj: any): any => {
        if (!obj) return obj;
        if (Array.isArray(obj)) {
            return obj.map(item => convert(item));
        }
        if (typeof obj === 'object' && obj !== null && !(obj instanceof Timestamp)) {
            const newObj: { [key: string]: any } = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    if (value instanceof Date) {
                        newObj[key] = Timestamp.fromDate(value);
                    } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                         const date = new Date(value);
                         if (!isNaN(date.getTime())) {
                            newObj[key] = Timestamp.fromDate(date);
                         } else {
                            newObj[key] = value;
                         }
                    } else if (typeof value === 'object') {
                        newObj[key] = convert(value);
                    } else {
                        newObj[key] = value;
                    }
                }
            }
            return newObj;
        }
        return obj;
    };
    
    return convert(data);
};


// --- Students Collection ---

export async function getStudents(): Promise<Student[]> {
    if (!db) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
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

export async function addStudent(studentData: Omit<Student, 'studentId' | 'enrollmentDate' | 'avatarUrl'> & {avatarUrl?: string}): Promise<Student> {
    if (!db) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    
    const studentsCollection = collection(db, 'students');
    
    // Create a clean copy for Firestore, ensuring dates are handled
    const studentForFirestore = {
        ...studentData,
        enrollmentDate: serverTimestamp() // Use server timestamp for creation
    };
    
    const dataWithTimestamps = convertDatesToTimestamps(studentForFirestore);

    const docRef = await addDoc(studentsCollection, dataWithTimestamps);
    
    // Fetch the just-created document to get the server-generated timestamp
    const newDoc = await getDoc(docRef);
    const newStudentData = newDoc.data();

    return convertTimestampsToDates({
        ...newStudentData,
        studentId: docRef.id,
    }) as Student;
}


export async function updateStudent(studentId: string, dataToUpdate: Partial<Student>): Promise<void> {
    if (!db) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const studentDoc = doc(db, 'students', studentId);
    const dataWithTimestamps = convertDatesToTimestamps(dataToUpdate);
    await updateDoc(studentDoc, dataWithTimestamps);
}

// --- Admissions Collection ---

export async function getAdmissions(): Promise<Admission[]> {
    if (!db) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
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
    if (!db) throw new Error("Firestore is not initialized. Check your Firebase configuration.");
    const admissionDoc = doc(db, 'admissions', admissionData.admissionId);
    // Firestore doesn't like undefined values, so let's clean the object
    const cleanedAdmission = JSON.parse(JSON.stringify(admissionData));
    await setDoc(admissionDoc, cleanedAdmission);
}
