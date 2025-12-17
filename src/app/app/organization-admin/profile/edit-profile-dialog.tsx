"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import LogoUploadDropzone from "./logo-upload-dropzone";
import { useProfile } from "./use-profile";

const editProfileSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  logo: z.any().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    name: string;
    logo?: string | null;
  };
  onSuccess: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSuccess,
}: EditProfileDialogProps) {
  const { logoPreview, uploadedUrl, status, clear } = useProfile() as any;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: profile.name,
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({ name: profile.name });
    } else {
      clear();
    }
  }, [open, profile.name, reset, clear]);

  const utils = api.useUtils();

  const updateProfile = api.organization.updateOrganizationProfile.useMutation({
    onSuccess: async () => {
      toast.success("Organization profile updated successfully");
      await utils.me.get.invalidate();
      onSuccess();
      clear();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: EditProfileFormData) => {
    try {
      let logoToSave: string | null | undefined = undefined;

      if (logoPreview === null && profile.logo) {
        logoToSave = null;
      } else if (uploadedUrl) {
        logoToSave = uploadedUrl;
      } else {
        logoToSave = undefined;
      }

      if (status === "uploading") {
        toast.error("Please wait for the upload to finish before saving.");
        return;
      }

      await updateProfile.mutateAsync({
        name: data.name,
        ...(logoToSave !== undefined && { logo: logoToSave }),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && isSubmitting) {
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Organization Profile</DialogTitle>
          <DialogDescription>
            Update your organization&apos;s name and logo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter organization name"
                disabled
                className="cursor-not-allowed bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">
                Organization name cannot be changed
              </p>
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Organization Logo</Label>
              <div className="flex items-start gap-4">
                <LogoUploadDropzone
                  organizationId={profile.id}
                  existingLogo={profile.logo ?? null}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || status === "uploading"}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || status === "uploading"}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : status === "uploading" ? (
                "Waiting for upload..."
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}