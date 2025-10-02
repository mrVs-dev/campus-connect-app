
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Admission, Assessment, Teacher, Enrollment, StudentStatusHistory, Subject, AssessmentCategory, UserRole } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/components/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { AdmissionsList } from "@/components/dashboard/admissions-list";
import { TeacherList } from "@/components/dashboard/teacher-list";
import { StatusHistoryList } from "@/components/dashboard/status-history-list";
import { SettingsPage } from "@/components/dashboard/settings-page";
import { getStudents, addStudent, updateStudent, getAdmissions, saveAdmission, deleteStudent, importStudents, getAssessments, saveAssessment, deleteAllStudents as deleteAllStudentsFromDB, getTeachers, addTeacher, deleteSelectedStudents, moveStudentsToClass, getStudentStatusHistory, updateStudentStatus, getSubjects, getAssessmentCategories, saveSubjects, saveAssessmentCategories, updateTeacher } from "@/lib/firebase/firestore";
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

const TABS_CONFIG: { value: string, label: string, roles: UserRole[] }[] = [
  { value: "dashboard", label: "Dashboard", roles: ['Admin', 'Head of Department', 'Receptionist'] },
  { value: "students", label: "Students", roles: ['Admin', 'Receptionist', 'Head of Department'] },
  { value: "teachers", label: "Teachers", roles: ['Admin', 'Head of Department'] },
  { value: "assessments", label: "Assessments", roles: ['Admin', 'Head of Department'] },
  { value: "admissions", label: "Admissions", roles: ['Admin', 'Receptionist'] },
  { value: "enrollment", label: "Enrollment", roles: ['Admin', 'Receptionist'] },
  { value: "statusHistory", label: "Status History", roles: ['Admin'] },
  { value: "settings", label: "Settings", roles: ['Admin'] },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [statusHistory, setStatusHistory] = React.useState<StudentStatusHistory[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assessmentCategories, setAssessmentCategories] = React.useState<AssessmentCategory[]>([]);
  const [userRole, setUserRole] = React.useState<UserRole>('Admin');

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
  
  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isFirebaseConfigured) {
      return;
    }

    const fetchData = async () => {
      try {
        const [
          studentsData, 
          admissionsData, 
          assessmentsData, 
          teachersData, 
          statusHistoryData, 
          subjectsData, 
          categoriesData
        ] = await Promise.all([
          getStudents(),
          getAdmissions(),
          getAssessments(),
          getTeachers(),
          getStudentStatusHistory(),
          getSubjects(),
          getAssessmentCategories(),
        ]);
        
        setStudents(studentsData);
        setAdmissions(admissionsData);
        setAssessments(assessmentsData);
        setTeachers(teachersData);
        setStatusHistory(statusHistoryData);
        setSubjects(subjectsData);
        setAssessmentCategories(categoriesData);

        // This ensures the user is always treated as an admin on this dashboard.
        setUserRole('Admin');
        
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please check your Firebase connection.",
          variant: "destructive",
        });
      }
    };
    
    fetchData();

  }, [user, authLoading, router, toast]);

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
    if (!user) return;
    try {
      await updateStudentStatus(student, newStatus, reason, user);
      setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, status: newStatus } : s));
      const newHistoryEntry = await getStudentStatusHistory(); // Refetch just history
      setStatusHistory(newHistoryEntry);
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
      const [updatedStudents, updatedAdmissions] = await Promise.all([getStudents(), getAdmissions()]);
      setStudents(updatedStudents);
      setAdmissions(updatedAdmissions);
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
  
  const handleAddTeacher = async (teacherData: Omit<Teacher, 'teacherId' | 'status' | 'joinedDate'>) => {
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

  const handleSaveSubjects = async (updatedSubjects: Subject[]) => {
    try {
      await saveSubjects(updatedSubjects);
      setSubjects(updatedSubjects);
      toast({
        title: "Subjects Saved",
        description: "The list of subjects has been updated.",
      });
    } catch (error) {
      console.error("Error saving subjects:", error);
      toast({
        title: "Save Failed",
        description: "Could not save subjects.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAssessmentCategories = async (updatedCategories: AssessmentCategory[]) => {
    try {
      await saveAssessmentCategories(updatedCategories);
      setAssessmentCategories(updatedCategories);
      toast({
        title: "Categories Saved",
        description: "Assessment categories and weights have been updated.",
      });
    } catch (error) {
      console.error("Error saving assessment categories:", error);
      toast({
        title: "Save Failed",
        description: "Could not save assessment categories.",
        variant: "destructive",
      });
    }
  };

  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        Loading application data...
      </div>
    );
  }

  const visibleTabs = userRole ? TABS_CONFIG.filter(tab => tab.roles.includes(userRole)) : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8">
         {userRole && visibleTabs.length > 0 ? (
          <Tabs defaultValue={visibleTabs[0]?.value} className="flex flex-col gap-4">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-8 self-start">
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="dashboard">
              <Overview students={studentsWithLatestEnrollments} admissions={admissions} />
            </TabsContent>

            <TabsContent value="students">
              <StudentList 
                students={studentsWithLatestEnrollments}
                assessments={assessments}
                admissions={admissions}
                assessmentCategories={assessmentCategories}
                subjects={subjects}
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
                subjects={subjects}
                assessmentCategories={assessmentCategories}
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

            <TabsContent value="settings">
              <SettingsPage 
                subjects={subjects}
                assessmentCategories={assessmentCategories}
                onSaveSubjects={handleSaveSubjects}
                onSaveCategories={handleSaveAssessmentCategories}
              />
            </TabsContent>

          </Tabs>
         ) : (
            <div className="text-center text-muted-foreground py-8">
              No tabs available for your role. Please contact an administrator if you believe this is an error.
            </div>
         )}
      </main>
    </div>
  );
}
