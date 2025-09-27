
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import type { Teacher } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageCropDialog } from "./image-crop-dialog";
import 'react-image-crop/dist/ReactCrop.css'

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
  joinedDate: z.date().optional(),
  avatarUrl: z.string().optional(),
});

type EditTeacherFormValues = z.infer<typeof formSchema>;

interface EditTeacherSheetProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (teacherId: string, updatedData: Partial<Teacher>) => void;
}

export function EditTeacherSheet({ teacher, open, onOpenChange, onSave }: EditTeacherSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoToCrop, setPhotoToCrop] = React.useState<string | null>(null);

  const form = useForm<EditTeacherFormValues>({
    resolver: zodResolver(formSchema),
  });
  
  React.useEffect(() => {
    if (teacher) {
      form.reset({
        ...teacher,
        joinedDate: teacher.joinedDate ? teacher.joinedDate : undefined,
      });
    }
  }, [teacher, form]);

  const avatarUrl = form.watch("avatarUrl");

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
    form.setValue("avatarUrl", croppedDataUri);
    setPhotoToCrop(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  async function onSubmit(values: EditTeacherFormValues) {
    if (!teacher) return;
    
    setIsSubmitting(true);
    await onSave(teacher.teacherId, values);
    setIsSubmitting(false);
    onOpenChange(false);
  }

  if (!teacher) return null;

  return (
    <>
      <ImageCropDialog 
        imageSrc={photoToCrop}
        onCropComplete={handlePhotoCropped}
        onOpenChange={(isOpen) => !isOpen && setPhotoToCrop(null)}
      />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Teacher Profile</SheetTitle>
            <SheetDescription>
              Update the details for {teacher.firstName} {teacher.lastName}.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="firstName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                        <FormField control={form.control} name="lastName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl><Input type="email" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone</FormLabel>
                                            <FormControl><Input type="tel" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="joinedDate" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Joined Date</FormLabel>
                                            <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar 
                                                  mode="single" 
                                                  selected={field.value}
                                                  onSelect={field.onChange}
                                                  defaultMonth={field.value || new Date()}
                                                  captionLayout="dropdown-buttons"
                                                  fromYear={1990}
                                                  toYear={new Date().getFullYear()}
                                                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")} 
                                                  initialFocus 
                                                />
                                            </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                        )} />
                                        <FormField control={form.control} name="status" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                    <SelectItem value="Active">Active</SelectItem>
                                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                <CardTitle>Profile Photo</CardTitle>
                                </CardHeader>
                                <CardContent className="flex justify-center items-center">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div
                                    className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                    onClick={handleAvatarClick}
                                >
                                    {avatarUrl ? (
                                    <img src={avatarUrl} alt="Teacher" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                    <div className="text-center text-muted-foreground">
                                        <UserIcon className="mx-auto h-12 w-12" />
                                        <p className="text-sm mt-2">Click to upload photo</p>
                                    </div>
                                    )}
                                </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                  <SheetFooter className="mt-auto pt-4 sticky bottom-0 bg-background">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                  </SheetFooter>
                </form>
              </Form>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
