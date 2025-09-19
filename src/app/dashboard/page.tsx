
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Admission } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { AdmissionsList } from "@/components/dashboard/admissions-list";
import { assessments } from "@/lib/mock-data";
import { getStudents, addStudent, updateStudent, getAdmissions, saveAdmission } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { isFirebaseConfigured } from "@/lib/firebase/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function MissingFirebaseConfig() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Firebase Configuration Missing</CardTitle>
          <CardDescription>
            Your application is not connected to Firebase, which is required for storing and managing data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            To get started, you need to create a Firebase project and add its configuration to this application.
          </p>
          <p>
            Please follow the instructions in the <code className="bg-muted px-2 py-1 rounded-md text-sm">README.md</code> file
            to set up your <code className="bg-muted px-2 py-1 rounded-md text-sm">.env.local</code> file with the necessary Firebase keys.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            After adding the configuration, you will need to restart the development server for the changes to take effect.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardContent() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchData() {
      if (!isFirebaseConfigured) {
        setLoadingData(false);
        return;
      }
      try {
        const [studentsData, admissionsData] = await Promise.all([getStudents(), getAdmissions()]);
        setStudents(studentsData);
        setAdmissions(admissionsData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load data from the server. Please check your Firebase connection and configuration.",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, [toast]);

  const handleEnrollStudent = async (newStudentData: Omit<Student, 'avatarUrl' | 'studentId' | 'enrollmentDate'> & {avatarUrl?: string}) => {
    try {
      const newStudent = await addStudent(newStudentData);
      setStudents(prev => [...prev, newStudent]);
      toast({
        title: "Enrollment Successful",
        description: `${newStudent.firstName} has been added to the roster.`,
      });
      return true;
    } catch (error) {
        console.error("Error enrolling student:", error);
        toast({
          title: "Enrollment Failed",
          description: "There was an error saving the new student. Please try again.",
          variant: "destructive",
        });
        return false;
    }
  };

  const handleUpdateStudent = async (studentId: string, updatedData: Partial<Student>) => {
     try {
        await updateStudent(studentId, updatedData);
        setStudents(prevStudents =>
            prevStudents.map(student =>
                student.studentId === studentId ? { ...student, ...updatedData } : student
            )
        );
         toast({
            title: "Student Updated",
            description: "Student information has been successfully updated.",
        });
    } catch (error) {
        console.error("Error updating student:", error);
        toast({
            title: "Update Failed",
            description: "There was an error updating the student. Please try again.",
            variant: "destructive",
        });
    }
  };

  const handleImportStudents = (importedStudents: Omit<Student, 'studentId' | 'avatarUrl'>[]) => {
    console.log("Importing students...", importedStudents)
  };

  const handleSaveAdmission = async (admissionData: Admission) => {
    try {
      await saveAdmission(admissionData);
      setAdmissions(prev => {
        const existingIndex = prev.findIndex(a => a.admissionId === admissionData.admissionId);
        if (existingIndex > -1) {
            const updatedAdmissions = [...prev];
            updatedAdmissions[existingIndex] = admissionData;
            return updatedAdmissions;
        } else {
            return [...prev, admissionData];
        }
      });
      toast({
        title: "Admissions Saved",
        description: `Admission data for ${admissionData.schoolYear} has been saved.`,
      });
      return true;
    } catch (error) {
       console.error("Error saving admission:", error);
       toast({
        title: "Save Failed",
        description: "There was an error saving the admission data. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const studentsWithLatestEnrollments = React.useMemo(() => {
    if (!admissions || admissions.length === 0) {
      return students;
    }

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
      return student;
    });
  }, [students, admissions]);

  if (loadingData) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-background">Loading data from server...</div>;
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
            <EnrollmentForm onEnroll={handleEnrollStudent} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }
  
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        Loading...
      </div>
    );
  }

  if (user) {
    return <DashboardContent />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      Redirecting to login...
    </div>
  );
}
