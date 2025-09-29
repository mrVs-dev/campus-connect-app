
"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import type { Subject, AssessmentCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Subjects Schema and Form
const subjectSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string().min(1, "Subject name is required."),
});

const subjectsFormSchema = z.object({
  subjects: z.array(subjectSchema),
});

type SubjectsFormValues = z.infer<typeof subjectsFormSchema>;

function SubjectSettings({ initialSubjects, onSave }: { initialSubjects: Subject[]; onSave: (subjects: Subject[]) => void }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<SubjectsFormValues>({
    resolver: zodResolver(subjectsFormSchema),
    defaultValues: { subjects: initialSubjects },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects",
    keyName: "keyId", // To avoid conflict with subjectId
  });

  React.useEffect(() => {
    form.reset({ subjects: initialSubjects });
  }, [initialSubjects, form]);

  const handleAddNew = () => {
    const newId = `SUB${Date.now()}`;
    append({ subjectId: newId, subjectName: "" });
  };
  
  const onSubmit = async (data: SubjectsFormValues) => {
    setIsSaving(true);
    await onSave(data.subjects);
    setIsSaving(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subjects</CardTitle>
        <CardDescription>Add, edit, or remove subjects offered at the school.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.keyId} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`subjects.${index}.subjectName`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="e.g., Mathematics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Subjects"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Assessment Categories Schema and Form
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  weight: z.coerce.number().min(0, "Weight must be positive.").max(100, "Weight cannot exceed 100."),
});

const categoriesFormSchema = z.object({
  categories: z.array(categorySchema),
}).refine(data => {
    const totalWeight = data.categories.reduce((acc, cat) => acc + (cat.weight || 0), 0);
    return totalWeight === 100;
}, {
    message: "Total weight of all categories must be exactly 100%.",
    path: ["categories"], // Shows error at the form level
});

type CategoriesFormValues = z.infer<typeof categoriesFormSchema>;

function CategorySettings({ initialCategories, onSave }: { initialCategories: AssessmentCategory[]; onSave: (categories: AssessmentCategory[]) => void }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<CategoriesFormValues>({
    resolver: zodResolver(categoriesFormSchema),
    defaultValues: { categories: initialCategories },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  const totalWeight = form.watch('categories').reduce((acc, cat) => acc + (cat.weight || 0), 0);

  React.useEffect(() => {
    form.reset({ categories: initialCategories });
  }, [initialCategories, form]);
  
  const onSubmit = async (data: CategoriesFormValues) => {
    setIsSaving(true);
    await onSave(data.categories);
    setIsSaving(false);
  };
  
  const handleFormError = () => {
      const formErrors = form.formState.errors;
      if (formErrors.categories && formErrors.categories.message) {
        toast({
            title: "Validation Error",
            description: formErrors.categories.message,
            variant: "destructive"
        });
      }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Categories & Weights</CardTitle>
        <CardDescription>Define the categories for assessments and their contribution to the final grade. The total weight must sum to 100%.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-6">
             <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`categories.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="e.g., Classwork" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`categories.${index}.weight`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                           <div className="relative">
                            <Input type="number" placeholder="e.g., 25" {...field} className="pr-8" />
                            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', weight: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                </Button>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">Total Weight: <span className={totalWeight !== 100 ? 'text-destructive' : ''}>{totalWeight}%</span></div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Categories"}
                    </Button>
                </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Main Page Component
interface SettingsPageProps {
  subjects: Subject[];
  assessmentCategories: AssessmentCategory[];
  onSaveSubjects: (subjects: Subject[]) => void;
  onSaveCategories: (categories: AssessmentCategory[]) => void;
}

export function SettingsPage({ subjects, assessmentCategories, onSaveSubjects, onSaveCategories }: SettingsPageProps) {
  return (
    <div className="space-y-8">
      <SubjectSettings initialSubjects={subjects} onSave={onSaveSubjects} />
      <CategorySettings initialCategories={assessmentCategories} onSave={onSaveCategories} />
    </div>
  );
}
