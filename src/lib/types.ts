

export type Guardian = {
  relation: string;
  name: string;
  occupation?: string;
  workplace?: string;
  mobiles: string[];
};

export type Enrollment = {
  programId: string;
  level: string;
  teacherIds?: string[];
};

export interface Student {
  studentId: string;
  enrollmentDate?: Date;
  firstName: string;
  middleName?: string;
  lastName: string;
  khmerFirstName?: string;
  khmerLastName?: string;
  sex?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: Date;
  placeOfBirth?: string;
  nationality?: string;
  nationalId?: string;
  status: 'Active' | 'Inactive' | 'Graduated';
  previousSchool?: string;
  address?: {
    district?: string;
    commune?: string;
    village?: string;
    street?: string;
    house?: string;
  };
  guardians?: Guardian[];
  mediaConsent?: boolean;
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  avatarUrl?: string;
  enrollments?: Enrollment[];
  deactivationDate?: Date;
  deactivationReason?: string;
}

export type StudentStatusHistory = {
  historyId: string;
  studentId: string;
  studentName: string;
  previousStatus: Student['status'];
  newStatus: Student['status'];
  reason: string;
  changedBy: {
    uid: string;
    email: string | null;
    displayName: string | null;
  };
  changeDate: Date;
};


export interface Teacher {
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
  joinedDate?: Date;
}

export interface Subject {
  subjectId: string;
  subjectName: string;
}

export interface AssessmentCategory {
  name: string;
  weight: number;
}


export interface Assessment {
  assessmentId: string;
  subjectId: string;
  teacherId: string;
  topic: string;
  category: string; // Now a string, not the enum
  totalMarks: number;
  scores: Record<string, number>; // { [studentId]: rawScore }
  creationDate?: Date;
}

// For yearly admissions
export type StudentAdmission = {
  studentId: string;
  enrollments: Enrollment[];
};

export interface Admission {
  admissionId: string; // e.g., '2025-2026'
  schoolYear: string;
  students: StudentAdmission[];
  classes?: Enrollment[]; // To store empty class definitions
}

// --- Attendance ---
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  classId: string; 
  date: Date;
  status: AttendanceStatus;
  minutesLate?: number;
  notes?: string;
  recordedById: string; // teacherId
}
