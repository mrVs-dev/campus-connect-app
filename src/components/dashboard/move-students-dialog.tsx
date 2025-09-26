
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { Admission, Enrollment } from "@/lib/types";
import { programs, getLevelsForProgram } from "@/lib/program-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const moveStudentsSchema = z.object({
  schoolYear: z.string().min(1, "School year is required"),
  fromProgramId: z.string().optional(),
  fromLevel: z.string().optional(),
  toProgramId: z.string().min(1, "Destination program is required"),
  toLevel: z.string().min(1, "Destination level is required"),
});

type MoveStudentsFormValues = z.infer<typeof moveStudentsSchema>;

interface MoveStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissions: Admission[];
  selectedStudentCount: number;
  onMove: (schoolYear: string, fromClass: Enrollment | null, toClass: Enrollment) => void;
}

export function MoveStudentsDialog({ open, onOpenChange, admissions, selectedStudentCount, onMove }: MoveStudentsDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<MoveStudentsFormValues>({
    resolver: zodResolver(moveStudentsSchema),
  });

  const admissionYears = React.useMemo(() => {
    return [...new Set(admissions.map(a => a.schoolYear))].sort((a, b) => b.localeCompare(a));
  }, [admissions]);

  const watchedFromProgramId = form.watch("fromProgramId");
  const fromLevels = React.useMemo(() => getLevelsForProgram(watchedFromProgramId || ""), [watchedFromProgramId]);

  const watchedToProgramId = form.watch("toProgramId");
  const toLevels = React.useMemo(() => getLevelsForProgram(watchedToProgramId || ""), [watchedToProgramId]);
  
  React.useEffect(() => {
    form.reset();
  }, [open, form]);

  const handleSubmit = (values: MoveStudentsFormValues) => {
    setIsSubmitting(true);
    const fromClass = values.fromProgramId && values.fromLevel 
      ? { programId: values.fromProgramId, level: values.fromLevel } 
      : null;
    const toClass = { programId: values.toProgramId, level: values.toLevel };
    
    onMove(values.schoolYear, fromClass, toClass);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {selectedStudentCount} Student(s)</DialogTitle>
          <DialogDescription>
            Select the destination class for the selected students.
            If a "From" class is selected, only students from that class will be moved.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="schoolYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a year" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {admissionYears.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="text-sm font-medium text-muted-foreground pt-2">From (Optional)</div>
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="fromProgramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); form.setValue('fromLevel', ''); }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="From program..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fromLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level / Grade</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={!watchedFromProgramId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="From level..." /></SelectTrigger></FormControl>
                        <SelectContent>
                           {fromLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
            </div>

            <div className="text-sm font-medium pt-2">To</div>
             <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                <FormField
                  control={form.control}
                  name="toProgramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); form.setValue('toLevel', ''); }} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="To program..." /></SelectTrigger></FormControl>
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
                  name="toLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level / Grade</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={!watchedToProgramId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="To level..." /></SelectTrigger></FormControl>
                        <SelectContent>
                           {toLevels.map(level => <SelectItem key={level} value={level}>{level}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Moving..." : "Move Students"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
