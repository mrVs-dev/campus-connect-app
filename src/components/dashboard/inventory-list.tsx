
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Package } from "lucide-react";
import { format } from "date-fns";
import type { InventoryItem, InventoryCategory } from "@/lib/types";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropDialog } from "./image-crop-dialog";
import { cn } from "@/lib/utils";

const inventoryCategories: InventoryCategory[] = ['Uniform', 'Book', 'Stationery', 'Other'];

const inventoryItemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.enum(inventoryCategories),
  imageUrl: z.string().optional(),
  cost: z.coerce.number().min(0, "Cost must be a positive number"),
  stockedInDate: z.date({ required_error: "Stocked in date is required" }),
  quantity: z.coerce.number().int().min(0, "Quantity must be a positive integer"),
});

type ItemFormValues = z.infer<typeof inventoryItemFormSchema>;

function ItemDialog({ open, onOpenChange, onSave, existingItem }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (data: Omit<InventoryItem, 'itemId' | 'reorderLevel'> | (Omit<InventoryItem, 'reorderLevel'> & { itemId: string })) => Promise<boolean>; existingItem?: InventoryItem | null; }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const isEditing = !!existingItem;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoToCrop, setPhotoToCrop] = React.useState<string | null>(null);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(inventoryItemFormSchema),
  });

  const cost = form.watch("cost");
  const quantity = form.watch("quantity");
  const totalValue = React.useMemo(() => (cost || 0) * (quantity || 0), [cost, quantity]);
  const avatarUrl = form.watch("imageUrl");

  React.useEffect(() => {
    if (open) {
      form.reset(existingItem ? {
        ...existingItem,
        stockedInDate: new Date(existingItem.stockedInDate),
      } : {
        name: "",
        category: "Other",
        cost: 0,
        quantity: 0,
        stockedInDate: new Date(),
        imageUrl: "",
      });
    }
  }, [open, existingItem, form]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoCropped = (croppedDataUri: string) => {
    form.setValue("imageUrl", croppedDataUri);
    setPhotoToCrop(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSave = async (values: ItemFormValues) => {
    setIsSaving(true);
    const dataToSave = existingItem
      ? { ...values, itemId: existingItem.itemId, reorderLevel: existingItem.reorderLevel }
      : { ...values, reorderLevel: 10 }; // Default reorder level
    
    const success = await onSave(dataToSave as any);
    if (success) {
      onOpenChange(false);
    }
    setIsSaving(false);
  };

  return (
    <>
      <ImageCropDialog
        imageSrc={photoToCrop}
        onCropComplete={handlePhotoCropped}
        onOpenChange={(isOpen) => !isOpen && setPhotoToCrop(null)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Item" : "Create New Item"}</DialogTitle>
                <DialogDescription>{isEditing ? "Update the details for this item." : "Fill in the details for the new inventory item."}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex justify-center items-center">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors" onClick={handleAvatarClick}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Item" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                            <div className="text-center text-muted-foreground p-2">
                                <Package className="mx-auto h-8 w-8" />
                                <p className="text-xs mt-1">Upload Photo</p>
                            </div>
                        )}
                    </div>
                </div>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name/Description</FormLabel>
                    <FormControl><Input placeholder="e.g., Grade 1 Math Book" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {inventoryCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ($)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stockedInDate" render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Stocked in Date</FormLabel>
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
                <div className="flex justify-between items-center pt-2">
                  <FormLabel>Total Value</FormLabel>
                  <span className="font-semibold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Item"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface InventoryListProps {
  inventoryItems: InventoryItem[];
  onSaveItem: (item: Omit<InventoryItem, 'itemId'> | InventoryItem) => Promise<boolean>;
  onDeleteItem: (itemId: string) => void;
}

export function InventoryList({ inventoryItems, onSaveItem, onDeleteItem }: InventoryListProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<InventoryItem | null>(null);


  const handleEdit = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsDialogOpen(true);
  };

  const handleOpenDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setItemToEdit(null);
    }
    setIsDialogOpen(isOpen);
  };
  
  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
  };
  
  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.itemId);
      setItemToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track and manage school supplies like books, uniforms, and stationery.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              New Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell>
                     <Avatar className="h-10 w-10 rounded-md">
                        <AvatarImage src={item.imageUrl} alt={item.name} className="object-cover" />
                        <AvatarFallback className="rounded-md"><Package /></AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${(item.cost * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEdit(item)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleDelete(item)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {inventoryItems.length === 0 && (
             <div className="text-center p-8 text-muted-foreground">
                No inventory items found. Click "New Item" to get started.
             </div>
          )}
        </CardContent>
      </Card>
      <ItemDialog
        open={isDialogOpen}
        onOpenChange={handleOpenDialog}
        onSave={onSaveItem}
        existingItem={itemToEdit}
      />
       <AlertDialog open={!!itemToDelete} onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the item "{itemToDelete?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
