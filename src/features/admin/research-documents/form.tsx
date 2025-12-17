"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const STATUS_OPTIONS = [
  "FREE",
  "WSIPP",
  "PURCHASE",
  "NO PDFs AVAILABLE FOR DOWNLOAD",
  "NO LINK TO PDF",
  "ACCESS REQUIRED",
  "PHOTOCOPY",
  "UNPUBLISHED",
  "WORKING PAPER",
] as const;

export type Status = (typeof STATUS_OPTIONS)[number];

const researchDocumentSchema = z.object({
  // Source fields (either file upload or URL)
  url: z.string().optional().nullable(),
  supabaseId: z.string().optional().nullable(),

  // Required metadata fields
  abstract: z.string().min(1, "Abstract is required"),
  citation: z.string().min(1, "Citation is required"),
  study_title: z.string().min(1, "Study title is required"),
  study_link: z
    .string()
    .url("Please enter a valid URL")
    .min(1, "PDF URL is required"),

  // Optional metadata fields
  gdive_link: z.string().url().optional(),
  meta_analysis_title: z.string().optional(),
  wsipp_link: z.string().url().optional(),
  gdrive_meta_analysis_link: z.string().url().optional(),
  status: z.enum(STATUS_OPTIONS),
  isArchived: z.boolean().default(false),
});

type FormData = z.infer<typeof researchDocumentSchema>;

interface ResearchDocumentFormProps {
  initialData?: Partial<FormData>;
  onSubmit?: (data: FormData) => void;
  isEditing?: boolean;
  documentId?: string;
}

export function ResearchDocumentForm({
  initialData,
  onSubmit,
  isEditing = false,
  documentId,
}: ResearchDocumentFormProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("url");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const utils = api.useUtils();

  // const createMutation = api.researchDocuments.create.useMutation({
  //   onSuccess: () => {
  //     toast.success("Document created");
  //     void utils.researchDocuments.list.invalidate();
  //     form.reset();
  //   },
  //   onError: (error) => {
  //     toast.error(error.message);
  //   },
  // });

  const updateMutation = api.researchDocuments.update.useMutation({
    onSuccess: () => {
      toast.success("Document updated");
      void utils.researchDocuments.getById.invalidate({ id: documentId! });
      // void utils.researchDocuments.getOpenSearchDocument.invalidate({
      //   id: documentId!,
      // });
      if (onSubmit) {
        onSubmit(form.getValues());
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(researchDocumentSchema),
    defaultValues: initialData || {
      abstract: "",
      citation: "",
      study_title: "",
      study_link: "",
      gdive_link: "",
      meta_analysis_title: "",
      wsipp_link: "",
      gdrive_meta_analysis_link: "",
      status: "FREE",
    },
  });

  const handleFileUploadComplete = (
    files: {
      path: string;
      name: string;
      type: string;
      documentId?: string;
      triggerTaskId?: string;
    }[],
  ) => {
    // When a file is uploaded, we'll get its URL and set it in the form
    const file = files[0]; // We only handle one file at a time
    if (file) {
      form.setValue("study_title", file.name.replace(/\.[^/.]+$/, "")); // Set filename as initial title
      form.setValue("study_link", file.path);
    }
  };

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && documentId) {
        await updateMutation.mutateAsync({
          id: documentId,
          data: {
            ...data,
            studyTitle: data.study_title,
            studyLink: data.study_link,
            isArchived: data.isArchived,
          },
        });
      } else {
        // await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="study_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Study Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="abstract"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abstract</FormLabel>
                <FormControl>
                  <Textarea {...field} className="min-h-[100px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="citation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Citation</FormLabel>
                <FormControl>
                  <Textarea {...field} className="min-h-[100px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isEditing && (
            <div className="rounded-lg border bg-card p-6">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "upload" | "url")}
                defaultValue="url"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Provide URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="pt-4">
                  <FormField
                    control={form.control}
                    name="study_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PDF URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the URL of the PDF document
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="upload" className="pt-4">
                  {/* <FileUploader
                    onUploadComplete={handleFileUploadComplete}
                    maxSizeMB={50}
                  /> */}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {isEditing && (
            <FormField
              control={form.control}
              name="study_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Link (PDF URL)</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" />
                  </FormControl>
                  {field.value && (
                    <div className="mt-2">
                      <a
                        href={field.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Original Study
                      </a>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="gdive_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GDrive Link</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                {field.value && (
                  <div className="mt-2">
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View in Google Drive
                    </a>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meta_analysis_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Analysis Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="wsipp_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WSIPP Link</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                {field.value && (
                  <div className="mt-2">
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View WSIPP Analysis
                    </a>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gdrive_meta_analysis_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GDrive Meta Analysis Link</FormLabel>
                <FormControl>
                  <Input {...field} type="url" />
                </FormControl>
                {field.value && (
                  <div className="mt-2">
                    <a
                      href={field.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Meta Analysis
                    </a>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Archive Document</FormLabel>
              <FormDescription>
                Archived documents will be hidden from search results
              </FormDescription>
            </div>
            <FormField
              control={form.control}
              name="isArchived"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>Saving...</>
            ) : isEditing ? (
              "Update Document"
            ) : (
              "Create Document"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
