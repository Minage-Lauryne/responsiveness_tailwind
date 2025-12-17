"use client";
import React from "react";
import { toast } from "sonner";
import { Button, LoadingButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/features/shared/loading-spinner";

export default function AddDomain() {
  const [open, setOpen] = React.useState(false);
  const { data: me } = api.me.get.useQuery();
  const activeOrganization = me?.activeOrganization;

  const { data, isLoading } = api.organization.getCanBeAddedDomain.useQuery(
    {
      organizationId: activeOrganization?.id,
    },
    {
      enabled: !!activeOrganization?.id,
    },
  );
  const domain = data?.domain;

  const utils = api.useUtils();

  const mutation = api.organization.addDomain.useMutation({
    onSuccess: async ({ organization, domain }) => {
      toast.success(
        `Domain ${domain} added to organization ${organization.name}`,
      );
      await utils.organization.getDomains.invalidate();
      await utils.me.get.invalidate();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add domain: ${error.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen} aria-label="Edit profile">
      <DialogTrigger asChild>
        <Button variant="outline">Add domain to organization</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[600px]">
        <div className="flex flex-col gap-y-4 p-8">
          <div className="text-2xl font-bold">Set up your domain</div>
          <p className="text-sm text-muted-foreground">
            Select the domain you want to add to your organization. Users with
            this domain will be able to join your organization.
          </p>
          {!activeOrganization?.id ? (
            <div className="text-muted-foreground">
              No active organization found
            </div>
          ) : isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : domain ? (
            <div className="flex flex-col gap-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{domain}</span>
                <LoadingButton
                  variant="outline"
                  isLoading={mutation.isLoading}
                  onClick={() => {
                    mutation.mutate({
                      domain,
                      organizationId: activeOrganization.id,
                    });
                  }}
                >
                  Add
                </LoadingButton>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No domains available</div>
          )}
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
