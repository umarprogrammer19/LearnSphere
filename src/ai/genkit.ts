import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import 'dotenv/config';

// Using Genkit Function to create gemini instance
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
