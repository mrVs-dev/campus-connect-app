
import type { Assessment, Student } from './types';
import { subjects } from './mock-data';
import { assessmentCategoryWeights } from './types';

export const calculateStudentAverage = (studentId: string, assessments: Assessment[]): number => {
    const studentAssessments = assessments.filter(a => a.scores && a.scores[studentId] !== undefined);
    if (studentAssessments.length === 0) return 0;
  
    const performanceBySubject = subjects.map(subject => {
      const subjectAssessments = studentAssessments.filter(a => a.subjectId === subject.subjectId);
      if (subjectAssessments.length === 0) {
        return { subjectName: subject.subjectName, overallScore: 0 };
      }
      
      let totalWeightedScore = 0;
      let totalWeight = 0;
  
      subjectAssessments.forEach(assessment => {
        const weight = assessmentCategoryWeights[assessment.category];
        const score = assessment.scores[studentId];
        const percentage = (score / assessment.totalMarks) * 100;
        totalWeightedScore += percentage * weight;
        totalWeight += weight;
      });
  
      const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      return { subjectName: subject.subjectName, overallScore: Math.round(overallScore) };
    });
  
    const validSubjects = performanceBySubject.filter(s => s.overallScore > 0);
    if (validSubjects.length === 0) return 0;

    const overallAverage = validSubjects.reduce((acc, curr) => acc + curr.overallScore, 0) / validSubjects.length;
    return Math.round(overallAverage);
};

export const getLetterGrade = (score: number): string => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
};
