
"use client";

import * as React from "react";
import type { Student, Guardian, Enrollment } from "@/lib/types";
import { assessments, subjects } from "@/lib/mock-data";
import { assessmentCategoryWeights } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AiSummary } from "./ai-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { ImageCropDialog } from "./image-crop-dialog";
import { programs } from "@/lib/program-data";
import 'react-image-crop/dist/ReactCrop.css'

interface StudentPerformanceSheetProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStudent: (studentId: string, updatedData: Partial<Student>) => void;
}

function StudentDetail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <p className="font-medium text-muted-foreground">{label}</p>
      <p>{value || 'N/A'}</p>
    </div>
  );
}

function GuardianDetails({ guardian }: { guardian: Guardian }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h4 className="font-semibold">{guardian.relation} - {guardian.name}</h4>
      <p className="text-sm text-muted-foreground">{guardian.occupation} at {guardian.workplace}</p>
      <p className="text-sm">Mobiles: {guardian.mobiles.join(', ')}</p>
    </div>
  );
}

function EnrollmentDetails({ enrollment }: { enrollment: Enrollment }) {
  const program = programs.find(p => p.id === enrollment.programId);
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h4 className="font-semibold">{program?.name || 'Unknown Program'}</h4>
      <p className="text-sm text-muted-foreground">Level/Grade: {enrollment.level}</p>
    </div>
  )
}


export function StudentPerformanceSheet({
  student,
  open,
  onOpenChange,
  onUpdateStudent,
}: StudentPerformanceSheetProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoToCrop, setPhotoToCrop] = React.useState<string | null>(null);
  const { toast } = useToast();

  if (!student) return null;

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
    if (student) {
        onUpdateStudent(student.studentId, { avatarUrl: croppedDataUri });
        toast({
            title: "Photo Updated",
            description: `${student.firstName}'s profile photo has been changed.`,
        });
    }
    setPhotoToCrop(null); // Close the dialog
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
    }
  };

  const studentAssessments = assessments.filter(
    (a) => a.scores[student.studentId] !== undefined
  );
  
  const performanceBySubject = subjects.map(subject => {
    const subjectAssessments = studentAssessments.filter(a => a.subjectId === subject.subjectId);
    if (subjectAssessments.length === 0) {
      return { subjectName: subject.subjectName, overallScore: 0 };
    }
    
    let totalWeightedScore = 0;
    let totalWeight = 0;

    subjectAssessments.forEach(assessment => {
      const weight = assessmentCategoryWeights[assessment.category];
      const score = assessment.scores[student.studentId];
      const percentage = (score / assessment.totalMarks) * 100;
      totalWeightedScore += percentage * weight;
      totalWeight += weight;
    });

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    return { subjectName: subject.subjectName, overallScore: Math.round(overallScore) };
  });

  const overallAverage = performanceBySubject.reduce((acc, curr) => acc + curr.overallScore, 0) / (performanceBySubject.filter(s => s.overallScore > 0).length || 1);

  const studentGrades = performanceBySubject.reduce((acc, subject) => {
    acc[subject.subjectName] = subject.overallScore;
    return acc;
  }, {} as Record<string, number>);

  const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.replace('  ', ' ');
  const khmerFullName = `${student.khmerLastName || ''} ${student.khmerFirstName || ''}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col">
        <ImageCropDialog 
            imageSrc={photoToCrop}
            onCropComplete={handlePhotoCropped}
            onOpenChange={(isOpen) => !isOpen && setPhotoToCrop(null)}
        />
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatarUrl} alt={student.firstName} className="object-cover" />
                  <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-opacity">
                   <p className="text-white text-xs opacity-0 group-hover:opacity-100">Edit</p>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <div>
                {student.firstName} {student.lastName}
                <SheetDescription>
                  {student.enrollments && student.enrollments.map(e => programs.find(p => p.id === e.programId)?.name).join(' | ')}
                </SheetDescription>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="performance" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="performance" className="flex-1 overflow-y-auto pr-2 py-4">
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="text-base">AI Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <AiSummary studentId={student.studentId} grades={studentGrades} />
                </CardContent>
            </Card>

            <h3 className="text-lg font-semibold mb-2">Overall Performance</h3>
            <div className="flex items-center gap-4 mb-4">
              <Progress value={overallAverage} className="w-full" />
              <span className="font-bold text-lg">{Math.round(overallAverage)}%</span>
            </div>
            
            <Separator className="my-4" />

            <h3 className="text-lg font-semibold mb-4">Performance by Subject</h3>
            <div className="space-y-4">
                {performanceBySubject.map((perf, index) => perf.overallScore > 0 && (
                <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">{perf.subjectName}</p>
                    <p className="text-sm font-semibold">{perf.overallScore}%</p>
                    </div>
                    <Progress value={perf.overallScore} />
                </div>
                ))}
            </div>
          </TabsContent>
          <TabsContent value="profile" className="flex-1 overflow-y-auto pr-2 py-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <StudentDetail label="Full English Name" value={fullName} />
                <StudentDetail label="Full Khmer Name" value={khmerFullName} />
                <StudentDetail label="Student ID" value={student.studentId} />
                <StudentDetail label="Sex" value={student.sex} />
                <StudentDetail label="Date of Birth" value={student.dateOfBirth ? format(student.dateOfBirth, "MMMM d, yyyy") : "N/A"} />
                <StudentDetail label="Place of Birth" value={student.placeOfBirth} />
                <StudentDetail label="Nationality" value={student.nationality} />
                <StudentDetail label="National ID" value={student.nationalId || 'N/A'} />
              </CardContent>
            </Card>

             <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.enrollments && student.enrollments.map((enrollment, index) => (
                  <EnrollmentDetails key={index} enrollment={enrollment} />
                ))}
                <div className="pt-2">
                  <StudentDetail label="Status" value={student.status} />
                  <StudentDetail label="Previous School" value={student.previousSchool || 'N/A'} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <StudentDetail 
                    label="Address" 
                    value={student.address ? `${student.address.house ? `${student.address.house}, ` : ''}${student.address.street ? `${student.address.street}, ` : ''}${student.address.village}, ${student.address.commune}, ${student.address.district}`: 'N/A'}
                  />
                <StudentDetail label="Emergency Contact" value={student.emergencyContact ? `${student.emergencyContact.name} (${student.emergencyContact.phone})` : 'N/A'} />
                <StudentDetail label="Media Consent" value={student.mediaConsent ? 'Yes' : 'No'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {student.guardians && student.guardians.map((guardian, index) => (
                  <GuardianDetails key={index} guardian={guardian} />
                ))}
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
        <div className="mt-auto pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
