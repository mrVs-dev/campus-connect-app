
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
