"use client";

import * as React from "react";
import { api } from "@/trpc/react";
import { OrganizationDetails } from "./organization-details";
import { IrsVerificationDetails } from "./irs-verification-details";
import { Form990SummaryCard } from "./form-990-summary-card";
import { EditProfileDialog } from "./edit-profile-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Form990FilingsSheet } from "@/components/form990/form-990-filings-sheet";

export default function OrganizationProfilePage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isForm990SheetOpen, setIsForm990SheetOpen] = React.useState(false);
  const { data: profile, isLoading, error, refetch } = api.organization.getOrganizationProfile.useQuery(
    {},
    {
      retry: false,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isForbidden = error.data?.code === "FORBIDDEN";
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className={`bg-white rounded-lg border p-6 ${isForbidden ? 'border-red-200' : 'border-gray-200'}`}>
            <h2 className={`text-xl font-semibold ${isForbidden ? 'text-red-500' : 'text-gray-900'}`}>
              {isForbidden ? 'Access Denied' : 'Organization Not Found'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isForbidden 
                ? 'You must be an organization admin to view this page.' 
                : 'Unable to load organization profile. Please select an organization workspace.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-gray-500 mt-2">
              Manage your organization profile
            </p>
          </div>
          <button
            onClick={() => setIsEditDialogOpen(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            Edit Profile
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization Details</h2>
          <p className="text-sm text-gray-500 mb-6">View your organization information</p>
          <OrganizationDetails
            profile={profile}
            onEdit={() => setIsEditDialogOpen(true)}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">IRS Verification Details</h2>
          <p className="text-sm text-gray-500 mb-6">Tax-exempt status and financial information</p>
          <IrsVerificationDetails profile={profile} />
        </div>

        {profile.irsVerified && profile.id && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Form 990 Summary</h2>
            <Form990SummaryCard
              organizationId={profile.id}
              onViewAll={() => setIsForm990SheetOpen(true)}
            />
          </div>
        )}

        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          profile={profile}
          onSuccess={() => {
            void refetch();
            setIsEditDialogOpen(false);
          }}
        />

        {profile.irsVerified && profile.id && (
          <Form990FilingsSheet
            organizationId={profile.id}
            organizationName={profile.name}
            isOpen={isForm990SheetOpen}
            onClose={() => setIsForm990SheetOpen(false)}
          />
        )}
      </div>
    </div>
  );
}