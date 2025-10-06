
"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getStudents, getAdmissions, getAssessments, saveAssessment, getTeachers, getSubjects, getAssessmentCategories } from "@/lib/firebase/firestore";
import type { Student, Assessment, Subject, AssessmentCategory, Teacher } from "@/lib/types";
import { programs } from "@/lib/program-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { calculateStudentAverage, getLetterGrade } from "@/lib/grades";
import { NewAssessmentDialog } from "@/components/dashboard/new-assessment-dialog";
import { GradeEntrySheet } from "@/components/dashboard/grade-entry-sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceRoster } from "@/components/dashboard/attendance-roster";

interface RosterStudent extends Student {
  averageScore: number;
  letterGrade: string;
}

export default function RosterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classIdParam = params.classId;
  const classId = Array.isArray(classIdParam) ? classIdParam[0] : classIdParam;

  const [roster, setRoster] = React.useState<RosterStudent[]>([]);
  const [classAssessments, setClassAssessments] = React.useState<Assessment[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assessmentCategories, setAssessmentCategories] = React.useState<AssessmentCategory[]>([]);
  const [classInfo, setClassInfo] = React.useState<{ programName: string; level: string; programId: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = React.useState(false);
  const [assessmentToGrade, setAssessmentToGrade] = React.useState<Assessment | null>(null);
  const [loggedInTeacher, setLoggedInTeacher] = React.useState<Teacher | null>(null);


  const fetchData = React.useCallback(async () => {
    if (user && typeof classId === 'string') {
        try {
            setLoading(true);
            
            const [schoolYear, programId, ...levelParts] = classId.split('_');
            const level = levelParts.join('_').replace(/-/g, ' ');

            if (!schoolYear || !programId || !level) {
                throw new Error("Invalid class information provided.");
            }

            const programName = programs.find(p => p.id === programId)?.name || "Unknown Program";
            setClassInfo({ programName, level, programId });

            const [allStudents, admissions, assessments, teachers, subjectsData, categoriesData] = await Promise.all([
              getStudents(), 
              getAdmissions(), 
              getAssessments(), 
              getTeachers(),
              getSubjects(),
              getAssessmentCategories(),
            ]);

            setSubjects(subjectsData);
            setAssessmentCategories(categoriesData);
            
            const currentTeacher = teachers.find(t => t.email === user.email);
            if (!currentTeacher) {
              throw new Error("Could not identify the logged-in teacher.");
            }
            setLoggedInTeacher(currentTeacher);

            const studentIdsInClass = new Set<string>();
            const admission = admissions.find(a => a.schoolYear === schoolYear);
            
            if (admission) {
                // Find students who are in a class definition assigned to this teacher
                const classDef = admission.classes?.find(c => c.programId === programId && c.level === level);
                if (classDef && classDef.teacherIds?.includes(currentTeacher.teacherId)) {
                     admission.students.forEach(studentAdmission => {
                        if (studentAdmission.enrollments.some(e => e.programId === programId && e.level === level)) {
                            studentIdsInClass.add(studentAdmission.studentId);
                        }
                    });
                }

                // Also check classes assigned directly to the teacher's profile
                if (currentTeacher.assignedClasses?.some(c => c.schoolYear === schoolYear && c.programId === programId && c.level === level)) {
                     admission.students.forEach(studentAdmission => {
                        if (studentAdmission.enrollments.some(e => e.programId === programId && e.level === level)) {
                            studentIdsInClass.add(studentAdmission.studentId);
                        }
                    });
                }
            } else {
                console.warn(`No admission data found for school year ${schoolYear}. Roster may be incomplete.`);
            }

            const classRosterData = allStudents.filter(s => studentIdsInClass.has(s.studentId));
            
            const relevantAssessments = assessments.filter(assessment => 
                classRosterData.some(student => assessment.scores && assessment.scores[student.studentId] !== undefined)
            );
            setClassAssessments(relevantAssessments.sort((a,b) => (b.creationDate?.getTime() || 0) - (a.creationDate?.getTime() || 0)));

            const processedRoster = classRosterData.map(student => {
                const averageScore = calculateStudentAverage(student.studentId, assessments, subjectsData, categoriesData);
                const letterGrade = getLetterGrade(averageScore);
                return { ...student, averageScore, letterGrade };
            });

            setRoster(processedRoster.sort((a, b) => a.firstName.localeCompare(b.firstName)));

        } catch (err: any) {
            console.error("Failed to fetch roster data:", err);
            setError(err.message || "Could not load the class roster.");
        } finally {
            setLoading(false);
        }
    }
  }, [user, classId]);
  
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleSaveAssessment = async (assessmentData: Omit<Assessment, 'assessmentId' | 'teacherId'> | Assessment) => {
    try {
      const isNewAssessment = !('assessmentId' in assessmentData);
      const savedAssessment = await saveAssessment(assessmentData);
      
      await fetchData(); // Refetch all data to update the view
      
      if (isNewAssessment && savedAssessment) {
        setAssessmentToGrade(savedAssessment);
      }

      return savedAssessment;
    } catch (error) {
      console.error("Error saving assessment:", error);
      return null;
    }
  };

  const classAverages = React.useMemo(() => {
    if (roster.length === 0) return null;

    const assessmentAverages = classAssessments.map(assessment => {
      const scores = roster
        .map(student => assessment.scores[student.studentId])
        .filter(score => typeof score === 'number');
      
      if (scores.length === 0) return { assessmentId: assessment.assessmentId, average: null };
      
      const sum = scores.reduce((acc, score) => acc + (score ?? 0), 0);
      const averageRaw = sum / scores.length;
      const averagePercentage = Math.round((averageRaw / assessment.totalMarks) * 100);

      return { 
        assessmentId: assessment.assessmentId, 
        average: averagePercentage
      };
    });

    const overallAverageSum = roster.reduce((acc, student) => acc + student.averageScore, 0);
    const overallClassAverage = Math.round(overallAverageSum / roster.length);

    return {
      assessments: assessmentAverages,
      overall: overallClassAverage,
      letterGrade: getLetterGrade(overallClassAverage),
    };
  }, [roster, classAssessments]);


  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full">Loading class data...</div>;
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  const teacherSubjects = loggedInTeacher?.assignedSubjects 
    ? subjects.filter(s => loggedInTeacher.assignedSubjects?.includes(s.subjectId))
    : subjects;

  return (
    <div className="space-y-6">
       <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/teacher/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
        </Button>
      </div>

       <Card>
        <CardHeader>
            <div>
              <CardTitle>Class Management</CardTitle>
              <CardDescription>
                {classInfo?.programName} - {classInfo?.level} ({roster.length} students)
              </CardDescription>
            </div>
        </CardHeader>
         <CardContent>
           <Tabs defaultValue="gradebook">
             <TabsList className="grid w-full grid-cols-2">
               <TabsTrigger value="gradebook">Gradebook</TabsTrigger>
               <TabsTrigger value="attendance">Attendance</TabsTrigger>
             </TabsList>
             <TabsContent value="gradebook" className="mt-4">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="sticky left-0 bg-background z-10 w-[250px] min-w-[250px]">Student</TableHead>
                        <TableHead className="sticky left-[250px] bg-background z-10 text-center font-semibold text-primary w-[100px] min-w-[100px]">Overall (%)</TableHead>
                        <TableHead className="sticky left-[350px] bg-background z-10 text-center font-semibold text-primary w-[100px] min-w-[100px]">Grade</TableHead>
                        {classAssessments.map(assessment => (
                            <TableHead 
                            key={assessment.assessmentId} 
                            className="text-center min-w-[150px] cursor-pointer hover:bg-muted"
                            onClick={() => setAssessmentToGrade(assessment)}
                            >
                            {assessment.topic}
                            <span className="block text-xs font-normal text-muted-foreground">
                                ({assessment.totalMarks} pts)
                            </span>
                            </TableHead>
                        ))}
                        <TableHead className="text-center min-w-[150px]">
                            <Button variant="outline" size="sm" onClick={() => setIsNewAssessmentOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Assessment
                            </Button>
                        </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roster.map((student, index) => (
                        <TableRow key={student.studentId} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/50'}>
                            <TableCell className="sticky left-0 z-10 font-medium" style={{ backgroundColor: index % 2 === 0 ? 'hsl(var(--card))' : 'hsl(var(--muted)/0.5)' }}>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-9 w-9">
                                <AvatarImage src={student.avatarUrl} alt={student.firstName} className="object-cover" />
                                <AvatarFallback>
                                    {(student.firstName || ' ')[0]}{(student.lastName || ' ')[0]}
                                </AvatarFallback>
                                </Avatar>
                                <div>
                                {student.firstName} {student.lastName}
                                </div>
                            </div>
                            </TableCell>
                            <TableCell className="sticky left-[250px] z-10 text-center font-medium" style={{ backgroundColor: index % 2 === 0 ? 'hsl(var(--card))' : 'hsl(var(--muted)/0.5)' }}>{student.averageScore}</TableCell>
                            <TableCell className="sticky left-[350px] z-10 text-center font-medium" style={{ backgroundColor: index % 2 === 0 ? 'hsl(var(--card))' : 'hsl(var(--muted)/0.5)' }}>{student.letterGrade}</TableCell>
                            {classAssessments.map(assessment => (
                            <TableCell key={assessment.assessmentId} className="text-center">
                                {assessment.scores[student.studentId] ?? "—"}
                            </TableCell>
                            ))}
                            <TableCell></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    {classAverages && (
                        <TableFooter>
                        <TableRow>
                            <TableCell className="sticky left-0 bg-background z-10 font-semibold text-right">Class Average</TableCell>
                            <TableCell className="sticky left-[250px] bg-background z-10 text-center font-semibold text-primary">{classAverages.overall}%</TableCell>
                            <TableCell className="sticky left-[350px] bg-background z-10 text-center font-semibold text-primary">{classAverages.letterGrade}</TableCell>
                            {classAssessments.map(assessment => {
                            const avg = classAverages.assessments.find(a => a.assessmentId === assessment.assessmentId);
                            return (
                                <TableCell key={assessment.assessmentId} className="text-center font-semibold">
                                {avg?.average !== null ? `${avg?.average}%` : "—"}
                                </TableCell>
                            )
                            })}
                            <TableCell></TableCell>
                        </TableRow>
                        </TableFooter>
                    )}
                    </Table>
                    {roster.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No students are currently enrolled in this class.
                    </div>
                    )}
                </div>
             </TabsContent>
             <TabsContent value="attendance">
                {loggedInTeacher && (
                  <AttendanceRoster 
                    students={roster}
                    classId={classId}
                    teacherId={loggedInTeacher.teacherId}
                  />
                )}
             </TabsContent>
           </Tabs>
        </CardContent>
      </Card>
      
      <NewAssessmentDialog
        open={isNewAssessmentOpen}
        onOpenChange={setIsNewAssessmentOpen}
        onSave={handleSaveAssessment}
        subjects={teacherSubjects}
        assessmentCategories={assessmentCategories}
      />
      
      <GradeEntrySheet
        assessment={assessmentToGrade}
        students={roster}
        open={!!assessmentToGrade}
        onOpenChange={(isOpen) => !isOpen && setAssessmentToGrade(null)}
        onSaveGrades={handleSaveAssessment}
      />

    </div>
  );
}
