"use client";

import * as React from "react";
import type { Assessment, Student } from "@/lib/types";
import { PlusCircle } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { subjects } from "@/lib/mock-data";
import { NewAssessmentDialog } from "./new-assessment-dialog";
import { GradeEntrySheet } from "./grade-entry-sheet";

export function AssessmentList({
  assessments,
  students,
}: {
  assessments: Assessment[];
  students: Student[];
}) {
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = React.useState(false);
  const [selectedAssessment, setSelectedAssessment] = React.useState<Assessment | null>(null);

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.subjectId === subjectId)?.subjectName || "Unknown";
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
            <Button size="sm" className="gap-1" onClick={() => setIsNewAssessmentOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                New Assessment
              </span>
            </Button>
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
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
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
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedAssessment(assessment)}>
                      Enter Grades
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <NewAssessmentDialog 
        open={isNewAssessmentOpen}
        onOpenChange={setIsNewAssessmentOpen}
      />
      <GradeEntrySheet
        assessment={selectedAssessment}
        students={students}
        open={!!selectedAssessment}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedAssessment(null);
          }
        }}
      />
    </>
  );
}
