"use client";

import type { Student } from "@/lib/types";
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

interface StudentPerformanceSheetProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
        <div className="py-4 flex-1 overflow-y-auto pr-2">
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
        </div>
        <div className="mt-auto pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
