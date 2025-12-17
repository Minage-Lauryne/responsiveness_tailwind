"use client";

import * as React from "react";
import { Users, UserPlus, Mail, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";

export function OrganizationOverview() {
  const { data: user } = api.me.get.useQuery();
  const activeOrg = user?.activeOrganization;
  
  const { data: teamOverview } = api.team.getTeamOverview.useQuery(
    {},
    { enabled: !!activeOrg }
  );
  const userRole = user?.activeOrganizationMember?.role;
  const isAdmin = userRole === "ADMIN";

  if (!activeOrg || !teamOverview) {
    return null;
  }

  const stats = [
    {
      title: "Total Members",
      value: teamOverview.totalMembers,
      icon: Users,
      description: "Active organization members",
    },
    {
      title: "Pending Invitations", 
      value: teamOverview.totalInvitations,
      icon: Mail,
      description: "Invitations waiting to be accepted",
    },
  ];

  if (teamOverview.seatInfo?.totalSeats) {
    stats.push({
      title: "Available Seats",
      value: teamOverview.seatInfo.totalSeats - (teamOverview.totalMembers + teamOverview.totalInvitations),
      icon: UserPlus,
      description: "Remaining seats for new members",
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Role</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {userRole === "ADMIN" && (
              <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-200">
                Admin
              </Badge>
            )}
            {userRole === "MEMBER" && (
              <Badge variant="secondary">Member</Badge>
            )}
            {userRole === "VIEWER" && (
              <Badge variant="outline">Viewer</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isAdmin ? "Full organization management" : 
             userRole === "MEMBER" ? "Can create and view analysis" : 
             "Can only view analysis"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}