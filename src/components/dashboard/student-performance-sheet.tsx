"use client";

import type { Student, Guardian } from "@/lib/types";
import { assessments, subjects } from "@/lib/mock-data";
import { assessmentCategoryWeights } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AiSummary } from "./ai-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface StudentPerformanceSheetProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StudentDetail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function GuardianDetails({ guardian }: { guardian: Guardian }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h4 className="font-semibold">{guardian.relation} - {guardian.name}</h4>
      <p className="text-sm text-muted-foreground">{guardian.occupation} at {guardian.workplace}</p>
      <p className="text-sm">Mobiles: {guardian.mobiles.join(', ')}</p>
    </div>
  );
}


export function StudentPerformanceSheet({
  student,
  open,
  onOpenChange,
}: StudentPerformanceSheetProps) {
  if (!student) return null;

  const studentAssessments = assessments.filter(
    (a) => a.scores[student.studentId] !== undefined
  );
  
  const performanceBySubject = subjects.map(subject => {
    const subjectAssessments = studentAssessments.filter(a => a.subjectId === subject.subjectId);
    if (subjectAssessments.length === 0) {
      return { subjectName: subject.subjectName, overallScore: 0 };
    }
    
    let totalWeightedScore = 0;
    let totalWeight = 0;

    subjectAssessments.forEach(assessment => {
      const weight = assessmentCategoryWeights[assessment.category];
      const score = assessment.scores[student.studentId];
      const percentage = (score / assessment.totalMarks) * 100;
      totalWeightedScore += percentage * weight;
      totalWeight += weight;
    });

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    return { subjectName: subject.subjectName, overallScore: Math.round(overallScore) };
  });

  const overallAverage = performanceBySubject.reduce((acc, curr) => acc + curr.overallScore, 0) / (performanceBySubject.filter(s => s.overallScore > 0).length || 1);

  const studentGrades = performanceBySubject.reduce((acc, subject) => {
    acc[subject.subjectName] = subject.overallScore;
    return acc;
  }, {} as Record<string, number>);

  const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace('  ', ' ');
  const khmerFullName = `${student.khmerLastName} ${student.khmerFirstName}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.avatarUrl} alt={student.firstName} />
                <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
              </Avatar>
              <div>
                {student.firstName} {student.lastName}
                <SheetDescription>
                  {student.program} Program | Grade {student.currentGradeLevel}
                </SheetDescription>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="performance" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="performance" className="flex-1 overflow-y-auto pr-2 py-4">
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="text-base">AI Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <AiSummary studentId={student.studentId} grades={studentGrades} />
                </CardContent>
            </Card>

            <h3 className="text-lg font-semibold mb-2">Overall Performance</h3>
            <div className="flex items-center gap-4 mb-4">
              <Progress value={overallAverage} className="w-full" />
              <span className="font-bold text-lg">{Math.round(overallAverage)}%</span>
            </div>
            
            <Separator className="my-4" />

            <h3 className="text-lg font-semibold mb-4">Performance by Subject</h3>
            <div className="space-y-4">
                {performanceBySubject.map((perf, index) => perf.overallScore > 0 && (
                <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">{perf.subjectName}</p>
                    <p className="text-sm font-semibold">{perf.overallScore}%</p>
                    </div>
                    <Progress value={perf.overallScore} />
                </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="profile" className="flex-1 overflow-y-auto pr-2 py-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StudentDetail label="Full English Name" value={fullName} />
                <StudentDetail label="Full Khmer Name" value={khmerFullName} />
                <StudentDetail label="Student ID" value={student.studentId} />
                <StudentDetail label="Sex" value={student.sex} />
                <StudentDetail label="Date of Birth" value={format(student.dateOfBirth, "MMMM d, yyyy")} />
                <StudentDetail label="Place of Birth" value={student.placeOfBirth} />
                <StudentDetail label="Nationality" value={student.nationality} />
                <StudentDetail label="National ID" value={student.nationalId} />
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StudentDetail label="Program" value={student.program} />
                <StudentDetail label="Admission Year" value={student.admissionYear} />
                <StudentDetail label="Current Grade" value={student.currentGradeLevel} />
                <StudentDetail label="Status" value={student.status} />
                <StudentDetail label="Previous School" value={student.previousSchool || 'N/A'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <StudentDetail 
                    label="Address" 
                    value={`${student.address.village}, ${student.address.commune}, ${student.address.district}`} 
                  />
                <StudentDetail label="Emergency Contact" value={`${student.emergencyContact.name} (${student.emergencyContact.phone})`} />
                <StudentDetail label="Media Consent" value={student.mediaConsent ? 'Yes' : 'No'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.guardians.map((guardian, index) => (
                  <GuardianDetails key={index} guardian={guardian} />
                ))}
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
        <div className="mt-auto pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
