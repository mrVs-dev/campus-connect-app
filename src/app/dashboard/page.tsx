
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Admission, Assessment, Teacher, Enrollment, StudentStatusHistory, Subject, AssessmentCategory, UserRole, Fee, Invoice, Permissions, LetterGrade, InventoryItem, AddressData } from "@/lib/types";
import { Header } from "@/components/dashboard/header";
import { Overview } from "@/app/dashboard/overview";
import { StudentList } from "@/components/dashboard/student-list";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { EnrollmentForm } from "@/components/dashboard/enrollment-form";
import { AdmissionsList } from "@/components/dashboard/admissions-list";
import { TeacherList } from "@/components/dashboard/teacher-list";
import { StatusHistoryList } from "@/components/dashboard/status-history-list";
import { SettingsPage } from "@/components/dashboard/settings-page";
import { getStudents, addStudent, updateStudent, getAdmissions, saveAdmission, deleteStudent, importStudents, getAssessments, saveAssessment, deleteAllStudents as deleteAllStudentsFromDB, getTeachers, addTeacher, deleteSelectedStudents, moveStudentsToClass, getStudentStatusHistory, updateStudentStatus, getSubjects, getAssessmentCategories, saveSubjects, saveAssessmentCategories, updateTeacher, getFees, saveFee, deleteFee, getInvoices, saveInvoice, deleteInvoice, importAdmissions, getPermissions, getRoles, saveRoles, deleteTeacher, deleteMainUser, getGradeScale, saveGradeScale, getInventoryItems, saveInventoryItem, deleteInventoryItem, getTeacherForUser, getAddressData, saveAddressData } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeesList } from "@/components/dashboard/fees-list";
import { InvoicingList } from "@/components/dashboard/invoicing-list";
import { InventoryList } from "@/components/dashboard/inventory-list";
import type { User as AuthUser } from "firebase/auth";
import { AppModule, initialPermissions, APP_MODULES } from "@/lib/modules";
import { WelcomeHeader } from "@/components/dashboard/welcome-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

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

