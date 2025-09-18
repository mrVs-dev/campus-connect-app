"use server";

import { summarizeStudentProgress } from "@/ai/flows/summarize-student-progress";
import type { SummarizeStudentProgressInput } from "@/ai/flows/summarize-student-progress";

export async function getStudentSummary(
  input: SummarizeStudentProgressInput
) {
  try {
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
