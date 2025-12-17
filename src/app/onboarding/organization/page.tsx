"use client";

import { PageContainer } from "@/components/complere/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, PlusCircle, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrganizationSearch } from "@/components/organization/organization-search";
import { api } from "@/trpc/react";

type View = "main" | "search" | "create";

export default function OrganizationOnboarding() {
  const router = useRouter();
  const [view, setView] = useState<View>("main");
  const [prefilledSearch, setPrefilledSearch] = useState("");

  const completeOnboardingMutation = api.user.completeOrgOnboarding.useMutation({
    onError: (error) => {
      console.error("Failed to mark onboarding as complete:", error);
    },
  });

  if (view === "search") {
    return (
      <PageContainer
        title="Find Organizations"
        description="Search for organizations to join and collaborate with your colleagues"
      >
        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Search
              </CardTitle>
              <CardDescription>
                Find organizations by name or domain. You can request to join any organization,
                and their admins will review your request.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <OrganizationSearch 
                initialSearchQuery={prefilledSearch}
                onJoinSuccess={() => {
                  completeOnboardingMutation.mutate();
                  router.push("/app");
                }}
              />
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setView("main");
                    setPrefilledSearch("");
                  }}
                  className="flex-1"
                >
                  Back to Options
                </Button>
                <Button
                  onClick={() => {
                    completeOnboardingMutation.mutate();
                    router.push("/app");
                  }}
                  className="flex-1"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  if (view === "create") {
    router.push("/onboarding/org?source=restoration");
    return null;
  }


  return (
    <PageContainer
      title="Welcome Back!"
      description="Your personal workspace has been restored. Choose how you'd like to continue."
    >
      <div className="max-w-4xl space-y-6">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push("/app")}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Personal Workspace</CardTitle>
              <CardDescription className="text-sm">
                Continue working in your personal workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Your personal analyses restored</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Work independently</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Join organizations later</span>
                </li>
              </ul>
              <Button className="w-full" onClick={() => {
                completeOnboardingMutation.mutate();
                router.push("/app");
              }}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setView("search")}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Search className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Join Organization</CardTitle>
              <CardDescription className="text-sm">
                Search and request to join existing organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Rejoin your team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Access shared resources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>Collaborate with colleagues</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" onClick={() => setView("search")}>
                Search Organizations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setView("create")}>
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <PlusCircle className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Create Organization</CardTitle>
              <CardDescription className="text-sm">
                Set up a new organization workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Start fresh</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Invite team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Manage workspace settings</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline" onClick={() => setView("create")}>
                Create New
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Note:</strong> When you deleted your account, your organization memberships were removed. 
              Your personal workspace and analyses have been restored. Organization analyses remain with their respective organizations.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}