// use server'
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting personalized training adjustments based on athlete performance data.
 *
 * - suggestTrainingAdjustments - A function that takes athlete performance data as input and returns suggested training adjustments.
 * - SuggestTrainingAdjustmentsInput - The input type for the suggestTrainingAdjustments function.
 * - SuggestTrainingAdjustmentsOutput - The return type for the suggestTrainingAdjustments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTrainingAdjustmentsInputSchema = z.object({
  athletePerformanceData: z
    .string()
    .describe(
      'A string containing the athlete performance data, including metrics like speed, strength, endurance, and technique scores.'
    ),
  currentTrainingPlan: z
    .string()
    .describe('A description of the athlete\u2019s current training plan.'),
});
export type SuggestTrainingAdjustmentsInput = z.infer<
  typeof SuggestTrainingAdjustmentsInputSchema
>;

const SuggestTrainingAdjustmentsOutputSchema = z.object({
  suggestedAdjustments: z
    .string()
    .describe(
      'A string containing the suggested training adjustments, including specific exercises, intensity levels, and frequency recommendations.'
    ),
  rationale: z
    .string()
    .describe(
      'A string containing the rationale behind the suggested adjustments, explaining how they address the athlete\u2019s performance data.'
    ),
});
export type SuggestTrainingAdjustmentsOutput = z.infer<
  typeof SuggestTrainingAdjustmentsOutputSchema
>;

export async function suggestTrainingAdjustments(
  input: SuggestTrainingAdjustmentsInput
): Promise<SuggestTrainingAdjustmentsOutput> {
  return suggestTrainingAdjustmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTrainingAdjustmentsPrompt',
  input: {schema: SuggestTrainingAdjustmentsInputSchema},
  output: {schema: SuggestTrainingAdjustmentsOutputSchema},
  prompt: `You are an expert sports coach specializing in personalized training plans.

  Based on the athlete's performance data and current training plan, suggest personalized training adjustments to optimize their training and improve outcomes.

  Performance Data: {{{athletePerformanceData}}}
  Current Training Plan: {{{currentTrainingPlan}}}

  Consider the following:
  - Specific exercises to add, remove, or modify
  - Intensity levels (e.g., low, medium, high)
  - Frequency recommendations (e.g., daily, weekly)

  Explain the rationale behind each adjustment, connecting it to the athlete's performance data.
  `,
});

const suggestTrainingAdjustmentsFlow = ai.defineFlow(
  {
    name: 'suggestTrainingAdjustmentsFlow',
    inputSchema: SuggestTrainingAdjustmentsInputSchema,
    outputSchema: SuggestTrainingAdjustmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
