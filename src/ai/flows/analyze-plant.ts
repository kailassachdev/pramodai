// src/ai/flows/analyze-plant.ts
'use server';
/**
 * @fileOverview A plant analysis AI agent that takes an image and location
 * and returns an analysis of the plant's health, potential problems, and recommendations,
 * as well as identifying the plant.
 *
 * - analyzePlant - A function that handles the plant analysis process.
 * - AnalyzePlantInput - The input type for the analyzePlant function.
 * - AnalyzePlantOutput - The return type for the analyzePlant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  latitude: z.number().describe('The latitude of the plant location.'),
  longitude: z.number().describe('The longitude of the plant location.'),
});
export type AnalyzePlantInput = z.infer<typeof AnalyzePlantInputSchema>;

const AnalyzePlantOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Whether or not the image contains a plant.'),
    commonName: z.string().optional().describe('The common name of the identified plant.'),
    latinName: z.string().optional().describe('The Latin name (scientific name) of the identified plant.'),
  }).describe('Identification of the plant in the image.'),
  problems: z.array(z.string()).describe('Potential problems with the plant.'),
  diseases: z.array(z.string()).describe('Potential diseases affecting the plant.'),
  solutions: z.array(z.string()).describe('Possible solutions to the plant problems.'),
  recommendations: z
    .object({
      manure: z.array(z.string()).optional().describe('Recommended types of manure.'),
      fertilizer: z.array(z.string()).optional().describe('Recommended types of fertilizer.'),
      pesticide: z.array(z.string()).optional().describe('Recommended types of pesticide.'),
    })
    .describe('Recommendations for plant care, including manure, fertilizer, and pesticide.'),
  vitaminDeficiencies: z.array(z.string()).describe('Vitamin deficiencies the plant may have.'),
});
export type AnalyzePlantOutput = z.infer<typeof AnalyzePlantOutputSchema>;

export async function analyzePlant(input: AnalyzePlantInput): Promise<AnalyzePlantOutput> {
  return analyzePlantFlow(input);
}

const analyzePlantPrompt = ai.definePrompt({
  name: 'analyzePlantPrompt',
  input: {schema: AnalyzePlantInputSchema},
  output: {schema: AnalyzePlantOutputSchema},
  prompt: `You are a highly knowledgeable agricultural expert and plant diagnostician.

First, identify the plant in the provided image. Determine if it is indeed a plant. If it is, provide its common name and Latin (scientific) name.

Then, analyze the provided plant image and the given geographical coordinates (latitude: {{{latitude}}}, longitude: {{{longitude}}})
to identify potential problems, diseases, solutions, appropriate manure/fertilizer/pesticide, and vitamin deficiencies.
Consider the climate and soil type implied by the geographical location in your analysis.

Output fields:
Identification: Include isPlant (boolean), commonName (string, optional), latinName (string, optional).
Problems: List potential problems with the plant.
Diseases: List potential diseases affecting the plant.
Solutions: List possible solutions to the plant problems.
Recommendations: Provide recommendations for plant care, including manure, fertilizer, and pesticide.
Vitamin Deficiencies: List any vitamin deficiencies the plant may have.

Here is the plant image:
{{media url=photoDataUri}}
`,
});

const analyzePlantFlow = ai.defineFlow(
  {
    name: 'analyzePlantFlow',
    inputSchema: AnalyzePlantInputSchema,
    outputSchema: AnalyzePlantOutputSchema,
  },
  async input => {
    const {output} = await analyzePlantPrompt(input);
    return output!;
  }
);
