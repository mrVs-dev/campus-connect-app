

import type { Assessment, Subject, AssessmentCategory, LetterGrade } from './types';

export const calculateStudentAverage = (studentId: string, assessments: Assessment[], subjects: Subject[], assessmentCategories: AssessmentCategory[]): number => {
    // A score is only valid if it's a number (including 0). undefined/null are ignored.
    const studentAssessments = assessments.filter(a => a.scores && typeof a.scores[studentId] === 'number');
    if (studentAssessments.length === 0) return 0;
  
    const categoryWeightMap = new Map(assessmentCategories.map(c => [c.englishTitle, c.weight / 100]));

    const performanceBySubject = subjects.map(subject => {
      const subjectAssessments = studentAssessments.filter(a => a.subjectId === subject.subjectId);
      if (subjectAssessments.length === 0) {
        return { subjectName: subject.englishTitle, overallScore: null }; // Return null if no scores for this subject
      }
      
      let totalWeightedScore = 0;
      let totalWeight = 0;
  
      subjectAssessments.forEach(assessment => {
        const weight = categoryWeightMap.get(assessment.category) || 0;
        const score = assessment.scores[studentId];
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
  
    // Only average the subjects where the student had at least one valid score.
    const validSubjects = performanceBySubject.filter(s => s.overallScore !== null);
    if (validSubjects.length === 0) return 0;

    const overallAverage = validSubjects.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / validSubjects.length;
    return Math.round(overallAverage);
};

export const getLetterGrade = (score: number, gradeScale: LetterGrade[]): string => {
    const sortedScale = [...gradeScale].sort((a, b) => b.minScore - a.minScore);
    
    for (const grade of sortedScale) {
        if (score >= grade.minScore) {
            return grade.grade;
        }
    }
    
    return 'F';
};


