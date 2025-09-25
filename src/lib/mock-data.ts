import type { Teacher, Subject, Assessment } from './types';

export const teachers: Teacher[] = [
  {
    teacherId: 'T001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@campusconnect.edu',
    phone: '123-456-7890',
    assignedSubjects: ['SUB001', 'SUB002'],
  },
  {
    teacherId: 'T002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@campusconnect.edu',
    phone: '098-765-4321',
    assignedSubjects: ['SUB003', 'SUB004'],
  },
];

export const subjects: Subject[] = [
  { subjectId: 'SUB001', subjectName: 'Mathematics', gradeLevel: '10', teacherId: 'T001' },
  { subjectId: 'SUB002', subjectName: 'Physics', gradeLevel: '10', teacherId: 'T001' },
  { subjectId: 'SUB003', subjectName: 'English Literature', gradeLevel: '10', teacherId: 'T002' },
  { subjectId: 'SUB004', subjectName: 'History', gradeLevel: '10', teacherId: 'T002' },
];

export const assessments: Assessment[] = [
  {
    assessmentId: 'A001',
    subjectId: 'SUB001',
    teacherId: 'T001',
    topic: 'Algebra Basics',
    category: 'Classwork',
    totalMarks: 25,
    scores: { 'S001': 22, 'S002': 18, 'S003': 24, 'S004': 20, 'S005': 15 },
  },
  {
    assessmentId: 'A002',
    subjectId: 'SUB001',
    teacherId: 'T001',
    topic: 'Geometry Fundamentals',
    category: 'Unit Assessment',
    totalMarks: 100,
    scores: { 'S001': 88, 'S002': 75, 'S003': 95, 'S004': 82, 'S005': 60 },
  },
  {
    assessmentId: 'A003',
    subjectId: 'SUB003',
    teacherId: 'T002',
    topic: 'Shakespearean Sonnets',
    category: 'Homework',
    totalMarks: 10,
    scores: { 'S001': 9, 'S002': 10, 'S003': 8, 'S004': 9, 'S005': 10 },
  },
  {
    assessmentId: 'A004',
    subjectId: 'SUB003',
    teacherId: 'T002',
    topic: 'Modernist Poetry',
    category: 'Unit Assessment',
    totalMarks: 100,
    scores: { 'S001': 85, 'S002': 92, 'S003': 78, 'S004': 88, 'S005': 95 },
  },
  {
    assessmentId: 'A005',
    subjectId: 'SUB001',
    teacherId: 'T001',
    topic: 'Calculus Prep',
    category: 'End-Semester',
    totalMarks: 150,
    scores: { 'S001': 130, 'S002': 110, 'S003': 145, 'S004': 120, 'S005': 95 },
  },
  {
    assessmentId: 'A006',
    subjectId: 'SUB003',
    teacherId: 'T002',
    topic: 'Victorian Novels',
    category: 'End-Semester',
    totalMarks: 150,
    scores: { 'S001': 125, 'S002': 140, 'S003': 115, 'S004': 130, 'S005': 142 },
  },
];
