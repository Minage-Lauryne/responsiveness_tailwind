"use client";

import { SubjectWithChat } from "@/app/app/subject/[id]/request/types";
import { Me } from "@/app/app/types";
import { LoadingButton } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { ArrowRight, CircleCheck } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { ExistingRequest } from "./existing-request";
import { RequestFileUpload } from "./uploads";

const serviceOptions = [
  {
    value: "expanded-plus-expert",
    title: "Expanded Research + Expert Review",
    features: [
      "Deep AI research analysis",
      "Expert subject matter review & validation",
      "Bias detection & counterpoints",
      "Human-verified insights",
    ],
    price: "$2,500",
    timeline: "10-14 business days",
  },
  {
    value: "expanded",
    title: "Expanded Research",
    features: [
      "Deep AI research analysis",
      "Bias detection & counterpoints",
      "Comprehensive documentation",
    ],
    price: "$1,200",
    timeline: "3-5 business days",
  },
];

export function RequestForm({
  subject,
  me,
}: {
  subject?: SubjectWithChat;
  me: Me | null;
}) {
  const utils = api.useUtils();
  const createResearchRequest = api.subject.createResearchRequest.useMutation({
    onSuccess: async () => {
      toast("Research request submitted");
      if (subject?.id) {
        await utils.subject.get.invalidate(subject.id);
      }
    },
    onError: (error) => {
      toast(error.message);
    },
  });

  const [documentIds, setDocumentIds] = React.useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = React.useState(false);

  const [requestDetails, setRequestDetails] = useState("");
  const [contactName, setContactName] = useState(me?.name ?? "");
  const [email, setEmail] = useState(me?.email ?? "");
  const [organization, setOrganization] = useState(
    me?.activeOrganization?.name ?? "",
  );
  const [researchTitle, setResearchTitle] = useState(subject?.title ?? "");
  const [researchObjective, setResearchObjective] = useState("");
  const [sectorFocus, setSectorFocus] = useState("");
  const [selectedService, setSelectedService] = useState(
    serviceOptions[0]?.value ?? "expanded-plus-expert",
  );

  const isSubmitDisabled = createResearchRequest.isLoading || isUploadingFiles;

  const handleSubmit = () => {
    if (isSubmitDisabled) return;

    createResearchRequest.mutate({
      subjectId: subject?.id,
      context: requestDetails || undefined,
      documentIds,
      withExpertReview: selectedService === "expanded-plus-expert",
      contactName,
      email,
      organization,
      researchTitle,
      researchObjective,
      sectorFocus,
      selectedService,
    });
  };

  if (subject?.researchRequest) {
    return <ExistingRequest subject={subject} />;
  }

  return (
    <div className="rounded-lg border bg-white p-8 shadow-sm">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-medium text-gray-900">
            Research Request Details
          </h2>
          <p className="text-gray-600">
            Please provide detailed information about your research needs
          </p>
        </div>

        <div className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Service Package *</Label>
            <RadioGroup.Root
              value={selectedService}
              onValueChange={setSelectedService}
              className="grid gap-3 md:grid-cols-2"
            >
              {serviceOptions.map((option) => (
                <RadioGroup.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "group relative cursor-pointer rounded-lg p-3 text-start ring-[1px] ring-border",
                    "data-[state=checked]:ring-2 data-[state=checked]:ring-foreground",
                    "transition-all hover:ring-muted-foreground",
                  )}
                >
                  <CircleCheck className="absolute right-2 top-2 h-4 w-4 fill-foreground stroke-background group-data-[state=unchecked]:hidden" />

                  <div className="space-y-2">
                    <h3 className="pr-5 text-base font-medium text-gray-900">
                      {option.title}
                    </h3>

                    <div className="space-y-1">
                      {option.features.slice(0, 2).map((feature, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          • {feature}
                        </div>
                      ))}
                      {option.features.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{option.features.length - 2} more
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-2">
                      <div className="text-lg font-medium text-gray-900">
                        {option.price}
                      </div>
                      <div className="text-xs text-gray-600">
                        {option.timeline}
                      </div>
                    </div>
                  </div>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="contact-name" className="text-sm font-medium">
                Contact Name *
              </Label>
              <input
                id="contact-name"
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Your full name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <input
                id="email"
                type="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="your.email@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="organization" className="text-sm font-medium">
              Organization/Foundation *
            </Label>
            <input
              id="organization"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Your organization or foundation name"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="research-title" className="text-sm font-medium">
              Research Title/Topic *
            </Label>
            <input
              id="research-title"
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Brief title describing your research focus"
              value={researchTitle}
              onChange={(e) => setResearchTitle(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="research-objective" className="text-sm font-medium">
              Research Objective *
            </Label>
            <Textarea
              id="research-objective"
              placeholder="What is the main goal or purpose of this research? What decisions will it inform?"
              rows={3}
              className="resize-none"
              value={researchObjective}
              onChange={(e) => setResearchObjective(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="research-questions" className="text-sm font-medium">
              Specific Research Questions
            </Label>
            <Textarea
              id="research-questions"
              placeholder="What specific questions should the research address? List key areas of inquiry..."
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="sector-focus" className="text-sm font-medium">
              Organization/Sector Focus
            </Label>
            <select
              id="sector-focus"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              value={sectorFocus}
              onChange={(e) => setSectorFocus(e.target.value)}
            >
              <option value="">Select focus area</option>
              <option value="education">Education</option>
              <option value="health-medical">Health & Medical</option>
              <option value="environment">Environment</option>
              <option value="poverty-alleviation">Poverty Alleviation</option>
              <option value="human-rights">Human Rights</option>
              <option value="arts-culture">Arts & Culture</option>
              <option value="disaster-relief">Disaster Relief</option>
              <option value="other">Other</option>
            </select>
          </div>

          <RequestFileUpload
            onDocumentAdded={(id) => {
              setDocumentIds((prev) => [...prev, id]);
            }}
            onUploadStateChange={setIsUploadingFiles}
          />

          <LoadingButton
            onClick={handleSubmit}
            className="h-12 w-full bg-gray-900 text-base font-medium hover:bg-gray-800"
            isLoading={createResearchRequest.isLoading}
            disabled={isSubmitDisabled}
          >
            {isUploadingFiles
              ? "Uploading files..."
              : "Submit Research Request"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </LoadingButton>

          <p className="text-center text-xs text-gray-500">
            No obligation • Free consultation • Response within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
