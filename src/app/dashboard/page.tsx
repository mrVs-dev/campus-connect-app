
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Admission, Assessment, Teacher, Enrollment, StudentStatusHistory } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { AdmissionsList } from "@/components/dashboard/admissions-list";
import { TeacherList } from "@/components/dashboard/teacher-list";
import { StatusHistoryList } from "@/components/dashboard/status-history-list";
import { getStudents, addStudent, updateStudent, getAdmissions, saveAdmission, deleteStudent, importStudents, getAssessments, saveAssessment, deleteAllStudents as deleteAllStudentsFromDB, getTeachers, addTeacher, deleteSelectedStudents, moveStudentsToClass, getStudentStatusHistory, updateStudentStatus } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { isFirebaseConfigured } from "@/lib/firebase/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [statusHistory, setStatusHistory] = React.useState<StudentStatusHistory[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);

  // Memoize the derived student data to prevent expensive recalculations on every render
  const studentsWithLatestEnrollments = React.useMemo(() => {
    if (!admissions || admissions.length === 0) {
      return students;
    }

    const sortedAdmissions = [...admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
    
    const studentEnrollmentMap = new Map<string, Enrollment[]>();

    sortedAdmissions.forEach(admission => {
      admission.students.forEach(studentAdmission => {
        if (!studentEnrollmentMap.has(studentAdmission.studentId)) {
          studentEnrollmentMap.set(studentAdmission.studentId, studentAdmission.enrollments);
        }
      });
    });

    return students.map(student => {
      const latestEnrollments = studentEnrollmentMap.get(student.studentId);
      if (latestEnrollments) {
        return { ...student, enrollments: latestEnrollments };
      }
      return student;
    });
  }, [students, admissions]);


  const fetchData = React.useCallback(async () => {
    if (!isFirebaseConfigured) {
      setLoadingData(false);
      return;
    }
    try {
      setLoadingData(true);
      const [studentsData, admissionsData, assessmentsData, teachersData, statusHistoryData] = await Promise.all([
        getStudents(), 
        getAdmissions(),
        getAssessments(),
        getTeachers(),
        getStudentStatusHistory()
      ]);
      setStudents(studentsData);
      setAdmissions(admissionsData);
      setAssessments(assessmentsData);
      setTeachers(teachersData);
      setStatusHistory(statusHistoryData);
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
  }, [toast]);
  
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleEnrollStudent = async (newStudentData: Omit<Student, 'studentId' | 'enrollmentDate' | 'status'>) => {
    try {
      const newStudent = await addStudent(newStudentData);
      setStudents(prev => [...prev, newStudent]);
      toast({
        title: "Enrollment Successful",
        description: `${newStudent.firstName} has been added with ID ${newStudent.studentId}.`,
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

  const handleUpdateStudentStatus = async (student: Student, newStatus: Student['status'], reason: string) => {
    try {
      await updateStudentStatus(student, newStatus, reason, user);
      await fetchData(); // Refetch all data to ensure consistency
      toast({
        title: "Status Updated",
        description: `${student.firstName}'s status has been updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating student status:", error);
      toast({
        title: "Status Update Failed",
        description: "There was an error updating the student's status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s.studentId !== studentId));
      toast({
        title: "Student Deleted",
        description: "The student has been removed from the roster.",
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the student. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelectedStudents = async (studentIds: string[]) => {
    try {
      await deleteSelectedStudents(studentIds);
      setStudents(prev => prev.filter(s => !studentIds.includes(s.studentId)));
      toast({
        title: "Students Deleted",
        description: `${studentIds.length} students have been removed.`,
      });
    } catch (error) {
      console.error("Error deleting selected students:", error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the selected students. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportStudents = async (importedStudents: Partial<Student>[]) => {
    try {
      const newStudents = await importStudents(importedStudents);
      setStudents(prev => [...prev, ...newStudents]);
      toast({
        title: "Import Successful",
        description: `${newStudents.length} students have been added.`,
      });
    } catch (error) {
      console.error("Error importing students:", error);
      toast({
        title: "Import Failed",
        description: "There was an error importing the students. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAdmission = async (admissionData: Admission, isNewClass: boolean = false) => {
    try {
      await saveAdmission(admissionData, isNewClass);
      const updatedAdmissions = await getAdmissions();
      setAdmissions(updatedAdmissions);
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
  
  const handleMoveStudents = async (studentIds: string[], schoolYear: string, fromClass: Enrollment | null, toClass: Enrollment) => {
    try {
      await moveStudentsToClass(studentIds, schoolYear, fromClass, toClass);
      await fetchData();
      toast({
        title: "Students Moved",
        description: `${studentIds.length} students have been moved successfully.`,
      });
    } catch (error) {
      console.error("Error moving students:", error);
      toast({
        title: "Move Failed",
        description: "There was an error moving the students. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAssessment = async (assessmentData: Omit<Assessment, 'assessmentId' | 'teacherId'> | Assessment) => {
    try {
      const savedAssessment = await saveAssessment(assessmentData);
      setAssessments(prev => {
        const existingIndex = prev.findIndex(a => a.assessmentId === savedAssessment.assessmentId);
        if (existingIndex > -1) {
            const updatedAssessments = [...prev];
            updatedAssessments[existingIndex] = savedAssessment;
            return updatedAssessments;
        } else {
            return [...prev, savedAssessment];
        }
      });
      toast({
        title: "Assessment Saved",
        description: `The assessment "${savedAssessment.topic}" has been saved.`,
      });
      return savedAssessment;
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the assessment. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAllStudents = async () => {
    try {
      await deleteAllStudentsFromDB();
      setStudents([]);
      toast({
        title: "All Students Deleted",
        description: "All student records have been removed from the database.",
      });
    } catch (error) {
      console.error("Error deleting all students:", error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting all students. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddTeacher = async (teacherData: Omit<Teacher, 'teacherId' | 'status'>) => {
    try {
      const newTeacher = await addTeacher(teacherData);
      if (newTeacher) {
        setTeachers(prev => [...prev, newTeacher]);
        toast({
          title: "Teacher Added",
          description: `${newTeacher.firstName} ${newTeacher.lastName} has been added.`,
        });
        return newTeacher;
      }
      return null;
    } catch (error) {
      console.error("Error adding teacher:", error);
      toast({
        title: "Failed to Add Teacher",
        description: "There was an error adding the new teacher. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  if (authLoading || loadingData || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        Loading application data...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8">
        <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-7 self-start">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="admissions">Admissions</TabsTrigger>
            <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
            <TabsTrigger value="statusHistory">Status History</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Overview students={studentsWithLatestEnrollments} admissions={admissions} />
          </TabsContent>

          <TabsContent value="students">
             <div className="mb-4 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete All Students</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all student records
                      from the database.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllStudents}>
                      Yes, delete all students
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <StudentList 
              students={studentsWithLatestEnrollments}
              assessments={assessments}
              admissions={admissions}
              onUpdateStudent={handleUpdateStudent}
              onUpdateStudentStatus={handleUpdateStudentStatus}
              onImportStudents={handleImportStudents}
              onDeleteStudent={handleDeleteStudent}
              onDeleteSelectedStudents={handleDeleteSelectedStudents}
              onMoveStudents={handleMoveStudents}
            />
          </TabsContent>
          
          <TabsContent value="teachers">
            <TeacherList teachers={teachers} onAddTeacher={handleAddTeacher} />
          </TabsContent>

          <TabsContent value="assessments">
            <AssessmentList
              assessments={assessments}
              students={students}
              onSaveAssessment={handleSaveAssessment}
            />
          </TabsContent>

          <TabsContent value="admissions">
            <AdmissionsList 
              admissions={admissions}
              students={students}
              teachers={teachers}
              onSave={handleSaveAdmission}
            />
          </TabsContent>
          
          <TabsContent value="enrollment">
            <EnrollmentForm onEnroll={handleEnrollStudent} />
          </TabsContent>
          
          <TabsContent value="statusHistory">
            <StatusHistoryList history={statusHistory} />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
