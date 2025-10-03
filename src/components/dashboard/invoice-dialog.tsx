
"use client";

import * as React from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMonths } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import type { Invoice, Student, Fee, InvoiceLineItem, AppliedDiscount, PaymentPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

const paymentPlans: PaymentPlan[] = ['Monthly', 'Termly', 'Semesterly', 'Yearly'];
const invoiceStatuses: Invoice['status'][] = ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue'];

const appliedDiscountSchema = z.object({
  discountId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  discountedAmount: z.coerce.number().min(0, "Amount must be positive"),
});

const lineItemSchema = z.object({
  feeId: z.string().min(1),
  description: z.string().min(1),
  amount: z.coerce.number().min(0),
});

const invoiceFormSchema = z.object({
  studentId: z.string().min(1, "A student must be selected"),
  schoolYear: z.string().min(1, "School year is required"),
  issueDate: z.date(),
  dueDate: z.date(),
  paymentPlan: z.enum(paymentPlans),
  lineItems: z.array(lineItemSchema).min(1, "An invoice must have at least one line item."),
  discounts: z.array(appliedDiscountSchema).optional(),
  status: z.enum(invoiceStatuses),
  amountPaid: z.coerce.number().min(0).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

function TotalsSection({ control }: { control: any }) {
  const lineItems = useWatch({ control, name: "lineItems" });
  const discounts = useWatch({ control, name: "discounts" });

  const subtotal = React.useMemo(() => {
    return (lineItems || []).reduce((acc: number, item: any) => acc + (item.amount || 0), 0);
  }, [lineItems]);

  const totalDiscount = React.useMemo(() => {
    return (discounts || []).reduce((acc: number, d: any) => acc + (d.discountedAmount || 0), 0);
  }, [discounts]);
  
  const totalAmount = subtotal - totalDiscount;
  
  return (
     <div className="space-y-4">
        <Separator />
        <div className="flex justify-end gap-4 font-medium">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-end gap-4 font-medium text-destructive">
          <span>Discount</span>
          <span>
            ${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-end gap-4 text-lg font-bold">
            <span>Total</span>
            <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <Separator />
      </div>
  );
}


interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  fees: Fee[];
  onSave: (invoice: Omit<Invoice, 'invoiceId'> | Invoice) => Promise<boolean>;
  existingInvoice?: Invoice | null;
}

export function InvoiceDialog({ open, onOpenChange, students, fees, onSave, existingInvoice }: InvoiceDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const isEditing = !!existingInvoice;
  const currentSchoolYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      studentId: "",
      schoolYear: currentSchoolYear,
      issueDate: new Date(),
      dueDate: addMonths(new Date(), 1),
      paymentPlan: "Monthly",
      lineItems: [],
      discounts: [],
      status: "Draft",
      amountPaid: 0,
    }
  });

  const { fields: lineItemFields, append: appendLineItem, remove: removeLineItem } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });
  
  const { fields: discountFields, append: appendDiscount, remove: removeDiscount } = useFieldArray({
    control: form.control,
    name: "discounts",
  });

  React.useEffect(() => {
    if (open) {
      form.reset(existingInvoice ? {
        ...existingInvoice,
        issueDate: new Date(existingInvoice.issueDate),
        dueDate: new Date(existingInvoice.dueDate),
        discounts: existingInvoice.discounts || [],
        amountPaid: existingInvoice.amountPaid || 0,
      } : {
        studentId: "",
        schoolYear: currentSchoolYear,
        issueDate: new Date(),
        dueDate: addMonths(new Date(), 1),
        paymentPlan: "Monthly",
        lineItems: [],
        discounts: [],
        status: "Draft",
        amountPaid: 0,
      });
    }
  }, [open, existingInvoice, form, currentSchoolYear]);

  const handleFeeSelection = (feeId: string) => {
    const fee = fees.find(f => f.feeId === feeId);
    if (fee) {
      appendLineItem({
        feeId: fee.feeId,
        description: fee.name,
        amount: fee.amount,
      });
    }
  };

  const handleSave = async (values: InvoiceFormValues) => {
    setIsSaving(true);
    
    const calculatedSubtotal = (values.lineItems || []).reduce((acc, item) => acc + (item.amount || 0), 0);
    const calculatedTotalDiscount = (values.discounts || []).reduce((acc, d) => acc + (d.discountedAmount || 0), 0);
    const calculatedTotalAmount = calculatedSubtotal - calculatedTotalDiscount;

    const invoiceData = {
      ...values,
      subtotal: calculatedSubtotal,
      totalDiscount: calculatedTotalDiscount,
      totalAmount: calculatedTotalAmount,
      amountPaid: values.amountPaid || 0,
    };
    
    const dataToSave = isEditing && existingInvoice ? { ...invoiceData, invoiceId: existingInvoice.invoiceId } : invoiceData;
    const success = await onSave(dataToSave);
    if (success) {
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{isEditing ? `Edit Invoice ${existingInvoice?.invoiceId.substring(0,7)}` : "Create New Invoice"}</DialogTitle>
              <DialogDescription>Fill in the details for the invoice. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-6 py-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="studentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {students.map(s => <SelectItem key={s.studentId} value={s.studentId}>{s.firstName} {s.lastName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="schoolYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Year</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="issueDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="paymentPlan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Plan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{paymentPlans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>{invoiceStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-2">
                  <FormLabel>Line Items</FormLabel>
                  <div className="p-4 border rounded-md space-y-4">
                    {lineItemFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`lineItems.${index}.amount`} render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="button" variant="outline" size="icon" onClick={() => removeLineItem(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <FormField
                      control={form.control}
                      name="lineItems"
                      render={() => (<FormMessage />)}
                    />
                    <Select onValueChange={handleFeeSelection}>
                      <SelectTrigger><SelectValue placeholder="Add a fee..." /></SelectTrigger>
                      <SelectContent>
                        {fees.map(fee => <SelectItem key={fee.feeId} value={fee.feeId}>{fee.name} - ${fee.amount}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <FormLabel>Discounts</FormLabel>
                  <div className="p-4 border rounded-md space-y-4">
                    {discountFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-2">
                        <FormField control={form.control} name={`discounts.${index}.description`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input placeholder="e.g., Scholarship" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`discounts.${index}.discountedAmount`} render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="button" variant="outline" size="icon" onClick={() => removeDiscount(index)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => appendDiscount({ description: "", discountedAmount: 0 })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Manual Discount
                    </Button>
                  </div>
                </div>

                <TotalsSection control={form.control} />

                <FormField control={form.control} name="amountPaid" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Paid</FormLabel>
                      <FormControl><Input type="number" {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
              </div>
            </ScrollArea>
            <DialogFooter className="mt-auto border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Invoice"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

