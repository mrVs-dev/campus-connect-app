
"use client";

import * as React from "react";
import type { Assessment, Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface GradeEntrySheetProps {
  assessment: Assessment | null;
  students: Student[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveGrades: (assessment: Assessment) => Promise<Assessment | null>;
}

export function GradeEntrySheet({
  assessment,
  students,
  open,
  onOpenChange,
  onSaveGrades,
}: GradeEntrySheetProps) {
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (assessment) {
      setScores(assessment.scores || {});
    }
  }, [assessment]);

  const handleScoreChange = (studentId: string, value: string) => {
    const score = parseInt(value, 10);
    if (!isNaN(score)) {
      setScores(prev => ({ ...prev, [studentId]: score }));
    } else {
      // Allow clearing the input
      const newScores = { ...scores };
      delete newScores[studentId];
      setScores(newScores);
    }
  };

  const handleSave = async () => {
    if (!assessment) return;
    setIsSaving(true);
    const updatedAssessment = { ...assessment, scores };
    await onSaveGrades(updatedAssessment);
    setIsSaving(false);
    onOpenChange(false);
  };

  if (!assessment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col">
        <SheetHeader>
          <SheetTitle>Enter Grades: {assessment.topic}</SheetTitle>
          <SheetDescription>
            Input scores for each student. The maximum score is {assessment.totalMarks}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>
                       <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                           <AvatarImage src={student.avatarUrl} alt="Avatar" className="object-cover" />
                           <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
                         </Avatar>
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={scores[student.studentId] || ""}
                        onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                        max={assessment.totalMarks}
                        min={0}
                        className="w-24 ml-auto"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <SheetFooter className="mt-auto pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Grades"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
