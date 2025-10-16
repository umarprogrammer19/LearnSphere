
"use server";

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/admin-config';

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

// This is a placeholder for getting the current user's UID.
async function getCurrentUserUid() {
    return 'some-user-uid-placeholder';
}


export async function generateQuiz(input: z.infer<typeof QuizInputSchema>) {
    const prompt = `Generate a 5-question multiple-choice quiz for a student named ${input.name} in grade ${input.grade} of the ${input.board} board, for the subject ${input.subject}. For each question, provide 4 options and clearly indicate the correct answer.`;
    
    const result = await ai.generate({
        prompt: prompt,
        output: {
            schema: QuizOutputSchema,
        }
    });

    const quizData = result.output();

    if (!quizData) {
        throw new Error("Failed to generate quiz data from the AI model.");
    }

    // Save quiz to Firestore - don't await
    try {
        const userUid = await getCurrentUserUid();
        if(userUid) {
            const quizHistoryRef = firestore.collection(`users/${userUid}/quizHistory`);
            await quizHistoryRef.add({
                ...input,
                quiz: quizData,
                createdAt: new Date(),
            });
        }
    } catch(e) {
        console.error("Failed to save quiz history:", e);
    }

    return quizData;
}
