
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Trash2, Upload } from "lucide-react";
import * as React from "react";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { communes, getVillagesByCommune } from "@/lib/address-data";
import type { Student } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ImageCropDialog } from "./image-crop-dialog";
import { programs, getLevelsForProgram } from "@/lib/program-data";
import 'react-image-crop/dist/ReactCrop.css'


const guardianSchema = z.object({
  relation: z.string().min(1, "Relation is required"),
  name: z.string().min(1, "Name is required"),
  occupation: z.string().min(1, "Occupation is required"),
  workplace: z.string().min(1, "Workplace is required"),
  mobiles: z.array(z.string().min(1, "Mobile number is required")).min(1, "At least one mobile number is required"),
});

const enrollmentSchema = z.object({
  programId: z.string().min(1, "Program is required"),
  level: z.string().min(1, "Level is required"),
});

const formSchema = z.object({
  serialNumber: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  khmerFirstName: z.string().min(1, "Khmer first name is required"),
  khmerLastName: z.string().min(1, "Khmer last name is required"),
  sex: z.enum(["Male", "Female", "Other"]),
  dateOfBirth: z.date({
    required_error: "Date of birth is required.",
  }),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  nationalId: z.string().optional(),
  avatarUrl: z.string().optional(),
  previousSchool: z.string().optional(),
  address: z.object({
    district: z.string().min(1, "District is required"),
    commune: z.string().min(1, "Commune is required"),
    village: z.string().min(1, "Village is required"),
    street: z.string().optional(),
    house: z.string().optional(),
  }),
  guardians: z.array(guardianSchema).min(1, "At least one guardian is required"),
  enrollments: z.array(enrollmentSchema).min(1, "At least one program enrollment is required"),
  mediaConsent: z.boolean().default(false),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: z.string().min(1, "Emergency contact phone is required"),
  }),
  status: z.enum(["Active", "Inactive", "Graduated"]).default("Active"),
});

type EnrollmentFormValues = z.infer<typeof formSchema>;

type EnrollmentFormProps = {
  onEnroll: (student: Omit<Student, 'studentId' | 'enrollmentDate'>) => Promise<boolean>;
};

