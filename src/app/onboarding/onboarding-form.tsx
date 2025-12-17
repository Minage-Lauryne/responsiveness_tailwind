"use client";

import { HelpTextBox } from "@/components/complere/help-text-box";
import { PageContainer } from "@/components/complere/page-container";
import { AIDisclaimer } from "@/components/complere/ai-disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { AIUsageRadioGroup } from "@/components/complere/ai-usage-radio-group";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";

const ON_BOARD_KEY = "onboarding-data";
const BILLIAM_EMAIL_KEY = "billiam-email";

export function OnboardingForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || localStorage.getItem(BILLIAM_EMAIL_KEY);
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    location: "",
    aiUsage: "occasionally",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (email) localStorage.setItem(BILLIAM_EMAIL_KEY, email);

    const saved = sessionStorage.getItem(ON_BOARD_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.fullName || parsed.firstName || parsed.location || parsed.aiUsage) {
          setFormData({
            fullName: parsed.fullName ?? "",
            firstName: parsed.firstName ?? "",
            location: parsed.location ?? "",
            aiUsage: parsed.aiUsage ?? "occasionally",
          });
        }
      } catch (error) {
        console.error("Failed to parse data", error)
      }
    }
  }, [email]);

  const handleChange = (
    eOrValue: React.ChangeEvent<HTMLInputElement> | string,
    name?: string
  ) => {
    const value = typeof eOrValue === "string" ? eOrValue : eOrValue.target.value;
    const fieldName = typeof eOrValue === "string" ? name! : eOrValue.target.name;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleFullNameBlur = () => {
    if (formData.fullName && !formData.firstName) {
      const firstName = formData.fullName.trim().split(" ")[0];
      setFormData((prev) => ({
        ...prev,
        firstName: firstName || "",
      }));
    }
  };

  const handleAIUsageChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      aiUsage: value,
    }));
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email) {
      setIsSubmitting(false);
      router.push("/register")
      return;
    }

    const draft = {
      email,
      fullName: formData.fullName,
      firstName: formData.firstName,
      location: formData.location,
      aiUsage: formData.aiUsage,
    };
    sessionStorage.setItem(ON_BOARD_KEY, JSON.stringify(draft));
    router.push("/onboarding/org");
  };

  return (
    <PageContainer
      title="Welcome"
      description="Let's get started."
      currentStep={1}
      totalSteps={3}
    >
      <div className="flex">
        <div className="w-2/3 pr-8">
          <form onSubmit={handleSubmit} className="relative h-full">
            <div className="space-y-8">
              {email && (
                <div className="text-sm text-muted-foreground mb-4">
                  Registering as <strong>{email}</strong>.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(BILLIAM_EMAIL_KEY);
                      sessionStorage.removeItem(ON_BOARD_KEY);
                      router.push("/register");
                    }}
                    className="text-blue-500 underline"
                  >
                    Wrong email? Sign out
                  </button>
                </div>
              )}

              <div>
                <label 
                  htmlFor="fullName" 
                  className="mb-2 block text-base font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                <Input
                    autoFocus
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleFullNameBlur}
                    required
                  className="h-14 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
                  />
              </div>
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-base font-medium text-gray-700"
                  >
                    First name: what should we call you?
                  </label>
                <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Enter your first name"
                  value={formData.firstName}
                    onChange={handleChange}
                    required
                  className="h-14 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
                  />
              </div>

              <div>
                <label
                    htmlFor="location"
                    className="mb-2 block text-base font-medium text-gray-700"
                  >
                    Location
                  </label>
                  <LocationAutocomplete
                    value={formData.location}
                    onChange={(value) => handleChange(value, "location")}
                  />

                </div>

              <div>
                <label className="mb-4 block text-base font-medium text-gray-700">
                    How often do you use AI in program work?
                  </label>
                <AIUsageRadioGroup
                    value={formData.aiUsage}
                    onChange={handleAIUsageChange}
                  />
              </div>
            </div>

            <div className="mt-16 text-right">
              <div className="flex items-center justify-end">
                <Button
                   type="submit" 
                   variant="default" 
                   effect="expandIcon" 
                   icon={ArrowRightIcon} 
                   iconPlacement="right"
                   disabled={
                    isSubmitting || 
                    !formData.fullName || 
                    !formData.firstName || 
                    !formData.location
                    }
                    >
                  {isSubmitting ? "Saving..." : "Next"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      {/* </div> */}

        <div className="w-1/3">
            <HelpTextBox title="">
              The more complete your profile and preferences, the better and
              more accurate the results are.
            </HelpTextBox>
        </div>
      </div>
      <AIDisclaimer />
    </PageContainer>
  );
}
