

"use client";

import * as React from "react";
import type { Student, Assessment, Admission, Enrollment, Subject, AssessmentCategory, UserRole, LetterGrade, AddressData } from "@/lib/types";
import { Upload, MoreHorizontal, ArrowUpDown, Trash2, Move, Search, Edit } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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
import { MoveStudentsDialog } from "./move-students-dialog";
import { EditStudentSheet } from "./edit-student-sheet";
import { programs } from "@/lib/program-data";
import { Checkbox } from "@/components/ui/checkbox";
import type { AppModule } from "@/lib/modules";

type SortableKey = 'studentId' | 'firstName' | 'status';

export function StudentList({
  userRole,
  students,
  assessments,
  admissions,
  subjects,
  assessmentCategories,
  gradeScale,
  onUpdateStudent,
  onUpdateStudentStatus,
  onImportStudents,
  onDeleteStudent,
  onDeleteSelectedStudents,
  onMoveStudents,
  hasPermission,
  addressData,
}: {
  userRole: UserRole;
  students: Student[];
  assessments: Assessment[];
  admissions: Admission[];
  subjects: Subject[];
  assessmentCategories: AssessmentCategory[];
  gradeScale: LetterGrade[];
  onUpdateStudent: (studentId: string, updatedData: Partial<Student>) => void;
  onUpdateStudentStatus: (student: Student, newStatus: Student['status'], reason: string) => void;
  onImportStudents: (students: Partial<Student>[]) => void;
  onDeleteStudent: (studentId: string) => void;
  onDeleteSelectedStudents: (studentIds: string[]) => void;
  onMoveStudents: (studentIds: string[], schoolYear: string, fromClass: Enrollment | null, toClass: Enrollment) => void;
  hasPermission: (module: AppModule, action: 'Create' | 'Read' | 'Update' | 'Delete') => boolean;
  addressData: AddressData;
}) {
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = React.useState<Student | null>(null);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isMoveOpen, setIsMoveOpen] = React.useState(false);
  const [studentToDelete, setStudentToDelete] = React.useState<Student | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
  const [studentsToDelete, setStudentsToDelete] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const canCreate = hasPermission('Students', 'Create');
  const canUpdate = hasPermission('Students', 'Update');
  const canDelete = hasPermission('Students', 'Delete');

  const filteredStudents = React.useMemo(() => {
    if (!searchQuery) {
      return students;
    }
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const sortedStudents = React.useMemo(() => {
    let sortableStudents = [...filteredStudents];
    if (sortConfig !== null) {
      sortableStudents.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort: Active first, then by the highest student ID
      sortableStudents.sort((a, b) => {
        if (a.status === 'Active' && b.status !== 'Active') return -1;
        if (b.status === 'Active' && a.status !== 'Active') return 1;
        return (b.studentId || '').localeCompare(a.studentId || '');
      });
    }
    return sortableStudents;
  }, [filteredStudents, sortConfig]);
  
  const requestSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    if (!canDelete) return;
    setStudentToDelete(student);
  };
  
  const handleEditClick = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    if (!canUpdate) return;
    setStudentToEdit(student);
  };
  
  const confirmDelete = () => {
    if (studentToDelete && canDelete) {
      onDeleteStudent(studentToDelete.studentId);
      setStudentToDelete(null);
    }
  };
  
  const handleSelectStudent = (studentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedStudentIds((prev) => [...prev, studentId]);
    } else {
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedStudentIds(sortedStudents.map((s) => s.studentId));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedStudentIds.length > 0 && canDelete) {
      setStudentsToDelete(selectedStudentIds);
    }
  };

  const confirmDeleteSelected = () => {
    if (canDelete) {
        onDeleteSelectedStudents(studentsToDelete);
        setStudentsToDelete([]);
        setSelectedStudentIds([]);
    }
  };

  const handleMove = (schoolYear: string, fromClass: Enrollment | null, toClass: Enrollment) => {
    if (canUpdate) {
        onMoveStudents(selectedStudentIds, schoolYear, fromClass, toClass);
        setIsMoveOpen(false);
        setSelectedStudentIds([]);
    }
  };
  
  const handleUpdateStudent = (studentId: string, updatedData: Partial<Student>) => {
    onUpdateStudent(studentId, updatedData);
    setStudentToEdit(null); // Close the sheet on save
  };


  const numSelected = selectedStudentIds.length;
  const numStudents = sortedStudents.length;
  const areAllSelected = numStudents > 0 && numSelected === numStudents;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
             <div className="flex-1">
              <CardTitle>Class Roster</CardTitle>
              <CardDescription>
                A list of all students. Default sort is Active, then newest.
              </CardDescription>
            </div>
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
           <div className="mt-4 flex items-center justify-end gap-2">
              {numSelected > 0 && (
                <>
                  {canUpdate && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setIsMoveOpen(true)}
                    >
                        <Move className="h-3.5 w-3.5" />
                        Move ({numSelected})
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={handleDeleteSelected}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete ({numSelected})
                    </Button>
                  )}
                </>
              )}
              {canCreate && (
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
              )}
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-12">
                   <Checkbox
                    checked={areAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                  />
                 </TableHead>
                <TableHead>
                   <Button variant="ghost" onClick={() => requestSort('firstName')}>
                    Student
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('studentId')}>
                    Student ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  Current Class
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button variant="ghost" onClick={() => requestSort('status')}>
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  Media Consent
                </TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student) => {
                const isSelected = selectedStudentIds.includes(student.studentId);
                const enrollments = student.enrollments || [];
                const programNames = enrollments.map(e => programs.find(p => p.id === e.programId)?.name || 'Unknown');
                const levels = enrollments.map(e => e.level);

                return (
                  <TableRow
                    key={student.studentId}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell>
                       <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectStudent(student.studentId, Boolean(checked))}
                        aria-label={`Select ${student.firstName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedStudent(student)}>
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
                    <TableCell>
                       {programNames.length > 0 ? (
                            programNames.map((name, index) => (
                                <div key={index} className="text-sm">
                                    <span className="font-medium">{name}</span> - <span>{levels[index]}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-muted-foreground">Not Assigned</span>
                        )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={
                          student.status === "Active" ? "default" : "secondary"
                        }
                      >
                        {student.status || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={student.mediaConsent ? "outline" : "secondary"}>
                          {student.mediaConsent ? "Yes" : "No"}
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
                            {canUpdate && (
                                <DropdownMenuItem onSelect={(e) => handleEditClick(e, student)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Profile
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem onSelect={(e) => handleDeleteClick(e, student)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                                </DropdownMenuItem>
                            )}
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
        subjects={subjects}
        assessmentCategories={assessmentCategories}
        gradeScale={gradeScale}
        open={!!selectedStudent}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedStudent(null);
          }
        }}
        onUpdateStudent={onUpdateStudent}
      />
       <EditStudentSheet
        student={studentToEdit}
        open={!!studentToEdit}
        onOpenChange={(isOpen) => !isOpen && setStudentToEdit(null)}
        onSave={handleUpdateStudent}
        onUpdateStatus={onUpdateStudentStatus}
        addressData={addressData}
      />
      {canCreate && (
        <StudentImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          onImport={onImportStudents}
        />
      )}
      {canUpdate && (
        <MoveStudentsDialog
          open={isMoveOpen}
          onOpenChange={setIsMoveOpen}
          admissions={admissions}
          onMove={handleMove}
          selectedStudentCount={numSelected}
        />
      )}
      {canDelete && (
        <>
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
          <AlertDialog open={studentsToDelete.length > 0} onOpenChange={(isOpen) => !isOpen && setStudentsToDelete([])}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the {studentsToDelete.length} selected student records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteSelected}>Delete Selected</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
