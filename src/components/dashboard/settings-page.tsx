

"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Subject, AssessmentCategory, UserRole, Permissions } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { getRoles, saveRoles, getPermissions, savePermissions } from "@/lib/firebase/firestore";

// --- PERMISSIONS MOCK DATA AND TYPES ---
const modules = ['Students', 'Users', 'Assessments', 'Fees', 'Invoicing', 'Inventory', 'Admissions', 'Settings'] as const;
const actions = ['Create', 'Read', 'Update', 'Delete'] as const;

type Module = typeof modules[number];
type Action = typeof actions[number];


// Mock data for initial permissions structure
const initialPermissions: Permissions = {
  Students: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: true, Update: false, Delete: false },
  },
  Users: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: false, Update: false, Delete: false },
    'Head of Department': { Create: false, Read: false, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
  },
  Assessments: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: true, Update: false, Delete: false },
    'Head of Department': { Create: true, Read: true, Update: true, Delete: true },
    Teacher: { Create: true, Read: true, Update: true, Delete: false },
  },
  Fees: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: true },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
  },
  Invoicing: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: true },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
  },
  Inventory: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
  },
  Admissions: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: true, Read: true, Update: true, Delete: false },
    'Head of Department': { Create: false, Read: true, Update: false, Delete: false },
    Teacher: { Create: false, Read: true, Update: false, Delete: false },
  },
  Settings: {
    Admin: { Create: true, Read: true, Update: true, Delete: true },
    Receptionist: { Create: false, Read: false, Update: false, Delete: false },
    'Head of Department': { Create: false, Read: false, Update: false, Delete: false },
    Teacher: { Create: false, Read: false, Update: false, Delete: false },
  },
};


// --- ROLE MANAGEMENT ---
const roleSchema = z.object({
  newRole: z.string().min(3, "Role name must be at least 3 characters."),
});
type RoleFormValues = z.infer<typeof roleSchema>;


function RoleSettings({ roles, onSaveRoles }: { roles: UserRole[]; onSaveRoles: (roles: UserRole[]) => Promise<void> }) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { newRole: "" },
  });

  const handleAddRole = async (values: RoleFormValues) => {
    if (roles.includes(values.newRole)) {
      form.setError("newRole", { message: "This role already exists." });
      return;
    }
    const newRoles = [...roles, values.newRole];
    await onSaveRoles(newRoles);
    form.reset();
  };

  const handleDeleteRole = async (roleToDelete: UserRole) => {
    const newRoles = roles.filter(role => role !== roleToDelete);
    await onSaveRoles(newRoles);
  };
  
  const protectedRoles = ['Admin', 'Receptionist', 'Head of Department', 'Teacher'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Roles</CardTitle>
        <CardDescription>Add or remove user roles. Default roles cannot be deleted.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <div key={role} className="flex items-center gap-2 bg-muted rounded-md pl-3 pr-1 py-1">
                 <span className="text-sm font-medium">{role}</span>
                 {!protectedRoles.includes(role) && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteRole(role)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
              </div>
            ))}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddRole)} className="flex items-start gap-4 pt-4">
              <FormField
                control={form.control}
                name="newRole"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="e.g., Librarian" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Role</Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}


// --- PERMISSIONS FORM ---

const permissionSchema = z.object({
  permissions: z.any(),
});
type PermissionsFormValues = z.infer<typeof permissionSchema>;


