
"use client";

import * as React from "react";
import type { Student, StudentStatusHistory } from "@/lib/types";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, PlusCircle, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "../ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";


const changeStatusSchema = z.object({
  studentId: z.string().min(1, "You must select a student."),
  newStatus: z.enum(["Active", "Inactive", "Graduated"]),
  reason: z.string().min(5, "A reason of at least 5 characters is required."),
});

type ChangeStatusFormValues = z.infer<typeof changeStatusSchema>;


function ChangeStatusDialog({
  open,
  onOpenChange,
  students,
  onUpdateStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  onUpdateStatus: (student: Student, newStatus: Student['status'], reason: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ChangeStatusFormValues>({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: { studentId: "", reason: "" },
  });

  const handleSubmit = (values: ChangeStatusFormValues) => {
    const student = students.find(s => s.studentId === values.studentId);
    if (student) {
        setIsSubmitting(true);
        onUpdateStatus(student, values.newStatus, values.reason);
        setIsSubmitting(false);
        onOpenChange(false);
        form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Student Status</DialogTitle>
          <DialogDescription>
            Select a student and update their status. This action will be logged.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
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
                            ? students.find(s => s.studentId === field.value)?.firstName + ' ' + students.find(s => s.studentId === field.value)?.lastName
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
                            {students.map((student) => (
                                <CommandItem
                                value={`${student.firstName} ${student.lastName} ${student.studentId}`}
                                key={student.studentId}
                                onSelect={() => form.setValue("studentId", student.studentId)}
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
             <FormField control={form.control} name="newStatus" render={({ field }) => (
                <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a new status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Graduated">Graduated</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Change</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Transferred to another school" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Confirm & Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}



type SortableKey = 'studentName' | 'changeDate' | 'newStatus';

interface StatusHistoryListProps {
  history?: StudentStatusHistory[];
  students: Student[];
  onUpdateStatus: (student: Student, newStatus: Student['status'], reason: string) => void;
  canChangeStatus: boolean;
}

export function StatusHistoryList({ history = [], students, onUpdateStatus, canChangeStatus }: StatusHistoryListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const filteredHistory = React.useMemo(() => {
    if (!searchQuery) {
      return history;
    }
    return history.filter(item =>
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [history, searchQuery]);
  
  const sortedHistory = React.useMemo(() => {
    let sortableItems = [...filteredHistory];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredHistory, sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                  <CardTitle>Student Status Change History</CardTitle>
                  <CardDescription>
                      A log of all student status updates.
                  </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                 <Input
                      placeholder="Search by name or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                  />
                  {canChangeStatus && (
                    <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Change Status
                    </Button>
                  )}
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                   <Button variant="ghost" onClick={() => requestSort('studentName')}>
                      Student
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('changeDate')}>
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.map((item) => (
                <TableRow key={item.historyId}>
                  <TableCell className="font-medium">{item.studentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.previousStatus}</Badge>
                      <span>→</span>
                      <Badge variant={item.newStatus === 'Active' ? 'default' : 'destructive'}>{item.newStatus}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>{item.changedBy?.displayName || item.changedBy?.email || 'System'}</TableCell>
                  <TableCell>{format(new Date(item.changeDate), "PPp")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ChangeStatusDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        students={students}
        onUpdateStatus={onUpdateStatus}
      />
    </>
  );
}

    