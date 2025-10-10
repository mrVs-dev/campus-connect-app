
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, ArrowUpDown } from "lucide-react";
import type { Fee, FeeType, FeeFrequency } from "@/lib/types";
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
import type { AppModule } from "@/lib/modules";

const feeTypes: FeeType[] = ['Tuition', 'Registration', 'Material', 'Admin', 'Exams', 'Other'];
const feeFrequencies: FeeFrequency[] = ['One-Time', 'Monthly', 'Termly', 'Semesterly', 'Yearly'];

const feeFormSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  type: z.enum(feeTypes),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  frequency: z.enum(feeFrequencies),
});

type FeeFormValues = z.infer<typeof feeFormSchema>;

function FeeDialog({ open, onOpenChange, onSave, existingFee }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (data: FeeFormValues | (FeeFormValues & { feeId: string })) => Promise<boolean>; existingFee?: Fee | null; }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const isEditing = !!existingFee;

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(existingFee ? {
        name: existingFee.name,
        type: existingFee.type,
        amount: existingFee.amount,
        frequency: existingFee.frequency,
      } : {
        name: "",
        type: "Tuition",
        amount: 0,
        frequency: "Monthly",
      });
    }
  }, [open, existingFee, form]);

  const handleSave = async (values: FeeFormValues) => {
    setIsSaving(true);
    const dataToSave = existingFee ? { ...values, feeId: existingFee.feeId } : values;
    const success = await onSave(dataToSave);
    if (success) {
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Fee" : "Create New Fee"}</DialogTitle>
              <DialogDescription>{isEditing ? "Update the details for this fee." : "Fill in the details for the new fee."}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Grade 1 Tuition" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {feeTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="frequency" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {feeFrequencies.map(freq => <SelectItem key={freq} value={freq}>{freq}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Fee"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface FeesListProps {
  fees: Fee[];
  onSaveFee: (fee: Omit<Fee, 'feeId'> | Fee) => Promise<boolean>;
  onDeleteFee: (feeId: string) => void;
  hasPermission: (module: AppModule, action: 'Create' | 'Read' | 'Update' | 'Delete') => boolean;
}

type SortableKey = 'name' | 'type' | 'frequency' | 'amount';

export function FeesList({ fees, onSaveFee, onDeleteFee, hasPermission }: FeesListProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [feeToEdit, setFeeToEdit] = React.useState<Fee | null>(null);
  const [feeToDelete, setFeeToDelete] = React.useState<Fee | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

  const canCreate = hasPermission('Fees', 'Create');
  const canUpdate = hasPermission('Fees', 'Update');
  const canDelete = hasPermission('Fees', 'Delete');

  const handleEdit = (fee: Fee) => {
    setFeeToEdit(fee);
    setIsDialogOpen(true);
  };

  const handleOpenDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setFeeToEdit(null);
    }
    setIsDialogOpen(isOpen);
  };

  const handleDelete = (fee: Fee) => {
    setFeeToDelete(fee);
  };

  const confirmDelete = () => {
    if (feeToDelete) {
      onDeleteFee(feeToDelete.feeId);
      setFeeToDelete(null);
    }
  };
  
  const requestSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedFees = React.useMemo(() => {
    let sortableItems = [...fees];
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
  }, [fees, sortConfig]);


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fees & Charges</CardTitle>
              <CardDescription>Manage all billable items for the school.</CardDescription>
            </div>
            {canCreate && (
              <Button size="sm" className="gap-1" onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                New Fee
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('type')}>
                        Type
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('frequency')}>
                        Frequency
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => requestSort('amount')}>
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFees.map((fee) => (
                <TableRow key={fee.feeId}>
                  <TableCell className="font-medium">{fee.name}</TableCell>
                  <TableCell><Badge variant="outline">{fee.type}</Badge></TableCell>
                  <TableCell>{fee.frequency}</TableCell>
                  <TableCell className="text-right">${fee.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {(canUpdate || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && <DropdownMenuItem onSelect={() => handleEdit(fee)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>}
                          {canDelete && <DropdownMenuItem onSelect={() => handleDelete(fee)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {canCreate && (
        <FeeDialog
          open={isDialogOpen}
          onOpenChange={handleOpenDialog}
          onSave={onSaveFee}
          existingFee={feeToEdit}
        />
      )}
      {canDelete && (
        <AlertDialog open={!!feeToDelete} onOpenChange={(isOpen) => !isOpen && setFeeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the fee "{feeToDelete?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
