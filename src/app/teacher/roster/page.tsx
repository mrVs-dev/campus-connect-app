
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getAdmissions, getStudents, getAssessments, getSubjects, getAssessmentCategories } from "@/lib/firebase/firestore";
import type { Admission, Student, Assessment, Subject, AssessmentCategory } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { programs } from "@/lib/program-data";
import { ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { calculateStudentAverage } from "@/lib/grades";

interface ClassRosterInfo {
  classId: string;
  schoolYear: string;
  programId: string;
  programName: string;
  level: string;
  studentCount: number;
  averagePerformance: number;
}

export default function AllRostersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allClasses, setAllClasses] = React.useState<ClassRosterInfo[]>([]);
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
          const [admissions, allStudents, assessments, subjects, categories] = await Promise.all([
            getAdmissions(),
            getStudents(),
            getAssessments(),
            getSubjects(),
            getAssessmentCategories(),
          ]);

          const classMap = new Map<string, { schoolYear: string, programId: string; programName: string; level: string; students: Set<string> }>();
          
          admissions.forEach(admission => {
            // Source 1: Get classes from class definitions, ensuring even empty classes are shown
            admission.classes?.forEach(classDef => {
              const classKey = `${admission.schoolYear}::${classDef.programId}::${classDef.level}`;
              if (!classMap.has(classKey)) {
                const programName = programs.find(p => p.id === classDef.programId)?.name || "Unknown Program";
                classMap.set(classKey, { schoolYear: admission.schoolYear, programId: classDef.programId, programName, level: classDef.level, students: new Set() });
              }
            });

            // Source 2: Get classes from student enrollments
            admission.students.forEach(studentAdmission => {
              studentAdmission.enrollments.forEach(enrollment => {
                const classKey = `${admission.schoolYear}::${enrollment.programId}::${enrollment.level}`;
                if (!classMap.has(classKey)) {
                   const programName = programs.find(p => p.id === enrollment.programId)?.name || "Unknown Program";
                   classMap.set(classKey, { schoolYear: admission.schoolYear, programId: enrollment.programId, programName, level: enrollment.level, students: new Set() });
                }
                classMap.get(classKey)!.students.add(studentAdmission.studentId);
              });
            });
          });

          const classList: ClassRosterInfo[] = Array.from(classMap.values()).map(classInfo => {
            const studentsInClass = allStudents.filter(s => classInfo.students.has(s.studentId));
            const classAverages = studentsInClass.map(s => calculateStudentAverage(s.studentId, assessments, subjects, categories));
            const totalAverage = classAverages.reduce((sum, avg) => sum + avg, 0);
            const averagePerformance = studentsInClass.length > 0 ? Math.round(totalAverage / studentsInClass.length) : 0;
            
            return {
              classId: `${classInfo.schoolYear}_${classInfo.programId}_${classInfo.level}`.replace(/\s+/g, '-'),
              schoolYear: classInfo.schoolYear,
              programId: classInfo.programId,
              programName: classInfo.programName,
              level: classInfo.level,
              studentCount: studentsInClass.length,
              averagePerformance: averagePerformance,
            };
          });

          setAllClasses(classList.sort((a,b) => b.schoolYear.localeCompare(a.schoolYear) || a.programName.localeCompare(b.programName) || a.level.localeCompare(b.level)));

        } catch (err: any) {
          console.error("Failed to fetch all class data:", err);
          setError(err.message || "Could not load class rosters.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, router]);


  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-screen">Loading all class rosters...</div>;
  }
  
  if (error) {
     return (
        <div className="flex flex-col gap-8 items-center justify-center h-screen">
         <Card className="border-destructive max-w-lg">
            <CardHeader>
                <CardTitle className="text-center">Error</CardTitle>
                <CardDescription className="text-center">{error}</CardDescription>
            </CardHeader>
        </Card>
        </div>
      );
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold mb-2">All Class Rosters</h1>
            <p className="text-muted-foreground">Browse all classes across all school years.</p>
        </div>

        {allClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allClasses.map(cls => (
                <Card key={cls.classId} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">{cls.programName}</CardTitle>
                    <CardDescription>{cls.level} ({cls.schoolYear})</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                    <p className="text-sm font-medium">{cls.studentCount} student(s)</p>
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
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg">
                No classes found.
            </div>
        )}
    </div>
  )
}

    