export function EnrollmentForm({ onEnroll }: EnrollmentFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoToCrop, setPhotoToCrop] = React.useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      khmerFirstName: "",
      khmerLastName: "",
      sex: "Male",
      placeOfBirth: "Siem Reap",
      nationality: "Cambodian",
      nationalId: "",
      avatarUrl: "",
      previousSchool: "",
      address: {
        district: "Krong Siem Reap",
        commune: "",
        village: "",
        street: "",
        house: "",
      },
      guardians: [{ relation: "", name: "", occupation: "", workplace: "", mobiles: [""] }],
      enrollments: [{ programId: "", level: "" }],
      mediaConsent: false,
      emergencyContact: {
        name: "",
        phone: "",
      },
      status: "Active",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "guardians",
  });

  const { fields: enrollmentFields, append: appendEnrollment, remove: removeEnrollment } = useFieldArray({
    control: form.control,
    name: "enrollments",
  });
  
  const selectedCommune = form.watch("address.commune");
  const villages = React.useMemo(() => getVillagesByCommune(selectedCommune), [selectedCommune]);

  React.useEffect(() => {
    form.resetField("address.village", { defaultValue: "" });
  }, [selectedCommune, form]);

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
    setPhotoPreview(croppedDataUri);
    form.setValue("avatarUrl", croppedDataUri);
    setPhotoToCrop(null); // Close the dialog
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
    }
  };

  async function onSubmit(values: EnrollmentFormValues) {
    setIsSubmitting(true);
    const success = await onEnroll(values);
    if (success) {
      form.reset();
      setPhotoPreview(null);
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ImageCropDialog 
            imageSrc={photoToCrop}
            onCropComplete={handlePhotoCropped}
            onOpenChange={(isOpen) => !isOpen && setPhotoToCrop(null)}
        />
        <Card>
          <CardHeader>
            <CardTitle>Enroll New Student</CardTitle>
            <CardDescription>
              Fill out the form below to add a new student to the roster.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-3">
                 <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Photo</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                           <Avatar className="h-24 w-24">
                            <AvatarImage src={photoPreview || undefined} className="object-cover" />
                            <AvatarFallback>
                               <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                                Photo
                               </div>
                            </AvatarFallback>
                           </Avatar>
                           <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4"/>
                              Upload Photo
                           </Button>
                           <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                           />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                 />
              </div>

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional serial number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div></div>
               <div></div>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name (English)</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (English)</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name (English)</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="khmerLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name (Khmer)</FormLabel>
                    <FormControl>
                      <Input placeholder="គោ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="khmerFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name (Khmer)</FormLabel>
                    <FormControl>
                      <Input placeholder="សុខ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
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
                          fromYear={1950}
                          toYear={new Date().getFullYear()}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="placeOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Place of Birth (City)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phnom Penh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input placeholder="Cambodian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID / Passport</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous School</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator className="my-6" />

            {/* Program Enrollment */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Program Enrollment</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => appendEnrollment({ programId: "", level: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Program
                </Button>
              </div>
              <div className="space-y-6">
                {enrollmentFields.map((field, index) => (
                  <EnrollmentCard key={field.id} enrollmentIndex={index} remove={removeEnrollment} />
                ))}
                <FormField
                  control={form.control}
                  name="enrollments"
                  render={() => (
                     <FormMessage />
                  )}
                />
              </div>
            </div>

            <Separator className="my-6" />
            
            {/* Address Information */}
            <h3 className="text-lg font-semibold border-b pb-2">Address</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <FormField
                    control={form.control}
                    name="address.district"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>District / Khan</FormLabel>
                        <FormControl>
                           <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address.commune"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Commune / Sangkat</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a commune" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {communes.map((commune) => (
                              <SelectItem key={commune.id} value={commune.name}>
                                {commune.name}
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
                  name="address.village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedCommune}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a village" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {villages.map((village) => (
                            <SelectItem key={village} value={village}>
                              {village}
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
                    name="address.house"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>House No.</FormLabel>
                        <FormControl>
                        <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Street No.</FormLabel>
                        <FormControl>
                        <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>

            <Separator className="my-6" />

            {/* Guardian Information */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Guardian Information</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ relation: "", name: "", occupation: "", workplace: "", mobiles: [""] })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Guardian
                </Button>
              </div>
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <GuardianCard key={field.id} guardianIndex={index} remove={remove} />
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Emergency & Media */}
            <h3 className="text-lg font-semibold border-b pb-2">Emergency & Media Consent</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact's phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="mediaConsent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Media Consent
                      </FormLabel>
                      <FormDescription>
                        Allow use of student's photo/video in school media.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => {
              form.reset();
              setPhotoPreview(null);
            }} disabled={isSubmitting}>Reset Form</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enrolling..." : "Enroll Student"}</Button>
        </div>
      </form>
    </Form>
  );
}


// Helper component for Guardian card to manage its own field array for mobiles
function GuardianCard({ guardianIndex, remove }: { guardianIndex: number, remove: (index: number) => void }) {
  const { control } = useFormContext<EnrollmentFormValues>();
  const { fields, append, remove: removeMobile } = useFieldArray({
    control,
    name: `guardians.${guardianIndex}.mobiles`,
  });
  
  const guardians = useFieldArray({
    control,
    name: "guardians",
  });
  
  return (
    <div className="p-4 border rounded-md relative space-y-4">
      {guardians.fields.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => remove(guardianIndex)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name={`guardians.${guardianIndex}.relation`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relation</FormLabel>
              <FormControl><Input placeholder="e.g., Father" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`guardians.${guardianIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="Guardian's full name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`guardians.${guardianIndex}.occupation`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Occupation</FormLabel>
              <FormControl><Input placeholder="e.g., Teacher" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`guardians.${guardianIndex}.workplace`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workplace</FormLabel>
              <FormControl><Input placeholder="e.g., Local School" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div>
        <FormLabel>Mobile Number(s)</FormLabel>
        <div className="space-y-2 mt-2">
            {fields.map((field, mobileIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                <FormField
                    control={control}
                    name={`guardians.${guardianIndex}.mobiles.${mobileIndex}`}
                    render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormControl>
                        <Input placeholder="012 345 678" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeMobile(mobileIndex)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 )}
                </div>
            ))}
        </div>
        <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append("")}
        >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Mobile
        </Button>
      </div>

    </div>
  );
}

function EnrollmentCard({ enrollmentIndex, remove }: { enrollmentIndex: number, remove: (index: number) => void }) {
  const { control, watch, setValue } = useFormContext<EnrollmentFormValues>();
  
  const enrollments = useFieldArray({
    control,
    name: "enrollments",
  });

  const programId = watch(`enrollments.${enrollmentIndex}.programId`);
  const levels = React.useMemo(() => getLevelsForProgram(programId), [programId]);

  React.useEffect(() => {
    setValue(`enrollments.${enrollmentIndex}.level`, '');
  }, [programId, enrollmentIndex, setValue]);

  return (
    <div className="p-4 border rounded-md relative space-y-4">
      {enrollments.fields.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => remove(enrollmentIndex)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name={`enrollments.${enrollmentIndex}.programId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`enrollments.${enrollmentIndex}.level`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Level / Grade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={!programId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a level or grade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

    