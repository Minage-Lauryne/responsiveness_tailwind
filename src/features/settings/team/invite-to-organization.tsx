"use client";
import { Button, LoadingButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputBlock } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const inviteSchema = z.object({
  emails: z.array(
    z.string().email({ message: "Please enter valid email addresses" }),
  ),
});

type InviteType = z.infer<typeof inviteSchema>;

export default function InviteToOrganization() {
  const [open, setOpen] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState("");

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
        setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!activeOrganization?.id}>
          Add user to organization
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[600px]">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-y-4 p-8">
            <div className="text-2xl font-bold">Invite Users</div>
            <FormField
              control={form.control}
              name="emails"
              render={() => (
                <FormItem className="flex flex-col gap-y-2">
                  <FormLabel>Email Addresses</FormLabel>
                  <FormControl>
                    <InputBlock
                      placeholder="Type email and press Enter or comma to add"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </FormControl>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("emails").map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => removeEmail(email)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FormDescription className="text-sm text-muted-foreground">
                    Enter email addresses separated by commas or press Enter
                    after each one. They will have access to all your
                    organization's resources.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoadingButton
              isLoading={mutation.isLoading}
              type="submit"
              disabled={form.watch("emails").length === 0}
            >
              Send Invites
            </LoadingButton>
            <Button
              variant="outline"
              className="w-fit"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
