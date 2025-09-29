
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeachers, getAdmissions, addTeacher } from "@/lib/firebase/firestore";
import type { Teacher, Admission, Student } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { programs } from "@/lib/program-data";

interface AssignedClass {
  classId: string;
  schoolYear: string;
  programId: string;
  programName: string;
  level: string;
  studentCount: number;
}

function getCurrentSchoolYear() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  // School year is typically considered to start around August.
  // If we are before August, we are in the school year that started last year.
  if (currentMonth < 7) { 
    return `${currentYear - 1}-${currentYear}`;
  }
  return `${currentYear}-${currentYear + 1}`;
}


export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assignedClasses, setAssignedClasses] = React.useState<AssignedClass[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          setLoading(true);
          let [teachers, admissions] = await Promise.all([getTeachers(), getAdmissions()]);
          
          let loggedInTeacher = teachers.find(t => t.email === user.email);
          
          if (!loggedInTeacher && user.email) {
            const [firstName, ...lastNameParts] = user.displayName?.split(' ') || ["", ""];
            const newTeacherData = {
              firstName: firstName || "New",
              lastName: lastNameParts.join(' ') || "Teacher",
              email: user.email,
            };
            try {
                const newTeacher = await addTeacher(newTeacherData);
                teachers.push(newTeacher);
                loggedInTeacher = newTeacher;
            } catch (addError) {
                console.error("Failed to auto-create teacher profile:", addError);
                setError("Could not create a teacher profile for your account.");
                setLoading(false);
                return;
            }
          }

          if (!loggedInTeacher) {
            setError("Your email is not associated with a teacher profile. Please contact an administrator.");
            setLoading(false);
            return;
          }

          const schoolYear = getCurrentSchoolYear();
          const currentYearAdmission = admissions.find(a => a.schoolYear === schoolYear);
          
          if (!currentYearAdmission) {
            setAssignedClasses([]);
            setLoading(false);
            return;
          }

          const classMap = new Map<string, { programId: string; programName: string; level: string; students: Set<string> }>();

          const addStudentToClass = (programId: string, level: string, studentId: string) => {
             const classKey = `${programId}::${level}`;
             if (!classMap.has(classKey)) {
                const programName = programs.find(p => p.id === programId)?.name || "Unknown Program";
                classMap.set(classKey, { programId, programName, level, students: new Set() });
             }
             if (studentId) {
               classMap.get(classKey)!.students.add(studentId);
             }
          };
          
          const teacherId = loggedInTeacher.teacherId;

          // Find classes defined in the admission.classes array assigned to the teacher
          currentYearAdmission.classes?.forEach(classDef => {
            if (classDef.teacherIds?.includes(teacherId)) {
                addStudentToClass(classDef.programId, classDef.level, '');
            }
          });

          // Find classes from student enrollments
          currentYearAdmission.students.forEach(studentAdmission => {
            studentAdmission.enrollments.forEach(enrollment => {
              if (enrollment.teacherIds?.includes(teacherId)) {
                 addStudentToClass(enrollment.programId, enrollment.level, studentAdmission.studentId);
              }
            });
          });
          
          const classes: AssignedClass[] = Array.from(classMap.values()).map(classInfo => ({
            classId: `${schoolYear}_${classInfo.programId}_${classInfo.level}`.replace(/\s+/g, '-'),
            schoolYear: schoolYear,
            programId: classInfo.programId,
            programName: classInfo.programName,
            level: classInfo.level,
            studentCount: classInfo.students.size,
          }));
          
          setAssignedClasses(classes.sort((a,b) => a.programName.localeCompare(b.programName) || a.level.localeCompare(b.level)));

        } catch (err) {
          console.error("Failed to fetch teacher data:", err);
          setError("Could not load your dashboard. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, router]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full">Loading your dashboard...</div>;
  }

  if (error) {
     return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Access Error</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
        </Card>
     );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard</h1>
       <Card>
        <CardHeader>
          <CardTitle>My Classes ({getCurrentSchoolYear()})</CardTitle>
          <CardDescription>
            Here are your assigned classes for the current school year. Select a class to view the roster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedClasses.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedClasses.map(cls => (
                <Link href={`/teacher/roster/${cls.classId}`} key={cls.classId} legacyBehavior>
                  <a className="block hover:shadow-lg transition-shadow rounded-lg">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{cls.programName}</CardTitle>
                        <CardDescription>{cls.level}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium">{cls.studentCount} student(s)</p>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
                You have no classes assigned for the {getCurrentSchoolYear()} school year.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
