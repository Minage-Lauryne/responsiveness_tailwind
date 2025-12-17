import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinRequestsManager } from "@/components/organization/join-requests-manager";
import { MembersManager } from "@/components/organization/members-manager";
import { OrganizationOverview } from "@/components/organization/organization-overview";
import { Users, UserPlus, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Manage Organization | Complēre",
  description: "Manage your organization members and join requests",
};

export default function ManageOrganizationPage() {
  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Organization Management</h1>
          <p className="text-muted-foreground">
            Manage your organization members, roles, and join requests.
          </p>
        </div>

        <OrganizationOverview />

        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Join Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organization Members
                </CardTitle>
                <CardDescription>
                  Invite new members, manage existing members, and control their roles and permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MembersManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Join Requests
                </CardTitle>
                <CardDescription>
                  Review and approve join requests from users who want to join your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JoinRequestsManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}