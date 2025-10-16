"use server";

import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, serverTimestamp, collection, addDoc } from 'firebase-admin/firestore';
import { app } from '@/firebase/admin-config';

if (process.env.NODE_ENV === 'production') {
    configureGenkit({
        plugins: [googleAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY })],
        logLevel: "warn",
        enableTracingAndMetrics: true,
    });
} else {
     configureGenkit({
        plugins: [googleAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY })],
        logLevel: "debug",
        enableTracingAndMetrics: true,
    });
}

const firestore = getFirestore(app);

const QuizInputSchema = z.object({
    name: z.string(),
    grade: z.string(),
    board: z.string(),
    subject: z.string(),
});

const QuizOutputSchema = z.object({
    questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        answer: z.string()
    }))
});

export async function generateQuiz(input: z.infer<typeof QuizInputSchema>) {
    const prompt = `Generate a 5-question multiple-choice quiz for a student named ${input.name} in grade ${input.grade} of the ${input.board} board, for the subject ${input.subject}. For each question, provide 4 options and clearly indicate the correct answer.`;
    
    const llm = googleAI.model('gemini-2.5-flash');

    const result = await genkit.generate({
        model: llm,
        prompt: prompt,
        output: {
            schema: QuizOutputSchema,
        }
    });

    const quizData = result.output();

    // Save quiz to Firestore - don't await
    try {
        const auth = getAuth(app);
        // Placeholder for user UID
        const userUid = 'some-user-uid-placeholder';
        if(userUid && quizData) {
            const quizHistoryRef = collection(firestore, `users/${userUid}/quizHistory`);
            await addDoc(quizHistoryRef, {
                ...input,
                quiz: quizData,
                createdAt: serverTimestamp(),
            });
        }
    } catch(e) {
        console.error("Failed to save quiz history:", e);
    }

    return quizData;
}
