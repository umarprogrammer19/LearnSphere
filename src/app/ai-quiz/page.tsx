"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { generateQuiz } from './actions';
import { useUser } from '@/hooks/use-user';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

interface QuizResult {
    questions: QuizQuestion[];
}

export default function AiQuizPage() {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [board, setBoard] = useState('');
    const [subject, setSubject] = useState('');

    const [quiz, setQuiz] = useState<QuizResult | null>(null);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [score, setScore] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    
    const { user } = useUser();

    const handleGenerateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setQuiz(null);
        setScore(null);
        setUserAnswers([]);

        try {
            const quizData = await generateQuiz({ name, grade, board, subject });
            if (quizData) {
                setQuiz(quizData);
                setUserAnswers(Array(quizData.questions.length).fill(''));
            }
        } catch (error) {
            console.error("AI Quiz Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[questionIndex] = answer;
        setUserAnswers(newAnswers);
    };
    
    const handleSubmitQuiz = () => {
        if (!quiz) return;
        let correctAnswers = 0;
        quiz.questions.forEach((q, i) => {
            if(userAnswers[i] === q.answer) {
                correctAnswers++;
            }
        });
        setScore(correctAnswers);
        setShowResult(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-grow container mx-auto py-12 px-4">
                <Card className="max-w-3xl mx-auto shadow-lg rounded-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold font-headline">AI Quiz Generator</CardTitle>
                        <CardDescription>Generate a personalized quiz on any subject.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!quiz ? (
                             <form onSubmit={handleGenerateQuiz} className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ali" required />
                                </div>
                                 <div>
                                    <Label htmlFor="grade">Grade</Label>
                                    <Input id="grade" value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g., 9th" required />
                                </div>
                                 <div>
                                    <Label htmlFor="board">Board</Label>
                                    <Input id="board" value={board} onChange={e => setBoard(e.target.value)} placeholder="e.g., Federal Board" required />
                                </div>
                                 <div>
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Physics" required />
                                </div>
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Generate Quiz'}
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                {quiz.questions.map((q, qIndex) => (
                                    <div key={qIndex} className="p-4 border rounded-lg">
                                        <p className="font-semibold mb-2">{qIndex + 1}. {q.question}</p>
                                        <RadioGroup value={userAnswers[qIndex]} onValueChange={(value) => handleAnswerChange(qIndex, value)}>
                                            {q.options.map((option, oIndex) => (
                                                <div key={oIndex} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option} id={`q${qIndex}o${oIndex}`} />
                                                    <Label htmlFor={`q${qIndex}o${oIndex}`}>{option}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                ))}
                                 <div className="flex justify-between">
                                    <Button variant="outline" onClick={() => setQuiz(null)}>Start New Quiz</Button>
                                    <Button onClick={handleSubmitQuiz}>Submit Quiz</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <AlertDialog open={showResult} onOpenChange={setShowResult}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Quiz Result</AlertDialogTitle>
                            <AlertDialogDescription>
                                You scored {score} out of {quiz?.questions.length}!
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={() => setShowResult(false)}>Close</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </main>
            <Footer />
        </div>
    );
}
