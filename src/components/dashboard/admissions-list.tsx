
"use client";

import * as React from "react";
import { PlusCircle, Search, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

import type { Admission, Student, Enrollment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { programs, getLevelsForProgram } from "@/lib/program-data";

// Schemas for forms
const studentAdmissionSchema = z.object({
  studentId: z.string(),
  enrollments: z
    .array(
      z.object({
        programId: z.string().min(1, "Program is required"),
        level: z.string().min(1, "Level is required"),
      })
    )
    .min(1, "At least one program is required for admission."),
});

const bulkEnrollmentSchema = z.object({
  programId: z.string().min(1, "Program is required"),
  level: z.string().min(1, "Level is required"),
});

const admissionFormSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  students: z.array(studentAdmissionSchema),
  bulkEnrollments: z.array(bulkEnrollmentSchema),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

interface AdmissionsListProps {
  admissions: Admission[];
  students: Student[];
  onSave: (admission: Admission) => Promise<boolean>;
}

// Main Component
export function AdmissionsList({
  admissions,
  students,
  onSave,
}: AdmissionsListProps) {
  const [editingYear, setEditingYear] = React.useState<string | null>(null);
  const [editingClass, setEditingClass] = React.useState<{ year: string; programId: string; level: string } | null>(null);

  const activeStudents = React.useMemo(() => {
    return students.filter((s) => s.status === "Active");
  }, [students]);

  const handleCreateNewYear = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const newSchoolYear = `${currentYear}-${nextYear}`;
    setEditingYear(newSchoolYear);
    setEditingClass(null);
  };

  const handleEditYear = (admission: Admission) => {
    setEditingYear(admission.schoolYear);
    setEditingClass(null);
  };

  const handleEditClass = (year: string, programId: string, level: string) => {
    setEditingClass({ year, programId, level });
    setEditingYear(null);
  };
  
  const handleCancel = () => {
    setEditingYear(null);
    setEditingClass(null);
  };

  const handleSaveAdmission = async (admissionData: Admission) => {
    const success = await onSave(admissionData);
    if (success) {
      handleCancel();
    }
    return success;
  };
  
  const editingAdmission = admissions.find(a => a.schoolYear === editingYear);

  if (editingYear) {
    return (
        <AdmissionForm
            key={editingYear}
            schoolYear={editingYear}
            activeStudents={activeStudents}
            existingAdmission={editingAdmission}
            onSave={handleSaveAdmission}
            onCancel={handleCancel}
        />
    );
  }

  if (editingClass) {
    return (
        <ClassEditor
            key={`${editingClass.year}-${editingClass.programId}-${editingClass.level}`}
            admissions={admissions}
            allStudents={activeStudents}
            classInfo={editingClass}
            onSave={handleSaveAdmission}
            onCancel={handleCancel}
        />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admissions Management</CardTitle>
        <CardDescription>
          Manage student admissions by class or by school year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="years">Admission Years</TabsTrigger>
          </TabsList>
          <TabsContent value="classes">
            <ClassList admissions={admissions} students={students} onEditClass={handleEditClass} />
          </TabsContent>
          <TabsContent value="years">
            <AdmissionYearList
              admissions={admissions}
              onEditYear={handleEditYear}
              onCreateNewYear={handleCreateNewYear}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Class-based View Components
function ClassList({ admissions, students, onEditClass }: { admissions: Admission[], students: Student[], onEditClass: (year: string, programId: string, level: string) => void }) {
  const classesByYear = React.useMemo(() => {
    const classMap: Record<string, Record<string, { studentIds: Set<string> }>> = {};

    for (const admission of admissions) {
      if (!classMap[admission.schoolYear]) {
        classMap[admission.schoolYear] = {};
      }
      for (const studentAdmission of admission.students) {
        for (const enrollment of studentAdmission.enrollments) {
          const classKey = `${enrollment.programId}::${enrollment.level}`;
          if (!classMap[admission.schoolYear][classKey]) {
            classMap[admission.schoolYear][classKey] = { studentIds: new Set() };
          }
          classMap[admission.schoolYear][classKey].studentIds.add(studentAdmission.studentId);
        }
      }
    }
    return classMap;
  }, [admissions]);

  const sortedYears = Object.keys(classesByYear).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 pt-4">
      {sortedYears.length > 0 ? (
        sortedYears.map(year => (
          <div key={year}>
            <h3 className="text-lg font-semibold mb-2">{year}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(classesByYear[year]).map(([classKey, data]) => {
                const [programId, level] = classKey.split('::');
                const programName = programs.find(p => p.id === programId)?.name || "Unknown Program";
                return (
                  <Card key={classKey}>
                    <CardHeader>
                      <CardTitle className="text-base">{programName}</CardTitle>
                      <CardDescription>{level}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <p className="text-sm">{data.studentIds.size} student(s)</p>
                      <Button variant="outline" size="sm" onClick={() => onEditClass(year, programId, level)}>Edit Class</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-8">No classes found. Create an admission year and add students to see classes here.</p>
      )}
    </div>
  );
}

const classEditorFormSchema = z.object({
    studentIds: z.array(z.string()),
});
type ClassEditorFormValues = z.infer<typeof classEditorFormSchema>;

function ClassEditor({ admissions, allStudents, classInfo, onSave, onCancel }: { admissions: Admission[], allStudents: Student[], classInfo: { year: string, programId: string, level: string }, onSave: (admission: Admission) => Promise<boolean>, onCancel: () => void}) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    const admissionForYear = admissions.find(a => a.schoolYear === classInfo.year);
    if (!admissionForYear) {
      // This should ideally not happen if the UI flows correctly
      return <p>Error: Could not find admission data for {classInfo.year}</p>;
    }
    
    const studentsInClass = React.useMemo(() => {
        return admissionForYear.students.filter(s => 
            s.enrollments.some(e => e.programId === classInfo.programId && e.level === classInfo.level)
        ).map(s => s.studentId);
    }, [admissionForYear, classInfo]);

    const form = useForm<ClassEditorFormValues>({
        resolver: zodResolver(classEditorFormSchema),
        defaultValues: {
            studentIds: studentsInClass,
        }
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: "studentIds"
    });
    
    const selectedStudentIds = new Set(form.watch('studentIds'));
    const availableStudents = allStudents.filter(s => !selectedStudentIds.has(s.studentId));

    const filteredAvailableStudents = React.useMemo(() => {
      if (!searchQuery) return availableStudents;
      return availableStudents.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [searchQuery, availableStudents]);

    const handleStudentSelect = (studentId: string, checked: boolean) => {
        const currentIds = form.getValues('studentIds');
        if (checked) {
            form.setValue('studentIds', [...currentIds, studentId]);
        } else {
            form.setValue('studentIds', currentIds.filter(id => id !== studentId));
        }
    };
    
    async function onSubmit(values: ClassEditorFormValues) {
        setIsSubmitting(true);

        const updatedAdmission = JSON.parse(JSON.stringify(admissionForYear)) as Admission;
        const newStudentIdSet = new Set(values.studentIds);
        const originalStudentIdSet = new Set(studentsInClass);

        // Update student enrollments based on changes
        for (const studentId of newStudentIdSet) {
            let studentAdmission = updatedAdmission.students.find(s => s.studentId === studentId);
            if (!studentAdmission) { // Student was newly added to the admission year
                studentAdmission = { studentId, enrollments: [] };
                updatedAdmission.students.push(studentAdmission);
            }
            // Add enrollment if it doesn't exist
            const hasEnrollment = studentAdmission.enrollments.some(e => e.programId === classInfo.programId && e.level === classInfo.level);
            if (!hasEnrollment) {
                studentAdmission.enrollments.push({ programId: classInfo.programId, level: classInfo.level });
            }
        }
        
        for (const studentId of originalStudentIdSet) {
             if (!newStudentIdSet.has(studentId)) { // Student was removed from this class
                let studentAdmission = updatedAdmission.students.find(s => s.studentId === studentId);
                if (studentAdmission) {
                    studentAdmission.enrollments = studentAdmission.enrollments.filter(e => !(e.programId === classInfo.programId && e.level === classInfo.level));
                }
            }
        }
        
        // Clean up students with no enrollments left
        updatedAdmission.students = updatedAdmission.students.filter(s => s.enrollments.length > 0);

        await onSave(updatedAdmission);
        setIsSubmitting(false);
    }

    const programName = programs.find(p => p.id === classInfo.programId)?.name || classInfo.programId;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Editing Class Roster</CardTitle>
                        <CardDescription>
                            Managing students for <span className="font-semibold">{programName} - {classInfo.level}</span> for the <span className="font-semibold">{classInfo.year}</span> school year.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                           <Label>Students in this class ({selectedStudentIds.size})</Label>
                           <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-4 border rounded-md">
                                {form.getValues('studentIds').map(studentId => {
                                    const student = allStudents.find(s => s.studentId === studentId);
                                    if (!student) return null;
                                    return (
                                        <FormItem key={student.studentId} className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 bg-muted/50">
                                            <FormControl>
                                                <Checkbox
                                                    checked={true}
                                                    onCheckedChange={(checked) => handleStudentSelect(student.studentId, !!checked)}
                                                    id={`student-${student.studentId}`}
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor={`student-${student.studentId}`} className="font-normal cursor-pointer flex-1">
                                                {student.firstName} {student.lastName}
                                            </FormLabel>
                                        </FormItem>
                                    );
                                })}
                            </div>
                        </div>

                         <div>
                            <Label>Add students to this class</Label>
                             <div className="relative pt-2">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search student name..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                           <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-4 border rounded-md">
                                {filteredAvailableStudents.map(student => (
                                    <FormItem key={student.studentId} className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                                        <FormControl>
                                            <Checkbox
                                                checked={false}
                                                onCheckedChange={(checked) => handleStudentSelect(student.studentId, !!checked)}
                                                id={`add-student-${student.studentId}`}
                                            />
                                        </FormControl>
                                        <FormLabel htmlFor={`add-student-${student.studentId}`} className="font-normal cursor-pointer flex-1">
                                            {student.firstName} {student.lastName}
                                        </FormLabel>
                                    </FormItem>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardContent>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Class Roster"}</Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}

// Admission Year-based View Components
function AdmissionYearList({ admissions, onEditYear, onCreateNewYear }: { admissions: Admission[], onEditYear: (admission: Admission) => void, onCreateNewYear: () => void }) {
  const sortedAdmissions = [...admissions].sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
  return (
    <Card className="border-0 shadow-none">
       <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Admission Years</CardTitle>
            <CardDescription>
              Create or manage student admissions for a whole school year.
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={onCreateNewYear}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            New Admission Year
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {sortedAdmissions.length > 0 ? (
                sortedAdmissions.map(admission => (
                    <div key={admission.admissionId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-semibold text-lg">{admission.schoolYear}</p>
                            <p className="text-sm text-muted-foreground">{admission.students.length} student(s) admitted</p>
                        </div>
                        <Button variant="outline" onClick={() => onEditYear(admission)}>Edit Year</Button>
                    </div>
                ))
            ) : (
                <p className="text-center text-muted-foreground py-8">No admission records found. Click "New Admission Year" to start.</p>
            )}
          </div>
      </CardContent>
    </Card>
  )
}

function AdmissionForm({ schoolYear, activeStudents, existingAdmission, onSave, onCancel }: { schoolYear: string, activeStudents: Student[], existingAdmission?: Admission, onSave: (admission: Admission) => Promise<boolean>, onCancel: () => void }) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const defaultStudents = existingAdmission
    ? existingAdmission.students.map(s => ({
        ...s,
        enrollments: s.enrollments || [{ programId: "", level: "" }],
      }))
    : [];

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      schoolYear: schoolYear,
      students: defaultStudents,
      bulkEnrollments: [{ programId: "", level: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "students",
    keyName: "keyId",
  });

  const selectedStudentIds = new Set(fields.map(f => f.studentId));
  const availableStudents = activeStudents.filter(s => !selectedStudentIds.has(s.studentId));

  const filteredAvailableStudents = React.useMemo(() => {
    if (!searchQuery) return availableStudents;
    return availableStudents.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, availableStudents]);

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      if (!selectedStudentIds.has(studentId)) {
        append({
          studentId,
          enrollments: [{ programId: "", level: "" }],
        });
      }
    } else {
      const indexToRemove = fields.findIndex(f => f.studentId === studentId);
      if (indexToRemove > -1) {
        remove(indexToRemove);
      }
    }
  };

  async function onSubmit(values: AdmissionFormValues) {
    setIsSubmitting(true);
    const newAdmission: Admission = {
      admissionId: existingAdmission?.admissionId || values.schoolYear,
      schoolYear: values.schoolYear,
      students: values.students
    };
    await onSave(newAdmission);
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-xl font-bold">Admissions for School Year: {schoolYear}</h3>

        <Card>
          <CardHeader>
            <CardTitle>Select Students</CardTitle>
            <CardDescription>Choose from available students to include in this admission year.</CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-60 overflow-y-auto p-4 border rounded-md">
            {filteredAvailableStudents.map(student => (
              <FormItem key={student.studentId} className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
                <FormControl>
                  <Checkbox
                    checked={false} // Always unchecked for adding new students
                    onCheckedChange={(checked) => handleStudentSelect(student.studentId, !!checked)}
                    id={`student-${student.studentId}`}
                  />
                </FormControl>
                <FormLabel htmlFor={`student-${student.studentId}`} className="font-normal cursor-pointer flex-1">
                  {student.firstName} {student.lastName}
                </FormLabel>
              </FormItem>
            ))}
          </CardContent>
        </Card>

        {fields.length > 0 && (
          <>
            <BulkEnrollmentControl />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Individual Assignments ({fields.length} student(s) selected)</h3>
              <Accordion type="multiple" className="w-full space-y-2">
                {fields.map((field, index) => {
                  const student = activeStudents.find(s => s.studentId === field.studentId);
                  return (
                    <AccordionItem value={field.studentId} key={field.keyId} className="border rounded-md px-4">
                      <AccordionTrigger className="hover:no-underline flex justify-between w-full">
                        <span className="font-medium">{student?.firstName} {student?.lastName}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <StudentEnrollmentFields studentIndex={index} />
                        <FormField
                          control={form.control}
                          name={`students.${index}.enrollments`}
                          render={() => <FormMessage className="mt-2" />}
                        />
                        <Button type="button" variant="link" className="text-destructive px-0 mt-2" onClick={() => handleStudentSelect(field.studentId, false)}>
                          Remove from this admission
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Admissions"}</Button>
        </div>
      </form>
    </Form>
  );
}

// Shared Form Control Components
function BulkEnrollmentControl() {
  const { control, setValue, getValues } = useFormContext<AdmissionFormValues>();
  const selectedStudentsCount = getValues("students").length;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "bulkEnrollments",
  });

  const handleApplyToAll = () => {
    const bulkEnrollments = getValues("bulkEnrollments").filter(e => e.programId && e.level);
    if (bulkEnrollments.length === 0) return;

    getValues("students").forEach((_, index) => {
      setValue(`students.${index}.enrollments`, JSON.parse(JSON.stringify(bulkEnrollments)));
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Assign Programs</CardTitle>
        <CardDescription>
          Configure programs and levels below, then click "Apply to All" to assign them to all {selectedStudentsCount} selected student(s). This will overwrite any individual assignments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => (
          <BulkEnrollmentRow key={field.id} index={index} onRemove={() => remove(index)} isOnlyOne={fields.length === 1} />
        ))}
        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ programId: "", level: "" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Program
          </Button>
          <Button type="button" onClick={handleApplyToAll}>
            Apply to All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BulkEnrollmentRow({ index, onRemove, isOnlyOne }: { index: number; onRemove: () => void; isOnlyOne: boolean; }) {
  const { control, watch, setValue } = useFormContext<AdmissionFormValues>();
  const programId = watch(`bulkEnrollments.${index}.programId`);
  const levels = React.useMemo(() => getLevelsForProgram(programId), [programId]);

  return (
    <div className="flex items-end gap-4 p-4 border rounded-md relative bg-muted/50">
      <FormField
        control={control}
        name={`bulkEnrollments.${index}.programId`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Program</FormLabel>
            <Select onValueChange={(value) => { field.onChange(value); setValue(`bulkEnrollments.${index}.level`, ''); }} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`bulkEnrollments.${index}.level`}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel>Level / Grade</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={!programId}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select a level" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {!isOnlyOne && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function StudentEnrollmentFields({ studentIndex }: { studentIndex: number }) {
  const { control } = useFormContext<AdmissionFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `students.${studentIndex}.enrollments`,
  });

  return (
    <div className="space-y-4 pt-2">
      {fields.map((field, enrollmentIndex) => (
        <EnrollmentCard key={field.id} studentIndex={studentIndex} enrollmentIndex={enrollmentIndex} remove={remove} />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ programId: "", level: "" })}
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Add Program
      </Button>
    </div>
  );
}

function EnrollmentCard({ studentIndex, enrollmentIndex, remove }: { studentIndex: number; enrollmentIndex: number; remove: (index: number) => void }) {
  const { control, watch, setValue } = useFormContext<AdmissionFormValues>();
  const { fields } = useFieldArray({
    control,
    name: `students.${studentIndex}.enrollments`,
  });

  const programId = watch(`students.${studentIndex}.enrollments.${enrollmentIndex}.programId`);
  const levels = React.useMemo(() => getLevelsForProgram(programId), [programId]);

  const handleProgramChange = (value: string) => {
    setValue(`students.${studentIndex}.enrollments.${enrollmentIndex}.programId`, value);
    setValue(`students.${studentIndex}.enrollments.${enrollmentIndex}.level`, '');
  };

  return (
    <div className="p-4 border rounded-md relative space-y-4 bg-muted/50">
      {fields.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => remove(enrollmentIndex)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name={`students.${studentIndex}.enrollments.${enrollmentIndex}.programId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program</FormLabel>
              <Select onValueChange={handleProgramChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`students.${studentIndex}.enrollments.${enrollmentIndex}.level`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level / Grade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!programId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
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

    