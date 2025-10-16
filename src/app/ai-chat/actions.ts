
"use server";

import { Message, Part } from 'genkit';
import { getFirestore } from 'firebase-admin/firestore';
import { app } from '@/firebase/admin-config';

const firestore = getFirestore(app);

// This is a placeholder for getting the current user's UID.
async function getCurrentUserUid() {
    return 'some-user-uid-placeholder';
}

export async function saveChatHistory(userId: string, messages: Message[]) {
    if (!userId) return;

    const historyRef = firestore.collection(`users/${userId}/chatHistory`);

    for (const message of messages) {
        // Ensure content is an array and handle it
        if (Array.isArray(message.content)) {
            try {
                // Extract text from all parts of the content
                const contentText = message.content
                    .map(part => part.text || '')
                    .join('\n');
                
                await historyRef.add({
                    role: message.role,
                    content: contentText, // Save the combined text content
                    timestamp: new Date(),
                });
            } catch (e) {
                console.error("Failed to save a chat message to history:", e);
                // Decide if you want to stop or continue
            }
        }
    }
}
