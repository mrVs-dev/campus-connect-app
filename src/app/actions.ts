
"use server";

import { summarizeStudentProgress } from "@/ai/flows/summarize-student-progress";
import { peekNextStudentId } from "@/lib/firebase/firestore";
import type { SummarizeStudentProgressInput } from "@/ai/flows/summarize-student-progress";

export async function getStudentSummary(
  input: SummarizeStudentProgressInput
) {
  try {
    // The grades are pre-filtered in the component; no need for extra filtering here.
    if (Object.keys(input.grades).length === 0) {
        return { summary: "No performance data available to generate a summary.", error: null };
    }

    const { summary } = await summarizeStudentProgress(input);
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
