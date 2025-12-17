"use client";

import { HelpTextBox } from "@/components/complere/help-text-box";
import { PageContainer } from "@/components/complere/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getEmailData } from "@/lib/utils/email";
import { parseOnboardingData, type OnboardingFormData } from "@/types/onboarding";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

const ONBOARD_KEY = "onboarding-data";
const BILL_EMAIL_KEY = "billiam-email";

export function OrgForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRestorationFlow = searchParams.get("source") === "restoration";

  const { data: currentUser } = api.me.get.useQuery(undefined, { enabled: isRestorationFlow });
  
  const email = isRestorationFlow
    ? currentUser?.email ?? null
    : (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("email") ||
        localStorage.getItem(BILL_EMAIL_KEY)
      : null);

  let derivedDomain: string | null = null;
  if (email) {
    try {
      const d = getEmailData(email);
      if (d?.domain) derivedDomain = d.domain;
    } catch {
      derivedDomain = null;
    }
  }

  const {
    data: existingDomainCheck,
    isLoading: isCheckingDerivedDomain,
  } = api.organization.checkDomain.useQuery(
    { domain: derivedDomain ?? "" },
    { enabled: !!derivedDomain },
  );

  const {
    data: irsDomainCheck,
    isLoading: isCheckingIRSDomain,
  } = api.irs.checkByDomain.useQuery(
    { domain: derivedDomain ?? "" },
    { enabled: !!derivedDomain },
  );

  const {
    data: pendingInvitations,
    isLoading: isCheckingInvitations,
  } = api.invitation.findPendingInvitations.useQuery(
    { email: email ?? "" },
    { enabled: !!email && !isRestorationFlow },
  );

  const shouldShowLoading = !isRestorationFlow && isCheckingInvitations;

  const completeOrgOnboardingMutation = api.user.completeOrgOnboarding.useMutation({
    onError: (error) => {
      console.error("Failed to mark onboarding as complete:", error);
    },
  });

  const createOrgMutation = api.organization.createOrganization.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully!");
      completeOrgOnboardingMutation.mutate();
      router.push("/app");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create organization");
      setIsSubmitting(false);
    },
  });

  const requestToJoinMutation = api.organization.requestToJoin.useMutation({
    onSuccess: () => {
      toast.success("Join request sent successfully!");
      completeOrgOnboardingMutation.mutate();
      router.push("/app");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send join request");
      setIsSubmitting(false);
    },
  });

  const [nameQuery, setNameQuery] = useState("");
  const [debouncedNameQuery, setDebouncedNameQuery] = useState("");
  const [selectedExistingOrg, setSelectedExistingOrg] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: "", url: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedIRSOrg, setSelectedIRSOrg] = useState<any | null>(null);

  useEffect(() => {
    const query = nameQuery.trim();
    if (query.length <= 2) {
      setDebouncedNameQuery("");
      return;
    }
    const timeout = setTimeout(() => setDebouncedNameQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [nameQuery]);

  const {
    data: nameSearchResults,
    isLoading: isSearchingNames,
    isError: isNameSearchError,
  } = api.organization.searchOrganizations.useQuery(
    { query: debouncedNameQuery, limit: 10 },
    { enabled: debouncedNameQuery.length > 0 },
  );

  const {
    data: irsSearchResults,
    isLoading: isSearchingIRS,
  } = api.irs.searchOrganization.useQuery(
    { name: debouncedNameQuery, limit: 5 },
    { enabled: debouncedNameQuery.length > 3 },
  );

  const nameCheckForSubmit = api.organization.searchOrganizations.useQuery(
    { query: formData.name ?? "", limit: 10 },
    { enabled: false },
  );
  const domainCheckForSubmit = api.organization.checkDomain.useQuery(
    { domain: formData.url ?? "" },
    { enabled: false },
  );

  useEffect(() => {
    if (isRestorationFlow) {
      if (derivedDomain) {
        setFormData((p) => ({ ...p, url: derivedDomain ?? "" }));
      }
      return;
    }

    const saved = sessionStorage.getItem(ONBOARD_KEY);
    if (saved) {
      const parsed = parseOnboardingData(saved);
      if (parsed) {
        setFormData({
          name: parsed.organization?.name ?? "",
          url: parsed.organization?.url ?? parsed.url ?? "",
        });
      }
    }
    if (derivedDomain) {
      setFormData((p) => ({ ...p, url: derivedDomain ?? "" }));
    }
  }, [derivedDomain, isRestorationFlow]);

  useEffect(() => {
    if (irsDomainCheck?.organization) {
      setSelectedIRSOrg(irsDomainCheck.organization);
      if (irsDomainCheck.organization.name && !formData.name) {
        setFormData((prev) => ({ ...prev, name: irsDomainCheck.organization.name }));
      }
    }
  }, [irsDomainCheck]);

  useEffect(() => {
    if (!pendingInvitations || pendingInvitations.length === 0) return;

    try {
      const invitation = pendingInvitations[0];
      const marker = invitation?.id ? String(invitation.id) : "has-invite";
      sessionStorage.setItem("invitation", marker);
    } catch (error) {
      console.warn("Failed to save pending invitation marker:", error);
    }

    router.push("/onboarding/interests");
  }, [pendingInvitations, router]);

  const joinOrg = selectedExistingOrg ?? existingDomainCheck?.organization ?? null;

  const isOrgBlocked = joinOrg && (
    joinOrg.verificationStatus === "PENDING_ADMIN" ||
    joinOrg.verificationStatus === "INACTIVE"
  );

  const showJoinForm = !!joinOrg;

  const isAutoDetectedJoin =
    !!(
      derivedDomain &&
      existingDomainCheck?.hasExistingDomain &&
      existingDomainCheck.organization &&
      !selectedExistingOrg
    );

  const nameDropdownRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(e.target as Node)) {
        setNameQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "url") {
      setUrlError(null);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setNameQuery(value);
      setSelectedExistingOrg(null);
    } else if (name === "url") {
      setSelectedExistingOrg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const [domainRefetchResult, nameRefetchResult] = await Promise.all([
        domainCheckForSubmit.refetch(),
        nameCheckForSubmit.refetch(),
      ]);

      const domainResult = domainRefetchResult.data;
      const nameResults = nameRefetchResult.data ?? [];

      if (domainResult?.hasExistingDomain && domainResult.organization) {
        setSelectedExistingOrg(domainResult.organization);
        toast.info("We found an existing organization for that domain, request to join instead.");
        setIsSubmitting(false);
        return;
      }

      const nameLower = (formData.name ?? "").trim().toLowerCase();
      const exactNameMatch = (nameResults as any[]).find((r) => (r.name ?? "").trim().toLowerCase() === nameLower);

      if (exactNameMatch) {
        setSelectedExistingOrg(exactNameMatch);
        toast.info("An organization with this name already exists, request to join instead.");
        setIsSubmitting(false);
        return;
      }

      const organizationData: any = {
        name: formData.name,
        domain: formData.url,
        isUSBased: true,
      };

      if (selectedIRSOrg) {
        organizationData.irsVerification = {
          ein: selectedIRSOrg.ein || "",
          organizationName: selectedIRSOrg.name || "",
          exemptionStatus: selectedIRSOrg.exemptionStatus || "",
          subsection: selectedIRSOrg.subsection || "",
          taxPeriod: selectedIRSOrg.taxPeriod || "",
          verificationStatus: selectedIRSOrg.isAllowed ? "VERIFIED" : "INACTIVE",
        };
      } else {
        organizationData.irsVerification = {
          ein: "",
          organizationName: formData.name,
          exemptionStatus: "",
          subsection: "",
          taxPeriod: "",
          verificationStatus: "NOT_FOUND",
        };
      }

      if (isRestorationFlow) {
        await createOrgMutation.mutateAsync(organizationData);
        return;
      }

      const savedRaw = sessionStorage.getItem(ONBOARD_KEY);
      let draft: OnboardingFormData = {};
      if (savedRaw) {
        const parsedDraft = parseOnboardingData(savedRaw);
        if (parsedDraft) draft = parsedDraft;
      }

      organizationData.url = formData.url;
      const newDraft = { ...draft, organization: organizationData };
      sessionStorage.setItem(ONBOARD_KEY, JSON.stringify(newDraft));
      router.push("/onboarding/interests");
    } catch (err) {
      console.error("Validation check failed:", err);
      toast.error("Failed to validate organization name/domain. Try again.");
      setIsSubmitting(false);
    }
  };

  const handleRequestToJoin = (org: any) => {
    if (isRestorationFlow) {
      setIsSubmitting(true);
      requestToJoinMutation.mutate({
        organizationId: org.id,
        message: `Request from restored account`,
      });
      return;
    }

    const savedRaw = sessionStorage.getItem(ONBOARD_KEY);
    let draft: OnboardingFormData = {};
    if (savedRaw) {
      const parsedDraft = parseOnboardingData(savedRaw);
      if (parsedDraft) draft = parsedDraft;
    }
    const newDraft = {
      ...draft,
      joinExistingOrganization: {
        organizationId: org.id ?? "",
        organizationName: org.name ?? "",
      },
    };
    sessionStorage.setItem(ONBOARD_KEY, JSON.stringify(newDraft));
    router.push("/onboarding/interests");
  };

  const getVerificationStatus = (org: any) => {
    if (!org) return null;

    const status = org.exemptionStatus?.toLowerCase() || org.statusLabel?.toLowerCase() || "";

    if (org.isAllowed || status.includes("active")) {
      return { text: "IRS Verified", color: "text-green-600", bgColor: "bg-green-50", icon: CheckCircle2 };
    } else if (status.includes("revoked")) {
      return { text: "Revoked", color: "text-red-600", bgColor: "bg-red-50", icon: AlertTriangle };
    } else if (status.includes("terminated")) {
      return { text: "Terminated", color: "text-blue-600", bgColor: "bg-blue-50", icon: AlertTriangle };
    }
    return { text: "Status Unknown", color: "text-gray-600", bgColor: "bg-gray-50", icon: AlertTriangle };
  };

  const combinedResults = [];

  if (nameSearchResults && nameSearchResults.length > 0) {
    combinedResults.push({
      type: "header",
      label: "Existing Organizations",
    });
    nameSearchResults.forEach((org: any) => {
      combinedResults.push({
        type: "existing",
        data: org,
      });
    });
  }

  if (irsSearchResults && irsSearchResults.length > 0) {
    if (combinedResults.length > 0) {
      combinedResults.push({
        type: "divider",
      });
    }

    irsSearchResults.forEach((org: any) => {
      combinedResults.push({
        type: "irs",
        data: org,
      });
    });
  }

  const isLoading = isSearchingNames || isSearchingIRS;

  return (
    <PageContainer
      title={showJoinForm ? "Join Organization" : "Your Organization"}
      description={showJoinForm ? "Join your colleagues" : "Tell us about where you work"}
      currentStep={isRestorationFlow ? undefined : 2}
      totalSteps={isRestorationFlow ? undefined : 3}
    >
      <div className="flex">
        <div className="w-2/3 pr-8">
          {showJoinForm ? (
            <div className="relative h-full">
              <div className={`transition-all duration-200 ${shouldShowLoading ? "pointer-events-none opacity-50 blur-sm" : ""}`}>
                <div className="space-y-8">
                  {isOrgBlocked ? (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-900">Organization Unavailable</AlertTitle>
                      <AlertDescription className="text-sm text-red-800">
                        <p className="mb-2">
                          <strong>{joinOrg?.name}</strong> is currently pending administrator approval and cannot accept new members at this time.
                        </p>
                        <p>
                          This may be due to verification requirements. Please contact <strong>support@complere.ai</strong> if you need to join this organization.
                        </p>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        {joinOrg?.name}
                      </h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Your email domain ({existingDomainCheck?.domain ?? ""}) matches this organization. You can request to join or contact support if you need a new organization.
                      </p>
                      <div className="flex items-center space-x-3">
                        <Button
                          onClick={() => handleRequestToJoin(joinOrg)}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          {isSubmitting ? "Requesting..." : "Request to Join"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isAutoDetectedJoin && (
                    <div className="text-center">
                      <p className="mb-2 text-sm text-gray-500">
                        Want to create a new organization instead?
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedExistingOrg(null);
                          toast.info(
                            "Contact support if you need to create a separate organization with the same domain or name",
                          );
                        }}
                        disabled={isSubmitting}
                      >
                        Create New Organization
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative h-full">
              <div className={`transition-all duration-200 ${shouldShowLoading ? "pointer-events-none opacity-50 blur-sm" : ""}`}>
                <div className="space-y-8">

                  <div className="relative">
                    <label htmlFor="name" className="mb-2 block text-base font-medium text-gray-700">
                      Organization Name
                    </label>
                    <Input
                      id="name"
                      autoFocus
                      name="name"
                      type="text"
                      placeholder="Enter your company or organization name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-14 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
                    />
                    {nameQuery.trim().length > 2 && (
                      <div ref={nameDropdownRef} className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 text-sm text-gray-500 border-b">
                          {isLoading ? "Searching..." : `Results for "${nameQuery}"`}
                        </div>

                        {!isLoading && combinedResults.length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500">No organizations found – you'll create a new one.</div>
                        )}

                        {!isLoading && combinedResults.length > 0 && (
                          <div>
                            {combinedResults.map((item: any, idx: number) => {
                              if (item.type === "header") {
                                return (
                                  <div key={idx} className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border-b">
                                    {item.label}
                                  </div>
                                );
                              }

                              if (item.type === "divider") {
                                return <div key={idx} className="border-t my-1" />;
                              }

                              if (item.type === "existing") {
                                const org = item.data;
                                return (
                                  <div
                                    key={`existing-${org.id}`}
                                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    onClick={() => setSelectedExistingOrg(org)}
                                  >
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{org.name}</div>
                                      <div className="text-xs text-gray-500">{org.domains?.[0] ?? org.url}</div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedExistingOrg(org);
                                      }}
                                    >
                                      Request to Join
                                    </Button>
                                  </div>
                                );
                              }

                              if (item.type === "irs") {
                                const org = item.data;
                                const verificationStatus = getVerificationStatus(org);
                                const Icon = verificationStatus?.icon || ShieldCheck;

                                return (
                                  <div
                                    key={`irs-${org.ein}`}
                                    className={`px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0 ${selectedIRSOrg?.ein === org.ein
                                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                                        : "hover:bg-gray-50"
                                      }`}
                                    onClick={() => {
                                      setSelectedIRSOrg(org);
                                      setFormData((prev) => ({ ...prev, name: org.name }));
                                      setNameQuery(""); 
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{org.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Icon className={`h-3.5 w-3.5 ${verificationStatus?.color}`} />
                                          <span className={`text-xs font-semibold ${verificationStatus?.color}`}>
                                            {verificationStatus?.text}
                                          </span>
                                        </div>
                                      </div>
                                      {selectedIRSOrg?.ein === org.ein && (
                                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedIRSOrg && (() => {
                    const verificationStatus = getVerificationStatus(selectedIRSOrg);
                    const Icon = verificationStatus?.icon || ShieldCheck;
                    return (
                      <Alert className={`border-2 ${selectedIRSOrg.isAllowed
                          ? "border-green-300 bg-green-50"
                          : selectedIRSOrg.statusLabel?.toLowerCase().includes("revoked")
                            ? "border-red-300 bg-red-50"
                            : "border-blue-300 bg-blue-50"
                        }`}>
                        <Icon className={`h-5 w-5 ${verificationStatus?.color}`} />
                        <AlertTitle className="font-semibold">
                          <span className={verificationStatus?.color}>{verificationStatus?.text}</span>
                        </AlertTitle>
                        <AlertDescription className="text-sm mt-2">
                          <strong>{selectedIRSOrg.name}</strong> has been {
                            selectedIRSOrg.isAllowed
                              ? "verified in the IRS database with active tax-exempt status"
                              : selectedIRSOrg.statusLabel?.toLowerCase().includes("revoked")
                                ? "found in the IRS database but its tax-exempt status has been revoked"
                                : "found in the IRS database but its status has been terminated"
                          }.
                        </AlertDescription>
                      </Alert>
                    );
                  })()}

                  <div>
                    <label htmlFor="url" className="mb-2 block text-base font-medium text-gray-700">
                      Organization Domain or URL
                    </label>
                    <Input
                      id="url"
                      name="url"
                      type="text"
                      placeholder="example.com or https://example.com"
                      value={formData.url}
                      onChange={handleChange}
                      required
                      className={`h-14 w-full rounded-full border-gray-200 px-6 text-base shadow-none ${urlError ? "border-red-500" : ""}`}
                    />
                    {urlError && <p className="mt-1 text-sm text-red-500">{urlError}</p>}
                  </div>
                </div>

                <div className="mt-16 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    asChild
                    size="default"
                    className="border-black h-10 py-2"
                  >
                    <Link href={isRestorationFlow ? "/onboarding/organization" : "/onboarding"}>
                      Back
                    </Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="default"
                    className="h-10 py-2"
                  >
                    {isSubmitting ? "Saving..." : (isRestorationFlow ? "Create Organization" : "Next")}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="w-1/3">
          <HelpTextBox title={showJoinForm ? "Join Organization" : "Organization Details"}>
            {showJoinForm ? (
              <>
                <li>We found an organization that matches your domain.</li>
                <li>Request to join and your account will be associated to that organization after review.</li>
              </>
            ) : (
              <>
                <li>We automatically verify organizations against the IRS database.</li>
                <li>Your organization information helps customize your workspace and features.</li>
                <li>Domain-specific templates and workflows will be suggested based on your input.</li>
              </>
            )}
          </HelpTextBox>
        </div>
      </div>
    </PageContainer>
  );
}