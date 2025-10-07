

"use client";

import * as React from "react";
import type { Assessment, Student, Subject, AssessmentCategory, UserRole } from "@/lib/types";
import { PlusCircle, MoreHorizontal, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NewAssessmentDialog } from "./new-assessment-dialog";
import { GradeEntrySheet } from "./grade-entry-sheet";

export function AssessmentList({
  assessments,
  students,
  subjects,
  assessmentCategories,
  onSaveAssessment,
  userRole,
}: {
  assessments: Assessment[];
  students: Student[];
  subjects: Subject[];
  assessmentCategories: AssessmentCategory[];
  onSaveAssessment: (assessment: Omit<Assessment, 'assessmentId' | 'teacherId'> | Assessment) => Promise<Assessment | null>;
  userRole: UserRole;
}) {
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = React.useState(false);
  const [assessmentToGrade, setAssessmentToGrade] = React.useState<Assessment | null>(null);
  const [assessmentToEdit, setAssessmentToEdit] = React.useState<Assessment | null>(null);

  const canCreate = userRole === 'Admin' || userRole === 'Head of Department' || userRole === 'Teacher';

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.subjectId === subjectId)?.englishTitle || "Unknown";
  };
  
  const handleEdit = (assessment: Assessment) => {
    if (!canCreate) return;
    setAssessmentToEdit(assessment);
    setIsNewAssessmentOpen(true);
  };
  
  const handleOpenNewDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setAssessmentToEdit(null);
    }
    setIsNewAssessmentOpen(isOpen);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>
                Manage and grade student assessments.
              </CardDescription>
            </div>
            {canCreate && (
              <Button size="sm" className="gap-1" onClick={() => setIsNewAssessmentOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Assessment
                </span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Total Marks</TableHead>
                {canCreate && (
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.assessmentId}>
                  <TableCell className="font-medium">
                    {assessment.topic}
                  </TableCell>
                  <TableCell>{getSubjectName(assessment.subjectId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{assessment.category}</Badge>
                  </TableCell>
                  <TableCell>{assessment.totalMarks}</TableCell>
                  {canCreate && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setAssessmentToGrade(assessment)}>
                            Enter Grades
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleEdit(assessment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {canCreate && (
        <NewAssessmentDialog 
          open={isNewAssessmentOpen}
          onOpenChange={handleOpenNewDialog}
          onSave={onSaveAssessment}
          existingAssessment={assessmentToEdit}
          subjects={subjects}
          assessmentCategories={assessmentCategories}
        />
      )}
      {canCreate && (
        <GradeEntrySheet
          assessment={assessmentToGrade}
          students={students}
          open={!!assessmentToGrade}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setAssessmentToGrade(null);
            }
          }}
          onSaveGrades={onSaveAssessment}
        />
      )}
    </>
  );
}
