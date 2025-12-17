"use client";

import * as React from "react";
import { X, Mail, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function PendingInvitations() {
  const [selectedInvitation, setSelectedInvitation] = React.useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);

  // Get team overview which includes pending invitations
  const { data: teamOverview, refetch } = api.team.getTeamOverview.useQuery({});

  // Cancel invitation mutation
  const cancelInvitation = api.team.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation cancelled successfully");
      setIsCancelDialogOpen(false);
      setSelectedInvitation(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCancelInvitation = (invitationId: string) => {
    setSelectedInvitation(invitationId);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelInvitation = () => {
    if (!selectedInvitation) return;
    cancelInvitation.mutate({ invitationId: selectedInvitation });
  };

  const invitations = teamOverview?.invitations || [];
  const selectedInvitationData = invitations.find(inv => inv.id === selectedInvitation);

  if (invitations.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            Invitations sent to users who haven't joined yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Sent {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      Expires {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                    disabled={cancelInvitation.isLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the invitation to <strong>{selectedInvitationData?.email}</strong>?
              They will no longer be able to use this invitation to join the organization.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={cancelInvitation.isLoading}
            >
              Keep Invitation
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelInvitation}
              disabled={cancelInvitation.isLoading}
            >
              {cancelInvitation.isLoading ? "Cancelling..." : "Cancel Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}