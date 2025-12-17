"use client";
import React from "react";
import { toast } from "sonner";
import { Button, LoadingButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { AlertTriangle } from "lucide-react";

export function AdminModal({
  isAdmin,
  name,
  userId,
}: {
  isAdmin: boolean;
  name: string | null;
  userId: string;
}) {
  const [open, setOpen] = React.useState(false);
  const utils = api.useUtils();
  const mutation = api.admin.toggleAdminStatus.useMutation({
    onSuccess: async () => {
      await utils.user.list.invalidate();
      await utils.user.get.invalidate();
      toast.success(
        `User ${name} ${isAdmin ? "removed from" : "granted"} admin privileges`,
      );
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Switch
          checked={isAdmin}
          onCheckedChange={() => {
            setOpen(true);
          }}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {isAdmin ? (
          <>
            <DialogHeader>
              <DialogTitle>Remove Admin Privileges?</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm">
                This will revoke admin privileges from {name || "this user"}.
                They will no longer have access to the admin panel or be able to
                see other users' data.
              </p>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 ">
                <AlertTriangle className="h-5 w-5" />
                Grant Admin Privileges - DANGEROUS
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-destructive/10 p-4">
                <p className="mb-2 font-semibold ">
                  ⚠️ WARNING: This is an all-access privilege.
                </p>
                <p className="text-sm text-muted-foreground">
                  Granting admin privileges will give {name || "this user"}{" "}
                  <strong>unrestricted access</strong> to the entire platform,
                  including:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Full access to ALL user data </li>
                  <li>Ability to view, modify, and delete any user content</li>
                  <li>Permission to grant or revoke access for other users</li>
                  <li>Complete visibility into all platform activity</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                (NB: this does not give them admin access to the server nor
                postgres root access, that must be done manually.)
              </p>
              <p className="text-sm font-semibold">
                Only proceed if you are OK giving this user access to all user
                data.
              </p>
            </div>
          </>
        )}

        <div className="flex items-center justify-between space-x-2">
          {isAdmin ? (
            <LoadingButton
              variant="default"
              onClick={() => {
                mutation.mutate({ id: userId, isAdmin: false });
              }}
              isLoading={mutation.isLoading}
            >
              Remove Admin Privileges
            </LoadingButton>
          ) : (
            <LoadingButton
              variant="destructive"
              onClick={() => {
                mutation.mutate({
                  id: userId,
                  isAdmin: true,
                });
              }}
              isLoading={mutation.isLoading}
            >
              Yes, Grant Admin Access
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
