
// src/app/api/analyze-plant/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { analyzePlantFlow, type AnalyzePlantInput, type AnalyzePlantOutput, AnalyzePlantInputSchema } from '@/ai/flows/analyze-plant'; // Ensure AnalyzePlantInputSchema is exported if not already

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    // Validate input with Zod schema
    const validationResult = AnalyzePlantInputSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error('[API /api/analyze-plant] Invalid input:', validationResult.error.flatten());
      return NextResponse.json(
        { message: 'Invalid input data.', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input: AnalyzePlantInput = validationResult.data;
    const result: AnalyzePlantOutput = await analyzePlantFlow(input);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[API /api/analyze-plant] Error during analysis:', error);
    let errorMessage = 'An unexpected error occurred during analysis.';
    let statusCode = 500;

    if (error.message) {
        errorMessage = error.message;
    }
    
    // You could add more specific error handling here if Genkit or your flow throws custom errors
    // For example, if error.status is available:
    // if (error.status) statusCode = error.status;

    return NextResponse.json(
      { message: errorMessage },
      { status: statusCode }
    );
  }
}
