"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Bot, User } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { chat } from './actions';
import { useUser } from '@/hooks/use-user';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemoFirebase, initializeFirebase } from '@/firebase';

const { firestore } = initializeFirebase();

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const chatHistoryQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, `users/${user.uid}/chatHistory`), orderBy('timestamp', 'desc'), limit(20)) : null
  , [user]);

  const { data: chatHistory } = useCollection<{ role: 'user' | 'model'; content: string, timestamp: any }>(chatHistoryQuery);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const history = [...(chatHistory || []).map(h => ({ role: h.role, content: h.content })).reverse(), ...messages];
        const modelResponse = await chat(input, history);
        
        const botMessage: Message = { role: 'model', content: modelResponse };
        setMessages(prev => [...prev, botMessage]);
    } catch (error) {
        console.error("AI Chat Error:", error);
        const errorMessage: Message = { role: 'model', content: 'Sorry, I encountered an error. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const getInitials = (role: 'user' | 'model') => {
    return role === 'user' ? 'U' : 'AI';
  }

  const combinedMessages = [...(chatHistory || []).map(h => ({ role: h.role, content: h.content })).reverse(), ...messages];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto py-12 px-4">
        <Card className="max-w-3xl mx-auto shadow-lg rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold font-headline">AI Study Buddy</CardTitle>
            <CardDescription>Ask any question related to your subjects.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] overflow-y-auto p-4 border rounded-lg mb-4 space-y-4 bg-muted/50">
              {combinedMessages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg p-3 max-w-[70%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                   {msg.role === 'user' && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback><User className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isLoading && (
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                       <AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-background flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin"/>
                    </div>
                  </div>
                )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask any question related to your subject..."
                className="flex-grow rounded-xl"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="rounded-xl">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Send'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
