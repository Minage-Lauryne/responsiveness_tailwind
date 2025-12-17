"use client";

import { useState } from "react";
import { ChatType } from "@prisma/client";
import { Mail, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ShareEmailForm } from "./share-email-form";
import { api } from "@/trpc/react";
import { SubjectWithDocuments } from "./types";
import { Message } from "@ai-sdk/react";

interface ShareAnalysisModalProps {
  subject: SubjectWithDocuments;
  chatType: ChatType;
  messages: Message[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareAnalysisModal({
  subject,
  chatType,
  messages,
  open,
  onOpenChange,
}: ShareAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState("email");

  const handleClose = () => {
    onOpenChange(false);
  };

  const { data: currentUser, isLoading } = api.user.getCurrent.useQuery();

  const senderEmail = currentUser?.email ?? "";
  const organizationId = currentUser?.organizationId ?? "";

  const isReady = !!senderEmail && !!organizationId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Analysis</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Invite Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading user info…</p>
            ) : !isReady ? (
              <p className="text-sm text-red-600">Missing sender email or organization ID</p>
            ) : (
              <ShareEmailForm
                subject={subject}
                chatType={chatType}
                messages={messages}
                senderEmail={senderEmail}
                organizationId={organizationId}
                onSuccess={handleClose}
              />
            )}
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">Team invitation feature coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
