
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getTeachers, getAdmissions, addTeacher, getStudents, getAssessments, saveAssessment, getSubjects, getAssessmentCategories, updateTeacher } from "@/lib/firebase/firestore";
import type { Teacher, Admission, Student, Assessment, Subject, AssessmentCategory, ClassAssignment } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { programs } from "@/lib/program-data";
import { BarChart, UserCheck, TrendingUp, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AssessmentList } from "@/components/dashboard/assessment-list";
import { calculateStudentAverage } from "@/lib/grades";
import { Button } from "@/components/ui/button";

interface AssignedClass {
  classId: string;
  schoolYear: string;
  programId: string;
  programName: string;
  level: string;
  students: Student[];
  averagePerformance: number;
}

interface PerformanceMetrics {
  overallAverage: number;
  outstandingStudent: { name: string; score: number } | null;
  mostImprovedStudent: { name: string; improvement: number } | null;
}

function getCurrentSchoolYear() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  if (currentMonth < 7) { 
    return `${currentYear - 1}-${currentYear}`;
  }
  return `${currentYear}-${currentYear + 1}`;
}

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assignedClasses, setAssignedClasses] = React.useState<AssignedClass[]>([]);
  const [allAssessments, setAllAssessments] = React.useState<Assessment[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assessmentCategories, setAssessmentCategories] = React.useState<AssessmentCategory[]>([]);
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
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
          let [teachers, admissions, allStudents, assessments, subjectsData, categoriesData] = await Promise.all([
            getTeachers(), 
            getAdmissions(), 
            getStudents(), 
            getAssessments(),
            getSubjects(),
            getAssessmentCategories(),
          ]);
          
          let loggedInTeacher = teachers.find(t => t.email === user.email);
          
          if (!loggedInTeacher) {
             // If user is not in the teacher list at all, they might be admin/other role
            router.replace('/dashboard');
            return;
          }
          
          // Auto-assign 'Teacher' role if not present, but only if they are not another role type
          if (!loggedInTeacher.role) {
            loggedInTeacher.role = 'Teacher';
            await updateTeacher(loggedInTeacher.teacherId, { role: 'Teacher' });
             // Re-fetch teachers to get the latest role
            teachers = await getTeachers();
            loggedInTeacher = teachers.find(t => t.email === user.email)!;
          }

          if (loggedInTeacher.role !== 'Teacher') {
            router.replace('/dashboard');
            return;
          }
          
          setAllAssessments(assessments);
          setSubjects(subjectsData);
          setAssessmentCategories(categoriesData);

          const classMap = new Map<string, { schoolYear: string, programId: string; programName: string; level: string; students: Set<string> }>();
          const teacherId = loggedInTeacher.teacherId;

          admissions.forEach(admission => {
              // Source 1: Get classes from the teacher's own profile
              loggedInTeacher?.assignedClasses?.forEach(assignedClass => {
                  if (assignedClass.schoolYear === admission.schoolYear) {
                      const classKey = `${assignedClass.schoolYear}::${assignedClass.programId}::${assignedClass.level}`;
                      if (!classMap.has(classKey)) {
                           const programName = programs.find(p => p.id === assignedClass.programId)?.name || "Unknown Program";
                           classMap.set(classKey, { schoolYear: assignedClass.schoolYear, programId: assignedClass.programId, programName, level: assignedClass.level, students: new Set() });
                       }
                  }
              });

              // Source 2: Get classes where this teacher is listed in the class definition for the year
              admission.classes?.forEach(classDef => {
                  if (classDef.teacherIds?.includes(teacherId)) {
                      const classKey = `${admission.schoolYear}::${classDef.programId}::${classDef.level}`;
                       if (!classMap.has(classKey)) {
                           const programName = programs.find(p => p.id === classDef.programId)?.name || "Unknown Program";
                           classMap.set(classKey, { schoolYear: admission.schoolYear, programId: classDef.programId, programName, level: classDef.level, students: new Set() });
                       }
                  }
              });

              // Now, populate students for all identified classes for this admission year
              admission.students.forEach(studentAdmission => {
                  studentAdmission.enrollments.forEach(enrollment => {
                       const classKey = `${admission.schoolYear}::${enrollment.programId}::${enrollment.level}`;
                       if (classMap.has(classKey)) {
                           classMap.get(classKey)!.students.add(studentAdmission.studentId);
                       }
                  });
              });
          });
          
          const classes: AssignedClass[] = Array.from(classMap.values()).map(classInfo => {
            const studentsInClass = allStudents.filter(s => classInfo.students.has(s.studentId));
            const classAverages = studentsInClass.map(s => calculateStudentAverage(s.studentId, assessments, subjectsData, categoriesData));
            const totalAverage = classAverages.reduce((sum, avg) => sum + avg, 0);
            const averagePerformance = studentsInClass.length > 0 ? Math.round(totalAverage / studentsInClass.length) : 0;
            
            return {
              classId: `${classInfo.schoolYear}_${classInfo.programId}_${classInfo.level}`.replace(/\s+/g, '-'),
              schoolYear: classInfo.schoolYear,
              programId: classInfo.programId,
              programName: classInfo.programName,
              level: classInfo.level,
              students: studentsInClass,
              averagePerformance: averagePerformance,
            };
          });
          
          setAssignedClasses(classes.sort((a,b) => b.schoolYear.localeCompare(a.schoolYear) || a.programName.localeCompare(b.programName) || a.level.localeCompare(b.level)));

          // Calculate overall metrics
          const allClassStudents = classes.flatMap(c => c.students);
          const uniqueStudentIds = [...new Set(allClassStudents.map(s => s.studentId))];
          const uniqueStudents = uniqueStudentIds.map(id => allStudents.find(s => s.studentId === id)!);
          
          if (uniqueStudents.length > 0) {
            const studentAverages = uniqueStudents.map(s => ({ student: s, average: calculateStudentAverage(s.studentId, assessments, subjectsData, categoriesData) }));
            
            const totalAverage = studentAverages.reduce((sum, s) => sum + s.average, 0);
            const overallAverage = Math.round(totalAverage / studentAverages.length);

            const outstandingStudent = studentAverages.reduce((max, current) => current.average > max.average ? current : max, studentAverages[0]);
            
            // NOTE: Most improved student logic is a placeholder. A real implementation would need historical data.
            const mostImprovedStudent = studentAverages.length > 1 ? { name: `${studentAverages[1].student.firstName} ${studentAverages[1].student.lastName}`, improvement: 5 } : null;

            setMetrics({
              overallAverage,
              outstandingStudent: { name: `${outstandingStudent.student.firstName} ${outstandingStudent.student.lastName}`, score: outstandingStudent.average },
              mostImprovedStudent,
            });
          }


        } catch (err: any) {
          console.error("Failed to fetch teacher data:", err);
          setError(err.message || "Could not load your dashboard. Please try again later.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, router]);
  
  const handleSaveAssessment = async (assessmentData: Omit<Assessment, 'assessmentId' | 'teacherId'> | Assessment) => {
    try {
      const savedAssessment = await saveAssessment(assessmentData);
      setAllAssessments(prev => {
        const existingIndex = prev.findIndex(a => a.assessmentId === savedAssessment.assessmentId);
        if (existingIndex > -1) {
            const updatedAssessments = [...prev];
            updatedAssessments[existingIndex] = savedAssessment;
            return updatedAssessments;
        } else {
            return [...prev, savedAssessment];
        }
      });
      return savedAssessment;
    } catch (error) {
      console.error("Error saving assessment:", error);
      return null;
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-screen">Loading your dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's a summary of your classes.</p>
      </div>

      {error && (
         <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Access Error</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
        </Card>
      )}

      {metrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Class Performance</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overallAverage}%</div>
              <p className="text-xs text-muted-foreground">Across all your classes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Student</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.outstandingStudent?.name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">Highest overall score of {metrics.outstandingStudent?.score || 0}%</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Improved</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.mostImprovedStudent?.name || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">+{metrics.mostImprovedStudent?.improvement || 0}% from last assessment cycle</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Class Rosters</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/teacher/roster">View All Class Rosters</Link>
              </Button>
            </div>
            {assignedClasses.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedClasses.map(cls => (
                <Card key={cls.classId} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">{cls.programName}</CardTitle>
                    <CardDescription>{cls.level} ({cls.schoolYear})</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <p className="text-sm font-medium">{cls.students.length} student(s)</p>
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Avg. Performance</span>
                        <span>{cls.averagePerformance}%</span>
                      </div>
                      <Progress value={cls.averagePerformance} />
                    </div>
                  </CardContent>
                  <CardContent>
                     <Link href={`/teacher/roster/${cls.classId}`} className="flex items-center justify-end text-sm font-medium text-primary hover:underline">
                        View Roster <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-card rounded-lg">
                  You have no classes assigned.
              </div>
            )}
          </div>
          
          <div>
             <h2 className="text-2xl font-bold mb-4">Assessments</h2>
             <AssessmentList
                userRole="Teacher"
                assessments={allAssessments}
                students={assignedClasses.flatMap(c => c.students)}
                subjects={subjects}
                assessmentCategories={assessmentCategories}
                onSaveAssessment={handleSaveAssessment}
            />
          </div>
      </div>
    </div>
  );
}

    