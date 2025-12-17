"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button, LoadingButton } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/trpc/react";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  analysisType: z.string().default("General Analysis"),
});

type InviteType = z.infer<typeof inviteSchema>;

interface InviteTeamMemberFormProps {
  subjectId: string;
  onSuccess: () => void;
}

export function InviteTeamMemberForm({
  subjectId,
  onSuccess,
}: InviteTeamMemberFormProps) {
  const [isInviting, setIsInviting] = useState(false);

  const { data: me } = api.me.get.useQuery();
  const activeOrganization = me?.activeOrganization;

  const form = useForm<InviteType>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      analysisType: "General Analysis",
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
        toast.success(`Successfully invited ${count} user${count > 1 ? "s" : ""}`);
      }

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
      }

      if (count > 0) {
        form.reset();

        try {
          const response = await fetch(`/api/subject/${subjectId}/share`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              emails: [form.getValues("email")],
              analysisType: form.getValues("analysisType"),
            }),
          });

          if (response.ok) {
            toast.success("Access granted to the analysis");
          }
        } catch (error) {
          console.error("Error granting access:", error);
          toast.error("Failed to grant access to the analysis");
        }

        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  const onSubmit = (values: InviteType) => {
    if (!activeOrganization?.id) {
      toast.error("No active organization found");
      return;
    }

    setIsInviting(true);
    mutation.mutate({
      organizationId: activeOrganization.id,
      emails: [values.email],
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
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
                  disabled={isInviting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="analysisType"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-y-4">
              <FormLabel>Type of Analysis</FormLabel>
              <FormControl>
                <Select
                  disabled={isInviting}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="border border-gray-200 focus:ring-0 focus:border-gray-300 rounded-md px-3 py-2">
                    <span>{field.value}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="General Analysis"
                      className="px-8 py-2 border-b border-slate-200 cursor-pointer"
                    >
                      General analysis
                    </SelectItem>
                    <SelectItem
                      value="Two Page Summary"
                      className="px-8 py-2 border-b border-slate-200 cursor-pointer"
                    >
                      Two page summary
                    </SelectItem>
                    <SelectItem
                      value="Comprehensive Analysis"
                      className="px-8 py-2 border-b border-slate-200 cursor-pointer"
                    >
                      Comprehensive analysis
                    </SelectItem>
                    <SelectItem
                      value="Most Recent Analysis"
                      className="px-8 py-2 cursor-pointer"
                    >
                      Most recent analysis
                    </SelectItem>
                  </SelectContent>

                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <div className="flex items-start gap-2">
            <Users className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">What happens next:</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• The user will be invited to your organization</li>
                <li>• They’ll be granted access to this analysis</li>
                <li>• You’ll receive a confirmation once access is granted</li>
              </ul>
            </div>
          </div>
        </div>


        <div className="flex justify-end gap-2 pt-4">
          <LoadingButton type="submit" isLoading={isInviting}>
            <Users className="mr-2 h-4 w-4" />
            Send Invitation
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}




