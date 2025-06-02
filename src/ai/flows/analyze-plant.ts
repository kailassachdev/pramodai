
// src/ai/flows/analyze-plant.ts
// 'use server'; // Removed this line to resolve build error
/**
 * @fileOverview A plant analysis AI agent that takes an image and location
 * and returns an analysis of the plant's health, potential problems, and recommendations,
 * as well as identifying the plant, in the specified language.
 *
 * Exports:
 * - analyzePlantFlow: The core Genkit flow for plant analysis.
 * - AnalyzePlantInputSchema: Zod schema for input validation.
 * - AnalyzePlantInput: The input type for the analyzePlantFlow.
 * - AnalyzePlantOutputSchema: Zod schema for output.
 * - AnalyzePlantOutput: The return type for the analyzePlantFlow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const AnalyzePlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  latitude: z.number().describe('The latitude of the plant location.'),
  longitude: z.number().describe('The longitude of the plant location.'),
  language: z.enum(['english', 'malayalam']).optional().default('english').describe('The preferred language for the analysis output (english or malayalam).'),
});
export type AnalyzePlantInput = z.infer<typeof AnalyzePlantInputSchema>;

export const AnalyzePlantOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Whether or not the image contains a plant.'),
    commonName: z.string().optional().describe('The common name of the identified plant (in the selected language).'),
    latinName: z.string().optional().describe('The Latin name (scientific name) of the identified plant.'),
  }).describe('Identification of the plant in the image.'),
  problems: z.array(z.string()).describe('Potential problems with the plant (in the selected language).'),
  diseases: z.array(z.string()).describe('Potential diseases affecting the plant (in the selected language).'),
  solutions: z.array(z.string()).describe('Possible solutions to the plant problems (in the selected language).'),
  recommendations: z
    .object({
      manure: z.array(z.string()).optional().describe('Recommended types of manure (in the selected language).'),
      fertilizer: z.array(z.string()).optional().describe('Recommended types of fertilizer (in the selected language).'),
      pesticide: z.array(z.string()).optional().describe('Recommended types of pesticide (in the selected language).'),
    })
    .describe('Recommendations for plant care, including manure, fertilizer, and pesticide (in the selected language).'),
  vitaminDeficiencies: z.array(z.string()).describe('Vitamin deficiencies the plant may have (in the selected language).'),
});
export type AnalyzePlantOutput = z.infer<typeof AnalyzePlantOutputSchema>;

// This is the core Genkit flow. It is NOT a Next.js Server Action.
// It will be called by the API Route Handler.
export const analyzePlantFlow = ai.defineFlow(
  {
    name: 'analyzePlantFlow', // Keep Genkit flow name
    inputSchema: AnalyzePlantInputSchema,
    outputSchema: AnalyzePlantOutputSchema,
  },
  async (input: AnalyzePlantInput) => { // Explicitly type input here for clarity
    const analyzePlantPrompt = ai.definePrompt({
      name: 'analyzePlantPrompt',
      input: {schema: AnalyzePlantInputSchema}, // Schema for prompt input
      output: {schema: AnalyzePlantOutputSchema}, // Schema for prompt output
      prompt: `You are a highly knowledgeable agricultural expert and plant diagnostician.
Your response MUST be in the language specified by the '{{language}}' parameter.

First, identify the plant in the provided image. Determine if it is indeed a plant.
If it is, provide its common name (in {{language}}) and Latin (scientific) name.

Then, analyze the provided plant image.
Use the given geographical coordinates (latitude: {{{latitude}}}, longitude: {{{longitude}}}) to infer local soil types and climatic patterns.
Incorporate this understanding of soil and climate to provide a more precise and locally relevant analysis.
Identify potential problems, diseases, solutions, appropriate manure/fertilizer/pesticide, and vitamin deficiencies.
All textual descriptions in your response MUST be in {{language}}.

Output fields (Ensure all text descriptions are in {{language}}):
Identification:
  isPlant: boolean
  commonName: string (optional, in {{language}})
  latinName: string (optional, scientific name, can remain Latin)
Problems: array of strings (in {{language}})
Diseases: array of strings (in {{language}})
Solutions: array of strings (in {{language}})
Recommendations:
  manure: array of strings (optional, in {{language}})
  fertilizer: array of strings (optional, in {{language}})
  pesticide: array of strings (optional, in {{language}})
Vitamin Deficiencies: array of strings (in {{language}})

Here is the plant image:
{{media url=photoDataUri}}
`,
    });
    
    const response = await analyzePlantPrompt(input);
    if (!response.output) {
      console.error(`[analyzePlantFlow] Prompt returned no output. Input: ${JSON.stringify(input)}. Language: ${input.language}.`);
      throw new Error(
        'The AI model did not return a valid analysis. This could be due to the input image, content safety filters, or a temporary model issue. Please try a different image or try again later.'
      );
    }
    return response.output;
  }
);
