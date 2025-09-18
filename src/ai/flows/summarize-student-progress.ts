'use server';

/**
 * @fileOverview A student progress summarization AI agent.
 *
 * - summarizeStudentProgress - A function that generates a summary of a student's academic progress.
 * - SummarizeStudentProgressInput - The input type for the summarizeStudentProgress function.
 * - SummarizeStudentProgressOutput - The return type for the summarizeStudentProgress function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudentProgressInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  grades: z
    .record(z.number())
    .describe('A map of subject names to grades for the student.'),
});
export type SummarizeStudentProgressInput = z.infer<
  typeof SummarizeStudentProgressInputSchema
>;

const SummarizeStudentProgressOutputSchema = z.object({
  summary: z.string().describe('A summary of the student\'s academic progress.'),
});
export type SummarizeStudentProgressOutput = z.infer<
  typeof SummarizeStudentProgressOutputSchema
>;

export async function summarizeStudentProgress(
  input: SummarizeStudentProgressInput
): Promise<SummarizeStudentProgressOutput> {
  return summarizeStudentProgressFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeStudentProgressPrompt',
  input: {schema: SummarizeStudentProgressInputSchema},
  output: {schema: SummarizeStudentProgressOutputSchema},
  prompt: `You are an AI assistant that summarizes student academic progress.

  Given the student's grades, generate a short summary (1-2 sentences) highlighting areas of strength and areas needing improvement.

  Student ID: {{{studentId}}}
  Grades: {{#each grades}}{{{@key}}}: {{{this}}}, {{/each}}

  Summary: `,
});

const summarizeStudentProgressFlow = ai.defineFlow(
  {
    name: 'summarizeStudentProgressFlow',
    inputSchema: SummarizeStudentProgressInputSchema,
    outputSchema: SummarizeStudentProgressOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      summary: output!.summary,
    };
  }
);
