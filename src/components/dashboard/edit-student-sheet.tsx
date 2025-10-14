

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import * as React from "react";
import { PlusCircle, Trash2, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import type { Student, AddressData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ImageCropDialog } from "./image-crop-dialog";
import 'react-image-crop/dist/ReactCrop.css'

const formSchema = z.object({
  familyId: z.string().optional(),
  studentEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  khmerFirstName: z.string().optional(),
  khmerLastName: z.string().optional(),
  sex: z.enum(["Male", "Female", "Other"]).optional(),
  dateOfBirth: z.date().optional(),
  placeOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  nationalId: z.string().optional(),
  previousSchool: z.string().optional(),
  address: z.object({
    district: z.string().optional(),
    commune: z.string().optional(),
    village: z.string().optional(),
    street: z.string().optional(),
    house: z.string().optional(),
  }).optional(),
  guardians: z.array(z.object({
    relation: z.string().min(1, "Relation is required"),
    name: z.string().min(1, "Name is required"),
    occupation: z.string().optional(),
    workplace: z.string().optional(),
    mobiles: z.array(z.string()).min(1, "At least one mobile number is required"),
    email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
    avatarUrl: z.string().optional(),
  })).optional(),
  mediaConsent: z.string({ required_error: "Media consent is required." }).transform(val => val === 'true'),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  avatarUrl: z.string().optional(),
  pickupPerson: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().optional(),
  }).optional(),
});

type EditStudentFormValues = z.output<typeof formSchema>;

interface EditStudentSheetProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (studentId: string, updatedData: Partial<Student>) => void;
  onUpdateStudentStatus: (student: Student, newStatus: Student['status'], reason: string) => void;
  addressData: AddressData | null;
}

