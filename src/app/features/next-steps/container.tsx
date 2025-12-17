"use client";

import { useState } from "react";
import { customPrompts } from "@/app/api/subject/utils/prompts/custom";
import { Subject } from "@prisma/client";
import { FileCheck, FileText, Share2 } from "lucide-react";
import Link from "next/link";
import { ShareOptionsModal } from "./share-options-modal";

export function NextStepsContainer({
  subject,
  senderEmail,
  organizationName,
  currentUserEmail,
  currentUserOrganization,
}: {
  subject: Subject;
  senderEmail?: string;
  organizationName?: string;
  currentUserEmail?: string;
  currentUserOrganization?: string;
}) {
  const [showShareModal, setShowShareModal] = useState(false);

  const summaryItem = {
    name: "Create Summary",
    description: "Create a summary of the analysis and share it with your team.",
    href: `/app/subject/${subject.id}/summary`,
    icon: FileCheck,
  };

  const shareItem = {
    name: "Share Analysis",
    description: "Share this analysis with team members or via email.",
    icon: Share2,
    onClick: () => setShowShareModal(true),
  };

  const gridItems = [
    summaryItem,
    ...customPrompts.map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      href: `/app/subject/${subject.id}/next-steps/${prompt.chatType.toLowerCase()}`,
      icon: FileCheck,
    })),
    shareItem,
  ];

  const organizationIdToSend = currentUserOrganization || organizationName;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Next Steps</h1>
        <p className="text-sm text-muted-foreground">
          Select the actions you'd like to take with this analysis.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
        <Link href={`/app/subject/${subject.id}/request`} className="block">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 rounded-md bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Research Request</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Request additional research on this analysis.
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Custom Reports</h2>
          <p className="text-sm text-muted-foreground">
            A set of specific tools to produce custom memos, reports and additional analyses.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {gridItems.map((item, index) => (
          <div
            key={index}
            className="group relative rounded-lg border bg-card p-6 transition-all duration-200 hover:border-accent-foreground/20 hover:bg-accent/50 hover:shadow-md"
          >
            {"onClick" in item ? (
              <div onClick={item.onClick} className="block cursor-pointer">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-md bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ) : (
              <Link href={item.href} className="block">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-md bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>

      <ShareOptionsModal
        subject={subject}
        open={showShareModal}
        onOpenChange={setShowShareModal}
        senderEmail={senderEmail}
        organizationId={organizationIdToSend}
      />
    </div>
  );
}
