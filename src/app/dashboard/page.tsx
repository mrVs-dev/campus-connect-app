
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Admission, Assessment, Teacher, Enrollment, StudentStatusHistory, Subject, AssessmentCategory, UserRole, Fee, Invoice, Payment, InventoryItem, Permissions } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/app/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { AdmissionsList } from "@/components/dashboard/admissions-list";
import { TeacherList } from "@/components/dashboard/teacher-list";
import { StatusHistoryList } from "@/components/dashboard/status-history-list";
import { SettingsPage } from "@/components/dashboard/settings-page";
import { getUsers, getStudents, addStudent, updateStudent, getAdmissions, saveAdmission, deleteStudent, importStudents, getAssessments, saveAssessment, deleteAllStudents as deleteAllStudentsFromDB, getTeachers, addTeacher, deleteSelectedStudents, moveStudentsToClass, getStudentStatusHistory, updateStudentStatus, getSubjects, getAssessmentCategories, saveSubjects, saveAssessmentCategories, updateTeacher, getFees, saveFee, deleteFee, getInvoices, saveInvoice, deleteInvoice, getInventoryItems, saveInventoryItem, deleteInventoryItem, importAdmissions, getPermissions, getRoles, saveRoles, deleteTeacher, deleteMainUser } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { isFirebaseConfigured } from "@/lib/firebase/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeesList } from "@/components/dashboard/fees-list";
import { InvoicingList } from "@/components/dashboard/invoicing-list";
import { InventoryList } from "@/components/dashboard/inventory-list";
import type { User as AuthUser } from "firebase/auth";
import { AppModule, initialPermissions, APP_MODULES } from "@/lib/modules";

// --- IMPORTANT: Admin Exception ---
const ADMIN_EMAIL = "vannak@api-school.com"; 

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

function PendingApproval() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="max-w-xl text-center">
        <CardHeader>
          <CardTitle>Account Pending Approval</CardTitle>
          <CardDescription>
            Your account has been created, but you cannot access the dashboard yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            An administrator must approve your account and assign a role before you can proceed. Please contact your school's administration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


