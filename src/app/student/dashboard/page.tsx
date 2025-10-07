

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getStudents, getAdmissions, getAssessments, getSubjects, getAssessmentCategories, getAttendanceForClass } from "@/lib/firebase/firestore";
import type { Student, Admission, Assessment, Subject, AssessmentCategory, Enrollment, AttendanceRecord } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { programs } from "@/lib/program-data";
import { BookOpen, CalendarCheck, TrendingUp, User, GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { calculateStudentAverage } from "@/lib/grades";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface EnrolledClass {
  programName: string;
  level: string;
  teacherNames?: string[];
}

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [student, setStudent] = React.useState<Student | null>(null);
  const [enrolledClasses, setEnrolledClasses] = React.useState<EnrolledClass[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assessmentCategories, setAssessmentCategories] = React.useState<AssessmentCategory[]>([]);
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([]);
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
          const [allStudents, allAdmissions, allAssessments, allSubjects, allCategories] = await Promise.all([
            getStudents(),
            getAdmissions(),
            getAssessments(),
            getSubjects(),
            getAssessmentCategories(),
          ]);

          const loggedInStudent = allStudents.find(s => s.guardians?.some(g => g.mobiles.includes(user.email || '')) || s.studentId === user.email);

          if (!loggedInStudent) {
            setError("Could not find student data for the logged-in user.");
            setLoading(false);
            return;
          }
          
          setStudent(loggedInStudent);
          setAssessments(allAssessments);
          setSubjects(allSubjects);
          setAssessmentCategories(allCategories);

          const studentEnrollments: Enrollment[] = [];
          allAdmissions.forEach(admission => {
            admission.students.forEach(studentAdmission => {
              if (studentAdmission.studentId === loggedInStudent.studentId) {
                studentEnrollments.push(...studentAdmission.enrollments);
              }
            });
          });
          
          const uniqueEnrollments = Array.from(new Map(studentEnrollments.map(e => [`${e.programId}-${e.level}`, e])).values());

          const classes = uniqueEnrollments.map(enrollment => {
            const program = programs.find(p => p.id === enrollment.programId);
            return {
              programName: program?.name || "Unknown Program",
              level: enrollment.level,
            };
          });
          setEnrolledClasses(classes);

          const classIds = uniqueEnrollments.map(e => `${new Date().getFullYear() -1}-${new Date().getFullYear()}_${e.programId}_${e.level}`);
          const attendancePromises = classIds.map(id => getAttendanceForClass(id, new Date()));
          const attendanceResults = await Promise.all(attendancePromises);
          const studentAttendance = attendanceResults.flat().filter(a => a.studentId === loggedInStudent.studentId);
          setAttendance(studentAttendance);

        } catch (err: any) {
          console.error("Failed to fetch student data:", err);
          setError(err.message || "Could not load your dashboard.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, router]);

  const studentAverage = React.useMemo(() => {
    if (!student) return 0;
    return calculateStudentAverage(student.studentId, assessments, subjects, assessmentCategories);
  }, [student, assessments, subjects, assessmentCategories]);

  const performanceBySubject = React.useMemo(() => {
    if (!student) return [];
    const studentAssessments = assessments.filter(a => a.scores && a.scores[student.studentId] !== undefined);
    const categoryWeightMap = new Map(assessmentCategories.map(c => [c.name, c.weight / 100]));

    return subjects.map(subject => {
      const subjectAssessments = studentAssessments.filter(a => a.subjectId === subject.subjectId);
      if (subjectAssessments.length === 0) {
        return null;
      }
      
      let totalWeightedScore = 0;
      let totalWeight = 0;

      subjectAssessments.forEach(assessment => {
        const weight = categoryWeightMap.get(assessment.category) || 0;
        const score = assessment.scores[student.studentId];
        const percentage = (score / assessment.totalMarks) * 100;
        totalWeightedScore += percentage * weight;
        totalWeight += weight;
      });

      const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
      return { subjectName: subject.englishTitle, overallScore };
    }).filter(Boolean) as { subjectName: string; overallScore: number }[];
  }, [student, assessments, subjects, assessmentCategories]);

  const monthlyAttendance = React.useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    const relevantRecords = attendance.filter(rec => isWithinInterval(rec.date, { start: monthStart, end: monthEnd }));
    const totalDays = relevantRecords.length;
    const presentDays = relevantRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    
    return {
      rate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100,
      absences: totalDays - presentDays
    }
  }, [attendance]);


  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-screen">Loading your dashboard...</div>;
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

  if (!student) {
    return (
        <div className="flex items-center justify-center h-screen">
            <p>No student data found for your account.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome, {student?.firstName}!</h1>
        <p className="text-muted-foreground">Here is your academic overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentAverage}%</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyAttendance.rate}%</div>
            <p className="text-xs text-muted-foreground">{monthlyAttendance.absences} absences this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledClasses.length}</div>
            <p className="text-xs text-muted-foreground">Active programs this year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Your current class schedule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {enrolledClasses.map((cls, i) => (
                <div key={i} className="p-4 border rounded-lg">
                    <h3 className="font-semibold">{cls.programName}</h3>
                    <p className="text-muted-foreground text-sm">Level: {cls.level}</p>
                </div>
            ))}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Grades by Subject</CardTitle>
            <CardDescription>Your overall performance in each subject.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceBySubject.map((perf, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <p className="font-medium">{perf.subjectName}</p>
                  <p className="text-sm font-semibold">{perf.overallScore}%</p>
                </div>
                <Progress value={perf.overallScore} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
       <Card>
          <CardHeader>
            <CardTitle>Attendance Log</CardTitle>
            <CardDescription>Your attendance record for the current month.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Minutes Late</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map(record => (
                    <TableRow key={record.attendanceId}>
                      <TableCell>{format(record.date, 'PPP')}</TableCell>
                      <TableCell><Badge variant={record.status === 'Absent' ? 'destructive' : 'secondary'}>{record.status}</Badge></TableCell>
                      <TableCell>{record.minutesLate || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {attendance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No attendance records found for this month.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

    </div>
  );
}

    
