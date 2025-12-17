"use client";

import * as React from "react";
import { Building2, Users, Crown, User, Eye, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import Link from "next/link";
import { truncateOrganizationName } from "@/lib/utils";

export function OrganizationCard() {
  const { data: user } = api.me.get.useQuery();
  const activeOrg = user?.activeOrganization;
  
  // Only fetch team overview if there's an active organization
  const { data: teamOverview } = api.team.getTeamOverview.useQuery(
    {},
    { enabled: !!activeOrg }
  );
  const userRole = user?.activeOrganizationMember?.role;
  const isAdmin = userRole === "ADMIN";

  if (!activeOrg) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            No Organization
          </CardTitle>
          <CardDescription>
            You're not part of any organization yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/app/organizations/search">
            <Button className="w-full">Find Organizations</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="h-4 w-4" />;
      case "MEMBER":
        return <User className="h-4 w-4" />;
      case "VIEWER":
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">{getRoleIcon(role)} Admin</Badge>;
      case "MEMBER":
        return <Badge variant="secondary">{getRoleIcon(role)} Member</Badge>;
      case "VIEWER":
        return <Badge variant="outline">{getRoleIcon(role)} Viewer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {truncateOrganizationName(activeOrg.name)}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              {userRole && getRoleBadge(userRole)}
            </CardDescription>
          </div>
          {isAdmin && (
            <Link href="/app/organizations/manage">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {teamOverview?.totalMembers || 0} member{(teamOverview?.totalMembers || 0) === 1 ? '' : 's'}
            </span>
          </div>
          {isAdmin && teamOverview?.totalInvitations && teamOverview.totalInvitations > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {teamOverview.totalInvitations} pending
              </Badge>
            </div>
          )}
        </div>
        {!isAdmin && (
          <div className="mt-4">
            <Link href="/app/organizations/search">
              <Button variant="outline" size="sm" className="w-full">
                Find More Organizations
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}