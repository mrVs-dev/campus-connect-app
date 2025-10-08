
"use client";

import * as React from "react";
import { PlusCircle, Trash2, Check, ChevronsUpDown, BookOpen, PenSquare, Upload } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

import type { Admission, Student, Enrollment, Teacher, ClassDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MultiSelectTeacher } from "./multi-select-teacher";
import { AdmissionImportDialog } from "./admission-import-dialog";


const enrollmentSchema = z.object({
    programId: z.string().min(1, "Program is required"),
    level: z.string().min(1, "Level is required"),
});

const admissionFormSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  studentId: z.string().min(1, "Student is required"),
  enrollments: z.array(enrollmentSchema).min(0),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;


const classDefinitionSchema = z.object({
    programId: z.string().min(1, "Program is required"),
    level: z.string().min(1, "Level is required"),
    teacherIds: z.array(z.string()).optional(),
});
type ClassDefinitionFormValues = z.infer<typeof classDefinitionSchema>;

function ClassDialog({ open, onOpenChange, schoolYear, teachers, onSave, existingClass }: { open: boolean, onOpenChange: (open: boolean) => void, schoolYear: string, teachers: Teacher[], onSave: (classDef: ClassDefinition) => void, existingClass?: ClassDefinition | null }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<ClassDefinitionFormValues>({
    resolver: zodResolver(classDefinitionSchema),
  });

  const watchedProgramId = form.watch('programId');
  const levels = React.useMemo(() => getLevelsForProgram(watchedProgramId || ''), [watchedProgramId]);

  React.useEffect(() => {
    if (open) {
      form.reset(existingClass ? {
        programId: existingClass.programId,
        level: existingClass.level,
        teacherIds: existingClass.teacherIds || [],
      } : {
        programId: '',
        level: '',
        teacherIds: [],
      });
    }
  }, [open, existingClass, form]);

  const handleSave = (values: ClassDefinitionFormValues) => {
    setIsSaving(true);
    onSave(values);
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{existingClass ? 'Edit Class' : 'Create New Class'} for {schoolYear}</DialogTitle>
            <DialogDescription>Define a class and assign teachers to it.</DialogDescription>
          </DialogHeader>
           <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); form.setValue('level', ''); }} value={field.value} disabled={!!existingClass}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level / Grade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedProgramId || !!existingClass}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a level" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {levels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="teacherIds"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Assign Teacher(s)</FormLabel>
                        <MultiSelectTeacher
                            teachers={teachers}
                            selected={field.value || []}
                            onChange={field.onChange}
                        />
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Class"}</Button>
                </DialogFooter>
              </form>
            </Form>
        </DialogContent>
    </Dialog>
  )
}

const newSchoolYearSchema = z.object({
  schoolYear: z.string().regex(/^\d{4}-\d{4}$/, "Year must be in YYYY-YYYY format."),
});
type NewSchoolYearFormValues = z.infer<typeof newSchoolYearSchema>;

