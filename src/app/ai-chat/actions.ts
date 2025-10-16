
"use server";

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/admin-config';
import { Message, Part } from 'genkit';

const firestore = getFirestore(app);

// This is a placeholder for getting the current user's UID.
// In a real app, you would get this from the session/auth context.
// For this example, we'll assume a function that can provide it.
async function getCurrentUserUid() {
    // In a real scenario, you'd use something like `next-auth` or Firebase Admin Auth
    // to verify a session token and get the UID.
    return 'some-user-uid-placeholder';
}


export async function chat(prompt: string, history: Message[]) {
    
    const result = await ai.generate({
        messages: [...history, { role: 'user', content: [{ text: prompt }] }],
    });

    const response = result.text;

    // Save to Firestore - don't await to avoid blocking response
    try {
        const userUid = await getCurrentUserUid();
        if (userUid) {
            const historyRef = firestore.collection(`users/${userUid}/chatHistory`);
            
            const userMessagePart: Part = { text: prompt };
            await historyRef.add({
                role: 'user',
                content: [userMessagePart], // Genkit Message format uses a 'content' array of Parts
                timestamp: new Date(),
            });

            const modelMessagePart: Part = { text: response };
            await historyRef.add({
                role: 'model',
                content: [modelMessagePart], // Save in the same format
                timestamp: new Date(),
            });
        }
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
    
    return response;
}
