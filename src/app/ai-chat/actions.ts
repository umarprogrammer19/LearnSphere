
"use server";

import { ai } from '@/ai/genkit';
import { Message } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/admin-config';

const firestore = getFirestore(app);

// This is a placeholder for getting the current user's UID.
async function getCurrentUserUid() {
    // In a real app, you'd get this from the session or an auth provider.
    return 'some-user-uid-placeholder';
}

export async function chat(prompt: string, history: Message[]): Promise<string> {

    const result = await ai.generate({
        messages: [...history, { role: 'user', content: [{ text: prompt }] }],
    });

    const response = result.text;

    // Save to Firestore - don't await to avoid blocking response
    try {
        const userUid = await getCurrentUserUid();
        if (userUid) {
            const historyRef = firestore.collection(`users/${userUid}/chatHistory`);
            // Save user prompt
            await historyRef.add({
                role: 'user',
                content: prompt,
                timestamp: new Date(),
            });
            // Save model response
            await historyRef.add({
                role: 'model',
                content: response,
                timestamp: new Date(),
            });
        }
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }

    return response;
}
