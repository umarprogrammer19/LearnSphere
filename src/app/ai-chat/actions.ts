
"use server";

import { ai } from '@/ai/genkit';
import { Message, Part } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/admin-config';

const firestore = getFirestore(app);

async function getCurrentUserUid() {
    return 'some-user-uid-placeholder';
}

export async function saveChatHistory(userId: string, messages: Message[]) {
    if (!userId) return;

    const historyRef = firestore.collection(`users/${userId}/chatHistory`);

    for (const message of messages) {
        if (message.role === 'user' || message.role === 'model') {
             try {
                // Ensure content is an array of parts and extract text
                const contentText = message.content
                    .map(part => part.text)
                    .join('');

                await historyRef.add({
                    role: message.role,
                    content: contentText, // Save the combined text content
                    timestamp: new Date(),
                });
            } catch (e) {
                console.error("Failed to save chat history for a message:", e);
                // Decide if you want to stop or continue
            }
        }
    }
}
