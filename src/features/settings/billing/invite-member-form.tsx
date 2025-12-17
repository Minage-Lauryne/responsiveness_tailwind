"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { LoadingButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteMemberFormProps {
  onInviteSuccess: () => void;
  seatInfo: {
    hasAvailableSeats: boolean;
    currentMembers: number;
    pendingInvitations: number;
    totalSeats: number | null;
    isTrialOrFree: boolean;
  };
}

export function InviteMemberForm({
  onInviteSuccess,
  seatInfo,
}: InviteMemberFormProps) {
  const utils = api.useUtils();
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  });

  const inviteMutation = api.team.inviteMember.useMutation({
    onSuccess: async () => {
      toast.success("Invitation sent successfully!");
      form.reset();
      // Invalidate both team and billing caches
      await Promise.all([
        utils.team.getTeamOverview.invalidate(),
        utils.billing.listSubscriptions.invalidate(),
      ]);
      onInviteSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate({ email: data.email });
  };

  const canInvite = seatInfo.hasAvailableSeats;
  const isAtLimit =
    !seatInfo.isTrialOrFree &&
    seatInfo.totalSeats &&
    seatInfo.currentMembers + seatInfo.pendingInvitations >=
      seatInfo.totalSeats;

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    disabled={!canInvite || inviteMutation.isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-4">
            <LoadingButton
              type="submit"
              disabled={!canInvite || inviteMutation.isLoading}
              isLoading={inviteMutation.isLoading}
            >
              Send Invitation
            </LoadingButton>

            {isAtLimit && (
              <p className="text-sm text-destructive">
                Seat limit reached. Upgrade your subscription to invite more
                members.
              </p>
            )}
          </div>
        </form>
      </Form>

      {/* Real-time seat availability info */}
      <div className="text-sm text-muted-foreground">
        {seatInfo.isTrialOrFree ? (
          <p>You can invite unlimited members during your trial period.</p>
        ) : seatInfo.totalSeats ? (
          <p>
            {seatInfo.totalSeats -
              (seatInfo.currentMembers + seatInfo.pendingInvitations)}{" "}
            seats remaining
          </p>
        ) : (
          <p>You need an active subscription to invite members.</p>
        )}
      </div>
    </div>
  );
}
