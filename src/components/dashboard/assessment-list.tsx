"use client";

import * as React from "react";
import type { Assessment, Student, Subject, AssessmentCategory, UserRole, Admission, Enrollment, Teacher } from "@/lib/types";
import { PlusCircle, MoreHorizontal, Edit, BookCopy, Layers2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Badge } from "@/components/ui/badge";
import { NewAssessmentDialog } from "./new-assessment-dialog";
import { GradeEntrySheet } from "./grade-entry-sheet";
import { programs } from "@/lib/program-data";

interface ClassWithAssessments {
  classId: string;
  schoolYear: string;
  programName: string;
  level: string;
  totalAssessments: number;
  assessmentsBySubject: {
    subjectId: string;
    subjectName: string;
    assessments: Assessment[];
  }[];
}

export function AssessmentList({
  assessments,
  students,
  subjects,
  assessmentCategories,
  admissions,
  teachers,
  onSaveAssessment,
  userRole,
}: {
  assessments: Assessment[];
  students: Student[];
  subjects: Subject[];
  assessmentCategories: AssessmentCategory[];
  admissions: Admission[];
  teachers: Teacher[];
  onSaveAssessment: (assessment: Omit<Assessment, 'assessmentId' | 'teacherId'> | Assessment) => Promise<Assessment | null>;
  userRole: UserRole;
}) {
  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = React.useState(false);
  const [assessmentToGrade, setAssessmentToGrade] = React.useState<Assessment | null>(null);
  const [assessmentToEdit, setAssessmentToEdit] = React.useState<Assessment | null>(null);
  const [classForNewAssessment, setClassForNewAssessment] = React.useState<string | undefined>(undefined);

  const canCreate = userRole === 'Admin' || userRole === 'Head of Department' || userRole === 'Teacher';

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.subjectId === subjectId)?.englishTitle || "Unknown";
  };
  
  const getTeacherName = (teacherId: string) => {
      const teacher = teachers.find(t => t.teacherId === teacherId);
      return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher';
  }

  const handleEdit = (assessment: Assessment) => {
    if (!canCreate) return;
    setAssessmentToEdit(assessment);
    setIsNewAssessmentOpen(true);
  };
  
  const handleOpenNewDialog = (isOpen: boolean) => {
    if (!isOpen) {
      setAssessmentToEdit(null);
      setClassForNewAssessment(undefined);
    }
    setIsNewAssessmentOpen(isOpen);
  };
  
 const assessmentsByClass = React.useMemo(() => {
    const classMap = new Map<string, { schoolYear: string, programId: string, level: string, studentIds: Set<string> }>();

    admissions.forEach(admission => {
        admission.classes?.forEach(classDef => {
            const classKey = `${admission.schoolYear}_${classDef.programId}_${classDef.level}`;
            if (!classMap.has(classKey)) {
                classMap.set(classKey, { schoolYear: admission.schoolYear, programId: classDef.programId, level: classDef.level, studentIds: new Set() });
            }
        });
        admission.students.forEach(studentAdmission => {
            studentAdmission.enrollments.forEach(enrollment => {
                const classKey = `${admission.schoolYear}_${enrollment.programId}_${enrollment.level}`;
                 if (!classMap.has(classKey)) {
                    classMap.set(classKey, { schoolYear: admission.schoolYear, programId: enrollment.programId, level: enrollment.level, studentIds: new Set() });
                }
                classMap.get(classKey)!.studentIds.add(studentAdmission.studentId);
            });
        });
    });
    
    const result: ClassWithAssessments[] = [];
    
    classMap.forEach((classInfo, classId) => {
      // --- HYBRID LOGIC ---
      // 1. Get assessments explicitly linked via classId (new data)
      const explicitAssessments = assessments.filter(a => a.classId === classId);
      
      // 2. Get assessments linked implicitly via student scores (old data)
      const implicitAssessments = assessments.filter(a => 
        !a.classId && // Only consider assessments without a classId
        Object.keys(a.scores).some(studentId => classInfo.studentIds.has(studentId))
      );

      // Combine and deduplicate
      const combined = new Map<string, Assessment>();
      [...explicitAssessments, ...implicitAssessments].forEach(a => combined.set(a.assessmentId, a));
      const assessmentsForClass = Array.from(combined.values());

      if (assessmentsForClass.length > 0) {
        const assessmentsBySubject: Record<string, { subjectName: string; assessments: Assessment[] }> = {};
        
        assessmentsForClass.forEach(assessment => {
            if (!assessmentsBySubject[assessment.subjectId]) {
                assessmentsBySubject[assessment.subjectId] = { subjectName: getSubjectName(assessment.subjectId), assessments: [] };
            }
            assessmentsBySubject[assessment.subjectId].assessments.push(assessment);
        });

        result.push({
          classId: classId,
          schoolYear: classInfo.schoolYear,
          programName: programs.find(p => p.id === classInfo.programId)?.name || 'Unknown Program',
          level: classInfo.level,
          totalAssessments: assessmentsForClass.length,
          assessmentsBySubject: Object.entries(assessmentsBySubject).map(([subjectId, data]) => ({subjectId, ...data})),
        });
      }
    });

    return result.sort((a,b) => b.schoolYear.localeCompare(a.schoolYear) || a.programName.localeCompare(b.programName) || a.level.localeCompare(b.level));
  }, [admissions, assessments, subjects]);


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessments Overview</CardTitle>
              <CardDescription>
                A summary of all assessments created, grouped by class. Only classes with scored assessments are shown.
              </CardDescription>
            </div>
            {canCreate && (
              <Button size="sm" className="gap-1" onClick={() => setIsNewAssessmentOpen(true)}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Assessment
                </span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assessmentsByClass.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {assessmentsByClass.map(classData => (
                <AccordionItem value={classData.classId} key={classData.classId}>
                   <AccordionTrigger>
                      <div className="flex flex-col items-start text-left">
                        <span className="font-semibold text-base">{classData.programName} - {classData.level}</span>
                        <span className="text-sm text-muted-foreground font-normal">{classData.schoolYear} • {classData.totalAssessments} Assessment(s)</span>
                      </div>
                   </AccordionTrigger>
                   <AccordionContent>
                      <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        {classData.assessmentsBySubject.map(subjectGroup => {
                          const categories = new Map<string, number>();
                          const teachersInSubject = new Map<string, number>();
                          
                          subjectGroup.assessments.forEach(asmnt => {
                            categories.set(asmnt.category, (categories.get(asmnt.category) || 0) + 1);
                            if (asmnt.teacherId) {
                                const teacherName = getTeacherName(asmnt.teacherId);
                                teachersInSubject.set(teacherName, (teachersInSubject.get(teacherName) || 0) + 1);
                            }
                          });

                          return (
                            <div key={subjectGroup.subjectId} className="p-3 border bg-background rounded-md">
                                <h4 className="font-semibold text-base flex items-center gap-2 mb-3">
                                    <BookCopy className="h-4 w-4" /> {subjectGroup.subjectName}
                                    <Badge variant="secondary" className="ml-2">{subjectGroup.assessments.length} Assessment(s)</Badge>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pl-6">
                                  <div>
                                    <h5 className="font-medium flex items-center gap-2 text-sm mb-1"><Layers2 className="h-4 w-4" /> By Category</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {Array.from(categories.entries()).map(([name, count]) => (
                                        <Badge key={name} variant="outline">{name} ({count})</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h5 className="font-medium flex items-center gap-2 text-sm mb-1"><User className="h-4 w-4" /> By Teacher</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {Array.from(teachersInSubject.entries()).map(([name, count]) => (
                                        <Badge key={name} variant="secondary" className="bg-blue-100 text-blue-800">{name} ({count})</Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                            </div>
                          )
                        })}
                      </div>
                   </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                No classes with scored assessments found.
              </div>
          )}
        </CardContent>
      </Card>
      {canCreate && (
        <NewAssessmentDialog 
          open={isNewAssessmentOpen}
          onOpenChange={handleOpenNewDialog}
          onSave={onSaveAssessment}
          existingAssessment={assessmentToEdit}
          subjects={subjects}
          assessmentCategories={assessmentCategories}
          classId={classForNewAssessment}
        />
      )}
      {canCreate && (
        <GradeEntrySheet
          assessment={assessmentToGrade}
          students={students}
          open={!!assessmentToGrade}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setAssessmentToGrade(null);
            }
          }}
          onSaveGrades={onSaveAssessment}
        />
      )}
    </>
  );
}
