
"use client";

import * as React from "react";
import { PlusCircle, Trash2, Check, ChevronsUpDown, User, BookOpen } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

import type { Admission, Student, Enrollment, Teacher } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { programs, getLevelsForProgram } from "@/lib/program-data";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";


const enrollmentSchema = z.object({
    programId: z.string().min(1, "Program is required"),
    level: z.string().min(1, "Level is required"),
});

const admissionFormSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  studentId: z.string().min(1, "Student is required"),
  enrollments: z.array(enrollmentSchema).min(1, "At least one program must be assigned."),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

interface AdmissionsListProps {
  admissions: Admission[];
  students: Student[];
  teachers: Teacher[];
  onSave: (admission: Admission, isNewClass: boolean) => Promise<boolean>;
}

export function AdmissionsList({
  admissions,
  students,
  teachers,
  onSave,
}: AdmissionsListProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const activeStudents = React.useMemo(() => students.filter(s => s.status === 'Active'), [students]);
    
    const admissionYears = React.useMemo(() => {
        const years = new Set(admissions.map(a => a.schoolYear));
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        years.add(`${currentYear}-${nextYear}`);
        return Array.from(years).sort((a,b) => b.localeCompare(a));
    }, [admissions]);

    const form = useForm<AdmissionFormValues>({
        resolver: zodResolver(admissionFormSchema),
        defaultValues: {
            schoolYear: admissionYears[0] || "",
            studentId: "",
            enrollments: [],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "enrollments"
    });

    const watchedStudentId = form.watch("studentId");
    const watchedSchoolYear = form.watch("schoolYear");

    React.useEffect(() => {
        if (watchedStudentId && watchedSchoolYear) {
            const admission = admissions.find(a => a.schoolYear === watchedSchoolYear);
            const studentAdmission = admission?.students.find(s => s.studentId === watchedStudentId);
            form.setValue('enrollments', studentAdmission?.enrollments || []);
        } else {
            form.setValue('enrollments', []);
        }
    }, [watchedStudentId, watchedSchoolYear, admissions, form]);

    async function onSubmit(values: AdmissionFormValues) {
        setIsSubmitting(true);
        const existingAdmission = admissions.find(a => a.schoolYear === values.schoolYear);
        const newAdmission: Admission = existingAdmission 
            ? JSON.parse(JSON.stringify(existingAdmission))
            : { schoolYear: values.schoolYear, admissionId: values.schoolYear, students: [] };
            
        let studentAdmission = newAdmission.students.find(s => s.studentId === values.studentId);
        
        if (studentAdmission) {
            studentAdmission.enrollments = values.enrollments;
        } else {
            newAdmission.students.push({
                studentId: values.studentId,
                enrollments: values.enrollments
            });
        }
        
        const success = await onSave(newAdmission, false);
        if (success) {
            form.reset({
                ...values,
                studentId: "", // Reset student selection
                enrollments: [],
            });
        }
        setIsSubmitting(false);
    }
    
    const getStudentInfo = (studentId: string) => {
        return students.find(s => s.studentId === studentId);
    };

    const sortedAdmissions = [...admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));


  return (
    <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Student Admission</CardTitle>
            <CardDescription>
              Assign a student to one or more programs for a specific school year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                           <Popover>
                            <PopoverTrigger asChild>
                               <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                >
                                    {field.value
                                    ? activeStudents.find(s => s.studentId === field.value)?.firstName + ' ' + activeStudents.find(s => s.studentId === field.value)?.lastName
                                    : "Select a student"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                               </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Search student..." />
                                <CommandList>
                                   <CommandEmpty>No student found.</CommandEmpty>
                                    <CommandGroup>
                                    {activeStudents.map((student) => (
                                        <CommandItem
                                        value={`${student.firstName} ${student.lastName} ${student.studentId}`}
                                        key={student.studentId}
                                        onSelect={() => {
                                            form.setValue("studentId", student.studentId)
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === student.studentId ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {student.firstName} {student.lastName} ({student.studentId})
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="schoolYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Year</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a school year" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {admissionYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                {watchedStudentId && watchedSchoolYear && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Programs</h3>
                        {fields.map((field, index) => (
                            <EnrollmentCard key={field.id} form={form} index={index} remove={remove} />
                        ))}
                        
                        <FormField
                            control={form.control}
                            name="enrollments"
                            render={() => (<FormMessage />)}
                        />
                        
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ programId: "", level: "" })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Program
                        </Button>
                    </div>
                )}
                
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Admission"}
                    </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Existing Admissions</CardTitle>
                <CardDescription>
                    Review all student admissions grouped by school year.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {sortedAdmissions.map(admission => (
                        <AccordionItem key={admission.admissionId} value={admission.admissionId}>
                            <AccordionTrigger>{admission.schoolYear}</AccordionTrigger>
                            <AccordionContent>
                               <div className="space-y-4">
                                {admission.students.map(studentAdmission => {
                                    const student = getStudentInfo(studentAdmission.studentId);
                                    if (!student) return null;
                                    return (
                                        <div key={student.studentId} className="p-4 border rounded-md">
                                             <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarImage src={student.avatarUrl} alt={student.firstName} />
                                                    <AvatarFallback>
                                                        {student.firstName?.[0]}{student.lastName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{student.firstName} {student.lastName}</p>
                                                    <p className="text-sm text-muted-foreground">{student.studentId}</p>
                                                </div>
                                             </div>
                                             <Separator className="my-3" />
                                             <div className="space-y-2">
                                                {studentAdmission.enrollments.map((enrollment, index) => {
                                                    const program = programs.find(p => p.id === enrollment.programId);
                                                    return (
                                                        <div key={index} className="flex items-center gap-2 text-sm">
                                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{program?.name || 'Unknown Program'}</span>
                                                            <span className="text-muted-foreground">- {enrollment.level}</span>
                                                        </div>
                                                    )
                                                })}
                                             </div>
                                        </div>
                                    )
                                })}
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {sortedAdmissions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No admissions found.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

function EnrollmentCard({ form, index, remove }: { form: any, index: number; remove: (index: number) => void; }) {
  const { control, watch, setValue } = form;

  const programId = watch(`enrollments.${index}.programId`);
  const levels = React.useMemo(() => getLevelsForProgram(programId), [programId]);

  return (
    <div className="p-4 border rounded-md relative space-y-4 bg-muted/50">
      <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`enrollments.${index}.programId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); setValue(`enrollments.${index}.level`, '') }} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`enrollments.${index}.level`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level / Grade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!programId}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select a level" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
