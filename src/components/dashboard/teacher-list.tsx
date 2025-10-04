
"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal, Edit, Trash2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Teacher, Subject, Admission, UserRole } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format } from "date-fns";
import { EditTeacherSheet } from "./edit-teacher-sheet";
import { updateTeacher, getSubjects, getAdmissions } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User as AuthUser } from "firebase/auth";

const userRoles: UserRole[] = ['Admin', 'Receptionist', 'Head of Department', 'Teacher'];

const teacherFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.enum(userRoles),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherListProps {
  userRole: UserRole;
  teachers: Teacher[];
  pendingUsers: AuthUser[];
  onAddTeacher: (teacherData: Omit<Teacher, 'teacherId' | 'status' | 'joinedDate'>) => Promise<Teacher | null>;
}

// --- Helper functions for robust date handling ---
const isDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.valueOf());
};

const isTimestamp = (date: any): date is { seconds: number; nanoseconds: number } => {
  return date && typeof date.seconds === 'number' && typeof date.nanoseconds === 'number';
};

const formatDateSafe = (date: any): string => {
  if (!date) return 'N/A';
  if (isDate(date)) return format(date, "PPP");
  if (isTimestamp(date)) return format(new Date(date.seconds * 1000), "PPP");
  
  const parsedDate = new Date(date);
  if (isDate(parsedDate)) return format(parsedDate, "PPP");
  
  return 'N/A';
};
// ---

export function TeacherList({ userRole, teachers: initialTeachers, pendingUsers, onAddTeacher }: TeacherListProps) {
  const [isNewTeacherDialogOpen, setIsNewTeacherDialogOpen] = React.useState(false);
  const [teacherToEdit, setTeacherToEdit] = React.useState<Teacher | null>(null);
  const [userToApprove, setUserToApprove] = React.useState<AuthUser | null>(null);
  const [teachers, setTeachers] = React.useState(initialTeachers);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const { toast } = useToast();

  const canEdit = userRole === 'Admin';

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
      role: "Teacher",
    },
  });

  React.useEffect(() => {
      if(userToApprove) {
          const displayName = userToApprove.displayName || "";
          const nameParts = displayName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";
          form.reset({
              firstName: firstName,
              lastName: lastName,
              email: userToApprove.email || "",
              role: "Teacher",
          });
          setIsNewTeacherDialogOpen(true);
      }
  }, [userToApprove, form]);
  
  React.useEffect(() => {
      if(!isNewTeacherDialogOpen) {
          setUserToApprove(null);
          form.reset({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            role: "Teacher",
          });
      }
  }, [isNewTeacherDialogOpen, form]);

  const handleAddTeacher = async (values: TeacherFormValues) => {
    if (!canEdit) return;
    const newTeacher = await onAddTeacher(values);
    if (newTeacher) {
      form.reset();
      setIsNewTeacherDialogOpen(false);
    }
  };
  
  const handleUpdateTeacher = async (teacherId: string, updatedData: Partial<Teacher>) => {
    if (!canEdit) return;
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
  
  const handleEditClick = (teacher: Teacher) => {
    if (!canEdit) return;
    setTeacherToEdit(teacher);
  };

  return (
    <div className="space-y-8">
      {userRole === 'Admin' && pendingUsers.length > 0 && (
          <Card>
              <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>The following users have signed in but are awaiting approval to access the application.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {pendingUsers.map(user => (
                              <TableRow key={user.uid}>
                                  <TableCell>
                                      <div className="flex items-center gap-3">
                                          <Avatar className="h-9 w-9">
                                              <AvatarImage src={user.photoURL || undefined} alt="Avatar" className="object-cover" />
                                              <AvatarFallback>{(user.displayName || user.email || 'U').charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">{user.displayName || 'Unnamed User'}</div>
                                      </div>
                                  </TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell className="text-right">
                                      <Button size="sm" onClick={() => setUserToApprove(user)}>
                                          <UserPlus className="mr-2 h-4 w-4" />
                                          Approve
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teachers & Staff</CardTitle>
              <CardDescription>
                Manage your school's teaching and administrative staff.
              </CardDescription>
            </div>
            {canEdit && (
                <Dialog open={isNewTeacherDialogOpen} onOpenChange={setIsNewTeacherDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="gap-1" onClick={() => form.reset()}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    New Staff
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddTeacher)}>
                        <DialogHeader>
                        <DialogTitle>{userToApprove ? "Approve User" : "Add New Staff Member"}</DialogTitle>
                        <DialogDescription>
                            {userToApprove ? "Assign a role and confirm the details for this user." : "Enter the details for the new staff member."}
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
                                <FormControl><Input type="email" {...field} disabled={!!userToApprove} /></FormControl>
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
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {userRoles.map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </div>
                        <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsNewTeacherDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">{userToApprove ? "Approve and Add Staff" : "Save Staff"}</Button>
                        </DialogFooter>
                    </form>
                    </Form>
                </DialogContent>
                </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead><span className="sr-only">Actions</span></TableHead>}
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
                    <Badge variant="outline">{teacher.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateSafe(teacher.joinedDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEditClick(teacher)}>
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
                  )}
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
    </div>
  );
}
