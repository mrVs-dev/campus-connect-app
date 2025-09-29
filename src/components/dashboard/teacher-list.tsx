
"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Teacher, Subject, Admission } from "@/lib/types";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format } from "date-fns";
import { EditTeacherSheet } from "./edit-teacher-sheet";
import { updateTeacher, getSubjects, getAdmissions } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";


const teacherFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherListProps {
  teachers: Teacher[];
  onAddTeacher: (teacherData: Omit<Teacher, 'teacherId' | 'status'>) => Promise<Teacher | null>;
}

export function TeacherList({ teachers: initialTeachers, onAddTeacher }: TeacherListProps) {
  const [isNewTeacherDialogOpen, setIsNewTeacherDialogOpen] = React.useState(false);
  const [teacherToEdit, setTeacherToEdit] = React.useState<Teacher | null>(null);
  const [teachers, setTeachers] = React.useState(initialTeachers);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    setTeachers(initialTeachers);
  }, [initialTeachers]);
  
  React.useEffect(() => {
    async function fetchSupportingData() {
      const [subjectsData, admissionsData] = await Promise.all([
        getSubjects(),
        getAdmissions()
      ]);
      setSubjects(subjectsData);
      setAdmissions(admissionsData);
    }
    fetchSupportingData();
  }, []);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const handleAddTeacher = async (values: TeacherFormValues) => {
    const newTeacher = await onAddTeacher(values);
    if (newTeacher) {
      setTeachers(prev => [...prev, newTeacher]);
      form.reset();
      setIsNewTeacherDialogOpen(false);
    }
  };
  
  const handleUpdateTeacher = async (teacherId: string, updatedData: Partial<Teacher>) => {
    try {
      const dataToSave = Object.fromEntries(
        Object.entries(updatedData).filter(([, value]) => value !== undefined)
      );

      await updateTeacher(teacherId, dataToSave);
      
      const updatedTeacherData = { ...teacherToEdit, ...dataToSave } as Teacher
      
      setTeachers(prev => 
        prev.map(t => t.teacherId === teacherId ? updatedTeacherData : t)
      );
      toast({
        title: "Teacher Updated",
        description: "Teacher profile has been successfully updated.",
      });
      setTeacherToEdit(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the teacher profile.",
        variant: "destructive",
      });
    }
  };
  
  const isDate = (date: any): date is Date => {
    return date instanceof Date && !isNaN(date.valueOf());
  };

  const isTimestamp = (date: any): date is { seconds: number; nanoseconds: number } => {
    return date && typeof date.seconds === 'number';
  };

  const formatDateSafe = (date: any) => {
    if (isDate(date)) {
      return format(date, "PPP");
    }
    if (isTimestamp(date)) {
      return format(new Date(date.seconds * 1000), "PPP");
    }
    return 'N/A';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teachers & Staff</CardTitle>
              <CardDescription>
                Manage your school's teaching and administrative staff.
              </CardDescription>
            </div>
            <Dialog open={isNewTeacherDialogOpen} onOpenChange={setIsNewTeacherDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  New Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleAddTeacher)}>
                    <DialogHeader>
                      <DialogTitle>Add New Teacher</DialogTitle>
                      <DialogDescription>
                        Enter the details for the new teacher.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <FormField control={form.control} name="firstName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="lastName" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl><Input type="tel" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsNewTeacherDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Save Teacher</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.teacherId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={teacher.avatarUrl} alt="Avatar" className="object-cover" />
                        <AvatarFallback>{teacher.firstName?.[0]}{teacher.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    {formatDateSafe(teacher.joinedDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setTeacherToEdit(teacher)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" />
                           Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EditTeacherSheet
        teacher={teacherToEdit}
        open={!!teacherToEdit}
        onOpenChange={(isOpen) => !isOpen && setTeacherToEdit(null)}
        onSave={handleUpdateTeacher}
        subjects={subjects}
        admissions={admissions}
      />
    </>
  );
}
