"use client";
import React from "react";
import { toast } from "sonner";
import { Button, LoadingButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";

export function BetaModal({
  isBetaUser,
  name,
  userId,
}: {
  isBetaUser: boolean;
  name: string | null;
  userId: string;
}) {
  const [open, setOpen] = React.useState(false);
  const utils = api.useUtils();
  const mutation = api.user.toggleBetaProgram.useMutation({
    onSuccess: async () => {
      await utils.user.list.invalidate();
      await utils.user.get.invalidate();
      toast.success(
        `User ${name} ${isBetaUser ? "removed from" : "added to"} beta program`,
      );
      setOpen(false);
    },
  });

  const [withWelcomeEmail, setWithWelcomeEmail] = React.useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen} aria-label="Edit profile">
      <DialogTrigger asChild>
        <Switch
          checked={isBetaUser}
          onCheckedChange={() => {
            setOpen(true);
          }}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {isBetaUser ? (
          <div>
            <DialogHeader>Remove from Beta Program?</DialogHeader>

            <div className="p-4">
              This user will no longer have access to Complere. They will not be
              notified.
            </div>
          </div>
        ) : (
          <div>
            <DialogHeader>Add to Beta Program?</DialogHeader>

            <div className="p-4">
              This user will be removed from the waitlist and have access to
              Complere.
            </div>

            <div className="flex items-center space-x-2 p-4">
              <Checkbox
                checked={withWelcomeEmail}
                onCheckedChange={() => setWithWelcomeEmail(!withWelcomeEmail)}
                id="withWelcomeEmail"
              />
              <Label htmlFor="withWelcomeEmail">Send welcome email</Label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between  space-x-2 p-4">
          {isBetaUser ? (
            <LoadingButton
              variant="default"
              onClick={() => {
                mutation.mutate({ id: userId, isBetaUser: false });
              }}
              isLoading={mutation.isLoading}
            >
              Remove from Beta Program
            </LoadingButton>
          ) : (
            <LoadingButton
              variant="default"
              onClick={() => {
                mutation.mutate({
                  id: userId,
                  isBetaUser: true,
                  withWelcomeEmail,
                });
              }}
              isLoading={mutation.isLoading}
            >
              Add to Beta Program
            </LoadingButton>
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