const TABS_CONFIG: { value: string, label: string, module: AppModule }[] = [
  { value: "dashboard", label: "Dashboard", module: "Dashboard" },
  { value: "students", label: "Students", module: "Students" },
  { value: "users", label: "Users", module: "Users" },
  { value: "assessments", label: "Assessments", module: "Assessments" },
  { value: "fees", label: "Fees", module: "Fees" },
  { value: "invoicing", label: "Invoicing", module: "Invoicing" },
  { value: "inventory", label: "Inventory", module: "Inventory" },
  { value: "admissions", label: "Admissions", module: "Admissions" },
  { value: "enrollment", label: "Enrollment", module: "Enrollment" }, 
  { value: "statusHistory", label: "Status History", module: "Status History" },
  { value: "settings", label: "Settings", module: "Settings" },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [allUsers, setAllUsers] = React.useState<AuthUser[]>([]);
  const [statusHistory, setStatusHistory] = React.useState<StudentStatusHistory[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assessmentCategories, setAssessmentCategories] = React.useState<AssessmentCategory[]>([]);
  const [fees, setFees] = React.useState<Fee[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [userRole, setUserRole] = React.useState<UserRole | null>(null);
  const [permissions, setPermissions] = React.useState<Permissions | null>(null);
  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const [pendingUsers, setPendingUsers] = React.useState<AuthUser[]>([]);


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
      setIsDataLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsDataLoading(true);
      try {
        const [
          fetchedUsers,
          fetchedTeachers,
          studentsData, 
          admissionsData, 
          assessmentsData, 
          statusHistoryData, 
          subjectsData, 
          categoriesData,
          feesData,
          invoicesData,
          inventoryData,
          savedPermissions,
          allRoles
        ] = await Promise.all([
          getUsers(),
          getTeachers(),
          getStudents(),
          getAdmissions(),
          getAssessments(),
          getStudentStatusHistory(),
          getSubjects(),
          getAssessmentCategories(),
          getFees(),
          getInvoices(),
          getInventoryItems(),
          getPermissions(),
          getRoles(),
        ]);
        
        let currentRoles = [...allRoles];
        const rolesToAdd: UserRole[] = ["Office Manager", "Finance Officer"];
        let madeChanges = false;
        rolesToAdd.forEach(role => {
            if (!currentRoles.some(r => r.toLowerCase() === role.toLowerCase())) {
                currentRoles.push(role);
                madeChanges = true;
            }
        });
        if (madeChanges) {
          await saveRoles(currentRoles);
        }


        // --- Build a complete, reliable permissions object ---
        const completePermissions = JSON.parse(JSON.stringify(initialPermissions)) as Permissions;
        APP_MODULES.forEach(module => {
           if (!completePermissions[module]) completePermissions[module] = {};
           currentRoles.forEach(role => {
               if (!completePermissions[module][role]) {
                  completePermissions[module][role] = { Create: false, Read: false, Update: false, Delete: false };
               }
               const saved = savedPermissions[module]?.[role];
               if (saved) {
                   completePermissions[module][role] = { ...completePermissions[module][role], ...saved };
               }
           });
        });
        setPermissions(completePermissions);


        const loggedInUserEmail = user.email;

        // --- START OF RE-ARCHITECTED ROUTING LOGIC ---

        // PRIORITY 1: Check for student/guardian roles first as they are definitive redirects.
        const isStudentLogin = studentsData.some(s => s.studentEmail === loggedInUserEmail);
        if (isStudentLogin) {
            router.replace('/student/dashboard');
            return;
        }

        const isGuardianLogin = studentsData.some(s => s.guardians?.some(g => g.email === loggedInUserEmail));
        const isAdminAsGuardian = loggedInUserEmail === ADMIN_EMAIL && isGuardianLogin;
        if (isGuardianLogin && !isAdminAsGuardian) {
            router.replace('/guardian/dashboard');
            return;
        }
         if(isAdminAsGuardian){
             router.replace('/guardian/dashboard');
            return;
        }

        // PRIORITY 2: If not a student/guardian, determine their staff role.
        let finalRole: UserRole | null = null;
        if (loggedInUserEmail === ADMIN_EMAIL) {
          finalRole = 'Admin';
        } else {
          const loggedInTeacher = fetchedTeachers.find(t => t.email === loggedInUserEmail);
          if (loggedInTeacher && loggedInTeacher.role) {
            finalRole = loggedInTeacher.role;
          }
        }
        
        setUserRole(finalRole);
        
        // PRIORITY 3: If they have an assigned role, load all data and proceed.
        if (finalRole) {
           setAllUsers(fetchedUsers as AuthUser[]);
           setTeachers(fetchedTeachers);
           setStudents(studentsData);
           setAdmissions(admissionsData);
           setAssessments(assessmentsData);
           setStatusHistory(statusHistoryData);
           setSubjects(subjectsData);
           setAssessmentCategories(categoriesData);
           setFees(feesData);
           setInvoices(invoicesData);
           setInventory(inventoryData);
           
           const teacherEmails = new Set(fetchedTeachers.map(t => t.email).filter(Boolean));
           setPendingUsers(fetchedUsers.filter(u => u.email && !teacherEmails.has(u.email)) as AuthUser[]);
           
           // Redirect teachers to their specific dashboard. Other roles stay here.
           if (finalRole === 'Teacher') {
               router.replace('/teacher/dashboard');
               return; // Stop execution
           }

        } else {
            // If they reach here, they are not a student, guardian, or approved staff. 
            // They are a pending user. Only load user/teacher data for the approval list.
             setAllUsers(fetchedUsers as AuthUser[]);
             setTeachers(fetchedTeachers);
             const teacherEmails = new Set(fetchedTeachers.map(t => t.email).filter(Boolean));
             setPendingUsers(fetchedUsers.filter(u => u.email && !teacherEmails.has(u.email)) as AuthUser[]);
        }
        // --- END OF RE-ARCHITECTED ROUTING LOGIC ---

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please check your Firebase connection.",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
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

  const handleImportAdmissions = async (importedData: { studentId: string; schoolYear: string; programId: string; level: string; }[]) => {
    try {
        await importAdmissions(importedData);
        const updatedAdmissions = await getAdmissions();
        setAdmissions(updatedAdmissions);
        toast({
            title: "Import Successful",
            description: `${importedData.length} admission records have been processed.`,
        });
    } catch (error: any) {
        console.error("Error importing admissions:", error);
        toast({
            title: "Import Failed",
            description: error.message || "There was an error importing the admission data.",
            variant: "destructive",
        });
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

  const handleAddTeacher = async (teacherData: Omit<Teacher, 'teacherId' | 'status' | 'joinedDate'>) => {
    try {
      const newTeacher = await addTeacher(teacherData);
      if (newTeacher) {
        const [updatedTeachers, updatedUsers] = await Promise.all([getTeachers(), getUsers()]);
        setTeachers(updatedTeachers);
        setAllUsers(updatedUsers as AuthUser[]);
        setPendingUsers(prev => prev.filter(u => u.email !== newTeacher.email));

        toast({
          title: "Staff Added",
          description: `${newTeacher.firstName} ${newTeacher.lastName} has been added and approved.`,
        });
        return newTeacher;
      }
      return null;
    } catch (error: any) {
      console.error("Error adding teacher:", error);
      toast({
        title: "Failed to Add Staff",
        description: error.message || "There was an error adding the new staff member. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!user) return;
    try {
        const userToDelete = allUsers.find(u => u.email === teacher.email);
        await deleteTeacher(teacher.teacherId);
        if (userToDelete) {
            await deleteMainUser(userToDelete.uid);
        }

        setTeachers(prev => prev.filter(t => t.teacherId !== teacher.teacherId));
        if (userToDelete) {
            setAllUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
            setPendingUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
        }

        toast({
            title: "Staff Deleted",
            description: `${teacher.firstName} ${teacher.lastName} has been removed.`,
        });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        toast({
            title: "Deletion Failed",
            description: "Could not delete staff member.",
            variant: "destructive",
        });
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

  const handleSaveFee = async (feeData: Omit<Fee, 'feeId'> | Fee) => {
    try {
      const savedFee = await saveFee(feeData);
      setFees(prev => {
        const existingIndex = prev.findIndex(f => f.feeId === savedFee.feeId);
        if (existingIndex > -1) {
            const updatedFees = [...prev];
            updatedFees[existingIndex] = savedFee;
            return updatedFees;
        } else {
            return [...prev, savedFee];
        }
      });
      toast({
        title: "Fee Saved",
        description: `The fee "${savedFee.name}" has been saved.`,
      });
      return true;
    } catch (error) {
      console.error("Error saving fee:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the fee. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteFee = async (feeId: string) => {
    try {
      await deleteFee(feeId);
      setFees(prev => prev.filter(f => f.feeId !== feeId));
      toast({
        title: "Fee Deleted",
        description: "The fee has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting fee:", error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the fee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'invoiceId'> | Invoice) => {
    try {
      const savedInvoice = await saveInvoice(invoiceData);
      setInvoices(prev => {
        const existingIndex = prev.findIndex(i => i.invoiceId === savedInvoice.invoiceId);
        if (existingIndex > -1) {
          const updatedInvoices = [...prev];
          updatedInvoices[existingIndex] = savedInvoice;
          return updatedInvoices;
        } else {
          return [...prev, savedInvoice];
        }
      });
      toast({
        title: "Invoice Saved",
        description: `Invoice ${savedInvoice.invoiceId} has been saved.`,
      });
      return true;
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the invoice.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      await deleteInvoice(invoiceId);
      setInvoices(prev => prev.filter(i => i.invoiceId !== invoiceId));
      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoiceId} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        title: "Deletion Failed",
        description: "There was an error deleting the invoice.",
        variant: "destructive",
      });
    }
  };

  const handleSaveInventoryItem = async (itemData: Omit<InventoryItem, 'itemId'> | InventoryItem) => {
    try {
      const savedItem = await saveInventoryItem(itemData);
      setInventory(prev => {
        const existingIndex = prev.findIndex(i => i.itemId === savedItem.itemId);
        if (existingIndex > -1) {
          const updatedItems = [...prev];
          updatedItems[existingIndex] = savedItem;
          return updatedItems;
        } else {
          return [...prev, savedItem];
        }
      });
      toast({
        title: "Inventory Item Saved",
        description: `Item "${savedItem.name}" has been saved.`,
      });
      return true;
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving the item.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    try {
      await deleteInventoryItem(itemId);
      setInventory(prev => prev.filter(item => item.itemId !== itemId));
      toast({
        title: "Item Deleted",
        description: "The inventory item has been removed.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Deletion Failed",
        description: "Could not delete the inventory item.",
        variant: "destructive",
      });
    }
  };


  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  if (authLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        Loading application data...
      </div>
    );
  }

  if (!userRole) {
    return <PendingApproval />;
  }
  
  const visibleTabs = TABS_CONFIG.filter(tab => {
    if (!userRole || !permissions) return false;
    if (userRole === 'Admin') return true;
    
    const modulePermissions = permissions[tab.module];
    return modulePermissions?.[userRole]?.Read;
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header userRole={userRole} />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8">
         {visibleTabs.length > 0 ? (
          <Tabs defaultValue={visibleTabs[0]?.value} className="flex flex-col gap-4">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-11 self-start">
              {visibleTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="dashboard">
              <Overview students={students} admissions={admissions} />
            </TabsContent>

            <TabsContent value="students">
              <StudentList 
                userRole={userRole}
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
            
            <TabsContent value="users">
              <TeacherList
                userRole={userRole}
                teachers={teachers}
                pendingUsers={pendingUsers}
                onAddTeacher={handleAddTeacher}
                onDeleteTeacher={handleDeleteTeacher}
              />
            </TabsContent>

            <TabsContent value="assessments">
              <AssessmentList
                userRole={userRole}
                assessments={assessments}
                students={students}
                subjects={subjects}
                assessmentCategories={assessmentCategories}
                onSaveAssessment={handleSaveAssessment}
              />
            </TabsContent>

            <TabsContent value="fees">
              <FeesList
                fees={fees}
                onSaveFee={handleSaveFee}
                onDeleteFee={handleDeleteFee}
              />
            </TabsContent>
            
            <TabsContent value="invoicing">
              <InvoicingList
                invoices={invoices}
                students={students}
                fees={fees}
                onSaveInvoice={handleSaveInvoice}
                onDeleteInvoice={handleDeleteInvoice}
              />
            </TabsContent>

            <TabsContent value="inventory">
              <InventoryList
                inventoryItems={inventory}
                onSaveItem={handleSaveInventoryItem}
                onDeleteItem={handleDeleteInventoryItem}
              />
            </TabsContent>

            <TabsContent value="admissions">
              <AdmissionsList 
                admissions={admissions}
                students={students}
                teachers={teachers}
                onSave={handleSaveAdmission}
                onImport={handleImportAdmissions}
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

    