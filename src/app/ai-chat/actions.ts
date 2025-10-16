"use server";

import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/admin-config';
import { Message } from 'genkit/generate';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

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

export async function chat(prompt: string, history: Message[]) {
    
    const llm = googleAI.model('gemini-2.5-flash');

    const result = await genkit.generate({
        model: llm,
        prompt: prompt,
        history: history,
    });

    const response = result.text();

    // Save to Firestore - don't await to avoid blocking response
    try {
        const auth = getAuth(app);
        // This is a placeholder for getting the current user's UID.
        // In a real app, you would get this from the session/auth context.
        const userUid = 'some-user-uid-placeholder';
        if (userUid) {
            const historyRef = collection(firestore, `users/${userUid}/chatHistory`);
            await addDoc(historyRef, {
                role: 'user',
                content: prompt,
                timestamp: serverTimestamp(),
            });
            await addDoc(historyRef, {
                role: 'model',
                content: response,
                timestamp: serverTimestamp(),
            });
        }
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
    
    return response;
}
