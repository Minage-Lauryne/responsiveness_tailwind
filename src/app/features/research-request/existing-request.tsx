"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle, FileText, Building, Mail, Target } from "lucide-react";
import { SubjectWithChat } from "@/app/app/subject/[id]/request/types";

export function ExistingRequest({ subject }: { subject: SubjectWithChat }) {
  if (!subject) return null;
  
  const request = subject.researchRequest;

  if (!request) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle className="h-8 w-8 text-black" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Research Request Submitted</h1>
          <p className="mx-auto max-w-2xl text-gray-600">
            Our research team has received your request and will begin review
            within 24 hours.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Request Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Request Overview</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Submitted{" "}
                {formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                })}
              </p>

              {request.withExpertReview && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  Expert review requested
                </div>
              )}
            </div>

            {request.selectedService && (
              <div className="space-y-2">
                <h3 className="font-medium">Service Type</h3>
                <p className="text-gray-600">{request.selectedService}</p>
              </div>
            )}
          </div>
        </div>

        {/* Research Details */}
        {(request.researchTitle ||
          request.researchObjective ||
          request.sectorFocus) && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Target className="h-5 w-5" />
              Research Details
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {request.researchTitle && (
                <div className="space-y-2">
                  <h3 className="font-medium">Research Title</h3>
                  <p className="text-gray-600">{request.researchTitle}</p>
                </div>
              )}

              {request.sectorFocus && (
                <div className="space-y-2">
                  <h3 className="font-medium">Sector Focus</h3>
                  <p className="text-gray-600">{request.sectorFocus}</p>
                </div>
              )}

              {request.researchObjective && (
                <div className="space-y-2 md:col-span-2">
                  <h3 className="font-medium">Research Objective</h3>
                  <p className="text-gray-600">{request.researchObjective}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(request.contactName || request.email || request.organization) && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Building className="h-5 w-5" />
              Contact Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {request.contactName && (
                <div className="space-y-2">
                  <h3 className="font-medium">Contact Name</h3>
                  <p className="text-gray-600">{request.contactName}</p>
                </div>
              )}

              {request.email && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4" />
                    Email
                  </h3>
                  <p className="text-gray-600">{request.email}</p>
                </div>
              )}

              {request.organization && (
                <div className="space-y-2">
                  <h3 className="font-medium">Organization</h3>
                  <p className="text-gray-600">{request.organization}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Context */}
        {request.context && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Additional Context</h2>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-gray-700">
                {request.context}
              </p>
            </div>
          </div>
        )}

        {/* Documents */}
        {subject.documents && subject.documents.length > 0 && (
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
              {subject.documents.map((doc) => (
                <div key={doc.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(doc.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
