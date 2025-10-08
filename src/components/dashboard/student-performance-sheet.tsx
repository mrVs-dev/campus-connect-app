
"use client";

import * as React from "react";
import type { Student, Guardian, Enrollment, Assessment, Subject, AssessmentCategory, PickupPerson, LetterGrade } from "@/lib/types";
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
import { User } from "lucide-react";
import { calculateStudentAverage } from "@/lib/grades";

interface StudentPerformanceSheetProps {
  student: Student | null;
  assessments: Assessment[];
  subjects: Subject[];
  assessmentCategories: AssessmentCategory[];
  gradeScale: LetterGrade[];
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
  const occupationInfo = [guardian.occupation, guardian.workplace].filter(Boolean).join(' at ');
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={guardian.avatarUrl} alt={guardian.name} className="object-cover" />
            <AvatarFallback><User /></AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{guardian.relation} - {guardian.name}</h4>
            {occupationInfo && <p className="text-sm text-muted-foreground">{occupationInfo}</p>}
          </div>
      </div>
      <p className="text-sm pt-2">Mobiles: {guardian.mobiles.join(', ')}</p>
      {guardian.email && <p className="text-sm">Email: {guardian.email}</p>}
    </div>
  );
}

function PickupPersonDetails({ person }: { person: PickupPerson }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={person.avatarUrl} alt={person.name} className="object-cover" />
            <AvatarFallback><User /></AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{person.name} ({person.relation})</h4>
             <p className="text-sm text-muted-foreground">Phone: {person.phone}</p>
          </div>
      </div>
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
  assessments,
  subjects,
  assessmentCategories,
  gradeScale,
  open,
  onOpenChange,
  onUpdateStudent,
}: StudentPerformanceSheetProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [photoToCrop, setPhotoToCrop] = React.useState<string | null>(null);
  const { toast } = useToast();
  const [studentGrades, setStudentGrades] = React.useState<Record<string, number> | null>(null);

  const performanceBySubject = React.useMemo(() => {
    if (!student) return [];
    const studentAssessments = assessments.filter(
      (a) => a.scores && a.scores[student.studentId] !== undefined
    );
    const categoryWeightMap = new Map(assessmentCategories.map(c => [c.name, c.weight / 100]));

    return subjects.map(subject => {
      const subjectAssessments = studentAssessments.filter(a => a.subjectId === subject.subjectId);
      if (subjectAssessments.length === 0) {
        return { subjectName: subject.englishTitle, overallScore: null };
      }
      
      let totalWeightedScore = 0;
      let totalWeight = 0;

      subjectAssessments.forEach(assessment => {
        const weight = categoryWeightMap.get(assessment.category) || 0;
        const score = assessment.scores[student.studentId];
        if (typeof score === 'number') {
          const percentage = (score / assessment.totalMarks) * 100;
          totalWeightedScore += percentage * weight;
          totalWeight += weight;
        }
      });

      if (totalWeight === 0) return { subjectName: subject.englishTitle, overallScore: null };

      const overallScore = totalWeightedScore / totalWeight;
      return { subjectName: subject.englishTitle, overallScore: Math.round(overallScore) };
    });
  }, [student, assessments, subjects, assessmentCategories]);

  const validSubjects = performanceBySubject.filter(s => s.overallScore !== null);
  const overallAverage = validSubjects.length > 0 ? validSubjects.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / validSubjects.length : 0;
  
  React.useEffect(() => {
    if (student) {
        const grades = performanceBySubject.reduce((acc, subject) => {
            if (subject.overallScore !== null) {
                acc[subject.subjectName] = subject.overallScore;
            }
            return acc;
        }, {} as Record<string, number>);
        setStudentGrades(grades);
    } else {
        setStudentGrades(null);
    }
  }, [student, performanceBySubject]);

  if (!student) {
    return null;
  }

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

  const fullName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.replace(/ +/g, ' ').trim();
  const khmerFullName = `${student.khmerLastName || ''} ${student.khmerFirstName || ''}`.trim();

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
                  <AvatarFallback>{student.firstName?.[0]}{student.lastName?.[0]}</AvatarFallback>
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
                    {studentGrades && (
                      <AiSummary studentId={student.studentId} grades={studentGrades} />
                    )}
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
                {performanceBySubject.map((perf, index) => perf.overallScore !== null && (
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
                <StudentDetail label="Gender" value={student.sex} />
                <StudentDetail label="Date of Birth" value={student.dateOfBirth ? format(new Date(student.dateOfBirth), "MMMM d, yyyy") : "N/A"} />
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
            
            {student.pickupPerson && student.pickupPerson.name && (
              <Card>
                <CardHeader>
                  <CardTitle>Designated Pickup Person</CardTitle>
                </CardHeader>
                <CardContent>
                  <PickupPersonDetails person={student.pickupPerson} />
                </CardContent>
              </Card>
            )}

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
