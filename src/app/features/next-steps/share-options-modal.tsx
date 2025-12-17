"use client";

import { useState } from "react";
import { Subject } from "@prisma/client";
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
import { EmailShareForm } from "./email-share-form";
import { api } from "@/trpc/react";
import { InviteTeamMemberForm } from "@/app/features/next-steps/invite-team-member-form";


interface ShareOptionsModalProps {
  subject: Subject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  senderEmail?: string;
  organizationId?: string;
}

export function ShareOptionsModal({
  subject,
  open,
  onOpenChange,
  senderEmail: senderEmailProp,
  organizationId: organizationIdProp,
}: ShareOptionsModalProps) {
  const [activeTab, setActiveTab] = useState("email");

  const handleClose = () => {
    onOpenChange(false);
  };

  const shouldFetchCurrent = !senderEmailProp || !organizationIdProp;

  const { data: currentUser, isLoading } = api.user.getCurrent.useQuery(
    undefined,
    { enabled: shouldFetchCurrent }
  );

  const senderEmail = senderEmailProp ?? currentUser?.email ?? "";
  const organizationId = organizationIdProp ?? currentUser?.organizationId ?? "";

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
            {isLoading && shouldFetchCurrent ? (
              <p className="text-sm text-muted-foreground">Loading user info…</p>
            ) : !isReady ? (
              <p className="text-sm text-red-600">Missing sender email or organization ID</p>
            ) : (
              <EmailShareForm
                subject={subject}
                senderEmail={senderEmail}
                organizationId={organizationId}
                onSuccess={handleClose}
              />
            )}
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <InviteTeamMemberForm
              subjectId={subject.id}
              onSuccess={() => {
              }}
            />
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
