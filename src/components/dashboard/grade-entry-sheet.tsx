
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
import { useToast } from "@/hooks/use-toast";

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
  const [scores, setScores] = React.useState<Record<string, number | undefined>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (assessment) {
      const initialScores: Record<string, number | undefined> = {};
      // Initialize scores for all students in the roster for this sheet.
      for (const student of students) {
        const score = assessment.scores[student.studentId];
        initialScores[student.studentId] = typeof score === 'number' ? score : undefined;
      }
      setScores(initialScores);
    }
  }, [assessment, students]);

  const handleScoreChange = (studentId: string, value: string) => {
    if (!assessment) return;

    if (value === "") {
      setScores(prev => ({ ...prev, [studentId]: undefined }));
      return;
    }

    const score = parseInt(value, 10);

    if (!isNaN(score)) {
      if (score > assessment.totalMarks) {
        toast({
          title: "Invalid Score",
          description: `Score cannot be greater than the total marks of ${assessment.totalMarks}.`,
          variant: "destructive",
        });
        return;
      }
       if (score < 0) {
        toast({
          title: "Invalid Score",
          description: "Score cannot be negative.",
          variant: "destructive",
        });
        return;
      }
      setScores(prev => ({ ...prev, [studentId]: score }));
    }
  };

  const handleSave = async () => {
    if (!assessment) return;
    setIsSaving(true);
    
    // Create a new, clean scores object.
    const newScores: Record<string, number> = {};

    // Iterate over all students that are supposed to be in this sheet.
    for (const student of students) {
        const scoreValue = scores[student.studentId];
        // Only include scores that are actual numbers. `undefined` will be skipped.
        if (typeof scoreValue === 'number') {
            newScores[student.studentId] = scoreValue;
        }
    }

    // Merge the new scores object with any existing scores for students
    // NOT in the current roster to avoid deleting their grades.
    const finalScores = {...assessment.scores, ...newScores};
    
    // Now, ensure any student in *this* roster who has a blank score
    // is fully removed from the final object.
    for (const student of students) {
        if (scores[student.studentId] === undefined) {
            delete finalScores[student.studentId];
        }
    }
    
    const updatedAssessment = { ...assessment, scores: finalScores };
    
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
            Input scores for each student. The maximum score is {assessment.totalMarks}. Leave blank to excuse.
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
                           <AvatarFallback>{(student.firstName || ' ')[0]}{(student.lastName || ' ')[0]}</AvatarFallback>
                         </Avatar>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-muted-foreground">{student.khmerLastName} {student.khmerFirstName}</p>
                        </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={scores[student.studentId] ?? ""}
                        onChange={(e) => handleScoreChange(student.studentId, e.target.value)}
                        max={assessment.totalMarks}
                        min={0}
                        className="w-24 ml-auto"
                        placeholder="—"
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
