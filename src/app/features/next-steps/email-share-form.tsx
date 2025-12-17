"use client";

import { useState } from "react";
import { Subject } from "@prisma/client";
import { Mail } from "lucide-react";
import { LoadingButton } from "@/components/ui/button";
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

const emailSchema = z.object({
  email: z.string().email("Please enter a valid recipient email address"),
  analysisType: z.string().default("General Analysis"),
});

type EmailType = z.infer<typeof emailSchema>;

interface EmailShareFormProps {
  subject: Subject;
  onSuccess: () => void;
  senderEmail: string;
  organizationId: string;
}

export function EmailShareForm({
  subject,
  onSuccess,
  senderEmail,
  organizationId,
}: EmailShareFormProps) {
  const form = useForm<EmailType>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      analysisType: "General Analysis",
    },
  });

  const sendEmail = api.email.send.useMutation();

  const onSubmit = async (values: EmailType) => {
    const cleanedSenderEmail = senderEmail?.trim().toLowerCase();
    const cleanedOrgId = organizationId?.trim();

    if (!cleanedSenderEmail || !cleanedOrgId) {
      toast.error("Missing sender email or organization ID");
      return;
    }

    sendEmail.mutate(
      {
        email: values.email.trim(),
        senderEmail: cleanedSenderEmail,
        organizationId: cleanedOrgId,
        subjectId: subject.id,
        analysisType: values.analysisType,
      },
      {
        onSuccess: () => {
          toast.success(`Report (${values.analysisType}) sent to ${values.email}`);
          form.reset();
          onSuccess();
        },
        onError: (error: { message?: string }) => {
          toast.error(error.message || "Failed to send email");
        },
      }
    );
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
                  disabled={sendEmail.isLoading}
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
                  disabled={sendEmail.isLoading}
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
            <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">What happens next:</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• A professional PDF report will be generated</li>
                <li>• The report will be emailed directly to the recipient</li>
                <li>• You’ll receive a confirmation once it's sent</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <LoadingButton type="submit" isLoading={sendEmail.isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            Send Report via Email
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}

