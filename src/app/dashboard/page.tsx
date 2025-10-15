"use client";
import { useUser } from "@/hooks/use-user";
import { Loader2, MoreVertical, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard-layout";

const applications = [
  { name: "Alex Carter", subject: "Chemistry (GCSE)", date: "May 25, 2024" },
  { name: "Maya Thompson", subject: "Maths (GCSE)", date: "Jun 20, 2024" },
  { name: "Liam Johnson", subject: "Chemistry (GCSE)", date: "July 13, 2024" },
  { name: "Sofia Ramirez", subject: "Chemistry (GCSE)", date: "Dec 20, 2024" },
  { name: "Ethan Davis", subject: "Chemistry (GCSE)", date: "Mar 15, 2024" },
];

const lessons = [
  { tutor: "Meenal", date: "May 25, 2024 | 18:30", type: "Trial" },
  { tutor: "Maya", date: "May 25, 2024 | 18:30", type: "Trial" },
  { tutor: "Liam", date: "May 25, 2024 | 18:30", type: "Trial" },
];


export default function DashboardPage() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    if (firstName) return firstName.charAt(0);
    return 'U';
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Content: Tutor Applications */}
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <CardTitle className="text-2xl font-bold">Tutor Applications</CardTitle>
                <div className="flex gap-2">
                  <Button className="bg-green-500 hover:bg-green-600 text-white rounded-lg">Request a Tutor</Button>
                  <Button variant="outline" className="rounded-lg">Browse Other Tutors</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{app.name}</TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0 text-green-500 hover:text-green-600">View Message</Button>
                      </TableCell>
                      <TableCell>{app.subject}</TableCell>
                      <TableCell>{app.date}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Profile & Schedule */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold">Profile</CardTitle>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-green-400">
                <AvatarImage src={userData?.profileImageUrl} />
                <AvatarFallback className="text-3xl bg-muted">
                  {getInitials(userData?.firstName, userData?.lastName)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">Good Morning {userData.firstName}</h3>

              <div className="mt-8 text-left">
                <h4 className="font-semibold text-lg mb-4">Your schedule</h4>
                <Tabs defaultValue="upcoming">
                  <TabsList className="grid w-full grid-cols-2 bg-muted rounded-xl">
                    <TabsTrigger value="upcoming" className="rounded-lg">Upcoming lessons</TabsTrigger>
                    <TabsTrigger value="past" className="rounded-lg">Past Lesson</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upcoming" className="mt-4 space-y-4">
                    {lessons.map((lesson, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                        <div>
                          <p className="font-semibold">{lesson.tutor}</p>
                          <p className="text-sm text-muted-foreground">{lesson.date}</p>
                        </div>
                        <Badge variant="outline" className="border-accent text-accent">{lesson.type}</Badge>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="past" className="mt-4 text-center text-muted-foreground">
                    <p>No past lessons found.</p>
                  </TabsContent>
                </Tabs>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
