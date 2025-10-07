

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Admission, Assessment, Teacher, Enrollment, StudentStatusHistory, Subject, AssessmentCategory, UserRole, Fee, Invoice, InventoryItem, Permissions } from "@/lib/types";
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
  
  const [allSystemRoles, setAllSystemRoles] = React.useState<UserRole[]>([]);
  const [userRole, setUserRole] = React.useState<UserRole | null>(null);
  const [permissions, setPermissions] = React.useState<Permissions | null>(null);

  const [isDataLoading, setIsDataLoading] = React.useState(true);
  const [pendingUsers, setPendingUsers] = React.useState<AuthUser[]>([]);

  const studentsWithLatestEnrollments = React.useMemo(() => {
    if (!admissions || admissions.length === 0) {
        // If no admissions data, ensure students don't have stale enrollment data
        return students.map(s => ({ ...s, enrollments: [] }));
    }

    const sortedAdmissions = [...admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));

    return students.map(student => {
        for (const admission of sortedAdmissions) {
            const studentAdmission = admission.students.find(sa => sa.studentId === student.studentId);
            if (studentAdmission && studentAdmission.enrollments.length > 0) {
                // Found the most recent year with enrollments, so use these and stop.
                return { ...student, enrollments: studentAdmission.enrollments };
            }
        }
        // If no enrollments were found for the student in any year, ensure their enrollments are cleared.
        return { ...student, enrollments: [] };
    });
}, [students, admissions]);
  
  const fetchData = React.useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
      const loggedInUserEmail = user.email;

      const [allStudentsForCheck, allTeachersForCheck, allDbUsers, allRolesFromDb, savedPermissions] = await Promise.all([
        getStudents(), 
        getTeachers(), 
        getUsers(),
        getRoles(),
        getPermissions(),
      ]);
      setAllSystemRoles(allRolesFromDb);
      
      if (allStudentsForCheck.some(s => s.studentEmail === loggedInUserEmail)) {
          router.replace('/student/dashboard');
          return;
      }
      if (allStudentsForCheck.some(s => s.guardians?.some(g => g.email === loggedInUserEmail))) {
          router.replace('/guardian/dashboard');
          return;
      }

      let finalRole: UserRole | null = null;
      if (loggedInUserEmail === ADMIN_EMAIL) {
        finalRole = 'Admin';
      } else {
        const loggedInStaffMember = allTeachersForCheck.find(t => t.email === loggedInUserEmail);
        if (loggedInStaffMember && loggedInStaffMember.role) {
          finalRole = loggedInStaffMember.role;
        }
      }
      
      if (!finalRole) {
        setAllUsers(allDbUsers as AuthUser[]);
        setTeachers(allTeachersForCheck);
        const teacherEmails = new Set(allTeachersForCheck.map(t => t.email).filter(Boolean));
        setPendingUsers(allDbUsers.filter(u => u.email && !teacherEmails.has(u.email)) as AuthUser[]);
        setUserRole(null);
        setIsDataLoading(false);
        return;
      }
      
      setUserRole(finalRole);
      
      if (finalRole === 'Teacher') {
          router.replace('/teacher/dashboard');
          return;
      }
      
      let currentRoles = [...allRolesFromDb];
      const rolesToAdd: UserRole[] = ["Office Manager", "Finance Officer"];
      let madeRoleChanges = false;
      rolesToAdd.forEach(role => {
          if (!currentRoles.some(r => r.toLowerCase() === role.toLowerCase())) {
              currentRoles.push(role);
              madeRoleChanges = true;
          }
      });
      if (madeRoleChanges) {
        await saveRoles(currentRoles);
        setAllSystemRoles(currentRoles);
      }

      const completePermissions = JSON.parse(JSON.stringify(initialPermissions)) as Permissions;
      APP_MODULES.forEach(module => {
         if (!completePermissions[module]) completePermissions[module] = {};
         currentRoles.forEach(role => {
             if (!completePermissions[module][role]) {
                completePermissions[module][role] = { Create: false, Read: false, Update: false, Delete: false };
             }
             if (savedPermissions[module]?.[role]) {
                 completePermissions[module][role] = { ...completePermissions[module][role], ...savedPermissions[module][role] };
             }
         });
      });
      setPermissions(completePermissions);
      
      const [
        admissionsData, 
        assessmentsData, 
        statusHistoryData, 
        subjectsData,
        feesData,
        invoicesData,
        inventoryData,
      ] = await Promise.all([
        getAdmissions(),
        getAssessments(),
        getStudentStatusHistory(),
        getSubjects(),
        getFees(),
        getInvoices(),
        getInventoryItems(),
      ]);

      setStudents(allStudentsForCheck);
      setAdmissions(admissionsData);
      setAssessments(assessmentsData);
      setTeachers(allTeachersForCheck);
      setAllUsers(allDbUsers as AuthUser[]);
      setStatusHistory(statusHistoryData);
      setSubjects(subjectsData);
      setAssessmentCategories(await getAssessmentCategories());
      setFees(feesData);
      setInvoices(invoicesData);
      setInventory(inventoryData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [user, router, toast]);

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
    fetchData();
  }, [user, authLoading, router, fetchData]);

  const handleSaveRoles = async (newRoles: UserRole[]) => {
    await saveRoles(newRoles);
    await fetchData(); 
    toast({ title: "Roles updated", description: "The list of system roles has been saved." });
  };
  
  const handleUpdateStudentStatus = async (student: Student, newStatus: Student['status'], reason: string) => {
    if (!user) return;
    await updateStudentStatus(student, newStatus, reason, user);
    await fetchData();
    toast({
      title: "Status Updated",
      description: `${student.firstName}'s status has been changed to ${newStatus}.`,
    });
  }

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!user) return;
    try {
        await deleteTeacher(teacher.teacherId);
        const userToDelete = allUsers.find(u => u.email === teacher.email);
        if (userToDelete) {
            await deleteMainUser(userToDelete.uid);
        }
        
        setTeachers(prev => prev.filter(t => t.teacherId !== teacher.teacherId));
        setAllUsers(prev => prev.filter(u => u.email !== teacher.email));

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
  
  const hasPermission = (module: AppModule, action: 'Read' | 'Create' | 'Update' | 'Delete'): boolean => {
    if (!permissions || !userRole) return false;
    if (userRole === 'Admin') return true;

    return permissions[module]?.[userRole]?.[action] ?? false;
  };

  if (authLoading || isDataLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  if (!userRole) {
    return <PendingApproval />;
  }

  return (
    <>
      <Header userRole={userRole} />
      <div className="hidden h-[calc(100vh-4rem)] border-t bg-background md:block">
        <div className="container relative h-full max-w-7xl">
          <main className="flex h-full flex-col overflow-y-auto pt-4 md:pt-8">
            <div className="container flex flex-col gap-6 py-4">
              <Tabs defaultValue="dashboard" className="w-full space-y-4">
                <TabsList>
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
                    onUpdateStudent={updateStudent}
                    onUpdateStudentStatus={handleUpdateStudentStatus}
                    onImportStudents={importStudents}
                    onDeleteStudent={deleteStudent}
                    onDeleteSelectedStudents={deleteSelectedStudents}
                    onMoveStudents={(studentIds, schoolYear, fromClass, toClass) => moveStudentsToClass(studentIds, schoolYear, fromClass, toClass)}
                    />
                </TabsContent>
                <TabsContent value="users" className="space-y-4">
                  <TeacherList 
                      userRole={userRole}
                      teachers={teachers}
                      onAddTeacher={addTeacher}
                      onDeleteTeacher={handleDeleteTeacher}
                      pendingUsers={pendingUsers}
                    />
                </TabsContent>
                <TabsContent value="assessments" className="space-y-4">
                  <AssessmentList 
                    userRole={userRole}
                    assessments={assessments}
                    students={students}
                    subjects={subjects}
                    assessmentCategories={assessmentCategories}
                    onSaveAssessment={saveAssessment}
                    />
                </TabsContent>
                <TabsContent value="fees" className="space-y-4">
                  <FeesList
                    fees={fees}
                    onSaveFee={saveFee}
                    onDeleteFee={deleteFee}
                    />
                </TabsContent>
                 <TabsContent value="invoicing" className="space-y-4">
                  <InvoicingList
                    invoices={invoices}
                    students={students}
                    fees={fees}
                    onSaveInvoice={saveInvoice}
                    onDeleteInvoice={deleteInvoice}
                    />
                </TabsContent>
                 <TabsContent value="inventory" className="space-y-4">
                  <InventoryList
                    inventoryItems={inventory}
                    onSaveItem={saveInventoryItem}
                    onDeleteItem={deleteInventoryItem}
                    />
                </TabsContent>
                <TabsContent value="admissions" className="space-y-4">
                  <AdmissionsList 
                    admissions={admissions}
                    students={students}
                    teachers={teachers}
                    onSave={saveAdmission}
                    onImport={importAdmissions}
                    />
                </TabsContent>
                <TabsContent value="enrollment" className="space-y-4">
                  <EnrollmentForm onEnroll={addStudent as any} />
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
                    subjects={subjects}
                    assessmentCategories={assessmentCategories}
                    onSaveSubjects={saveSubjects}
                    onSaveCategories={saveAssessmentCategories}
                    allRoles={allSystemRoles}
                    onSaveRoles={handleSaveRoles}
                    initialPermissions={permissions}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

    