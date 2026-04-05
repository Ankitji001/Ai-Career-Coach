import { checkUser } from "@/lib/checkUser";
import InterviewUI from "@/components/mock-interview/InterviewUI";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Mock Interview | AI Career Coach",
  description: "Practice your interview skills with real-time AI mock interviews.",
};

export default async function MockInterviewPage() {
  await checkUser();

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-4xl font-bold gradient-title mt-4">
          Virtual Mock Interview
        </h1>
        <p className="text-muted-foreground mt-2">
          Hone your verbal communication and technical answers using your camera and microphone.
        </p>
      </div>

      <InterviewUI />
    </div>
  );
}
