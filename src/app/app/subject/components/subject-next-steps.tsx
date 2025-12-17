"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SubjectNextSteps({ subjectId }: { subjectId: string }) {
  // const mutation = api.subject.createChat.useMutation();

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* <div className="mb-4 mt-8 text-xl">Next steps:</div> */}
      <div className="flex flex-row gap-2">
        <Button>
          <Link href={`/app/subject/${subjectId}/chat`}>
            Chat with the Analysis
          </Link>
        </Button>
      </div>
    </div>
  );
}
