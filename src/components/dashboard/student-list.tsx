"use client";

import * as React from "react";
import type { Student } from "@/lib/types";
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
import { StudentPerformanceSheet } from "./student-performance-sheet";

export function StudentList({ students }: { students: Student[] }) {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Class Roster</CardTitle>
          <CardDescription>
            A list of all students in your class. Click a student to view their performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className="hidden md:table-cell">Grade</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Parent/Guardian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
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
                  <TableCell>{student.program}</TableCell>
                   <TableCell className="hidden md:table-cell">
                    {student.currentGradeLevel}
                  </TableCell>
                   <TableCell className="hidden md:table-cell">
                    <Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>{student.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {student.studentPhone}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {student.parentGuardianName} ({student.parentGuardianPhone})
                  </TableCell>
                </TableRow>
              ))}
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
      />
    </>
  );
}
