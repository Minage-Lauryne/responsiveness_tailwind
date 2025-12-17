"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Mail } from "lucide-react";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteMemberFormProps {
  onInviteSuccess?: () => void;
}

export function InviteMemberForm({ onInviteSuccess }: InviteMemberFormProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const utils = api.useUtils();
  
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const { data: teamOverview } = api.team.getTeamOverview.useQuery({});

  const inviteMutation = api.team.inviteMember.useMutation({
    onSuccess: async () => {
      toast.success("Invitation sent successfully!");
      form.reset();
      setIsDialogOpen(false);
      
      await Promise.all([
        utils.team.getTeamOverview.invalidate(),
        utils.organization.listMembers.invalidate(),
      ]);
      
      onInviteSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate({ 
      email: data.email,
      role: data.role,
    });
  };

  const seatInfo = teamOverview?.seatInfo;
  const canInvite = seatInfo?.hasAvailableSeats ?? false;
  const isAtLimit = !seatInfo?.isTrialOrFree && 
    seatInfo?.totalSeats && 
    (seatInfo.currentMembers + seatInfo.pendingInvitations) >= seatInfo.totalSeats;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They'll receive an email with instructions to accept.
          </DialogDescription>
        </DialogHeader>

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

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!canInvite || inviteMutation.isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VIEWER">
                        <div>
                          <div className="font-medium">Viewer</div>
                          <div className="text-xs text-muted-foreground">Can only view analysis</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEMBER">
                        <div>
                          <div className="font-medium">Member</div>
                          <div className="text-xs text-muted-foreground">Can create and view analysis</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-muted-foreground">Full organization management</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-muted p-3 text-sm">
              {seatInfo?.isTrialOrFree ? (
                <p className="text-muted-foreground">
                  ✨ You can invite unlimited members during your trial period.
                </p>
              ) : seatInfo?.totalSeats ? (
                <p className="text-muted-foreground">
                  📊 {seatInfo.totalSeats - (seatInfo.currentMembers + seatInfo.pendingInvitations)} seats remaining
                </p>
              ) : (
                <p className="text-destructive ">
                  ⚠️ You need an active subscription to invite members.
                </p>
              )}
            </div>

            {isAtLimit && (
              <div className="rounded-lg  bg-destructive/10 p-3 text-sm text-blue-400">
                <p>Seat limit reached. Upgrade your subscription to invite more members</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={inviteMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canInvite || inviteMutation.isLoading}
              >
                {inviteMutation.isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