function NewSchoolYearDialog({ open, onOpenChange, onSave, existingYears }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (year: string) => void, existingYears: string[] }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<NewSchoolYearFormValues>({
    resolver: zodResolver(newSchoolYearSchema),
  });

  const handleSave = (values: NewSchoolYearFormValues) => {
    if (existingYears.includes(values.schoolYear)) {
      form.setError("schoolYear", { message: "This school year already exists."});
      return;
    }
    setIsSaving(true);
    onSave(values.schoolYear);
    setIsSaving(false);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New School Year</DialogTitle>
          <DialogDescription>Enter the new school year for admissions (e.g., 2025-2026).</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="schoolYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Year</FormLabel>
                  <FormControl><Input placeholder="YYYY-YYYY" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Creating..." : "Create Year"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


interface AdmissionsListProps {
  admissions: Admission[];
  students: Student[];
  teachers: Teacher[];
  onSave: (admission: Admission, isNewClass: boolean) => Promise<boolean>;
  onImport: (data: { studentId: string; schoolYear: string; programId: string; level: string; }[]) => void;
}

export function AdmissionsList({
  admissions,
  students,
  teachers,
  onSave,
  onImport,
}: AdmissionsListProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const activeStudents = React.useMemo(() => students.filter(s => s.status === 'Active'), [students]);
    
    const [isClassDialogOpen, setIsClassDialogOpen] = React.useState(false);
    const [isNewYearOpen, setIsNewYearOpen] = React.useState(false);
    const [isImportOpen, setIsImportOpen] = React.useState(false);
    const [classToEdit, setClassToEdit] = React.useState<ClassDefinition | null>(null);
    const [activeSchoolYear, setActiveSchoolYear] = React.useState('');

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

    const handleClassSave = async (classDef: ClassDefinition) => {
        const existingAdmission = admissions.find(a => a.schoolYear === activeSchoolYear);
        const newAdmission: Admission = existingAdmission 
            ? JSON.parse(JSON.stringify(existingAdmission)) 
            : { schoolYear: activeSchoolYear, admissionId: activeSchoolYear, students: [], classes: [] };
        
        if (!newAdmission.classes) {
            newAdmission.classes = [];
        }

        const existingClassIndex = newAdmission.classes.findIndex(c => c.programId === classDef.programId && c.level === classDef.level);

        if (existingClassIndex > -1) {
            newAdmission.classes[existingClassIndex] = classDef;
        } else {
            newAdmission.classes.push(classDef);
        }
        
        await onSave(newAdmission, true);
    };

    const handleNewSchoolYear = async (year: string) => {
      const newAdmission: Admission = {
        admissionId: year,
        schoolYear: year,
        students: [],
        classes: [],
      };
      await onSave(newAdmission, true);
    };

    const handleOpenClassDialog = (schoolYear: string, classDef?: ClassDefinition) => {
        setActiveSchoolYear(schoolYear);
        setClassToEdit(classDef || null);
        setIsClassDialogOpen(true);
    }
    
    const getStudentInfo = (studentId: string) => {
        return students.find(s => s.studentId === studentId);
    };

    const getTeacherName = (teacherId: string) => {
        const teacher = teachers.find(t => t.teacherId === teacherId);
        return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown';
    };

    const sortedAdmissions = [...admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));

    const groupedAdmissions = React.useMemo(() => {
        return sortedAdmissions.map(admission => {
            const programsMap: { [key: string]: { programName: string; classes: (ClassDefinition & { students: Student[] })[] } } = {};
    
            const processEnrollment = (student: Student, enrollment: Enrollment) => {
                const programId = enrollment.programId;
                let levelName = enrollment.level;
    
                if (levelName.toLowerCase() === 'starter') {
                    levelName = 'Starters';
                }
    
                if (!programsMap[programId]) {
                    programsMap[programId] = {
                        programName: programs.find(p => p.id === programId)?.name || 'Unknown Program',
                        classes: []
                    };
                }
    
                let classInProgram = programsMap[programId].classes.find(c => c.level === levelName);
    
                if (!classInProgram) {
                    const existingClassDef = admission.classes?.find(c => c.programId === programId && c.level === levelName);
                    classInProgram = {
                        ...(existingClassDef || { programId: programId, level: levelName }),
                        students: []
                    };
                    programsMap[programId].classes.push(classInProgram);
                }
    
                if (!classInProgram.students.some(s => s.studentId === student.studentId)) {
                    classInProgram.students.push(student);
                }
            };
    
            // Populate classes with students
            admission.students.forEach(studentAdmission => {
                const student = getStudentInfo(studentAdmission.studentId);
                if (student) {
                    studentAdmission.enrollments.forEach(enrollment => {
                        processEnrollment(student, enrollment);
                    });
                }
            });
    
            // Ensure even classes without students are included and levels are standardized
            admission.classes?.forEach(classDef => {
                let levelName = classDef.level;
                if (levelName.toLowerCase() === 'starter') {
                    levelName = 'Starters';
                }
                const finalClassDef = { ...classDef, level: levelName };
    
                if (!programsMap[finalClassDef.programId]) {
                    programsMap[finalClassDef.programId] = {
                        programName: programs.find(p => p.id === finalClassDef.programId)?.name || 'Unknown Program',
                        classes: []
                    };
                }
                if (!programsMap[finalClassDef.programId].classes.some(c => c.level === finalClassDef.level)) {
                    programsMap[finalClassDef.programId].classes.push({ ...finalClassDef, students: [] });
                }
            });
    
            return { ...admission, programs: Object.values(programsMap) };
        });
    }, [sortedAdmissions, students]);

  return (
    <div className="space-y-8">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Student Admission</CardTitle>
                    <CardDescription>
                    Assign a student to one or more programs for a specific school year.
                    </CardDescription>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setIsImportOpen(true)}
                >
                    <Upload className="h-3.5 w-3.5" />
                    Import
                </Button>
            </div>
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
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Existing Admissions</CardTitle>
                        <CardDescription>
                            Review all student admissions and manage class assignments for each school year.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsNewYearOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New School Year
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {groupedAdmissions.map(admission => (
                        <AccordionItem key={admission.admissionId} value={admission.admissionId}>
                            <AccordionTrigger>{admission.schoolYear}</AccordionTrigger>
                            <AccordionContent>
                               <div className="space-y-6">
                                   <div className="flex justify-end">
                                      <Button variant="outline" size="sm" onClick={() => handleOpenClassDialog(admission.schoolYear)}>
                                          <PlusCircle className="mr-2 h-4 w-4" /> New Class
                                      </Button>
                                   </div>
                                    {admission.programs.map((program, progIndex) => (
                                        <div key={progIndex} className="space-y-4 rounded-lg border p-4">
                                            <h3 className="font-semibold text-lg">{program.programName}</h3>
                                            {program.classes.map((classDef, classIndex) => (
                                                <div key={classIndex} className="space-y-3">
                                                    <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                                                        <div>
                                                            <p className="font-medium">{classDef.level}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {classDef.teacherIds && classDef.teacherIds.length > 0 
                                                                    ? `Teacher(s): ${classDef.teacherIds.map(getTeacherName).join(', ')}`
                                                                    : 'No teachers assigned'
                                                                }
                                                            </p>
                                                        </div>
                                                         <Button variant="ghost" size="icon" onClick={() => handleOpenClassDialog(admission.schoolYear, classDef)}>
                                                            <PenSquare className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="pl-4 space-y-2">
                                                        {classDef.students.map(student => (
                                                            <div key={student.studentId} className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={student.avatarUrl} alt={student.firstName} />
                                                                    <AvatarFallback>
                                                                        {student.firstName?.[0]}{student.lastName?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                                                                    <p className="text-xs text-muted-foreground">{student.studentId}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {classDef.students.length === 0 && <p className="text-xs text-muted-foreground pl-2">No students enrolled in this class.</p>}
                                                    </div>
                                                </div>
                                            ))}
                                            {program.classes.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No classes defined for this program.</p>}
                                        </div>
                                    ))}
                                    {admission.programs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No programs with classes or students for this year.</p>}
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {groupedAdmissions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No admissions found.
                    </div>
                )}
            </CardContent>
        </Card>
        
        <ClassDialog 
            open={isClassDialogOpen}
            onOpenChange={setIsClassDialogOpen}
            schoolYear={activeSchoolYear}
            teachers={teachers}
            onSave={handleClassSave}
            existingClass={classToEdit}
        />
        <NewSchoolYearDialog
          open={isNewYearOpen}
          onOpenChange={setIsNewYearOpen}
          onSave={handleNewSchoolYear}
          existingYears={admissionYears}
        />
        <AdmissionImportDialog
            open={isImportOpen}
            onOpenChange={setIsImportOpen}
            onImport={onImport}
        />
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
              <Select onValueChange={(value) => { field.onChange(value); setValue(`enrollments.${index}.level`, '') }} value={field.value || ""}>
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
