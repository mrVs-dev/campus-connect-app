
export type Guardian = {
  relation: string;
  name: string;
  occupation: string;
  workplace: string;
  mobiles: string[];
};

export interface Student {
  studentId: string;
  serialNumber?: string;
  enrollmentDate?: Date;
  firstName: string;
  middleName?: string;
  lastName: string;
  khmerFirstName: string;
  khmerLastName: string;
  sex: 'Male' | 'Female' | 'Other';
  dateOfBirth: Date;
  placeOfBirth: string;
  nationality: string;
  nationalId?: string;
  program: string;
  admissionYear: number;
  currentGradeLevel: string;
  status: 'Active' | 'Inactive' | 'Graduated';
  previousSchool?: string;
  address: {
    district: string;
    commune: string;
    village: string;
    street?: string;
    house?: string;
  };
  guardians: Guardian[];
  mediaConsent: boolean;
  emergencyContact: {
    name: string;
    phone: string;
  };
  avatarUrl?: string;
}

export interface Teacher {
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  assignedSubjects: string[];
}

export interface Subject {
  subjectId: string;
  subjectName: string;
  gradeLevel: string;
  teacherId: string;
}

export type AssessmentCategory = 'Classwork' | 'Participation' | 'Homework' | 'Unit Assessment' | 'End-Semester';

export const assessmentCategoryWeights: Record<AssessmentCategory, number> = {
  'Classwork': 0.25,
  'Participation': 0.05,
  'Homework': 0.05,
  'Unit Assessment': 0.30,
  'End-Semester': 0.35,
};

export interface Assessment {
  assessmentId: string;
  subjectId: string;
  teacherId: string;
  topic: string;
  category: AssessmentCategory;
  totalMarks: number;
  scores: Record<string, number>; // { [studentId]: rawScore }
}

    