function PermissionSettings({ roles }: { roles: UserRole[] }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = React.useState(true);
  const { toast } = useToast();

  const form = useForm<PermissionsFormValues>({
    defaultValues: { permissions: {} },
  });

  React.useEffect(() => {
    async function loadPermissions() {
      setIsLoadingPermissions(true);
      const savedPermissions = await getPermissions();
      
      const completePermissions = { ...initialPermissions };

      // Ensure all modules, roles, and actions have a defined boolean value.
      modules.forEach(module => {
        if (!completePermissions[module]) {
          completePermissions[module] = {};
        }
        roles.forEach(role => {
          if (!completePermissions[module][role]) {
            completePermissions[module][role] = { Create: false, Read: false, Update: false, Delete: false };
          }
          actions.forEach(action => {
            const savedValue = savedPermissions[module]?.[role]?.[action];
            // If there's a saved value, use it. Otherwise, use the initial/default, or false if none exists.
            completePermissions[module][role][action] = typeof savedValue === 'boolean' 
              ? savedValue 
              : (completePermissions[module][role][action] || false);
          });
        });
      });

      form.reset({ permissions: completePermissions });
      setIsLoadingPermissions(false);
    }
    if (roles.length > 0) {
      loadPermissions();
    }
  }, [form, roles]);


  const onSubmit = async (data: PermissionsFormValues) => {
    setIsSaving(true);
    await savePermissions(data.permissions);
    toast({
      title: "Permissions Saved",
      description: "Role permissions have been updated.",
    });
    setIsSaving(false);
  };
  
  if (isLoadingPermissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Configure module access for each user role. Changes will be applied upon next login.</CardDescription>
        </CardHeader>
        <CardContent>
          Loading permissions...
        </CardContent>
      </Card>
    )
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
        <CardDescription>Configure module access for each user role. Changes will be applied upon next login.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold border-r">Module</TableHead>
                    {roles.map(role => (
                      <TableHead key={role} className="text-center font-bold border-r last:border-r-0">{role}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map(module => (
                    <TableRow key={module}>
                      <TableCell className="font-semibold border-r">{module}</TableCell>
                      {roles.map(role => (
                        <TableCell key={role} className="border-r last:border-r-0">
                          <div className="flex justify-around items-center gap-2">
                            {actions.map(action => (
                              <FormField
                                key={action}
                                control={form.control}
                                name={`permissions.${module}.${role}.${action}`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-col items-center space-y-1">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={role === 'Admin'}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-xs text-muted-foreground">{action}</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
             <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// Subjects Schema and Form
const subjectSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string().min(1, "Subject name is required."),
});

const subjectsFormSchema = z.object({
  subjects: z.array(subjectSchema),
});

type SubjectsFormValues = z.infer<typeof subjectsFormSchema>;

function SubjectSettings({ initialSubjects, onSave }: { initialSubjects: Subject[]; onSave: (subjects: Subject[]) => void }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<SubjectsFormValues>({
    resolver: zodResolver(subjectsFormSchema),
    defaultValues: { subjects: initialSubjects },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subjects",
    keyName: "keyId", // To avoid conflict with subjectId
  });

  React.useEffect(() => {
    form.reset({ subjects: initialSubjects });
  }, [initialSubjects, form]);

  const handleAddNew = () => {
    const newId = `SUB${Date.now()}`;
    append({ subjectId: newId, subjectName: "" });
  };
  
  const onSubmit = async (data: SubjectsFormValues) => {
    setIsSaving(true);
    await onSave(data.subjects);
    setIsSaving(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subjects</CardTitle>
        <CardDescription>Add, edit, or remove subjects offered at the school.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.keyId} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`subjects.${index}.subjectName`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="e.g., Mathematics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4">
              <Button type="button" variant="outline" size="sm" onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Subjects"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Assessment Categories Schema and Form
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required."),
  weight: z.coerce.number().min(0, "Weight must be positive.").max(100, "Weight cannot exceed 100."),
});

const categoriesFormSchema = z.object({
  categories: z.array(categorySchema),
}).refine(data => {
    const totalWeight = data.categories.reduce((acc, cat) => acc + (cat.weight || 0), 0);
    return totalWeight === 100;
}, {
    message: "Total weight of all categories must be exactly 100%.",
    path: ["categories"], // Shows error at the form level
});

type CategoriesFormValues = z.infer<typeof categoriesFormSchema>;

function CategorySettings({ initialCategories, onSave }: { initialCategories: AssessmentCategory[]; onSave: (categories: AssessmentCategory[]) => void }) {
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<CategoriesFormValues>({
    resolver: zodResolver(categoriesFormSchema),
    defaultValues: { categories: initialCategories },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  const totalWeight = form.watch('categories').reduce((acc, cat) => acc + (cat.weight || 0), 0);

  React.useEffect(() => {
    form.reset({ categories: initialCategories });
  }, [initialCategories, form]);
  
  const onSubmit = async (data: CategoriesFormValues) => {
    setIsSaving(true);
    await onSave(data.categories);
    setIsSaving(false);
  };
  
  const handleFormError = () => {
      const formErrors = form.formState.errors;
      if (formErrors.categories && formErrors.categories.message) {
        toast({
            title: "Validation Error",
            description: formErrors.categories.message,
            variant: "destructive"
        });
      }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Categories & Weights</CardTitle>
        <CardDescription>Define the categories for assessments and their contribution to the final grade. The total weight must sum to 100%.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-6">
             <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4">
                  <FormField
                    control={form.control}
                    name={`categories.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="e.g., Classwork" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`categories.${index}.weight`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormControl>
                           <div className="relative">
                            <Input type="number" placeholder="e.g., 25" {...field} className="pr-8" />
                            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
                           </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', weight: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                </Button>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">Total Weight: <span className={totalWeight !== 100 ? 'text-destructive' : ''}>{totalWeight}%</span></div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Categories"}
                    </Button>
                </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Main Page Component
interface SettingsPageProps {
  subjects: Subject[];
  assessmentCategories: AssessmentCategory[];
  onSaveSubjects: (subjects: Subject[]) => void;
  onSaveCategories: (categories: AssessmentCategory[]) => void;
}

export function SettingsPage({ subjects, assessmentCategories, onSaveSubjects, onSaveCategories }: SettingsPageProps) {
  const [roles, setRoles] = React.useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadRoles() {
      setIsLoading(true);
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
      setIsLoading(false);
    }
    loadRoles();
  }, []);

  const handleSaveRoles = async (newRoles: UserRole[]) => {
    await saveRoles(newRoles);
    const fetchedRoles = await getRoles(); // Re-fetch to ensure consistency
    setRoles(fetchedRoles);
  };
  
  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      <RoleSettings roles={roles} onSaveRoles={handleSaveRoles} />
      <PermissionSettings roles={roles} />
      <SubjectSettings initialSubjects={subjects} onSave={onSaveSubjects} />
      <CategorySettings initialCategories={assessmentCategories} onSave={onSaveCategories} />
    </div>
  );
}
