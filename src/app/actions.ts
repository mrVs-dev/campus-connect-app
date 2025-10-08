"use server";

import { summarizeStudentProgress } from "@/ai/flows/summarize-student-progress";
import { peekNextStudentId } from "@/lib/firebase/firestore";
import type { SummarizeStudentProgressInput } from "@/ai/flows/summarize-student-progress";

export async function getStudentSummary(
  input: SummarizeStudentProgressInput
) {
  try {
    // Final safeguard: Ensure no zero-value grades are passed to the AI.
    const validGrades: Record<string, number> = {};
    for (const subject in input.grades) {
        if (Object.prototype.hasOwnProperty.call(input.grades, subject)) {
            const grade = input.grades[subject];
            if (typeof grade === 'number' && grade > 0) {
                validGrades[subject] = grade;
            }
        }
    }

    if (Object.keys(validGrades).length === 0) {
        return { summary: "No performance data available to generate a summary.", error: null };
    }

    const { summary } = await summarizeStudentProgress({ ...input, grades: validGrades });
    return { summary, error: null };
  } catch (error) {
    console.error("Error generating student summary:", error);
    return {
      summary: null,
      error: "Failed to generate AI summary. Please try again later.",
    };
  }
}

export async function getNextStudentIdAction(): Promise<string> {
    try {
        const nextId = await peekNextStudentId();
        return nextId;
    } catch (error: any) {
        console.error("Error fetching next student ID:", error.message);
        return "Error";
    }
}
