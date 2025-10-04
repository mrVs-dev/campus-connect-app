
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getStudents, getAdmissions, getAssessments, getSubjects, getAssessmentCategories, getAttendanceForClass, getInvoices, getFees } from "@/lib/firebase/firestore";
import type { Student, Admission, Assessment, Subject, AssessmentCategory, Enrollment, AttendanceRecord, Invoice, Fee } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { programs } from "@/lib/program-data";
import { BookOpen, CalendarCheck, TrendingUp, User, GraduationCap, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { calculateStudentAverage } from "@/lib/grades";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoicingList } from "@/components/dashboard/invoicing-list";

interface EnrolledClass {
  programName: string;
  level: string;
}

function StudentDataView({ student, assessments, subjects, assessmentCategories, attendance }: { student: Student; assessments: Assessment[]; subjects: Subject[]; assessmentCategories: AssessmentCategory[]; attendance: AttendanceRecord[] }) {
  
   const enrolledClasses = React.useMemo(() => {
        const studentEnrollments = student.enrollments || [];
        const uniqueEnrollments = Array.from(new Map(studentEnrollments.map(e => [`${e.programId}-${e.level}`, e])).values());

        return uniqueEnrollments.map(enrollment => {
        const program = programs.find(p => p.id === enrollment.programId);
        return {
            programName: program?.name || "Unknown Program",
            level: enrollment.level,
        };
        });
    }, [student.enrollments]);


  const studentAverage = React.useMemo(() => {
    return calculateStudentAverage(student.studentId, assessments, subjects, assessmentCategories);
  }, [student, assessments, subjects, assessmentCategories]);

  const performanceBySubject = React.useMemo(() => {
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
      return { subjectName: subject.subjectName, overallScore };
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

  return (
      <div className="flex flex-col gap-8">
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

export default function GuardianDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [children, setChildren] = React.useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = React.useState<Student | null>(null);
  const [allData, setAllData] = React.useState<{ assessments: Assessment[]; subjects: Subject[]; assessmentCategories: AssessmentCategory[]; attendance: AttendanceRecord[]; invoices: Invoice[], fees: Fee[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (user?.email) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const [allStudents, allAdmissions, assessments, subjects, categories, invoices, fees] = await Promise.all([
            getStudents(),
            getAdmissions(),
            getAssessments(),
            getSubjects(),
            getAssessmentCategories(),
            getInvoices(),
            getFees(),
          ]);

          // Find children directly linked by guardian email
          const directChildren = allStudents.filter(s => s.guardians?.some(g => g.email === user.email));
          
          // Find family IDs from direct children
          const familyIds = new Set<string>();
          directChildren.forEach(child => {
            if (child.familyId) {
              familyIds.add(child.familyId);
            }
          });

          // Find other children sharing the same family ID
          let familyChildren: Student[] = [];
          if (familyIds.size > 0) {
            familyChildren = allStudents.filter(s => s.familyId && familyIds.has(s.familyId));
          }

          // Combine and deduplicate the list of children
          const allGuardianChildrenMap = new Map<string, Student>();
          [...directChildren, ...familyChildren].forEach(child => {
            allGuardianChildrenMap.set(child.studentId, child);
          });
          const guardianChildren = Array.from(allGuardianChildrenMap.values());


          if (guardianChildren.length === 0) {
            setError("Could not find any students associated with your account.");
            setLoading(false);
            return;
          }
          
          setChildren(guardianChildren);
          setSelectedChild(guardianChildren[0]);

          const childIds = guardianChildren.map(c => c.studentId);
          const childAssessments = assessments.filter(a => childIds.some(id => a.scores[id] !== undefined));
          const childInvoices = invoices.filter(i => childIds.includes(i.studentId));
          
          // Get all class IDs for all children to fetch attendance
          const allClassIds: string[] = [];
           allAdmissions.forEach(admission => {
              admission.students.forEach(studentAdmission => {
                  if (childIds.includes(studentAdmission.studentId)) {
                      studentAdmission.enrollments.forEach(enrollment => {
                          const classId = `${admission.schoolYear}_${enrollment.programId}_${enrollment.level}`;
                          if (!allClassIds.includes(classId)) {
                              allClassIds.push(classId);
                          }
                      });
                  }
              });
          });
          
          const attendancePromises = allClassIds.map(id => getAttendanceForClass(id, new Date()));
          const attendanceResults = await Promise.all(attendancePromises);
          const allChildrenAttendance = attendanceResults.flat().filter(a => childIds.includes(a.studentId));

          setAllData({
            assessments: childAssessments,
            subjects,
            assessmentCategories: categories,
            attendance: allChildrenAttendance,
            invoices: childInvoices,
            fees: fees,
          });

        } catch (err: any) {
          console.error("Failed to fetch guardian data:", err);
          setError(err.message || "Could not load your dashboard.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, router]);
  
  const handleChildChange = (studentId: string) => {
    const child = children.find(c => c.studentId === studentId);
    if(child) {
        setSelectedChild(child);
    }
  };
  
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

  if (!selectedChild || !allData) {
    return <div className="flex items-center justify-center h-screen">Preparing your dashboard...</div>;
  }
  
  const selectedChildAttendance = allData.attendance.filter(a => a.studentId === selectedChild.studentId);
  const selectedChildInvoices = allData.invoices.filter(i => i.studentId === selectedChild.studentId);


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.displayName}!</h1>
        <p className="text-muted-foreground">This is the portal for your children's academic information.</p>
      </div>

       <Tabs defaultValue="academics">
          <div className="flex justify-between items-center mb-4">
              <TabsList className="grid w-full grid-cols-2 max-w-sm">
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
              </TabsList>
              {children.length > 1 && (
                 <Select value={selectedChild.studentId} onValueChange={handleChildChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select a child" />
                    </SelectTrigger>
                    <SelectContent>
                        {children.map(child => (
                           <SelectItem key={child.studentId} value={child.studentId}>
                                {child.firstName} {child.lastName}
                           </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              )}
          </div>
          <TabsContent value="academics">
                <StudentDataView 
                    student={selectedChild}
                    assessments={allData.assessments}
                    subjects={allData.subjects}
                    assessmentCategories={allData.assessmentCategories}
                    attendance={selectedChildAttendance}
                />
          </TabsContent>
          <TabsContent value="invoicing">
             <InvoicingList 
                invoices={selectedChildInvoices}
                students={[selectedChild]}
                fees={allData.fees}
                onSaveInvoice={async () => { console.log("Not implemented for guardians"); return false; }}
                onDeleteInvoice={() => console.log("Not implemented for guardians")}
                isReadOnly={true}
             />
          </TabsContent>
        </Tabs>
    </div>
  );
}
