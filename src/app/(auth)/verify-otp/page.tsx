import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function VerifyOtpPage() {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold font-headline">Check your Phone</CardTitle>
        <CardDescription>
          We&apos;ve sent a 6-digit code to your number. Please enter it below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-2">
            <Input className="w-12 h-12 text-center text-xl" maxLength={1} />
            <Input className="w-12 h-12 text-center text-xl" maxLength={1} />
            <Input className="w-12 h-12 text-center text-xl" maxLength={1} />
            <Input className="w-12 h-12 text-center text-xl" maxLength={1} />
            <Input className="w-12 h-12 text-center text-xl" maxLength={1} />
            <Input className="w-12 h-12 text-center text-xl" maxLength={1} />
        </div>
        <Button type="submit" className="w-full">
          Verify
        </Button>
      </CardContent>
       <CardFooter className="flex flex-col items-center text-center text-sm text-muted-foreground">
        <span>Didn&apos;t receive a code?</span>
        <Button variant="link" className="p-0 h-auto">Resend Code</Button>
      </CardFooter>
    </Card>
  );
}
