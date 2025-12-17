"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Mail } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  createdAt: Date;
  expiresAt: Date | null;
  status: string;
}

interface InvitationsListProps {
  invitations: Invitation[];
  totalInvitations: number;
  onInvitationCanceled: () => void;
}

export function InvitationsList({
  invitations,
  totalInvitations,
  onInvitationCanceled,
}: InvitationsListProps) {
  const utils = api.useUtils();
  const [cancelingInvitationId, setCancelingInvitationId] = useState<
    string | null
  >(null);

  const cancelInvitationMutation = api.team.cancelInvitation.useMutation({
    onSuccess: async () => {
      toast.success("Invitation canceled successfully");
      setCancelingInvitationId(null);
      // Invalidate both team and billing caches
      await Promise.all([
        utils.team.getTeamOverview.invalidate(),
        utils.billing.listSubscriptions.invalidate(),
      ]);
      onInvitationCanceled();
    },
    onError: (error) => {
      toast.error(`Failed to cancel invitation: ${error.message}`);
      setCancelingInvitationId(null);
    },
  });

  const handleCancelInvitation = (invitationId: string) => {
    setCancelingInvitationId(invitationId);
    cancelInvitationMutation.mutate({ invitationId });
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (invitations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Mail className="mx-auto mb-2 h-8 w-8" />
        <p>No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const expired = isExpired(invitation.expiresAt);

            return (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{invitation.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={expired ? "destructive" : "outline"}
                    className="capitalize"
                  >
                    {expired ? "Expired" : invitation.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(invitation.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invitation.expiresAt ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {expired ? (
                        <span className="text-destructive">Expired</span>
                      ) : (
                        formatDistanceToNow(new Date(invitation.expiresAt), {
                          addSuffix: true,
                        })
                      )}
                    </div>
                  ) : (
                    "Never"
                  )}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cancelingInvitationId === invitation.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel the invitation for{" "}
                          <strong>{invitation.email}</strong>? They will no
                          longer be able to use this invitation to join the
                          organization.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Cancel Invitation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalInvitations > invitations.length && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {invitations.length} of {totalInvitations} pending invitations
        </div>
      )}
    </div>
  );
}
