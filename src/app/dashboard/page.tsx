
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Admission, Assessment, Teacher, Enrollment, StudentStatusHistory, Subject, AssessmentCategory, UserRole, Fee, Invoice, InventoryItem, Permissions, LetterGrade } from "@/lib/types";
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
import { getStudents, addStudent, updateStudent, getAdmissions, saveAdmission, deleteStudent, importStudents, getAssessments, saveAssessment, deleteAllStudents as deleteAllStudentsFromDB, getTeachers, addTeacher, deleteSelectedStudents, moveStudentsToClass, getStudentStatusHistory, updateStudentStatus, getSubjects, getAssessmentCategories, saveSubjects, saveAssessmentCategories, updateTeacher, getFees, saveFee, deleteFee, getInvoices, saveInvoice, deleteInvoice, getInventoryItems, saveInventoryItem, deleteInventoryItem, importAdmissions, getPermissions, getRoles, saveRoles, deleteTeacher, deleteMainUser, getGradeScale, swapLegacyStudentNames, saveGradeScale } from "@/lib/firebase/firestore";
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

type LoadingState = 'Authenticating' | 'Checking Role' | 'Fetching Main Data' | 'Idle' | 'Error';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [activeAdmissionsAccordion, setActiveAdmissionsAccordion] = React.useState<string | undefined>(undefined);
  
  const [students, setStudents] = React.useState<Student[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [statusHistory, setStatusHistory] = React.useState<StudentStatusHistory[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assessmentCategories, setAssessmentCategories] = React.useState<AssessmentCategory[]>([]);
  const [gradeScale, setGradeScale] = React.useState<LetterGrade[]>([]);
  const [fees, setFees] = React.useState<Fee[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  
  const [allSystemRoles, setAllSystemRoles] = React.useState<UserRole[]>([]);
  const [userRole, setUserRole] = React.useState<UserRole | null>(null);
  const [permissions, setPermissions] = React.useState<Permissions | null>(null);

  const [loadingState, setLoadingState] = React.useState<LoadingState>('Authenticating');
  const [dataLoaded, setDataLoaded] = React.useState(false);

  const studentsWithLatestEnrollments = React.useMemo(() => {
    if (!admissions || admissions.length === 0) {
        return students.map(s => ({ ...s, enrollments: [] }));
    }

    const sortedAdmissions = [...admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));

    return students.map(student => {
        for (const admission of sortedAdmissions) {
            const studentAdmission = admission.students.find(sa => sa.studentId === student.studentId);
            if (studentAdmission && studentAdmission.enrollments.length > 0) {
                return { ...student, enrollments: studentAdmission.enrollments };
            }
        }
        return { ...student, enrollments: [] };
    });
  }, [students, admissions]);
  
  const fetchData = React.useCallback(async (showToast = false) => {
    if (!user) {
      console.warn("FetchData called without user.");
      return;
    };
    
    setLoadingState('Fetching Main Data');
    try {
      const [
        studentsData,
        admissionsData, 
        assessmentsData, 
        statusHistoryData, 
        subjectsData,
        categoriesData,
        gradeScaleData,
        feesData,
        invoicesData,
        inventoryData,
      ] = await Promise.all([
        getStudents(),
        getAdmissions(),
        getAssessments(),
        getStudentStatusHistory(),
        getSubjects(),
        getAssessmentCategories(),
        getGradeScale(),
        getFees(),
        getInvoices(),
        getInventoryItems(),
      ]);

      setStudents(studentsData);
      setAdmissions(admissionsData);
      setAssessments(assessmentsData);
      setStatusHistory(statusHistoryData);
      setSubjects(subjectsData);
      setAssessmentCategories(categoriesData);
      setGradeScale(gradeScaleData);
      setFees(feesData);
      setInvoices(invoicesData);
      setInventory(inventoryData);
      setDataLoaded(true);
      
      if (showToast) {
        toast({ title: "Data Refreshed", description: "The latest data has been loaded." });
      }
      setLoadingState('Idle');

    } catch (error: any) {
      console.error("Error fetching main data:", error);
      toast({
        title: "Error Loading Data",
        description: error.message || "Failed to load all application data. Please try again.",
        variant: "destructive",
      });
      setLoadingState('Error');
    }
  }, [user, toast]);
  
  // Effect 1: Check user authentication status and redirect if necessary
  React.useEffect(() => {
    if (authLoading) {
      setLoadingState('Authenticating');
      return;
    }
    if (!isFirebaseConfigured) {
      setLoadingState('Error');
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    setLoadingState('Checking Role'); // Ready to check role
  }, [user, authLoading, router]);

  // Effect 2: Fetch initial user role and permissions
  React.useEffect(() => {
    const checkUserRoleAndPermissions = async () => {
      if (!user || loadingState !== 'Checking Role') return;

      try {
        // Fetch teachers first, then roles, to avoid race conditions.
        const allTeachersFromDb = await getTeachers();
        setTeachers(allTeachersFromDb);

        const allRolesFromDb = await getRoles();
        setAllSystemRoles(allRolesFromDb);

        let currentUserRole: UserRole | null = null;
        if (user.email === ADMIN_EMAIL) {
          currentUserRole = 'Admin';
        } else {
          const loggedInStaffMember = allTeachersFromDb.find(t => t.email === user.email);
          if (loggedInStaffMember?.role) {
            currentUserRole = loggedInStaffMember.role;
          }
        }
        
        if (currentUserRole) {
          setUserRole(currentUserRole);

          if (currentUserRole === 'Teacher') {
            router.replace('/teacher/dashboard');
            return;
          }
          
          const savedPermissions = await getPermissions();
          const completePermissions = JSON.parse(JSON.stringify(initialPermissions)) as Permissions;
          APP_MODULES.forEach(module => {
            if (!completePermissions[module]) completePermissions[module] = {};
            allRolesFromDb.forEach(role => {
              if (!completePermissions[module][role]) {
                completePermissions[module][role] = { Create: false, Read: false, Update: false, Delete: false };
              }
              if (savedPermissions[module]?.[role]) {
                completePermissions[module][role] = { ...completePermissions[module][role], ...savedPermissions[module][role] };
              }
            });
          });
          setPermissions(completePermissions);
        } else {
          // If no staff role, check if they are a student or guardian
          const allStudentsFromDb = await getStudents();
          setStudents(allStudentsFromDb); // Set students now for role checking
          if (allStudentsFromDb.some(s => s.studentEmail === user.email)) {
            router.replace('/student/dashboard');
            return;
          }
          if (allStudentsFromDb.some(s => s.guardians?.some(g => g.email === user.email))) {
            router.replace('/guardian/dashboard');
            return;
          }
          // If no role found at all, they are pending approval
          setLoadingState('Idle'); 
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setLoadingState('Error');
      }
    };
    
    checkUserRoleAndPermissions();
    
  }, [user, loadingState, router]);

  // Effect 3: Fetch main data only after a user role has been established
  React.useEffect(() => {
    if (userRole && !dataLoaded) {
      fetchData();
    }
  }, [userRole, dataLoaded, fetchData]);


  const handleUpdateStudent = async (studentId: string, updatedData: Partial<Student>) => {
    await updateStudent(studentId, updatedData);
    await fetchData(true);
    toast({
        title: "Student Updated",
        description: "The student's profile has been saved.",
    });
  };

  const handleSaveRoles = async (newRoles: UserRole[]) => {
    await saveRoles(newRoles);
    const updatedRoles = await getRoles();
    setAllSystemRoles(updatedRoles);
    toast({ title: "Roles updated", description: "The list of system roles has been saved." });
  };
  
  const handleUpdateStudentStatus = async (student: Student, newStatus: Student['status'], reason: string) => {
    if (!user) return;
    await updateStudentStatus(student, newStatus, reason, user);
    await fetchData(true);
    toast({
      title: "Status Updated",
      description: `${student.firstName}'s status has been changed to ${newStatus}.`,
    });
  }

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!user) return;
    try {
        await deleteTeacher(teacher.teacherId);
        
        await fetchData(true);

        toast({
            title: "Staff Deleted",
            description: `${teacher.firstName} ${teacher.lastName} has been removed.`,
        });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        toast({
            title: "Delete Failed",
            description: "Could not remove the staff member.",
            variant: "destructive",
        });
    }
  };

  const handleUpdateTeacher = async (teacherId: string, updatedData: Partial<Teacher>) => {
    await updateTeacher(teacherId, updatedData);
    await fetchData(true);
    toast({
        title: "Teacher Updated",
        description: "The teacher's profile has been saved.",
    });
  };
  
  const handleSaveAdmission = async (admission: Admission, isNewClass: boolean) => {
    const success = await saveAdmission(admission, isNewClass);
    if (success) {
      await fetchData(true);
      toast({
        title: "Admissions Updated",
        description: "The admission records have been saved.",
      });
    } else {
       toast({
        title: "Save Failed",
        description: "Could not save admission changes.",
        variant: "destructive"
      });
    }
    return success;
  };
  
  const handleSaveAssessment = async (assessment: Assessment) => {
    const result = await saveAssessment(assessment);
    if(result) {
        await fetchData(true);
        toast({
          title: "Assessment Saved",
          description: "The assessment has been successfully saved.",
        });
    } else {
       toast({
        title: "Save Failed",
        description: "Could not save the assessment.",
        variant: "destructive"
      });
    }
    return result;
  }
  
  const handleSwapLegacyNames = async () => {
    try {
      const count = await swapLegacyStudentNames();
      toast({
        title: "Data Correction Successful",
        description: `${count} student records were updated. Please refresh the page to see the changes.`,
      });
      await fetchData(true);
    } catch (error: any) {
      toast({
        title: "Data Correction Failed",
        description: error.message || "Could not swap student names.",
        variant: "destructive",
      });
    }
  };
  
  const hasPermission = (module: AppModule, action: 'Read' | 'Create' | 'Update' | 'Delete'): boolean => {
    if (!permissions || !userRole) return false;
    if (userRole === 'Admin') return true;

    return permissions[module]?.[userRole]?.[action] ?? false;
  };

  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  if (loadingState !== 'Idle') {
    return <div className="flex min-h-screen items-center justify-center">{loadingState}...</div>;
  }
  
  if (!userRole) {
    return <PendingApproval />;
  }

  return (
    <>
      <Header userRole={userRole} />
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex flex-1 flex-col gap-4 bg-background p-4 md:gap-8 md:p-6">
          <div className="mx-auto w-full max-w-full">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                <TabsList className="h-auto flex-wrap w-full">
                  {TABS_CONFIG.filter(tab => hasPermission(tab.module, 'Read')).map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value} className="capitalize">
                        {tab.label}
                      </TabsTrigger>
                    ))}
                </TabsList>
                <TabsContent value="dashboard" className="space-y-4">
                  <Overview students={studentsWithLatestEnrollments} admissions={admissions || []} />
                </TabsContent>
                <TabsContent value="students" className="space-y-4">
                  <StudentList 
                    userRole={userRole}
                    students={studentsWithLatestEnrollments}
                    assessments={assessments}
                    admissions={admissions}
                    subjects={subjects}
                    assessmentCategories={assessmentCategories}
                    onUpdateStudent={handleUpdateStudent}
                    onUpdateStudentStatus={handleUpdateStudentStatus}
                    onImportStudents={async (importedStudents) => { await importStudents(importedStudents); await fetchData(true); }}
                    onDeleteStudent={async (studentId) => { await deleteStudent(studentId); await fetchData(true); }}
                    onDeleteSelectedStudents={async (studentIds) => { await deleteSelectedStudents(studentIds); await fetchData(true); }}
                    onMoveStudents={async (studentIds, schoolYear, fromClass, toClass) => { await moveStudentsToClass(studentIds, schoolYear, fromClass, toClass); await fetchData(true); }}
                    gradeScale={gradeScale}
                    />
                </TabsContent>
                <TabsContent value="users" className="space-y-4">
                  <TeacherList 
                      userRole={userRole}
                      initialTeachers={teachers}
                      onAddTeacher={async (teacher) => { await addTeacher(teacher); }}
                      onDeleteTeacher={handleDeleteTeacher}
                      onUpdateTeacher={handleUpdateTeacher}
                      onRefreshData={() => fetchData(true)}
                    />
                </TabsContent>
                <TabsContent value="assessments" className="space-y-4">
                  <AssessmentList 
                    userRole={userRole}
                    assessments={assessments}
                    students={students}
                    subjects={subjects}
                    assessmentCategories={assessmentCategories}
                    admissions={admissions}
                    teachers={teachers}
                    onSaveAssessment={handleSaveAssessment}
                    />
                </TabsContent>
                <TabsContent value="fees" className="space-y-4">
                  <FeesList
                    fees={fees}
                    onSaveFee={async (fee) => { const success = await saveFee(fee); if (success) await fetchData(true); return success; }}
                    onDeleteFee={async (feeId) => { await deleteFee(feeId); await fetchData(true); }}
                    />
                </TabsContent>
                 <TabsContent value="invoicing" className="space-y-4">
                  <InvoicingList
                    invoices={invoices}
                    students={students}
                    fees={fees}
                    onSaveInvoice={async (invoice) => { const success = await saveInvoice(invoice); if (success) await fetchData(true); return success; }}
                    onDeleteInvoice={async (invoiceId) => { await deleteInvoice(invoiceId); await fetchData(true); }}
                    />
                </TabsContent>
                 <TabsContent value="inventory" className="space-y-4">
                  <InventoryList
                    inventoryItems={inventory}
                    onSaveItem={async (item) => { const success = await saveInventoryItem(item); if (success) await fetchData(true); return success; }}
                    onDeleteItem={async (itemId) => { await deleteInventoryItem(itemId); await fetchData(true); }}
                    />
                </TabsContent>
                <TabsContent value="admissions" className="space-y-4">
                  <AdmissionsList 
                    admissions={admissions}
                    students={students}
                    teachers={teachers}
                    onSave={handleSaveAdmission}
                    onImport={async (data) => { await importAdmissions(data); await fetchData(true); }}
                    activeAccordion={activeAdmissionsAccordion}
                    onAccordionChange={setActiveAdmissionsAccordion}
                    />
                </TabsContent>
                <TabsContent value="enrollment" className="space-y-4">
                  <EnrollmentForm onEnroll={async (student) => { await addStudent(student); await fetchData(true); }} />
                </TabsContent>
                <TabsContent value="statusHistory" className="space-y-4">
                  <StatusHistoryList
                    history={statusHistory}
                    students={students}
                    onUpdateStatus={handleUpdateStudentStatus}
                    canChangeStatus={hasPermission('Status History', 'Update')}
                  />
                </TabsContent>
                <TabsContent value="settings" className="space-y-4">
                  <SettingsPage 
                    userRole={userRole}
                    subjects={subjects}
                    assessmentCategories={assessmentCategories}
                    onSaveSubjects={async (s) => { await saveSubjects(s); await fetchData(true); }}
                    onSaveCategories={async (c) => { await saveAssessmentCategories(c); await fetchData(true); }}
                    allRoles={allSystemRoles}
                    onSaveRoles={handleSaveRoles}
                    initialPermissions={permissions}
                    gradeScale={gradeScale}
                    onSaveGradeScale={async (g) => { await saveGradeScale(g); await fetchData(true); }}
                    onSwapLegacyNames={handleSwapLegacyNames}
                  />
                </TabsContent>
              </Tabs>
          </div>
        </main>
      </div>
    </>
  );
}

    

    