export const TABS_CONFIG: { value: string, label: string, module: AppModule }[] = [
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

  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [activeAdmissionsAccordion, setActiveAdmissionsAccordion] = React.useState<string | undefined>(undefined);
  
  const [data, setData] = React.useState<{
    students: Student[];
    admissions: Admission[];
    assessments: Assessment[];
    teachers: Teacher[];
    statusHistory: StudentStatusHistory[];
    subjects: Subject[];
    assessmentCategories: AssessmentCategory[];
    gradeScale: LetterGrade[];
    fees: Fee[];
    invoices: Invoice[];
    inventoryItems: InventoryItem[];
    addressData: AddressData | null;
    allSystemRoles: UserRole[];
    permissions: Permissions | null;
  } | null>(null);

  const [userRole, setUserRole] = React.useState<UserRole | null>(null);
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const hasPermission = (module: AppModule, action: 'Read' | 'Create' | 'Update' | 'Delete'): boolean => {
    if (!data?.permissions || !userRole) return false;
    if (userRole === 'Admin') return true;

    return data.permissions[module]?.[userRole]?.[action] ?? false;
  };
  
  const fetchData = React.useCallback(async (showToast = false) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const adminEmail = "vannak@api-school.com";
      const [currentTeacher, existingRoles] = await Promise.all([
          getTeacherForUser(user.uid),
          getRoles()
      ]);
      let currentUserRole: UserRole | null = null;
      let finalTeacherData = currentTeacher;

      if (user.email === adminEmail) {
          currentUserRole = 'Admin';
          if (!finalTeacherData) {
              const adminData: Omit<Teacher, 'teacherId' | 'status' | 'joinedDate'> = { firstName: 'Vannak', lastName: 'Admin', email: adminEmail, role: 'Admin' };
              await addTeacher(adminData);
              finalTeacherData = await getTeacherForUser(user.uid);
          } else if (finalTeacherData.role !== 'Admin') {
              await updateTeacher(finalTeacherData.teacherId, { role: 'Admin' });
              finalTeacherData.role = 'Admin';
          }
      } else if (finalTeacherData) {
          currentUserRole = finalTeacherData.role;
      }

      setUserRole(currentUserRole);

      if (!currentUserRole) {
          setLoading(false);
          return;
      }
      
      const [
        students, admissions, assessments, teachers, statusHistory,
        subjects, assessmentCategories, gradeScale, fees, invoices,
        inventoryItems, permissions, addressData
      ] = await Promise.all([
        getStudents(), getAdmissions(), getAssessments(), getTeachers(),
        getStudentStatusHistory(), getSubjects(), getAssessmentCategories(),
        getGradeScale(), getFees(), getInvoices(), getInventoryItems(),
        getPermissions(), getAddressData()
      ]);
      
      const completePermissions = JSON.parse(JSON.stringify(initialPermissions)) as Permissions;
      APP_MODULES.forEach(module => {
        if (!completePermissions[module]) completePermissions[module] = {};
        existingRoles.forEach(role => {
          if (!completePermissions[module][role]) {
            completePermissions[module][role] = { Create: false, Read: false, Update: false, Delete: false };
          }
          if (permissions[module]?.[role]) {
            completePermissions[module][role] = { ...completePermissions[module][role], ...permissions[module][role] };
          }
        });
      });

      setData({
        students, admissions, assessments, teachers, statusHistory,
        subjects, assessmentCategories, gradeScale, fees, invoices,
        inventoryItems, addressData, allSystemRoles: existingRoles,
        permissions: completePermissions,
      });

      if (showToast) {
        toast({ title: "Data Refreshed", description: "The latest data has been loaded." });
      }

    } catch (e: any) {
      console.error("Error fetching dashboard data:", e);
      setError(e.message || "Failed to load application data.");
    } finally {
        setLoading(false);
    }
  }, [user, toast]);

  const studentsWithLatestEnrollments = React.useMemo(() => {
    if (!data) return [];
    if (!data.admissions || data.admissions.length === 0) {
        return data.students.map(s => ({ ...s, enrollments: [] }));
    }

    const sortedAdmissions = [...data.admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));

    return data.students.map(student => {
        for (const admission of sortedAdmissions) {
            const studentAdmission = admission.students.find(sa => sa.studentId === student.studentId);
            if (studentAdmission && studentAdmission.enrollments.length > 0) {
                return { ...student, enrollments: studentAdmission.enrollments };
            }
        }
        return { ...student, enrollments: [] };
    });
  }, [data]);
  
  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchData();
  }, [user, authLoading, fetchData, router]);

  const handleUpdateStudent = async (studentId: string, updatedData: Partial<Student>) => {
    await updateStudent(studentId, updatedData);
    fetchData(true);
  };

  const handleSaveRoles = async (newRoles: UserRole[]) => {
    await saveRoles(newRoles);
    fetchData(true);
  };
  
  const handleUpdateStudentStatus = async (student: Student, newStatus: Student['status'], reason: string) => {
    if (!user) return;
    await updateStudentStatus(student, newStatus, reason, user);
    fetchData(true);
  }

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (!user) return;
    await deleteTeacher(teacher.teacherId);
    if(teacher.email) {
      const userToDelete = await getDocs(query(collection(db, "users"), where("email", "==", teacher.email)));
      if (!userToDelete.empty) {
        await deleteMainUser(userToDelete.docs[0].id);
      }
    }
    fetchData(true);
  };

  const handleUpdateTeacher = async (teacherId: string, updatedData: Partial<Teacher>) => {
    await updateTeacher(teacherId, updatedData);
    fetchData(true);
  };
  
  const handleSaveAdmission = async (admission: Admission, isNewClass: boolean) => {
    const success = await saveAdmission(admission, isNewClass);
    if (success) fetchData(true);
    return success;
  };
  
  const handleSaveAssessment = async (assessment: Assessment) => {
    const result = await saveAssessment(assessment);
    if(result) fetchData(true);
    return result;
  }

  const handleSaveItem = async (item: Omit<InventoryItem, 'itemId'> | InventoryItem) => {
    const success = await saveInventoryItem(item);
    if (success) fetchData(true);
    return success;
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteInventoryItem(itemId);
    fetchData(true);
  };

  if (authLoading || (loading && !data)) {
    return <div className="flex min-h-screen items-center justify-center">Loading Dashboard...</div>;
  }
  
  if (!loading && !userRole) {
    return <PendingApproval />;
  }

  if (error) {
      return <div className="flex min-h-screen items-center justify-center text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center">Preparing dashboard...</div>;
  }

  const visibleTabs = TABS_CONFIG.filter(tab => hasPermission(tab.module, 'Read'));
  
  const contentMap: { [key: string]: React.ReactNode } = {
    dashboard: <Overview students={studentsWithLatestEnrollments} admissions={data.admissions} />,
    students: <StudentList 
        userRole={userRole}
        students={studentsWithLatestEnrollments}
        assessments={data.assessments}
        admissions={data.admissions}
        subjects={data.subjects}
        assessmentCategories={data.assessmentCategories}
        onUpdateStudent={handleUpdateStudent}
        onUpdateStudentStatus={handleUpdateStudentStatus}
        onImportStudents={async (importedStudents) => { await importStudents(importedStudents); fetchData(true); }}
        onDeleteStudent={async (studentId) => { await deleteStudent(studentId); fetchData(true); }}
        onDeleteSelectedStudents={async (studentIds) => { await deleteSelectedStudents(studentIds); fetchData(true); }}
        onMoveStudents={async (studentIds, schoolYear, fromClass, toClass) => { await moveStudentsToClass(studentIds, schoolYear, fromClass, toClass); fetchData(true); }}
        gradeScale={data.gradeScale}
        hasPermission={hasPermission}
        addressData={data.addressData}
        />,
    users: <TeacherList 
        userRole={userRole}
        initialTeachers={data.teachers}
        onAddTeacher={async (teacher) => { await addTeacher(teacher); fetchData(true); }}
        onDeleteTeacher={handleDeleteTeacher}
        onUpdateTeacher={handleUpdateTeacher}
        onRefreshData={() => fetchData(true)}
        hasPermission={hasPermission}
      />,
    assessments: <AssessmentList 
        userRole={userRole}
        assessments={data.assessments}
        students={data.students}
        subjects={data.subjects}
        assessmentCategories={data.assessmentCategories}
        admissions={data.admissions}
        teachers={data.teachers}
        onSaveAssessment={handleSaveAssessment}
        hasPermission={hasPermission}
        />,
    fees: <FeesList
        fees={data.fees}
        onSaveFee={async (fee) => { const success = await saveFee(fee); if (success) fetchData(true); return success; }}
        onDeleteFee={async (feeId) => { await deleteFee(feeId); fetchData(true); }}
        hasPermission={hasPermission}
        />,
    invoicing: <InvoicingList
        invoices={data.invoices}
        students={data.students}
        fees={data.fees}
        onSaveInvoice={async (invoice) => { const success = await saveInvoice(invoice); if (success) fetchData(true); return success; }}
        onDeleteInvoice={async (invoiceId) => { await deleteInvoice(invoiceId); fetchData(true); }}
        hasPermission={hasPermission}
        />,
    inventory: <InventoryList
        inventoryItems={data.inventoryItems}
        onSaveItem={handleSaveItem}
        onDeleteItem={handleDeleteItem}
        hasPermission={hasPermission}
      />,
    admissions: <AdmissionsList 
        admissions={data.admissions}
        students={data.students}
        teachers={data.teachers}
        onSave={handleSaveAdmission}
        onImport={async (importData) => { await importAdmissions(importData); fetchData(true); }}
        activeAccordion={activeAdmissionsAccordion}
        onAccordionChange={setActiveAdmissionsAccordion}
        hasPermission={hasPermission}
        />,
    enrollment: <EnrollmentForm 
        onEnroll={async (student) => { await addStudent(student); fetchData(true); }}
        addressData={data.addressData}
      />,
    statusHistory: <StatusHistoryList
        history={data.statusHistory}
        students={data.students}
        onUpdateStatus={handleUpdateStudentStatus}
        canChangeStatus={hasPermission('Status History', 'Update')}
      />,
    settings: <SettingsPage 
        userRole={userRole}
        subjects={data.subjects}
        assessmentCategories={data.assessmentCategories}
        onSaveSubjects={async (s) => { await saveSubjects(s); fetchData(true); }}
        onSaveCategories={async (c) => { await saveAssessmentCategories(c); fetchData(true); }}
        allRoles={data.allSystemRoles}
        onSaveRoles={handleSaveRoles}
        initialPermissions={data.permissions}
        gradeScale={data.gradeScale}
        onSaveGradeScale={async (g) => { await saveGradeScale(g); fetchData(true); }}
        addressData={data.addressData}
        onSaveAddressData={async (a) => { await saveAddressData(a); fetchData(true); }}
      />,
  }

  return (
    <SidebarProvider>
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={visibleTabs} />
      <div className="flex flex-col w-full">
        <Header userRole={userRole} />
        <div className="p-4 md:p-8 space-y-4">
          <WelcomeHeader userRole={userRole} className="-mt-5" />
          <main className="flex-1 space-y-4">
            {contentMap[activeTab]}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
