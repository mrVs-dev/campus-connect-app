
"use client";

import * as React from "react";
import type { Student, Assessment } from "@/lib/types";
import { Upload, MoreHorizontal, Trash2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudentPerformanceSheet } from "./student-performance-sheet";
import { StudentImportDialog } from "./student-import-dialog";
import { programs } from "@/lib/program-data";

export function StudentList({
  students,
  assessments,
  onUpdateStudent,
  onImportStudents,
  onDeleteStudent,
}: {
  students: Student[];
  assessments: Assessment[];
  onUpdateStudent: (studentId: string, updatedData: Partial<Student>) => void;
  onImportStudents: (students: Partial<Student>[]) => void;
  onDeleteStudent: (studentId: string) => void;
}) {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null
  );
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);


  const formatAddress = (address?: Student["address"]) => {
    if (!address) return "N/A";
    const parts = [address.village, address.commune, address.district].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : "N/A";
  }

  const getProgramInfo = (enrollments?: Student["enrollments"]) => {
    if (!enrollments || enrollments.length === 0) {
      return { programNames: ["N/A"], levels: [""] };
    }
    const programNames = enrollments.map(e => programs.find(p => p.id === e.programId)?.name || 'Unknown');
    const levels = enrollments.map(e => e.level);
    return { programNames, levels };
  };

  const handleDeleteClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setStudentToDelete(student);
  };
  
  const confirmDelete = () => {
    if (studentToDelete) {
      onDeleteStudent(studentToDelete.studentId);
      setStudentToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Roster</CardTitle>
              <CardDescription>
                A list of all students. Click a student to view their
                performance.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setIsImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="sr-only sm-not-sr-only sm:whitespace-nowrap">
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
                <TableHead>Student ID</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const { programNames, levels } = getProgramInfo(student.enrollments);
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
                            {(student.firstName || ' ')[0]}
                            {(student.lastName || ' ')[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <p className="text-sm font-medium leading-none">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.khmerLastName || ''} {student.khmerFirstName || ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.sex || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          student.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {student.status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setSelectedStudent(student)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => handleDeleteClick(e, student)} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        assessments={assessments}
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
      <AlertDialog open={!!studentToDelete} onOpenChange={(isOpen) => !isOpen && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record for {studentToDelete?.firstName} {studentToDelete?.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
