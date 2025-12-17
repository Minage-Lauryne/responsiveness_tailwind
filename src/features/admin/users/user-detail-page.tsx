"use client";

import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { Badge } from "@/components/ui/badge";
import { Button, LoadingButton } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import PageContainer from "@/features/dashboard-layout/page-container";
import { LoadingBlur } from "@/app/app/subject/components/loading-blur";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BetaModal } from "./beta-modal";
import { AdminModal } from "./admin-modal";
import { OrganizationSelector } from "./organization-selector";

export function UserDetailPage({ userId }: { userId: string }) {
  const getUrlMutation = api.admin.getSignedDownloadUrl.useMutation({
    onSuccess: (data) => {
      window.open(data, "_blank");
    },
  });
  const router = useRouter();
  const { data: userDetails, isLoading } = api.user.get.useQuery({
    id: userId,
  });

  if (!userDetails && !isLoading) {
    return (
      <PageContainer
        breadcrumbs={[
          {
            name: "Admin",
            href: "/app/admin",
          },
          {
            name: "Users",
            href: "/app/admin/users",
          },
          {
            name: "User Not Found",
          },
        ]}
      >
        <div>User not found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      breadcrumbs={[
        {
          name: "Admin",
          href: "/app/admin",
        },
        {
          name: "Users",
          href: "/app/admin/users",
        },
        {
          name: userDetails?.name || userDetails?.email || "Loading...",
        },
      ]}
    >
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {userDetails?.name || "Unnamed User"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card className="rounded-none border-none">
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <CopyToClipboard>{userDetails?.name || "—"}</CopyToClipboard>
                  {userDetails?.isAdmin && (
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  )}
                  {userDetails?.isBetaUser && (
                    <Badge variant="secondary" className="text-xs">
                      Beta User
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <div>
                  <CopyToClipboard>{userDetails?.email}</CopyToClipboard>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <div>
                  <CopyToClipboard className="font-mono text-sm">
                    {userDetails?.id}
                  </CopyToClipboard>
                </div>
              </div>

              {userDetails?.firstName && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <div>{userDetails?.firstName}</div>
                </div>
              )}

              {userDetails?.location && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Location
                  </label>
                  <div>{userDetails?.location}</div>
                </div>
              )}

              {userDetails?.url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    URL
                  </label>
                  <div>
                    <CopyToClipboard>{userDetails?.url}</CopyToClipboard>
                  </div>
                </div>
              )}

              {userDetails?.interests && userDetails?.interests.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Interests
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {userDetails?.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <div className="text-sm">
                    {userDetails?.createdAt.toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Active
                  </label>
                  <div className="text-sm">
                    {userDetails?.lastActive
                      ? formatDistanceToNow(userDetails?.lastActive, {
                          addSuffix: true,
                        })
                      : "Never"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card className="rounded-none border-none">
            <CardHeader>
              <CardTitle className="text-lg">Admin Actions</CardTitle>
              <CardDescription>
                Administrative controls for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Admin Privileges
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {userDetails?.isAdmin
                      ? "User has full admin access to the platform"
                      : "User does not have admin privileges"}
                  </p>
                </div>
                <AdminModal
                  isAdmin={userDetails?.isAdmin ?? false}
                  name={userDetails?.name ?? null}
                  userId={userDetails?.id ?? ""}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Beta Program</label>
                  <p className="text-sm text-muted-foreground">
                    {userDetails?.isBetaUser
                      ? "User has access to beta features"
                      : "User is not in the beta program"}
                  </p>
                </div>
                <BetaModal
                  isBetaUser={userDetails?.isBetaUser ?? false}
                  name={userDetails?.name ?? null}
                  userId={userDetails?.id ?? ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Organizations */}
          <Card className="rounded-none border-none">
            <CardHeader>
              <CardTitle className="text-lg">Organizations</CardTitle>
              <CardDescription>
                Manage the organizations this user has access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userDetails && (
                <div className="mb-4">
                  <OrganizationSelector user={userDetails} />
                </div>
              )}
              {userDetails?.organizations &&
                userDetails?.organizations.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {userDetails?.organizations.map((org) => (
                      <div
                        key={org.id}
                        className="flex items-center justify-between  p-4"
                      >
                        <div>
                          <Link
                            href={`/app/admin/organizations?organizationId=${org.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {org.name}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {org.role}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Joined {org.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              {(!userDetails?.organizations ||
                userDetails?.organizations.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  This user is not a member of any organizations
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          {userDetails?.sessions && userDetails?.sessions.length > 0 && (
            <Card className="rounded-none border-none">
              <CardHeader>
                <CardTitle className="text-lg">Recent Sessions</CardTitle>
                <CardDescription>
                  Last {userDetails?.sessions.length} sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {userDetails?.sessions.map((session, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {formatDistanceToNow(session.updatedAt, {
                              addSuffix: true,
                            })}
                          </div>
                          {session.ipAddress && (
                            <div className="text-sm text-muted-foreground">
                              IP: {session.ipAddress}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.updatedAt.toLocaleDateString()}
                        </div>
                      </div>
                      {session.userAgent && (
                        <div className="mt-2 truncate text-xs text-muted-foreground">
                          {session.userAgent}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Chats - Moved to bottom */}
        <Card className="rounded-none border-none">
          <CardHeader>
            <CardTitle className="text-lg">User Chats</CardTitle>
            <CardDescription>
              {userDetails?.subjects.length} subject
              {userDetails?.subjects.length === 1 ? "" : "s"} with research
              context and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {userDetails?.subjects.map((subject) => (
                <div key={subject.id} className="p-6">
                  {/* Subject Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-semibold">
                        {subject.title || "Untitled Subject"}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Created{" "}
                        {formatDistanceToNow(subject.createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {subject._count.chats} chat
                      {subject._count.chats === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {/* Subject Context */}
                  {subject.context && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-muted-foreground">
                        Research Context
                      </label>
                      <div className="mt-1 bg-muted p-3 text-sm">
                        {subject.context}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {subject.documents && subject.documents.length > 0 && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-muted-foreground">
                        Documents ({subject.documents.length})
                      </label>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {subject.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3"
                          >
                            <div className="flex flex-1 items-center gap-2">
                              <div className="truncate text-sm font-medium">
                                {doc.name}
                              </div>
                              <LoadingButton
                                isLoading={getUrlMutation.isLoading}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  getUrlMutation.mutate({
                                    filePath: doc.supabaseURL,
                                  });
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </LoadingButton>
                              <div className="text-xs text-muted-foreground">
                                {doc.fileType.toUpperCase()}
                                {doc.pageCount && ` • ${doc.pageCount} pages`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Activity by Type */}
                  {subject.chatsByType &&
                    Object.keys(subject.chatsByType).length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Chat Activity by Type
                        </label>
                        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                          {Object.entries(subject.chatsByType).map(
                            ([type, count]) => (
                              <div
                                key={type}
                                className="flex items-center justify-between  p-2"
                              >
                                <span className="text-xs capitalize">
                                  {type.toLowerCase().replace(/_/g, " ")}
                                </span>
                                <span className="text-xs font-medium">
                                  {count}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <LoadingBlur loading={isLoading} />
    </PageContainer>
  );
}
