"use client";

import { PageContainer } from "@/components/complere/page-container";
import { Button } from "@/components/ui/button";
import { interests } from "@/lib/data/interests";
import { parseOnboardingData } from "@/types/onboarding";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ONBOARD_KEY = "onboarding-data";

export function InterestsForm() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(ONBOARD_KEY);
    if (saved) {
      const parsed = parseOnboardingData(saved);
      if (parsed?.interests && Array.isArray(parsed.interests)) {
        setSelectedInterests(parsed.interests);
      }
    }
  }, []);

  const registerForBeta = api.auth.registerForBeta.useMutation({
    onSuccess: (data) => {
      sessionStorage.removeItem(ONBOARD_KEY);
      
      if (data?.acceptedInvitations && data.acceptedInvitations > 0) {
        localStorage.removeItem("invite-redirect");
      }
      
      window.location.href = "/signin";
    },
    onError: (err) => {
      toast.error(err.message ?? "Registration failed");
    },
  });

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const cleanOrganizationData = (org: any) => {
    if (!org) return undefined;
    
    return {
      ...org,
      irsVerification: org.irsVerification ? {
        ein: org.irsVerification.ein || "",
        organizationName: org.irsVerification.organizationName || "",
        exemptionStatus: org.irsVerification.exemptionStatus || "", // Ensure not null
        subsection: org.irsVerification.subsection || "",
        taxPeriod: org.irsVerification.taxPeriod || "",
        verificationStatus: org.irsVerification.verificationStatus || "NOT_FOUND",
      } : {
        ein: "",
        organizationName: org.name || "",
        exemptionStatus: "",
        subsection: "",
        taxPeriod: "",
        verificationStatus: "NOT_FOUND",
      }
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const saved = sessionStorage.getItem(ONBOARD_KEY);
    if (!saved) {
      toast.error(" Please go back and complete the form.");
      return;
    }

    const draft = parseOnboardingData(saved);
    if (!draft) {
      toast.error("Something went wrong. Please start over.");
      return;
    }

    if (!draft.email || !draft.fullName || !draft.firstName || !draft.location || !draft.aiUsage) {
      toast.error("Please go back and complete all required fields.");
      return;
    }

    const cleanedOrganization = cleanOrganizationData(draft.organization);

    const payload = {
      email: draft.email,
      fullName: draft.fullName,
      firstName: draft.firstName,
      location: draft.location,
      aiUsage: draft.aiUsage,
      interests: selectedInterests,
      organization: cleanedOrganization,
      joinExistingOrganization: draft.joinExistingOrganization ?? undefined,
    };

    registerForBeta.mutate(payload);
  };

  const isLoading = registerForBeta.isLoading;

  return (
    <PageContainer
      title="Your Interests"
      description="Help us personalize your experience"
      currentStep={3}
      totalSteps={3}
    >
      <div className="flex h-full">
        <div className="max-h-[calc(100vh-200px)] w-full overflow-y-auto pr-8">
          <form onSubmit={handleSubmit} className="relative">
            <div
              className={`transition-all duration-200 ${
                isLoading ? "pointer-events-none opacity-50 blur-sm" : ""
              }`}
            >
          <h3 className="mb-6 text-base font-medium text-gray-700">
                Select your interests. This helps us personalize the reports you
                work on.
              </h3>
              <div className="flex flex-wrap gap-4">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={`relative rounded-[16px] px-6 py-4 text-center text-lg transition-all ${
                      selectedInterests.includes(interest.id)
                        ? "border border-blue-200 bg-gradient-to-r from-[rgba(110,191,244,0.26)] to-[rgba(113,214,247,0.1248)] font-semibold text-[#484139] shadow-[1px_3px_20px_-8px_rgba(0,0,0,0.41)] backdrop-blur-[42.8px] hover:translate-y-[-2px] hover:shadow-[1px_5px_25px_-6px_rgba(0,0,0,0.5)]"
                        : "bg-[rgba(205,198,190,0.26)] font-medium text-[#484139] backdrop-blur-[42.8px] hover:translate-y-[-2px] hover:bg-[rgba(205,198,190,0.4)] hover:shadow-md"
                    }`}
                  >
                    {interest.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-16">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  asChild
                  className="border-black"
                >
                  <Link href="/onboarding/org">
                    Back
                  </Link>
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Complete"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}