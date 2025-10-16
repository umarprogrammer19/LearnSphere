"use client";

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { initializeFirebase, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/hooks/use-user';
import { collection, orderBy, query } from 'firebase/firestore';
import { Bot, Loader2, Send, User } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { chat } from './actions';
import type { Message } from 'genkit';

const { firestore } = initializeFirebase();

export default function AiChatPage() {
  const { user, userData } = useUser();
  const [isPending, startTransition] = useTransition();

  const chatHistoryQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, `users/${user.uid}/chatHistory`),
      orderBy('timestamp', 'asc')
    );
  }, [user]);

  const { data: initialMessagesData } = useCollection(chatHistoryQuery);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    if (initialMessagesData) {
      const formattedMessages: Message[] = initialMessagesData.map(msg => ({
        role: msg.role as 'user' | 'model',
        content: [{ text: msg.content }]
      }));
      setMessages(formattedMessages);
    }
  }, [initialMessagesData]);


  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: [{ text: input }],
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    startTransition(async () => {
      const response = await chat(currentInput, messages);
      const modelMessage: Message = {
        role: 'model',
        content: [{ text: response }],
      };
      setMessages(prev => [...prev, modelMessage]);
    });
  };

  const getMessageContent = (message: Message) => {
    if (Array.isArray(message.content)) {
      return message.content.map(part => part.text || '').join('');
    }
    return '';
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <Card className="max-w-3xl mx-auto shadow-lg rounded-xl flex flex-col h-[70vh]">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-headline">AI Study Buddy</CardTitle>
            <CardDescription>Ask any question related to your subjects.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <ScrollArea className="flex-grow h-[1px] mb-4 pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((m, index) => (
                  <div key={index} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'model' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-lg p-3 max-w-[70%] whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm">{getMessageContent(m)}</p>
                    </div>
                    {m.role === 'user' && userData && (
                      <Avatar className="w-8 h-8">
                        {userData.profileImageUrl && <AvatarImage src={userData.profileImageUrl} />}
                        <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                 {isPending && (
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                       <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-muted flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin"/>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask any question related to your subject..."
                className="flex-grow rounded-xl"
                disabled={isPending}
              />
              <Button type="submit" disabled={isPending || !input.trim()} className="rounded-xl">
                {isPending ? <Loader2 className="animate-spin" /> : <Send />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
