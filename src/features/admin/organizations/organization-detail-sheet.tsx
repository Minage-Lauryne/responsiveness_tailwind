"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { Calendar, CreditCard, Plus, Trash2, Users, Shield, CheckCircle2, AlertTriangle, Info, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { UserSelector } from "./user-selector";
import { Form990FilingsSheet } from "@/components/form990/form-990-filings-sheet";

interface OrganizationDetailSheetProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrganizationDetailSheet({
  organizationId,
  isOpen,
  onClose,
}: OrganizationDetailSheetProps) {
  const {
    data: organization,
    isLoading,
    refetch,
  } = api.organization.listAdmin.useQuery();

  const selectedOrg = organization?.find((org) => org.id === organizationId);

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [showExtendTrialModal, setShowExtendTrialModal] = useState(false);
  const [weeksToAdd, setWeeksToAdd] = useState<string>("4");
  const [showUpdateChatCountModal, setShowUpdateChatCountModal] =
    useState(false);
  const [newChatCount, setNewChatCount] = useState<string>("5");
  const [isForm990SheetOpen, setIsForm990SheetOpen] = useState(false);

  // Get available domains for this organization
  const { data: availableDomainsData } =
    api.organization.adminGetAvailableDomains.useQuery(
      { organizationId },
      { enabled: isAddingDomain && !!organizationId },
    );

  // Get current chat count for this organization
  const { data: currentChatCount, refetch: refetchChatCount } =
    api.organization.getOrganizationChatCount.useQuery(
      { organizationId },
      { enabled: !!organizationId },
    );

  const toggleFreeForeverMutation =
    api.organization.toggleFreeForever.useMutation({
      async onSuccess() {
        await refetch();
        toast.success("Free forever status updated");
      },
      onError(error) {
        toast.error(`Failed to update: ${error.message}`);
      },
    });

  const addDomainMutation = api.organization.adminAddDomain.useMutation({
    async onSuccess() {
      await refetch();
      setSelectedDomains([]);
      setIsAddingDomain(false);
      toast.success("Domain added successfully");
    },
    onError(error) {
      toast.error(`Failed to add domain: ${error.message}`);
    },
  });

  const deleteDomainMutation = api.organization.adminDeleteDomain.useMutation({
    async onSuccess() {
      await refetch();
      toast.success("Domain deleted successfully");
    },
    onError(error) {
      toast.error(`Failed to delete domain: ${error.message}`);
    },
  });

  const extendTrialMutation = api.organization.extendTrial.useMutation({
    async onSuccess() {
      await refetch();
      toast.success("Trial extended by one month");
    },
    onError(error) {
      toast.error(`Failed to extend trial: ${error.message}`);
    },
  });

  const updateChatCountMutation = (
    api.organization as any
  ).updateTrialChatCount.useMutation({
    async onSuccess() {
      await refetch();
      toast.success("Trial chat count updated");
    },
    onError(error: any) {
      toast.error(`Failed to update chat count: ${error.message}`);
    },
  });

  const approveOrganizationMutation = api.organization.adminApproveOrganization.useMutation({
    async onSuccess() {
      await refetch();
      toast.success("Organization approved successfully");
    },
    onError(error) {
      toast.error(`Failed to approve organization: ${error.message}`);
    },
  });

  const handleAddDomains = () => {
    if (selectedDomains.length === 0) {
      toast.error("Please select at least one domain");
      return;
    }

    // Add domains one by one
    Promise.all(
      selectedDomains.map((domain) =>
        addDomainMutation.mutateAsync({
          organizationId: selectedOrg!.id,
          domain,
        }),
      ),
    )
      .then(() => {
        toast.success(`Added ${selectedDomains.length} domain(s) successfully`);
      })
      .catch(() => {
        // Individual errors are handled by the mutation
      });
  };

  const handleDeleteDomain = (domainId: string) => {
    if (confirm("Are you sure you want to delete this domain?")) {
      deleteDomainMutation.mutate({ domainId });
    }
  };

  const handleExtendTrial = () => {
    const weeks = parseInt(weeksToAdd);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      toast.error("Please enter a valid number of weeks (1-52)");
      return;
    }

    extendTrialMutation.mutate({
      organizationId: selectedOrg!.id,
      weeks,
    });
    setShowExtendTrialModal(false);
    setWeeksToAdd("4"); // Reset to default
  };

  const handleUpdateChatCount = () => {
    const count = parseInt(newChatCount);
    if (isNaN(count) || count < 1 || count > 1000) {
      toast.error("Please enter a valid chat count (1-1000)");
      return;
    }

    updateChatCountMutation.mutate({
      organizationId: selectedOrg!.id,
      trialChatCount: count,
    });
    setShowUpdateChatCountModal(false);
  };

  if (isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!selectedOrg) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Organization not found</h3>
              <p className="text-muted-foreground">
                This organization may have been deleted.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] overflow-y-auto sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="text-xl">{selectedOrg.name}</SheetTitle>
          <SheetDescription>
            Created{" "}
            {formatDistanceToNow(selectedOrg.createdAt, {
              addSuffix: true,
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 py-6">
          {/* Organization Status */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Calendar className="h-5 w-5" />
              Organization Status
            </h3>
            <div className="grid gap-4">
              {/* Trial Status Card */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">Trial Status</h4>
                  {selectedOrg.freeForever ? (
                    <Badge variant="default">Free Forever</Badge>
                  ) : selectedOrg.trialEndsAt ? (
                    <Badge
                      variant={
                        selectedOrg.trialEndsAt < new Date()
                          ? "destructive"
                          : "default"
                      }
                    >
                      {selectedOrg.trialEndsAt < new Date()
                        ? "Expired"
                        : "Active"}
                      {" · "}
                      {formatDistanceToNow(selectedOrg.trialEndsAt, {
                        addSuffix: true,
                      })}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No trial</Badge>
                  )}
                </div>
                {!selectedOrg.freeForever && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExtendTrialModal(true)}
                  >
                    Extend Trial
                  </Button>
                )}
              </div>

              {/* Chat Usage Card */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-4">
                  <h4 className="font-medium">Chat Usage</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Trial Limit:
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedOrg.trialChatCount || 5} chats
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewChatCount(
                            (selectedOrg?.trialChatCount || 5).toString(),
                          );
                          setShowUpdateChatCountModal(true);
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Current Usage:
                    </span>
                    <Badge variant="secondary">
                      {currentChatCount ?? 0} used
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Free Forever Status Card */}
              <div className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">Free Forever Status</h4>
                  <Badge
                    variant={selectedOrg.freeForever ? "default" : "secondary"}
                  >
                    {selectedOrg.freeForever ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleFreeForeverMutation.mutate({
                      organizationId: selectedOrg.id,
                    })
                  }
                  disabled={toggleFreeForeverMutation.isLoading}
                >
                  {toggleFreeForeverMutation.isLoading
                    ? "Updating..."
                    : "Toggle Status"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* IRS Verification Section */}
          <div>
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5" />
              IRS Verification
            </h3>

            {selectedOrg.isUSBased === false ? (
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">International Organization</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  IRS verification not applicable for non-US organizations
                </p>
              </div>
            ) : selectedOrg.verificationStatus === "NOT_CHECKED" || !selectedOrg.isUSBased ? (
              <div className="rounded-lg border bg-card p-4">
                <Badge variant="secondary">Not Yet Verified</Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  This organization has not been verified with the IRS database
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Status Badge */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Verification Status</span>
                    <Badge
                      variant={
                        selectedOrg.verificationStatus === "VERIFIED"
                          ? "default"
                          : selectedOrg.verificationStatus === "PENDING_ADMIN"
                            ? "secondary"
                            : selectedOrg.verificationStatus === "INACTIVE"
                              ? "destructive"
                              : "outline"
                      }
                      className="flex items-center gap-1"
                    >
                      {selectedOrg.verificationStatus === "VERIFIED" && <CheckCircle2 className="h-3 w-3" />}
                      {selectedOrg.verificationStatus === "INACTIVE" && <AlertTriangle className="h-3 w-3" />}
                      {selectedOrg.verificationStatus === "PENDING_ADMIN" && <AlertTriangle className="h-3 w-3" />}
                      {selectedOrg.verificationStatus === "NOT_FOUND" && <Info className="h-3 w-3" />}
                      {selectedOrg.verificationStatus}
                    </Badge>
                  </div>
                </div>

                {/* IRS Details */}
                {selectedOrg.irsEin && (
                  <div className="rounded-lg border bg-card p-4">
                    <h4 className="mb-3 font-medium">IRS Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Official IRS Name:</span>
                        <div className="font-medium">{selectedOrg.irsOrganizationName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">EIN:</span>
                        <div className="font-mono">{selectedOrg.irsEin}</div>
                      </div>
                      {selectedOrg.irsSubsectionCode && (
                        <div>
                          <span className="text-muted-foreground">Organization Type:</span>
                          <div>501(c)({selectedOrg.irsSubsectionCode})</div>
                        </div>
                      )}
                      {selectedOrg.irsExemptionStatus && (
                        <div>
                          <span className="text-muted-foreground">Exemption Status:</span>
                          <div>Code {selectedOrg.irsExemptionStatus}</div>
                        </div>
                      )}
                      {selectedOrg.irsVerifiedAt && (
                        <div>
                          <span className="text-muted-foreground">Verified At:</span>
                          <div>
                            {formatDistanceToNow(selectedOrg.irsVerifiedAt, {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {selectedOrg.verificationStatus === "PENDING_ADMIN" && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <div className="mb-3">
                      <h4 className="font-medium text-yellow-900">Approval Required</h4>
                      <p className="text-sm text-yellow-800">
                        This organization's tax-exempt status appears to be inactive or revoked. 
                        Review the details and approve if legitimate.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        approveOrganizationMutation.mutate({
                          organizationId: selectedOrg.id,
                        })
                      }
                      disabled={approveOrganizationMutation.isLoading}
                    >
                      {approveOrganizationMutation.isLoading
                        ? "Approving..."
                        : "Approve Organization"}
                    </Button>
                  </div>
                )}

                {selectedOrg.verificationStatus === "NOT_FOUND" && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        This organization was not found in the IRS Business Master File. 
                        It may be too new, too small, or operate internationally.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Form 990 Filings Section */}
          {selectedOrg.irsVerified && (
            <>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FileText className="h-5 w-5" />
                    Form 990 Tax Filings
                  </h3>
                  <Button
                    onClick={() => setIsForm990SheetOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    View All Filings
                  </Button>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">
                    Annual tax returns and financial data for this organization are available.
                    Click "View All Filings" to see detailed Form 990 information.
                  </p>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Members Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                Members ({selectedOrg.members?.length || 0})
              </h3>
              <UserSelector
                organizationId={selectedOrg.id}
                currentMembers={(selectedOrg.members || []).filter(
                  (
                    member,
                  ): member is typeof member & { user: { email: string } } =>
                    member.organizationEmail != null || member.user.email != null,
                )}
              />
            </div>
            {selectedOrg.members && selectedOrg.members.length > 0 ? (
              <div className="space-y-3">
                {selectedOrg.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <Link
                        href={`/app/admin/users/${member.user.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {member.user.name || "Unknown"}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {member.organizationEmail || member.user.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Joined{" "}
                        {formatDistanceToNow(member.createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No members found
              </div>
            )}
          </div>

          <Separator />

          {/* Stripe Subscriptions Section */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-5 w-5" />
              Stripe Subscriptions ({selectedOrg.subscriptions?.length || 0})
            </h3>
            {selectedOrg.subscriptions &&
            selectedOrg.subscriptions.length > 0 ? (
              <div className="space-y-3">
                {selectedOrg.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            subscription.status === "active"
                              ? "default"
                              : subscription.status === "canceled"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {subscription.status}
                        </Badge>
                        <Badge variant="outline">{subscription.plan}</Badge>
                        {subscription.pastDue && (
                          <Badge variant="destructive">Past Due</Badge>
                        )}
                      </div>
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${subscription.stripeSubscriptionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View in Stripe →
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Seats:</span>{" "}
                        {subscription.seats}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Customer ID:
                        </span>{" "}
                        <code className="text-xs">
                          {subscription.stripeCustomerId}
                        </code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Period:</span>{" "}
                        {new Date(
                          subscription.periodStart,
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(subscription.periodEnd).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        {formatDistanceToNow(subscription.createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>

                    {subscription.retirementReason && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Retirement reason:
                        </span>{" "}
                        <Badge variant="outline">
                          {subscription.retirementReason}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No stripe subscriptions found
              </div>
            )}
          </div>

          {/* Domains Section */}
          <Separator />
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Domains ({selectedOrg.domains?.length || 0})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingDomain(true)}
                disabled={isAddingDomain}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Domain
              </Button>
            </div>

            {/* Add Domain Form */}
            {isAddingDomain && (
              <div className="mb-4 rounded-lg border p-3">
                <div className="mb-2 text-sm font-medium">Add Domains</div>
                <div className="mb-3 text-xs text-muted-foreground">
                  Select domains from verified users in this organization
                </div>

                {availableDomainsData?.availableDomains.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No available domains found. All domains from verified users
                    are already added or taken by other organizations.
                  </div>
                ) : (
                  <>
                    <div className="mb-3 max-h-40 space-y-2 overflow-y-auto">
                      {availableDomainsData?.availableDomains.map(
                        (domainData) => (
                          <div
                            key={domainData.domain}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={domainData.domain}
                              checked={selectedDomains.includes(
                                domainData.domain,
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDomains((prev) => [
                                    ...prev,
                                    domainData.domain,
                                  ]);
                                } else {
                                  setSelectedDomains((prev) =>
                                    prev.filter((d) => d !== domainData.domain),
                                  );
                                }
                              }}
                              disabled={addDomainMutation.isLoading}
                            />
                            <label
                              htmlFor={domainData.domain}
                              className="cursor-pointer font-mono text-sm"
                            >
                              {domainData.domain}
                            </label>
                          </div>
                        ),
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddDomains}
                    disabled={
                      addDomainMutation.isLoading ||
                      selectedDomains.length === 0 ||
                      availableDomainsData?.availableDomains.length === 0
                    }
                    size="sm"
                  >
                    {addDomainMutation.isLoading
                      ? "Adding..."
                      : `Add Selected (${selectedDomains.length})`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingDomain(false);
                      setSelectedDomains([]);
                    }}
                    disabled={addDomainMutation.isLoading}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Domains List */}
            {selectedOrg.domains && selectedOrg.domains.length > 0 ? (
              <div className="space-y-2">
                {selectedOrg.domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between rounded border p-3"
                  >
                    <div>
                      <div className="font-mono text-sm">{domain.domain}</div>
                      <div className="text-xs text-muted-foreground">
                        Added{" "}
                        {formatDistanceToNow(domain.createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDomain(domain.id)}
                      disabled={deleteDomainMutation.isLoading}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No domains found
              </div>
            )}
          </div>
        </div>
      </SheetContent>

      {/* Extend Trial Modal */}
      <Dialog
        open={showExtendTrialModal}
        onOpenChange={setShowExtendTrialModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>
              How many weeks would you like to extend the trial for{" "}
              <strong>{selectedOrg?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weeks" className="text-right">
                Weeks
              </Label>
              <Input
                id="weeks"
                type="number"
                min="1"
                max="52"
                value={weeksToAdd}
                onChange={(e) => setWeeksToAdd(e.target.value)}
                className="col-span-3"
                placeholder="4"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExtendTrialModal(false);
                setWeeksToAdd("4");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendTrial}
              disabled={extendTrialMutation.isLoading}
            >
              {extendTrialMutation.isLoading ? "Extending..." : "Extend Trial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Chat Count Modal */}
      <Dialog
        open={showUpdateChatCountModal}
        onOpenChange={setShowUpdateChatCountModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Trial Chat Limit</DialogTitle>
            <DialogDescription>
              Set the maximum number of chats allowed for{" "}
              <strong>{selectedOrg?.name}</strong> during their trial period.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chatCount" className="text-right">
                Chat Limit
              </Label>
              <Input
                id="chatCount"
                type="number"
                min="1"
                max="1000"
                value={newChatCount}
                onChange={(e) => setNewChatCount(e.target.value)}
                className="col-span-3"
                placeholder="5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUpdateChatCountModal(false);
                setNewChatCount("5");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateChatCount}
              disabled={updateChatCountMutation.isLoading}
            >
              {updateChatCountMutation.isLoading
                ? "Updating..."
                : "Update Limit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedOrg && (
        <Form990FilingsSheet
          organizationId={selectedOrg.id}
          organizationName={selectedOrg.name}
          isOpen={isForm990SheetOpen}
          onClose={() => setIsForm990SheetOpen(false)}
        />
      )}
    </Sheet>
  );
}