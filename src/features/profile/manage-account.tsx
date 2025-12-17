"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RiArrowDropDownLine } from "react-icons/ri";

type OrganizationMember = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

type LastAdminOrganization = {
  organizationId: string;
  organizationName: string;
  members: OrganizationMember[];
};

export default function ManageAccountPage() {
  const { data: me } = api.me.get.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  const { data: userOrganizations = [] } = api.user.getUserOrganizations.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
  
  const { data: lastAdminOrgs = [] } = api.user.getLastAdminOrganizations.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const [adminReplacements, setAdminReplacements] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  const deleteAccountMutation = api.user.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Your account deletion has been processed. Check your email for details about the 30-day recovery period.");
      window.location.href = "/register";
    },
    onError: (error) => {
      const errorMessage = error.message || "Unknown error occurred";
      let displayMessage = errorMessage;
      
      if (errorMessage.includes("only admin in the following organizations")) {
        displayMessage = errorMessage;
      } else {
        displayMessage = "Failed to delete account. Please try again or contact support.";
      }
      
      toast.error(displayMessage);
      setIsDeleting(false);
    },
  });

  const hasLastAdminOrgs = lastAdminOrgs.length > 0;

  const handleAdminReplacement = (organizationId: string, newAdminId: string) => {
    setAdminReplacements((current) => ({
      ...current,
      [organizationId]: newAdminId,
    }));
  };

  const computeCanDelete = (): { canDelete: boolean; reason?: string } => {
    if (!me) return { canDelete: false, reason: "User data not ready" };

    for (const org of lastAdminOrgs) {
      if (!adminReplacements[org.organizationId]) {
        return { 
          canDelete: false, 
          reason: `You are the only admin in "${org.organizationName}". Please select a replacement admin before deleting your account.` 
        };
      }
    }

    return { canDelete: true };
  };

  const { canDelete, reason: cannotDeleteReason } = computeCanDelete();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    if (!canDelete) {
      setValidationError(cannotDeleteReason ?? "Please complete the form before deleting.");
      return;
    }

    setShowConfirmationDialog(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    setShowConfirmationDialog(false);

    const payload = {
      promoteAdmins: adminReplacements,
    };

    deleteAccountMutation.mutate(payload);
  };

  const renderAdminReplacementTrigger = (org: LastAdminOrganization, selectedId: string, placeholder: string) => {
    const selectedMember = org.members.find((m) => m.user.id === selectedId);
    const selectedLabel = selectedMember ? 
      (selectedMember.user.name ?? selectedMember.user.email ?? selectedMember.user.id) : 
      placeholder;
    
    return (
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div className="truncate text-sm">{selectedLabel}</div>
        <div className="ml-3 text-muted-foreground"><RiArrowDropDownLine /></div>
      </div>
    );
  };

  return (
    <>
      <div className="rounded-lg bg-gray-50 p-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">Delete Account</h2>
            <p className="text-sm text-muted-foreground">
              {hasLastAdminOrgs  
                ? "You must transfer admin roles before proceeding. You will have a 30-day recovery period to restore your account if you change your mind."
                : "Request permanent deletion of your account and personal data in accordance with GDPR data protection rights. You will have a 30-day recovery period to restore your account if needed."}
            </p>
          </div>

          {hasLastAdminOrgs && (
            <section className="mb-6 space-y-4">
              <h3 className="text-base font-semibold">Transfer Admin Rights</h3>
              <p className="text-sm text-muted-foreground">
                You are the only admin in the following organizations. Select a replacement admin for each organization.
              </p>
              
              {lastAdminOrgs.map((org: LastAdminOrganization) => {
                const selectedAdminId = adminReplacements[org.organizationId];
                
                return (
                  <div key={org.organizationId} className="rounded-lg border bg-amber-50 p-4">
                    <h4 className="mb-3 text-base font-medium text-amber-700">
                      {org.organizationName}
                    </h4>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Select a member to promote to Admin:
                    </p>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="w-full text-left max-w-md">
                          {renderAdminReplacementTrigger(
                            org, 
                            selectedAdminId ?? "", 
                            "Choose a member..."
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Promote to Admin</DropdownMenuLabel>
                        {org.members.map((member: OrganizationMember) => (
                          <DropdownMenuItem 
                            key={member.user.id} 
                            onSelect={() => handleAdminReplacement(org.organizationId, member.user.id)}
                          >
                            {member.user.name ?? member.user.email ?? member.user.id}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </section>
          )}

          <section className="bg-white p-6 mb-6 rounded-lg border">
            <h3 className="mb-4 text-base font-semibold">What will happen when you delete your account:</h3>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">Deleted Immediately (Cannot be recovered):</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside ml-2">
                <li>All chat conversations will be permanently deleted</li>
                <li>Your organization memberships will be removed</li>
                <li>Your active sessions will be terminated</li>
                <li>Organizations where you're the only member will be permanently deleted</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-blue-700 mb-2">Recoverable for 30 Days:</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside ml-2">
                <li>Your personal workspace and analyses (you can request restoration)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Retained with Organizations:</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside ml-2">
                <li>Analyses you created in organizations remain with those organizations</li>
                <li>You will appear as "Deleted User" in organization records</li>
              </ul>
            </div>
          </section>

          {validationError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-6">
              {validationError}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <Button
              type="submit"
              className="bg-sunset text-white border-none shadow-sm hover:bg-sunset/90"
              disabled={isDeleting || deleteAccountMutation.isPending || !canDelete}
            >
              {isDeleting || deleteAccountMutation.isPending ? "Deleting..." : "Delete My Account"}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showConfirmationDialog} onOpenChange={(open) => {
        setShowConfirmationDialog(open);
        if (!open) {
          // Clear any validation errors when dialog is closed
          setValidationError(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This action will delete your account and personal data. Please review what will happen:
            </DialogDescription>
          </DialogHeader>
           <div className="space-y-3 my-4">
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm font-semibold text-red-900 mb-1">Deleted Immediately:</p>
              <p className="text-xs text-red-800">Chat conversations, organization memberships, and active sessions</p>
            </div>

            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm font-semibold text-blue-900 mb-1">30-Day Recovery Period:</p>
              <p className="text-xs text-blue-800">Your personal workspace and analyses can be restored if you change your mind</p>
            </div>

            <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
              <p className="text-sm font-semibold text-gray-900 mb-1">Organization Data:</p>
              <p className="text-xs text-gray-800">Your organization analyses remain with organizations</p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowConfirmationDialog(false);
                setValidationError(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-sunset text-white border-none shadow-sm hover:bg-sunset/90 flex-1"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Processing..." : "Confirm Deletion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}