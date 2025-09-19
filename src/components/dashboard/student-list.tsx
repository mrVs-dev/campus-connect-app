
"use client";

import * as React from "react";
import type { Student } from "@/lib/types";
import { Upload } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentPerformanceSheet } from "./student-performance-sheet";
import { StudentImportDialog } from "./student-import-dialog";
import { programs } from "@/lib/program-data";

export function StudentList({
  students,
  onUpdateStudent,
  onImportStudents,
}: {
  students: Student[];
  onUpdateStudent: (studentId: string, updatedData: Partial<Student>) => void;
  onImportStudents: (students: Omit<Student, 'studentId' | 'avatarUrl'>[]) => void;
}) {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null
  );
  const [isImportOpen, setIsImportOpen] = React.useState(false);

  const formatAddress = (address: Student["address"]) => {
    return `${address.village}, ${address.commune}, ${address.district}`;
  }

  const getProgramInfo = (enrollments: Student["enrollments"]) => {
    if (!enrollments || enrollments.length === 0) {
      return [{ programName: "N/A", level: "" }];
    }
    return enrollments.map(enrollment => {
      const program = programs.find(p => p.id === enrollment.programId);
      return {
        programName: program?.name || "Unknown Program",
        level: enrollment.level,
      };
    });
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Roster</CardTitle>
              <CardDescription>
                A list of all students in your class. Click a student to view
                their performance.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setIsImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Import Students
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program &amp; Level</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Address</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Guardian
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const programInfo = getProgramInfo(student.enrollments);
                return (
                  <TableRow
                    key={student.studentId}
                    className="cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="hidden h-9 w-9 sm:flex">
                          <AvatarImage
                            src={student.avatarUrl}
                            alt={`${student.firstName} ${student.lastName}`}
                            data-ai-hint="student portrait"
                            className="object-cover"
                          />
                          <AvatarFallback>
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <p className="text-sm font-medium leading-none">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.khmerLastName} {student.khmerFirstName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {programInfo.map((p, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{p.programName}:</span>
                            <span className="text-muted-foreground ml-1">{p.level}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          student.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatAddress(student.address)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {student.guardians[0]?.name} ({student.guardians[0]?.mobiles[0]})
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <StudentPerformanceSheet
        student={selectedStudent}
        open={!!selectedStudent}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedStudent(null);
          }
        }}
        onUpdateStudent={onUpdateStudent}
      />
      <StudentImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={onImportStudents}
      />
    </>
  );
}
