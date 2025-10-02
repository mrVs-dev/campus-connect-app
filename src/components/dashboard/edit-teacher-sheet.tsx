
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Calendar as CalendarIcon, User as UserIcon, X, PlusCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import type { Teacher, Subject, Admission, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageCropDialog } from "./image-crop-dialog";
import 'react-image-crop/dist/ReactCrop.css';
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { programs, getLevelsForProgram } from "@/lib/program-data";

const userRoles: UserRole[] = ['Admin', 'Receptionist', 'Head of Department', 'Teacher'];

const classAssignmentSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  programId: z.string().min(1, "Program is required"),
  level: z.string().min(1, "Level is required"),
});

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
  role: z.enum(userRoles),
  joinedDate: z.date().optional(),
  avatarUrl: z.string().optional(),
  assignedSubjects: z.array(z.string()).optional(),
  assignedClasses: z.array(classAssignmentSchema).optional(),
});

type EditTeacherFormValues = z.infer<typeof formSchema>;

interface EditTeacherSheetProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (teacherId: string, updatedData: Partial<Teacher>) => void;
  subjects: Subject[];
  admissions: Admission[];
}

// --- Helper functions for robust date handling ---
const isDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.valueOf());
};

const isTimestamp = (date: any): date is { seconds: number; nanoseconds: number } => {
  return date && typeof date.seconds === 'number' && typeof date.nanoseconds === 'number';
};

const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (isDate(value)) return value;
  if (isTimestamp(value)) return new Date(value.seconds * 1000);
  
  // Try parsing if it's a string or number
  const parsedDate = new Date(value);
  if (isDate(parsedDate)) return parsedDate;

  return undefined;
};
// ---

function MultiSelectSubject({ subjects, selected, onChange }: { subjects: Subject[], selected: string[], onChange: (selected: string[]) => void }) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (subjectId: string) => {
    const newSelected = selected.includes(subjectId)
      ? selected.filter(id => id !== subjectId)
      : [...selected, subjectId];
    onChange(newSelected);
  };
  
  const selectedSubjects = subjects.filter(t => selected.includes(t.subjectId));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto">
          <div className="flex gap-1 flex-wrap">
            {selectedSubjects.length > 0 ? selectedSubjects.map(subject => (
              <Badge key={subject.subjectId} variant="secondary">
                {subject.subjectName}
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(subject.subjectId);
                    }
                  }}
                  onClick={(e) => { e.stopPropagation(); handleSelect(subject.subjectId); }}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </span>
              </Badge>
            )) : "Select subjects..."}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search subjects..." />
          <CommandList>
            <CommandEmpty>No subjects found.</CommandEmpty>
            <CommandGroup>
              {subjects.map(subject => (
                <CommandItem
                  key={subject.subjectId}
                  onSelect={() => handleSelect(subject.subjectId)}
                >
                  <Checkbox className="mr-2" checked={selected.includes(subject.subjectId)} />
                  {subject.subjectName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function EditTeacherSheet({ teacher, open, onOpenChange, onSave, subjects, admissions }: EditTeacherSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoToCrop, setPhotoToCrop] = React.useState<string | null>(null);

  const form = useForm<EditTeacherFormValues>({
    resolver: zodResolver(formSchema),
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "assignedClasses"
  });
  
  const admissionYears = React.useMemo(() => {
    return [...new Set(admissions.map(a => a.schoolYear))].sort((a, b) => b.localeCompare(a));
  }, [admissions]);

  React.useEffect(() => {
    if (teacher) {
      form.reset({
        ...teacher,
        joinedDate: toDate(teacher.joinedDate),
        assignedSubjects: teacher.assignedSubjects || [],
        assignedClasses: teacher.assignedClasses || [],
      });
    }
  }, [teacher, form]);

  const avatarUrl = form.watch("avatarUrl");

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoCropped = (croppedDataUri: string) => {
    form.setValue("avatarUrl", croppedDataUri);
    setPhotoToCrop(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  async function onSubmit(values: EditTeacherFormValues) {
    if (!teacher) return;
    
    setIsSubmitting(true);
    await onSave(teacher.teacherId, values);
    setIsSubmitting(false);
    onOpenChange(false);
  }

  if (!teacher) return null;

  return (
    <>
      <ImageCropDialog 
        imageSrc={photoToCrop}
        onCropComplete={handlePhotoCropped}
        onOpenChange={(isOpen) => !isOpen && setPhotoToCrop(null)}
      />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Staff Profile</SheetTitle>
            <SheetDescription>
              Update the details for {teacher.firstName} {teacher.lastName}.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="firstName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                        <FormField control={form.control} name="lastName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl><Input type="tel" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="joinedDate" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Joined Date</FormLabel>
                                            <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar 
                                                  mode="single" 
                                                  selected={field.value}
                                                  onSelect={field.onChange}
                                                  captionLayout="dropdown-buttons"
                                                  fromYear={2010}
                                                  toYear={new Date().getFullYear()}
                                                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")} 
                                                  initialFocus 
                                                />
                                            </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                        <FormField control={form.control} name="status" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
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
                                    <FormField
                                        control={form.control}
                                        name="assignedSubjects"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Assigned Subjects</FormLabel>
                                            <MultiSelectSubject
                                                subjects={subjects}
                                                selected={field.value || []}
                                                onChange={field.onChange}
                                            />
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Class Assignments</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                  {fields.map((field, index) => {
                                      const programId = form.watch(`assignedClasses.${index}.programId`);
                                      const levels = getLevelsForProgram(programId || "");
                                      return (
                                        <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md bg-muted/50">
                                            <FormField
                                              control={form.control}
                                              name={`assignedClasses.${index}.schoolYear`}
                                              render={({ field }) => (
                                                <FormItem className="flex-1">
                                                  <FormLabel>School Year</FormLabel>
                                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                      {admissionYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                                    </SelectContent>
                                                  </Select>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <FormField
                                              control={form.control}
                                              name={`assignedClasses.${index}.programId`}
                                              render={({ field }) => (
                                                <FormItem className="flex-1">
                                                  <FormLabel>Program</FormLabel>
                                                  <Select onValueChange={(value) => { field.onChange(value); form.setValue(`assignedClasses.${index}.level`, ''); }} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                                    </SelectContent>
                                                  </Select>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <FormField
                                              control={form.control}
                                              name={`assignedClasses.${index}.level`}
                                              render={({ field }) => (
                                                <FormItem className="flex-1">
                                                  <FormLabel>Level</FormLabel>
                                                  <Select onValueChange={field.onChange} value={field.value} disabled={!programId}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                      {levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                                                    </SelectContent>
                                                  </Select>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="shrink-0">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                      );
                                  })}
                                  <Button type="button" variant="outline" size="sm" onClick={() => append({ schoolYear: '', programId: '', level: '' })}>
                                      <PlusCircle className="mr-2 h-4 w-4" /> Add Class Assignment
                                  </Button>
                                </CardContent>
                            </Card>

                        </div>
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                <CardTitle>Profile Photo</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center items-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div
                                    className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                    onClick={handleAvatarClick}
                                >
                                    {avatarUrl ? (
                                    <img src={avatarUrl} alt="Teacher" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                    <div className="text-center text-muted-foreground">
                                        <UserIcon className="mx-auto h-12 w-12" />
                                        <p className="text-sm mt-2">Click to upload photo</p>
                                    </div>
                                    )}
                                </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                  <SheetFooter className="mt-auto pt-4 sticky bottom-0 bg-background">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                  </SheetFooter>
                </form>
              </Form>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
