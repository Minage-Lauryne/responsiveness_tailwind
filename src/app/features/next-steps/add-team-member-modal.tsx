"use client";

import { Button, LoadingButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

const inviteSchema = z.object({
  emails: z
    .array(z.string().email())
    .min(1, "Please add at least one email address"),
});

type InviteType = z.infer<typeof inviteSchema>;

interface AddTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeamMemberModal({
  open,
  onOpenChange,
}: AddTeamMemberModalProps) {
  const [emailInput, setEmailInput] = useState("");

  const { data: me } = api.me.get.useQuery();
  const activeOrganization = me?.activeOrganization;

  const form = useForm<InviteType>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      emails: [],
    },
  });

  const utils = api.useUtils();

  const mutation = api.organization.inviteUsers.useMutation({
    onSuccess: async ({ count, errors }) => {
      await Promise.all([
        utils.organization.listMembers.invalidate(),
        utils.me.get.invalidate(),
        utils.billing.listSubscriptions.invalidate(),
        utils.team.getTeamOverview.invalidate(),
      ]);

      if (count > 0) {
        toast.success(
          `Successfully invited ${count} user${count > 1 ? "s" : ""}`,
        );
      }

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
      }

      if (count > 0) {
        form.reset();
        setEmailInput("");
        onOpenChange(false);
      }
    },
    onError: (error) => {
      toast.error(`Failed to send invitations: ${error.message}`);
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const emails = emailInput
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
      const currentEmails = form.getValues("emails");
      const newEmails = [...new Set([...currentEmails, ...emails])];
      form.setValue("emails", newEmails);
      setEmailInput("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const currentEmails = form.getValues("emails");
    form.setValue(
      "emails",
      currentEmails.filter((email) => email !== emailToRemove),
    );
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return form.handleSubmit(async (values) => {
      if (!activeOrganization?.id) {
        toast.error("No active organization found");
        return;
      }

      mutation.mutate({
        organizationId: activeOrganization.id,
        emails: values.emails,
      });
    })();
  };

  const handleClose = () => {
    form.reset();
    setEmailInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Addresses</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter email addresses separated by commas or press Enter"
                        disabled={mutation.isLoading}
                      />
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((email) => (
                            <Badge
                              key={email}
                              variant="secondary"
                              className="pr-1"
                            >
                              {email}
                              <X
                                className="ml-2 size-3 cursor-pointer text-muted-foreground hover:text-foreground"
                                onClick={() => removeEmail(email)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={mutation.isLoading}
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                isLoading={mutation.isLoading}
                disabled={form.getValues("emails").length === 0}
              >
                Send Invitations
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
