import { Metadata } from "next";
import { OrganizationSearch } from "@/components/organization/organization-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Find Organizations | Complēre",
  description: "Search and request to join organizations on Complēre",
};

export default function SearchOrganizationsPage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Find Organizations</h1>
          <p className="text-muted-foreground">
            Search for organizations to join and collaborate with your colleagues.
          </p>
        </div>

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
          <CardContent>
            <OrganizationSearch />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}