import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminOnly } from "@/components/organization/role-guard";
import { Building2, Settings, Users, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Organization Settings | Complēre",
  description: "Manage your organization settings and configuration",
};

export default function OrganizationSettingsPage() {
  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
          <p className="text-muted-foreground">
            Configure your organization settings and preferences.
          </p>
        </div>

        <AdminOnly>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="domains" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domains
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Information</CardTitle>
                  <CardDescription>
                    Basic information about your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Organization settings coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domains" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Domain Management</CardTitle>
                  <CardDescription>
                    Manage email domains associated with your organization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Domain management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Subscription</CardTitle>
                  <CardDescription>
                    Manage your organization's subscription and billing settings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Billing settings coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </AdminOnly>
      </div>
    </div>
  );
}