export function EditStudentSheet({ student, open, onOpenChange, onSave, onUpdateStudentStatus, addressData }: EditStudentSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoToCrop, setPhotoToCrop] = React.useState<string | null>(null);
  const [cropTarget, setCropTarget] = React.useState<string | null>(null);

  const form = useForm<EditStudentFormValues>({
    resolver: zodResolver(formSchema),
  });
  
  React.useEffect(() => {
    if (student && open) {
      const safeAddress = {
        district: student.address?.district || "Siem Reap",
        commune: student.address?.commune || "",
        village: student.address?.village || "",
        street: student.address?.street || "",
        house: student.address?.house || "",
      };

      form.reset({
        ...student,
        familyId: student.familyId || "",
        studentEmail: student.studentEmail || "",
        middleName: student.middleName || "",
        khmerFirstName: student.khmerFirstName || "",
        khmerLastName: student.khmerLastName || "",
        placeOfBirth: student.placeOfBirth || "",
        nationality: student.nationality || "",
        nationalId: student.nationalId || "",
        previousSchool: student.previousSchool || "",
        address: safeAddress,
        emergencyContact: {
          name: student.emergencyContact?.name || "",
          phone: student.emergencyContact?.phone || "",
        },
        avatarUrl: student.avatarUrl || "",
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
        guardians: student.guardians?.map(g => ({ ...g, mobiles: g.mobiles || [""], email: g.email || "", avatarUrl: g.avatarUrl || "" })) || [{ relation: "", name: "", occupation: "", workplace: "", mobiles: [""], email: "", avatarUrl: "" }],
        pickupPerson: student.pickupPerson || { name: "", relation: "", phone: "", avatarUrl: "" },
        mediaConsent: String(student.mediaConsent) as any,
      });
    }
  }, [student, form, open]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "guardians",
  });

  const watchedCommune = form.watch("address.commune");
  
  const villages = React.useMemo(() => {
    if (!addressData) return [];
    const commune = addressData.communes.find(c => c.name === watchedCommune);
    return commune ? commune.villages : [];
  }, [watchedCommune, addressData]);
  
  const studentAvatarUrl = form.watch("avatarUrl");
  const guardianAvatars = form.watch("guardians");
  const pickupPersonAvatarUrl = form.watch("pickupPerson.avatarUrl");

  const handleAvatarClick = (target: string) => {
    setCropTarget(target);
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
    if (cropTarget) {
      form.setValue(cropTarget as any, croppedDataUri);
    }
    setPhotoToCrop(null);
    setCropTarget(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  async function onSubmit(values: EditStudentFormValues) {
    if (!student) return;

    setIsSubmitting(true);
    onSave(student.studentId, values);
    setIsSubmitting(false);
    onOpenChange(false);
  }

  if (!student) return null;

  return (
    <>
      <ImageCropDialog 
        imageSrc={photoToCrop}
        onCropComplete={handlePhotoCropped}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPhotoToCrop(null);
            setCropTarget(null);
          }
        }}
      />
       <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-4xl w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Edit Student Profile</SheetTitle>
            <SheetDescription>
              Update the details for {student.firstName} {student.lastName}. Click save when you're done.
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
                           <FormField control={form.control} name="familyId" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Family ID</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormDescription>
                                Link this student with siblings using a shared Family ID.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )} />
                           <FormField control={form.control} name="studentEmail" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Student Login Email</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="firstName" render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name (English)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="middleName" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Middle Name (English)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="lastName" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name (English)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="khmerFirstName" render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name (Khmer)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="khmerLastName" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name (Khmer)</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="sex" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Sex</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                      <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Date of Birth</FormLabel>
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
                                      captionLayout="dropdown-buttons"
                                      fromYear={1990}
                                      toYear={new Date().getFullYear()}
                                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")} 
                                      initialFocus />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="placeOfBirth" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Place of Birth</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="nationality" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nationality</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="nationalId" render={({ field }) => (
                              <FormItem>
                                <FormLabel>National ID</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="previousSchool" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Previous School</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                              )} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="address.commune" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Commune / Sangkat</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); form.setValue('address.village', ''); }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a commune" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {addressData?.communes.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="address.village" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Village</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCommune}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a village" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {villages.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="address.street" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street No.</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="address.house" render={({ field }) => (
                              <FormItem>
                                <FormLabel>House No.</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader><CardTitle>Guardian Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-muted/50">
                               <div className="flex items-start gap-4">
                                <div
                                    className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors flex-shrink-0"
                                    onClick={() => handleAvatarClick(`guardians.${index}.avatarUrl`)}
                                    data-ai-hint="person portrait"
                                >
                                    {guardianAvatars?.[index]?.avatarUrl ? (
                                        <img src={guardianAvatars[index].avatarUrl} alt="Guardian" className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <div className="text-center text-muted-foreground p-1">
                                        <UserIcon className="mx-auto h-6 w-6" />
                                        <p className="text-xs mt-1">Upload</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <FormField control={form.control} name={`guardians.${index}.relation`} render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Relation</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name={`guardians.${index}.name`} render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                               </div>

                              <FormField control={form.control} name={`guardians.${index}.occupation`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Occupation</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`guardians.${index}.workplace`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Workplace</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name={`guardians.${index}.mobiles.0`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mobile Phone</FormLabel>
                                  <FormControl><Input type="tel" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                               <FormField control={form.control} name={`guardians.${index}.email`} render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Guardian Login Email</FormLabel>
                                  <FormControl><Input type="email" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button type="button" variant="outline" size="sm" onClick={() => append({ relation: '', name: '', occupation: '', workplace: '', mobiles: [''], email: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Guardian
                          </Button>
                        </CardContent>
                      </Card>
                      
                       <Card>
                        <CardHeader><CardTitle>Student Pickup Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                        <div className="flex items-start gap-6">
                            <div
                            className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors flex-shrink-0"
                            onClick={() => handleAvatarClick('pickupPerson.avatarUrl')}
                            data-ai-hint="person portrait"
                            >
                            {pickupPersonAvatarUrl ? (
                                <img src={pickupPersonAvatarUrl} alt="Pickup Person" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <div className="text-center text-muted-foreground p-1">
                                <UserIcon className="mx-auto h-8 w-8" />
                                <p className="text-xs mt-1">Upload Photo</p>
                                </div>
                            )}
                            </div>
                            <div className="flex-1 space-y-4">
                            <FormField control={form.control} name="pickupPerson.name" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="pickupPerson.relation" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Relation to Student</FormLabel>
                                <FormControl><Input placeholder="e.g., Aunt" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="pickupPerson.phone" render={({ field }) => (
                                <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl><Input type="tel" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            </div>
                        </div>
                        </CardContent>
                    </Card>

                      <Card>
                        <CardHeader><CardTitle>Other Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          <FormField control={form.control} name="emergencyContact.name" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Name</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="emergencyContact.phone" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Phone</FormLabel>
                              <FormControl><Input type="tel" {...field} /></FormControl>
                            </FormItem>
                          )} />
                           <FormField
                            control={form.control}
                            name="mediaConsent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Media Consent</FormLabel>
                                <Select onValueChange={field.onChange} value={String(field.value)}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select an option" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="true">Yes</SelectItem>
                                    <SelectItem value="false">No</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Can the student be featured in school promotional materials?
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </div>
                     <div className="space-y-8">
                        <Card>
                            <CardHeader>
                            <CardTitle>Student Photo</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-center items-center">
                            <div
                                className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                onClick={() => handleAvatarClick('avatarUrl')}
                                data-ai-hint="student portrait"
                            >
                                {studentAvatarUrl ? (
                                <img src={studentAvatarUrl} alt="Student" className="w-full h-full object-cover rounded-lg" />
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

    

    