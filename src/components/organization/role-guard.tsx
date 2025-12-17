"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { api } from "@/trpc/react";

interface RoleGuardProps {
  allowedRoles: ("ADMIN" | "MEMBER" | "VIEWER")[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  action?: string; // Description of what action is being restricted
}




export function RoleGuard({ allowedRoles, children, fallback, action = "perform this action" }: RoleGuardProps) {
  const { data: user } = api.me.get.useQuery();

  const userRole = user?.activeOrganizationMember?.role;
  const isPersonalWorkspace = user?.activeOrganization?.id === null;

  const hasPermission = isPersonalWorkspace || (userRole && allowedRoles.includes(userRole as "ADMIN" | "MEMBER" | "VIEWER"));


  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">Access Restricted</CardTitle>
          <CardDescription>
            You need {allowedRoles.length === 1 ? 'a' : 'one of the following'} {' '}
            <span className="font-medium">
              {allowedRoles.join(', ')}
            </span> role{allowedRoles.length === 1 ? '' : 's'} to {action}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {userRole ? (
            <>Your current role is <span className="font-medium">{userRole}</span>. Contact your organization admin to request access.</>
          ) : (
            <>You are not a member of any organization. Please join an organization first.</>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  return (
    <RoleGuard
      allowedRoles={["ADMIN"]}
      action="access admin features"
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

interface MemberOrAdminProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  action?: string;
}

export function MemberOrAdmin({ children, fallback, action = "create content" }: MemberOrAdminProps) {
  return (
    <RoleGuard
      allowedRoles={["ADMIN", "MEMBER"]}
      action={action}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function RoleOnlyView({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: ("ADMIN" | "MEMBER" | "VIEWER")[] }) {

  const { data: user } = api.me.get.useQuery();

  const userRole = user?.activeOrganizationMember?.role;
  const isPersonalWorkspace = user?.activeOrganization?.id === null;
  const hasPermission = isPersonalWorkspace || (userRole && allowedRoles.includes(userRole as "ADMIN" | "MEMBER" | "VIEWER"));

  if (!hasPermission) {
    return null;
  }

  return (
    <>
      {children}
    </>

  )
}