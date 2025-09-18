"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/firebase";
import type { Student } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { students as initialStudents, assessments } from "@/lib/mock-data";

export default function DashboardPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [isMounted, setIsMounted] = React.useState(false);
  const nextStudentIdCounter = React.useRef(0);
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null); // Use a more specific type if possible
  const auth = getFirebaseAuth();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsMounted(true);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router, auth]);

  // Load students from localStorage on initial mount
  React.useEffect(() => {
    if (isMounted) {
      try {
        const storedStudents = localStorage.getItem("students");
        if (storedStudents) {
          const parsedStudents = JSON.parse(storedStudents).map((s: Student) => ({
            ...s,
            dateOfBirth: new Date(s.dateOfBirth),
          }));
          setStudents(parsedStudents);
        } else {
          setStudents(initialStudents);
        }
      } catch (error) {
        console.error("Failed to load students from localStorage", error);
        setStudents(initialStudents);
      }
    }
  }, [isMounted]);
  
  // Save students to localStorage whenever the list changes
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

  const handleEnrollStudent = (newStudent: Omit<Student, 'avatarUrl' | 'studentId'> & { studentId?: string; avatarUrl?: string }) => {
    const studentWithDetails: Student = {
      ...newStudent,
      studentId: `stu${nextStudentIdCounter.current}`,
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

  if (!isMounted) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header user={user} />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-4 self-start">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Overview />
          </TabsContent>

          <TabsContent value="students">
            <StudentList 
              students={students} 
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

          <TabsContent value="enrollment">
            <EnrollmentForm onEnroll={handleEnrollStudent} nextStudentId={nextStudentIdCounter.current} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
