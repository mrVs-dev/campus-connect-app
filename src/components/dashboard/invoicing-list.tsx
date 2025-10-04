
"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal, Edit, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import type { Invoice, Student, Fee } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import { InvoiceDialog } from "./invoice-dialog";

interface InvoicingListProps {
  invoices: Invoice[];
  students: Student[];
  fees: Fee[];
  onSaveInvoice: (invoice: Omit<Invoice, 'invoiceId'> | Invoice) => Promise<boolean>;
  onDeleteInvoice: (invoiceId: string) => void;
  isReadOnly?: boolean;
}

export function InvoicingList({ invoices, students, fees, onSaveInvoice, onDeleteInvoice, isReadOnly = false }: InvoicingListProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = React.useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = React.useState<Invoice | null>(null);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.studentId === studentId);
    return student ? `${student.firstName} ${student.lastName}` : "Unknown Student";
  };
  
  const getStatusVariant = (status: Invoice['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Partially Paid':
        return 'outline';
      case 'Sent':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleOpenDialog = (isOpen: boolean) => {
    if (isReadOnly) return;
    if (!isOpen) {
      setInvoiceToEdit(null);
    }
    setIsDialogOpen(isOpen);
  };

  const handleEdit = (invoice: Invoice) => {
    if (isReadOnly) return;
    setInvoiceToEdit(invoice);
    setIsDialogOpen(true);
  };

  const handleDelete = (invoice: Invoice) => {
     if (isReadOnly) return;
    setInvoiceToDelete(invoice);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      onDeleteInvoice(invoiceToDelete.invoiceId);
      setInvoiceToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoicing</CardTitle>
              <CardDescription>
                {isReadOnly ? "A list of all invoices for the selected student." : "Manage all student invoices."}
              </CardDescription>
            </div>
            {!isReadOnly && (
              <Button size="sm" className="gap-1" onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                New Invoice
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                {!isReadOnly && <TableHead>Student</TableHead>}
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment Plan</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.invoiceId}>
                  <TableCell className="font-mono">{invoice.invoiceId.substring(0, 7)}...</TableCell>
                  {!isReadOnly && <TableCell className="font-medium">{getStudentName(invoice.studentId)}</TableCell>}
                  <TableCell>{format(new Date(invoice.issueDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{invoice.paymentPlan}</TableCell>
                  <TableCell className="text-right">${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell><Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> View/Print</DropdownMenuItem>
                        {!isReadOnly && (
                          <>
                            <DropdownMenuItem onSelect={() => handleEdit(invoice)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDelete(invoice)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {invoices.length === 0 && (
             <div className="text-center p-8 text-muted-foreground">
                No invoices found.
             </div>
          )}
        </CardContent>
      </Card>
      {!isReadOnly && (
        <>
          <InvoiceDialog
            open={isDialogOpen}
            onOpenChange={handleOpenDialog}
            students={students}
            fees={fees}
            onSave={onSaveInvoice}
            existingInvoice={invoiceToEdit}
          />
          <AlertDialog open={!!invoiceToDelete} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete invoice {invoiceToDelete?.invoiceId.substring(0,7)}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
