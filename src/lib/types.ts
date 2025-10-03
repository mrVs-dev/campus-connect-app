

export type UserRole = 'Admin' | 'Receptionist' | 'Head of Department' | 'Teacher';

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
  familyId?: string; // For sibling discounts
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

export type ClassAssignment = {
  schoolYear: string;
  programId: string;
  level: string;
};

export interface Teacher {
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  role: UserRole;
  avatarUrl?: string;
  joinedDate?: Date;
  assignedSubjects?: string[]; // subjectIds
  assignedClasses?: ClassAssignment[];
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

// --- Fees & Invoicing ---
export type FeeType = 'Tuition' | 'Registration' | 'Books' | 'Uniform' | 'Transportation' | 'Other';
export type FeeFrequency = 'One-Time' | 'Monthly' | 'Termly' | 'Semesterly' | 'Yearly';

export interface Fee {
  feeId: string;
  name: string;
  type: FeeType;
  amount: number;
  frequency: FeeFrequency;
  programId?: string; // Link fee to a specific program if needed
  level?: string;     // Link fee to a specific level if needed
}

export type DiscountType = 'Scholarship' | 'Sibling' | 'Bundle';

export interface Discount {
  discountId: string;
  name: string;
  type: DiscountType;
  value: number; // Can be a percentage (e.g., 10 for 10%) or a fixed amount
  isPercentage: boolean;
  appliesTo: 'Tuition' | 'All'; // Specifies if discount applies only to tuition or all fees
}

export interface InvoiceLineItem {
  feeId: string;
  description: string;
  amount: number;
}

export interface AppliedDiscount {
  discountId?: string;
  description: string;
  discountedAmount: number;
}

export type PaymentPlan = 'Monthly' | 'Termly' | 'Semesterly' | 'Yearly';

export interface Invoice {
  invoiceId: string;
  studentId: string;
  schoolYear: string;
  issueDate: Date;
  dueDate: Date;
  paymentPlan: PaymentPlan;
  lineItems: InvoiceLineItem[];
  discounts: AppliedDiscount[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  amountPaid: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue';
}

export interface Payment {
  paymentId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  paymentDate: Date;
  method: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Other';
  notes?: string;
}

// --- Inventory & Supplies ---
export type InventoryCategory = 'Uniform' | 'Book' | 'Stationery' | 'Other';

export interface InventoryItem {
  itemId: string;
  name: string;
  category: InventoryCategory;
  imageUrl?: string;
  cost: number;
  stockedInDate: Date;
  quantity: number;
  reorderLevel: number;
  supplier?: string;
}

export interface StudentSupply {
  supplyId: string;
  studentId: string;
  itemId: string;
  quantityIssued: number;
  issueDate: Date;
  issuedBy: string; // userId
  notes?: string;
}
