
"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getStudents, getAdmissions, getAssessments, saveAssessment, getTeachers } from "@/lib/firebase/firestore";
import type { Student, Admission, Assessment, Teacher } from "@/lib/types";
import { programs } from "@/lib/program-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { calculateStudentAverage, getLetterGrade } from "@/lib/grades";
import { AssessmentList } from "@/components/dashboard/assessment-list";

interface RosterStudent extends Student {
  averageScore: number;
  letterGrade: string;
}

export default function RosterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { classId } = params;

  const [roster, setRoster] = React.useState<RosterStudent[]>([]);
  const [classAssessments, setClassAssessments] = React.useState<Assessment[]>([]);
  const [allAssessments, setAllAssessments] = React.useState<Assessment[]>([]);
  const [classInfo, setClassInfo] = React.useState<{ programName: string; level: string; programId: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (user && typeof classId === 'string') {
        try {
            setLoading(true);
            const classIdParts = classId.split('_');
            if (classIdParts.length < 3) throw new Error("Invalid class ID format.");
            
            const schoolYear = classIdParts[0];
            const programId = classIdParts[1];
            const level = classIdParts.slice(2).join('_').replace(/-/g, ' '); // Rejoin level parts and replace dashes with spaces

            if (!schoolYear || !programId || !level) {
                throw new Error("Invalid class information provided.");
            }

            const programName = programs.find(p => p.id === programId)?.name || "Unknown Program";
            setClassInfo({ programName, level, programId });

            const [allStudents, admissions, assessments, teachers] = await Promise.all([getStudents(), getAdmissions(), getAssessments(), getTeachers()]);
            setAllAssessments(assessments);

            const admission = admissions.find(a => a.schoolYear === schoolYear);
            const loggedInTeacher = teachers.find(t => t.email === user.email);
            const loggedInTeacherId = loggedInTeacher?.teacherId;

            if (!loggedInTeacherId) {
                throw new Error("Could not identify the logged-in teacher.");
            }
            
            const studentIdsInClass = new Set<string>();

            if (admission) {
                // Find students enrolled in this class via direct student admission records and taught by this teacher
                admission.students.forEach(studentAdmission => {
                    if (studentAdmission.enrollments.some(e => 
                        e.programId === programId && 
                        e.level === level &&
                        e.teacherIds?.includes(loggedInTeacherId)
                    )) {
                        studentIdsInClass.add(studentAdmission.studentId);
                    }
                });

                // Find students in this class via the class definition if the teacher is assigned
                const classDef = admission.classes?.find(c => c.programId === programId && c.level === level);
                if (classDef && classDef.teacherIds?.includes(loggedInTeacherId)) {
                    // This logic is important for classes that might not have students explicitly assigned to a teacher in their enrollment record
                    // We find all students in that class and add them.
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
            setClassAssessments(relevantAssessments.sort((a,b) => a.topic.localeCompare(b.topic)));

            const processedRoster = classRosterData.map(student => {
                const averageScore = calculateStudentAverage(student.studentId, assessments);
                const letterGrade = getLetterGrade(averageScore);
                return { ...student, averageScore, letterGrade };
            });

            setRoster(processedRoster);

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
      const savedAssessment = await saveAssessment(assessmentData);
      await fetchData(); // Refetch all data to update the view
      return savedAssessment;
    } catch (error) {
      console.error("Error saving assessment:", error);
      return null;
    }
  };


  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full">Loading class gradebook...</div>;
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
              <CardTitle>Gradebook</CardTitle>
              <CardDescription>
                {classInfo?.programName} - {classInfo?.level} ({roster.length} students)
              </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 w-1/3 min-w-[250px]">Student</TableHead>
                  {classAssessments.map(assessment => (
                    <TableHead key={assessment.assessmentId} className="text-center min-w-[150px]">
                      {assessment.topic}
                      <span className="block text-xs font-normal text-muted-foreground">
                        ({assessment.totalMarks} pts)
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold text-primary min-w-[120px]">Overall (%)</TableHead>
                  <TableHead className="text-center font-semibold text-primary min-w-[120px]">Letter Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map(student => (
                  <TableRow key={student.studentId}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
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
                    {classAssessments.map(assessment => (
                      <TableCell key={assessment.assessmentId} className="text-center">
                        {assessment.scores[student.studentId] ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-medium">{student.averageScore}</TableCell>
                    <TableCell className="text-center font-medium">{student.letterGrade}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {roster.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                No students are currently enrolled in this class.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div>
        <AssessmentList
            assessments={allAssessments}
            students={roster}
            onSaveAssessment={handleSaveAssessment}
        />
      </div>
    </div>
  );
}
