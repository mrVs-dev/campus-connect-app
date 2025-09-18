"use client";

import * as React from "react";
import type { Student } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { students as initialStudents, assessments } from "@/lib/mock-data";

export default function DashboardPage() {
  const [students, setStudents] = React.useState<Student[]>(initialStudents);
  
  const handleEnrollStudent = (newStudent: Omit<Student, 'avatarUrl' | 'studentId'> & { studentId?: string; avatarUrl?: string }) => {
    const nextStudentId = `stu${1832 + students.filter(s => s.studentId.startsWith('stu')).length}`;
    
    const studentWithDetails: Student = {
      ...newStudent,
      studentId: nextStudentId,
      avatarUrl: newStudent.avatarUrl || `https://picsum.photos/seed/${students.length + 1}/100/100`,
    };
    setStudents(prevStudents => [...prevStudents, studentWithDetails]);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
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
            <StudentList students={students} />
          </TabsContent>

          <TabsContent value="assessments">
            <AssessmentList
              assessments={assessments}
              students={students}
            />
          </TabsContent>

          <TabsContent value="enrollment">
            <EnrollmentForm onEnroll={handleEnrollStudent} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
