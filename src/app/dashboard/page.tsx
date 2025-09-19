
"use client";

import * as React from "react";
import type { Student, Admission } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { AdmissionsList } from "@/components/dashboard/admissions-list";
import { students as initialStudents, assessments } from "@/lib/mock-data";

export default function DashboardPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const nextStudentIdCounter = React.useRef(0);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load data from localStorage on initial mount
  React.useEffect(() => {
    if (isMounted) {
      try {
        const storedStudents = localStorage.getItem("students");
        if (storedStudents) {
          const parsedStudents = JSON.parse(storedStudents).map((s: Student) => ({
            ...s,
            dateOfBirth: new Date(s.dateOfBirth),
            enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate) : undefined,
          }));
          setStudents(parsedStudents);
        } else {
          setStudents(initialStudents);
        }
      } catch (error) {
        console.error("Failed to load students from localStorage, resetting to initial data.", error);
        setStudents(initialStudents);
      }

      try {
        const storedAdmissions = localStorage.getItem("admissions");
        if (storedAdmissions) {
          setAdmissions(JSON.parse(storedAdmissions));
        } else {
          setAdmissions([]);
        }
      } catch (error) {
        console.error("Failed to load admissions from localStorage, resetting to empty.", error);
        setAdmissions([]);
      }
    }
  }, [isMounted]);

  // Save students to localStorage
  React.useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem("students", JSON.stringify(students));
        const maxId = students.reduce((max, s) => {
            const idNum = parseInt(s.studentId.replace('stu', ''), 10);
            return idNum > max ? idNum : max;
        }, 1831);
        nextStudentIdCounter.current = maxId + 1;
      } catch (error) {
        console.error("Failed to save students to localStorage", error);
      }
    }
  }, [students, isMounted]);

  // Save admissions to localStorage
  React.useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem("admissions", JSON.stringify(admissions));
      } catch (error) {
        console.error("Failed to save admissions to localStorage", error);
      }
    }
  }, [admissions, isMounted]);

  const handleEnrollStudent = (newStudent: Omit<Student, 'avatarUrl' | 'studentId' | 'enrollmentDate'> & { studentId?: string; avatarUrl?: string }) => {
    const studentWithDetails: Student = {
      ...newStudent,
      studentId: `stu${nextStudentIdCounter.current}`,
      enrollmentDate: new Date(),
      avatarUrl: newStudent.avatarUrl || `https://picsum.photos/seed/${students.length + 1}/100/100`,
    };
    setStudents(prevStudents => [...prevStudents, studentWithDetails]);
  };

  const handleUpdateStudent = (studentId: string, updatedData: Partial<Student>) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.studentId === studentId ? { ...student, ...updatedData } : student
      )
    );
  };

  const handleImportStudents = (importedStudents: Omit<Student, 'studentId' | 'avatarUrl'>[]) => {
    let currentId = nextStudentIdCounter.current;
    const newStudents = importedStudents.map((s, index) => {
        const student: Student = {
            ...s,
            studentId: `stu${currentId + index}`,
            avatarUrl: `https://picsum.photos/seed/${students.length + index + 1}/100/100`,
        };
        return student;
    });
    setStudents(prev => [...prev, ...newStudents]);
  };

  const handleSaveAdmission = (newAdmission: Admission) => {
    setAdmissions(prev => {
        const existingIndex = prev.findIndex(a => a.admissionId === newAdmission.admissionId);
        if (existingIndex > -1) {
            const updatedAdmissions = [...prev];
            updatedAdmissions[existingIndex] = newAdmission;
            return updatedAdmissions;
        } else {
            return [...prev, newAdmission];
        }
    });
  };

  const studentsWithLatestEnrollments = React.useMemo(() => {
    if (admissions.length === 0) {
      return students;
    }

    // Sort admissions by school year descending to find the latest one
    const sortedAdmissions = [...admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
    const latestAdmission = sortedAdmissions[0];

    if (!latestAdmission) {
      return students;
    }

    const admissionMap = new Map(latestAdmission.students.map(s => [s.studentId, s.enrollments]));

    return students.map(student => {
      const latestEnrollments = admissionMap.get(student.studentId);
      if (latestEnrollments) {
        return { ...student, enrollments: latestEnrollments };
      }
      // If student not in latest admission, return their original enrollments
      return student;
    });
  }, [students, admissions]);


  if (!isMounted) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-5 self-start">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="admissions">Admissions</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Overview students={students} />
          </TabsContent>

          <TabsContent value="students">
            <StudentList 
              students={studentsWithLatestEnrollments} 
              onUpdateStudent={handleUpdateStudent}
              onImportStudents={handleImportStudents}
            />
          </TabsContent>

          <TabsContent value="assessments">
            <AssessmentList
              assessments={assessments}
              students={students}
            />
          </TabsContent>

          <TabsContent value="admissions">
            <AdmissionsList 
              admissions={admissions}
              students={students}
              onSave={handleSaveAdmission}
            />
          </TabsContent>
          
          <TabsContent value="enrollment">
            <EnrollmentForm onEnroll={handleEnrollStudent} nextStudentId={nextStudentIdCounter.current} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
