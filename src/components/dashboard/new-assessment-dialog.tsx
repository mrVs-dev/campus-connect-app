
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { subjects } from "@/lib/mock-data";
import { assessmentCategoryWeights, Assessment, AssessmentCategory } from "@/lib/types";

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  subjectId: z.string().min(1, "Subject is required"),
  category: z.nativeEnum(Object.keys(assessmentCategoryWeights).reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {} as { [key: string]: string })) as z.ZodType<AssessmentCategory>,
  totalMarks: z.coerce.number().min(1, "Total marks must be at least 1"),
});

type NewAssessmentFormValues = z.infer<typeof formSchema>;


interface NewAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assessment: Omit<Assessment, 'assessmentId' | 'teacherId'> | Assessment) => Promise<Assessment | null>;
  existingAssessment?: Assessment | null;
}

export function NewAssessmentDialog({ open, onOpenChange, onSave, existingAssessment }: NewAssessmentDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<NewAssessmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      subjectId: "",
      totalMarks: 100,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (existingAssessment) {
        form.reset(existingAssessment);
      } else {
        form.reset({
          topic: "",
          subjectId: "",
          totalMarks: 100,
          category: undefined,
        });
      }
    }
  }, [open, existingAssessment, form]);

  const handleSave = async (values: NewAssessmentFormValues) => {
    setIsSaving(true);
    let result: Assessment | null = null;
    
    if (existingAssessment) {
      const updatedAssessment = { ...existingAssessment, ...values };
      result = await onSave(updatedAssessment);
    } else {
      const newAssessmentData = {
        ...values,
        scores: {},
      };
      result = await onSave(newAssessmentData);
    }

    if (result) {
        form.reset();
        onOpenChange(false);
    }
    setIsSaving(false);
  };
  
  const isEditing = !!existingAssessment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Assessment" : "Create New Assessment"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update the details for this assessment." : "Fill in the details for the new assessment."} Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Algebra Basics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                       </FormControl>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.subjectId} value={subject.subjectId}>
                            {subject.subjectName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                       </FormControl>
                      <SelectContent>
                        {Object.keys(assessmentCategoryWeights).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalMarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Marks</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Assessment"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
