
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
  assessments: Assessment[];
  assessmentsBySubject: { subjectName: string; count: number }[];
  assessmentsByCategory: { categoryName: string; count: number }[];
  assessmentsByTeacher: { teacherName: string; count: number }[];
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
    }
    setIsNewAssessmentOpen(isOpen);
  };
  
 const assessmentsByClass = React.useMemo(() => {
    const classMap = new Map<string, { schoolYear: string, programId: string, level: string, studentIds: Set<string> }>();

    // Step 1: Build a comprehensive map of all unique classes and the students in them.
    admissions.forEach(admission => {
        admission.classes?.forEach(classDef => {
            const classKey = `${admission.schoolYear}_${classDef.programId}_${classDef.level}`;
            if (!classMap.has(classKey)) {
                classMap.set(classKey, {
                    schoolYear: admission.schoolYear,
                    programId: classDef.programId,
                    level: classDef.level,
                    studentIds: new Set(),
                });
            }
        });
        
        admission.students.forEach(studentAdmission => {
            studentAdmission.enrollments.forEach(enrollment => {
                const classKey = `${admission.schoolYear}_${enrollment.programId}_${enrollment.level}`;
                 if (!classMap.has(classKey)) {
                    classMap.set(classKey, {
                        schoolYear: admission.schoolYear,
                        programId: enrollment.programId,
                        level: enrollment.level,
                        studentIds: new Set(),
                    });
                }
                classMap.get(classKey)!.studentIds.add(studentAdmission.studentId);
            });
        });
    });

    const result: ClassWithAssessments[] = [];
    
    // Step 2: Iterate through each defined class to find its valid assessments.
    classMap.forEach((classInfo, classId) => {
      const studentIdSet = classInfo.studentIds;
      if (studentIdSet.size === 0) return; // Skip classes with no students

      const assessmentsForClass = assessments.filter(assessment => {
        // An assessment belongs to a class if it has scores for at least one student in that class.
        return Object.keys(assessment.scores).some(studentId => studentIdSet.has(studentId));
      });

      if (assessmentsForClass.length > 0) {
        const subjectCounts: Record<string, number> = {};
        const categoryCounts: Record<string, number> = {};
        const teacherCounts: Record<string, number> = {};

        assessmentsForClass.forEach(a => {
          const subjectName = getSubjectName(a.subjectId);
          subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
          categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
          
          const teacherName = getTeacherName(a.teacherId);
          teacherCounts[teacherName] = (teacherCounts[teacherName] || 0) + 1;
        });

        result.push({
          classId: classId,
          schoolYear: classInfo.schoolYear,
          programName: programs.find(p => p.id === classInfo.programId)?.name || 'Unknown Program',
          level: classInfo.level,
          assessments: assessmentsForClass,
          assessmentsBySubject: Object.entries(subjectCounts).map(([subjectName, count]) => ({ subjectName, count })),
          assessmentsByCategory: Object.entries(categoryCounts).map(([categoryName, count]) => ({ categoryName, count })),
          assessmentsByTeacher: Object.entries(teacherCounts).map(([teacherName, count]) => ({ teacherName, count })),
        });
      }
    });

    return result.sort((a,b) => b.schoolYear.localeCompare(a.schoolYear) || a.programName.localeCompare(b.programName) || a.level.localeCompare(b.level));
  }, [admissions, assessments, subjects, teachers]);


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessments Overview</CardTitle>
              <CardDescription>
                A summary of all assessments created, grouped by class.
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
                        <span className="text-sm text-muted-foreground font-normal">{classData.schoolYear} • {classData.assessments.length} Assessment(s)</span>
                      </div>
                   </AccordionTrigger>
                   <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2"><BookCopy className="h-4 w-4" /> By Subject</h4>
                           <div className="flex flex-wrap gap-2">
                            {classData.assessmentsBySubject.map(sub => (
                              <Badge key={sub.subjectName} variant="secondary">{sub.subjectName} ({sub.count})</Badge>
                            ))}
                          </div>
                        </div>
                         <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2"><Layers2 className="h-4 w-4" /> By Category</h4>
                          <div className="flex flex-wrap gap-2">
                             {classData.assessmentsByCategory.map(cat => (
                              <Badge key={cat.categoryName} variant="outline">{cat.categoryName} ({cat.count})</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> By Teacher</h4>
                          <div className="flex flex-wrap gap-2">
                             {classData.assessmentsByTeacher.map(t => (
                              <Badge key={t.teacherName} variant="secondary" className="bg-blue-100 text-blue-800">{t.teacherName} ({t.count})</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                   </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                No assessments found.
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
