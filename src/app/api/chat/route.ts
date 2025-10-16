
import { ai } from '@/ai/genkit';
import { StreamingTextResponse, StreamData, Message as VercelMessage } from 'ai';
import { Message } from 'genkit';
import { saveChatHistory } from '@/app/ai-chat/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages }: { messages: VercelMessage[] } = await req.json();

  // Convert Vercel AI SDK messages to Genkit messages for the API call
  const genkitMessages: Message[] = messages.map(m => ({
    role: m.role as 'user' | 'model',
    content: [{ text: m.content }] 
  }));

  const { stream, response } = ai.generateStream({
    messages: genkitMessages,
  });

  const data = new StreamData();

  response.then(async (result) => {
    // This is a placeholder for getting the current user's UID.
    const userUid = 'some-user-uid-placeholder';

    // Construct the final list of messages to save, including the model's response.
    // The result from Genkit is already in the correct Message format.
    const allMessages: Message[] = [
      ...genkitMessages,
      result.message,
    ];

    try {
        await saveChatHistory(userUid, allMessages);
    } catch(e) {
        console.error("[API_ROUTE] Failed to save chat history:", e);
    } finally {
        data.close();
    }
  });
  
  // Convert Genkit stream to a format readable by StreamingTextResponse
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if(chunk.text) {
          controller.enqueue(chunk.text);
        }
      }
      controller.close();
    },
  });

  return new StreamingTextResponse(readableStream, {}, data);
}
