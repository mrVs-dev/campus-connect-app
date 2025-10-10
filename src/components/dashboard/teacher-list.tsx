

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { getSubjects, getAdmissions, getRoles } from "@/lib/firebase/firestore";
import type { User as AuthUser } from "firebase/auth";
import { useAuth } from "@/hooks/use-auth";

const teacherFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.string().min(1, "A role is required."),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherListProps {
  userRole: UserRole | null;
  initialTeachers: Teacher[];
  onAddTeacher: (teacherData: Omit<Teacher, 'teacherId' | 'status' | 'joinedDate'>) => Promise<Teacher | null>;
  onUpdateTeacher: (teacherId: string, updatedData: Partial<Teacher>) => void;
  onDeleteTeacher: (teacher: Teacher) => void;
  onRefreshData: () => void;
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

export function TeacherList({ userRole, initialTeachers: teachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher, onRefreshData }: TeacherListProps) {
  const { user } = useAuth(); // Get the currently logged-in user
  const [isNewTeacherDialogOpen, setIsNewTeacherDialogOpen] = React.useState(false);
  const [teacherToEdit, setTeacherToEdit] = React.useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = React.useState<Teacher | null>(null);
  const [userToApprove, setUserToApprove] = React.useState<AuthUser | null>(null);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [admissions, setAdmissions] = React.useState<Admission[]>([]);
  const [roles, setRoles] = React.useState<UserRole[]>([]);
  
  // This state will hold all users who are not yet teachers
  const [pendingUsers, setPendingUsers] = React.useState<AuthUser[]>([]);

  const isAdmin = userRole === 'Admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;
  
  React.useEffect(() => {
    async function fetchSupportingData() {
      const [subjectsData, admissionsData, rolesData] = await Promise.all([
        getSubjects(),
        getAdmissions(),
        getRoles(),
      ]);
      setSubjects(subjectsData);
      setAdmissions(admissionsData);
      setRoles(rolesData);
    }
    fetchSupportingData();
  }, []);
  
  // New effect to calculate pending users
  React.useEffect(() => {
    if (user && teachers.length > 0) {
      // This is a simplified example. In a real app, you'd fetch all auth users.
      // For now, we'll mock a user that needs approval.
      const mockAuthUsers: AuthUser[] = [
        // This simulates a user who has logged in but is not in the 'teachers' list.
        {
          uid: 'mock-user-uid',
          email: 'new.user@example.com',
          displayName: 'New User',
          photoURL: null,
        } as AuthUser,
        // Add the current logged-in user to the list to ensure they are filtered out
        user as AuthUser,
      ];
      
      const teacherEmails = new Set(teachers.map(t => t.email));
      const filteredPending = mockAuthUsers.filter(
        u => u.email && !teacherEmails.has(u.email)
      );
      setPendingUsers(filteredPending);
    }
  }, [user, teachers]);

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
              phone: userToApprove.phoneNumber || "",
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

    if (teachers.some(teacher => teacher.email.toLowerCase() === values.email.toLowerCase())) {
        form.setError("email", { message: "A staff member with this email already exists." });
        return;
    }

    await onAddTeacher(values as any);
    onRefreshData();
    form.reset();
    setIsNewTeacherDialogOpen(false);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    if (!canDelete) return;
    setTeacherToDelete(teacher);
  };
  
  const handleConfirmDelete = () => {
    if (teacherToDelete) {
        onDeleteTeacher(teacherToDelete);
        setTeacherToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      {canEdit && pendingUsers.length > 0 && (
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
                          {pendingUsers.map(u => (
                              <TableRow key={u.uid}>
                                  <TableCell>
                                      <div className="flex items-center gap-3">
                                          <Avatar className="h-9 w-9">
                                              <AvatarImage src={u.photoURL || undefined} alt="Avatar" className="object-cover" />
                                              <AvatarFallback>{(u.displayName || u.email || 'U').charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">{u.displayName || 'Unnamed User'}</div>
                                      </div>
                                  </TableCell>
                                  <TableCell>{u.email}</TableCell>
                                  <TableCell className="text-right">
                                      <Button size="sm" onClick={() => setUserToApprove(u)}>
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
                    <Button size="sm" className="gap-1" onClick={() => form.reset({
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        role: "Teacher",
                    })}>
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
                                <Select onValueChange={field.onChange} value={field.value || 'Teacher'}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {roles.map(role => (
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
                            <DropdownMenuItem onSelect={() => setTeacherToEdit(teacher)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDeleteClick(teacher)} className="text-destructive">
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
        onSave={onUpdateTeacher}
        subjects={subjects}
        admissions={admissions}
      />
      <AlertDialog open={!!teacherToDelete} onOpenChange={(isOpen) => !isOpen && setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the staff member "{teacherToDelete?.firstName} {teacherToDelete?.lastName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
