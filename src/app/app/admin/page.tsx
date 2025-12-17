"use client";

import {
  Users,
  Building2,
  CreditCard,
  Files,
  Search,
  Filter,
  Eye,
  Crown,
  User as UserIcon,
  ChevronDown,
  Check,
  X,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as React from "react";
import { api } from "@/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function DashboardCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: number;
  description: string;
  icon?: React.ReactNode;
  href?: string;
}) {
  const content = (
    <Card className="bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-6 px-6">
        <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          {title}
        </CardTitle>
        <div className="rounded-full bg-gray-100 p-3">{icon}</div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-4xl font-bold text-gray-900 mb-2">
          {value.toLocaleString()}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function PlatformAdminDashboard() {
  const { data: stats, isLoading: isStatsLoading } = api.admin.getStats.useQuery();

  const [userSearch, setUserSearch] = React.useState("");
  const [filterAdmin, setFilterAdmin] = React.useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [userPage, setUserPage] = React.useState(1);
  const usersPerPage = 10;

  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = api.admin.listUsers.useQuery({
    limit: 100,
    search: userSearch || undefined,
    isAdmin: filterAdmin === "ALL" ? undefined : filterAdmin === "ADMIN",
  });

  const [orgSearch, setOrgSearch] = React.useState("");
  const [orgPage, setOrgPage] = React.useState(1);
  const orgsPerPage = 10;

  const { data: orgsData, isLoading: isOrgsLoading } = api.admin.listOrganizations.useQuery({
    limit: 100,
    search: orgSearch || undefined,
  });

  const [requestsTab, setRequestsTab] = React.useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const { data: restorationRequests, refetch: refetchRequests } = api.admin.listRestorationRequests.useQuery({
    status: requestsTab,
    limit: 20,
  });

  const toggleAdmin = api.admin.toggleAdminStatus.useMutation({
    onSuccess: () => {
      toast.success("Admin status updated successfully");
      void refetchUsers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [isToggleAdminDialogOpen, setIsToggleAdminDialogOpen] = React.useState(false);

  const filteredUsers = usersData?.users || [];
  const totalUsers = filteredUsers.length;
  const totalUserPages = Math.max(1, Math.ceil(totalUsers / usersPerPage));
  const userStartIndex = (userPage - 1) * usersPerPage;
  const userEndIndex = userStartIndex + usersPerPage;
  const usersPreview = filteredUsers.slice(userStartIndex, userEndIndex);

  React.useEffect(() => {
    if (userPage > totalUserPages) setUserPage(totalUserPages);
  }, [userPage, totalUserPages]);

  const filteredOrgs = orgsData?.organizations || [];
  const totalOrgs = filteredOrgs.length;
  const totalOrgPages = Math.max(1, Math.ceil(totalOrgs / orgsPerPage));
  const orgStartIndex = (orgPage - 1) * orgsPerPage;
  const orgEndIndex = orgStartIndex + orgsPerPage;
  const orgsPreview = filteredOrgs.slice(orgStartIndex, orgEndIndex);

  React.useEffect(() => {
    if (orgPage > totalOrgPages) setOrgPage(totalOrgPages);
  }, [orgPage, totalOrgPages]);

  const handleToggleAdminClick = (user: any) => {
    setSelectedUser(user);
    setIsToggleAdminDialogOpen(true);
  };

  const confirmToggleAdmin = () => {
    if (!selectedUser) return;
    toggleAdmin.mutate({
      id: selectedUser.id,
      isAdmin: !selectedUser.isAdmin,
    });
    setIsToggleAdminDialogOpen(false);
    setSelectedUser(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "REJECTED":
      case "REJECTED_FINAL":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSubscriptionBadge = (org: any) => {
    if (org.freeForever) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Free Forever
        </Badge>
      );
    }
    if (org.hasActiveSubscription) {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          Active
        </Badge>
      );
    }
    if (org.trialEndsAt && new Date(org.trialEndsAt) > new Date()) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          Trial
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
        Expired
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Complere</h1>
            <p className="text-sm text-gray-500 mt-1">
              System overview and management
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
            <p className="text-sm text-gray-500">Platform statistics and metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Total Users"
              value={stats?.userCount ?? 0}
              description="Registered users in the system"
              icon={<Users className="h-5 w-5 text-gray-400" />}
              href="/app/admin/users"
            />
            <DashboardCard
              title="Organizations"
              value={stats?.organizationCount ?? 0}
              description="Active organizations"
              icon={<Building2 className="h-5 w-5 text-gray-400" />}
              href="/app/admin/organizations"
            />
            <DashboardCard
              title="Documents"
              value={stats?.documentCount ?? 0}
              description="Research documents in system"
              icon={<Files className="h-5 w-5 text-gray-400" />}
              href="/app/admin/documents"
            />
            <DashboardCard
              title="Active Subscriptions"
              value={stats?.activeSubscriptionCount ?? 0}
              description="Currently active subscriptions"
              icon={<CreditCard className="h-5 w-5 text-gray-400" />}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Users</h2>
              <p className="text-xs text-gray-500">
                Manage platform users and admin access.
              </p>
            </div>
            <Link href="/app/admin/users">
              <Button variant="outline" size="sm">
                View All Users
              </Button>
            </Link>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Search by name or email"
                    className="w-full rounded-md border border-gray-300 px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Select
                  onValueChange={(v) => {
                    setFilterAdmin(v as any);
                    setUserPage(1);
                  }}
                  value={filterAdmin}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="ADMIN">Admins</SelectItem>
                    <SelectItem value="USER">Non-Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">
                    User
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Chats
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                    Organizations
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Role
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isUsersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-sm text-gray-500">Loading users...</div>
                    </td>
                  </tr>
                ) : usersPreview.length > 0 ? (
                  usersPreview.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                              {user.name
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("") || user.email?.slice(0, 2).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm text-gray-900">
                                {user.name || "Unknown User"}
                              </div>
                              {user.isBetaUser && (
                                <span className="text-xs text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">
                                  Beta
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {user.email}
                              <span className="mx-1.5">·</span>
                              Joined{" "}
                              {formatDistanceToNow(new Date(user.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {user.chatCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {user.organizations.length > 0
                            ? user.organizations.map((o: any) => o.name).join(", ")
                            : "None"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <Badge
                          className={`${
                            user.isAdmin
                              ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {user.isAdmin ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <UserIcon className="h-3 w-3 mr-1" />
                              User
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/app/admin/users/${user.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAdminClick(user)}
                            className={`text-xs ${
                              user.isAdmin
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            }`}
                          >
                            {user.isAdmin ? "Remove Admin" : "Make Admin"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <UserIcon className="h-10 w-10 mb-2" />
                        <p className="text-sm">No users found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {totalUsers > 0 ? userStartIndex + 1 : 0}
                </span>
                -<span className="font-medium">{Math.min(userEndIndex, totalUsers)}</span> of{" "}
                <span className="font-medium">{totalUsers}</span> users
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">
                  Page {userPage} of {totalUserPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    className="h-7 w-7"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                    disabled={userPage === totalUserPages}
                    className="h-7 w-7"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Organizations</h2>
              <p className="text-xs text-gray-500">
                Manage organizations and their subscriptions.
              </p>
            </div>
            <Link href="/app/admin/organizations">
              <Button variant="outline" size="sm">
                View All Organizations
              </Button>
            </Link>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={orgSearch}
                    onChange={(e) => {
                      setOrgSearch(e.target.value);
                      setOrgPage(1);
                    }}
                    placeholder="Search organizations"
                    className="w-full rounded-md border border-gray-300 px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Members
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Chats
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isOrgsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-sm text-gray-500">Loading organizations...</div>
                    </td>
                  </tr>
                ) : orgsPreview.length > 0 ? (
                  orgsPreview.map((org: any) => (
                    <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 text-white font-bold text-sm shrink-0 overflow-hidden">
                            {org.logo ? (
                              <img
                                src={org.logo}
                                alt={org.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              org.name?.charAt(0).toUpperCase() || "O"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm text-gray-900">
                                {org.name}
                              </div>
                              {org.irsVerified && (
                                <span className="text-xs text-green-600 bg-green-50 rounded px-1.5 py-0.5">
                                  IRS Verified
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Created{" "}
                              {formatDistanceToNow(new Date(org.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {org.memberCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {org.chatCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {getSubscriptionBadge(org)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <Link href={`/app/admin/organizations?selected=${org.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Building2 className="h-10 w-10 mb-2" />
                        <p className="text-sm">No organizations found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <div className="text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {totalOrgs > 0 ? orgStartIndex + 1 : 0}
                </span>
                -<span className="font-medium">{Math.min(orgEndIndex, totalOrgs)}</span> of{" "}
                <span className="font-medium">{totalOrgs}</span> organizations
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">
                  Page {orgPage} of {totalOrgPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setOrgPage((p) => Math.max(1, p - 1))}
                    disabled={orgPage === 1}
                    className="h-7 w-7"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setOrgPage((p) => Math.min(totalOrgPages, p + 1))}
                    disabled={orgPage === totalOrgPages}
                    className="h-7 w-7"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Restoration Requests</h2>
            <p className="text-sm text-gray-500">
              Review and respond to account restoration requests.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Tabs
              value={requestsTab}
              onValueChange={(value) => setRequestsTab(value as any)}
              className="w-full"
            >
              <div className="border-b border-gray-200">
                <TabsList className="h-auto p-0 bg-transparent border-none w-full grid grid-cols-3">
                  <TabsTrigger
                    value="PENDING"
                    className="px-6 py-3 text-sm font-medium border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="APPROVED"
                    className="px-6 py-3 text-sm font-medium border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700"
                  >
                    Approved
                  </TabsTrigger>
                  <TabsTrigger
                    value="REJECTED"
                    className="px-6 py-3 text-sm font-medium border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700"
                  >
                    Rejected
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={requestsTab} className="m-0">
                {!restorationRequests || restorationRequests.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                      <UserIcon className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      No {requestsTab.toLowerCase()} restoration requests
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      {requestsTab === "PENDING"
                        ? "New requests will appear here when users request account restoration."
                        : `${requestsTab.toLowerCase().charAt(0).toUpperCase() + requestsTab.toLowerCase().slice(1)} requests will appear here.`}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">
                            Requested
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {restorationRequests.map((request: any) => (
                          <tr
                            key={request.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                                    {request.user?.name
                                      ?.split(" ")
                                      .map((n: string) => n[0])
                                      .join("") ||
                                      request.user?.email?.slice(0, 2).toUpperCase() ||
                                      "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm text-gray-900">
                                    {request.user?.name || "Unknown User"}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {request.user?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-gray-600">
                                {formatDistanceToNow(new Date(request.requestedAt), {
                                  addSuffix: true,
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                            <td className="px-6 py-4">
                              <Link href="/app/admin/restoration-requests">
                                <Button variant="ghost" size="sm" className="text-xs">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog open={isToggleAdminDialogOpen} onOpenChange={setIsToggleAdminDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedUser?.isAdmin ? "Remove Admin Access" : "Grant Admin Access"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.isAdmin
                  ? `Are you sure you want to remove admin access from ${selectedUser?.name || selectedUser?.email}?`
                  : `Are you sure you want to grant admin access to ${selectedUser?.name || selectedUser?.email}? They will have full platform administration privileges.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsToggleAdminDialogOpen(false)}
                disabled={toggleAdmin.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmToggleAdmin}
                disabled={toggleAdmin.isPending}
                variant={selectedUser?.isAdmin ? "destructive" : "default"}
              >
                {toggleAdmin.isPending
                  ? "Processing..."
                  : selectedUser?.isAdmin
                    ? "Remove Admin"
                    : "Grant Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}