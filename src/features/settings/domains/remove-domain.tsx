"use client";
import React from "react";
import { toast } from "sonner";
import { Button, LoadingButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/trpc/react";

type RemoveDomainProps = {
  domain: string;
};

export default function RemoveDomain({ domain }: RemoveDomainProps) {
  const [open, setOpen] = React.useState(false);
  const { data: me } = api.me.get.useQuery();
  const activeOrganization = me?.activeOrganization;

  const utils = api.useUtils();

  const mutation = api.organization.removeDomain.useMutation({
    onSuccess: async ({ organization, domain }) => {
      toast.success(
        `Domain ${domain} removed from organization ${organization.name}`,
      );
      setOpen(false);
      await utils.organization.getDomains.invalidate();
      await utils.me.get.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to remove domain: ${error.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen} aria-label="Edit profile">
      <DialogTrigger asChild>
        <Button variant="destructive">Remove</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[600px]">
        <div className="flex flex-col gap-y-4 p-8">
          <div className="text-2xl font-bold">Remove your domain</div>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{domain}</strong> from your
            organization?
          </p>

          <div className="flex justify-between">
            <Button
              variant="outline"
              className="w-fit"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              variant="destructive"
              isLoading={mutation.isLoading}
              disabled={!activeOrganization?.id}
              onClick={() => {
                if (activeOrganization?.id) {
                  mutation.mutate({
                    domain,
                    organizationId: activeOrganization.id,
                  });
                }
              }}
            >
              Remove
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
