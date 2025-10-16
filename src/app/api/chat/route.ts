
import { ai } from '@/ai/genkit';
import { StreamingTextResponse, StreamData } from 'ai';
import { Message } from 'genkit';
import { saveChatHistory } from '@/app/ai-chat/actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const { stream, response } = await ai.generateStream({
    messages: messages,
  });

  const data = new StreamData();

  response.then(async (result) => {
    // This is a placeholder for getting the current user's UID.
    const userUid = 'some-user-uid-placeholder';
    const allMessages: Message[] = [
      ...messages,
      { role: 'model', content: [{ text: result.text }] },
    ];
    await saveChatHistory(userUid, allMessages);
    data.close();
  });
  
  // Convert Genkit stream to a format readable by StreamingTextResponse
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(chunk.text);
      }
      controller.close();
    },
  });

  return new StreamingTextResponse(readableStream, {}, data);
}
