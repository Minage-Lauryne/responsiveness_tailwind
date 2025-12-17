"use client";

import { Users, MessageSquare, Clock, CreditCard, Crown, User as UserIcon, Eye, Search, Filter, Trash2, Mail, Calendar, ChevronDown, Check, X, MapPin } from "lucide-react";
import { DashboardCard } from "./dashboardCard";
import { useDashboardStats } from "@/hooks/useDashboard";
import { api } from "@/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfileDialog } from "../profile/edit-profile-dialog";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { memberCount, chatCount, requestCount, subscriptionCount } = useDashboardStats();
  const { data: session } = api.me.get.useQuery();
  const { data: members, refetch: refetchMembers } = api.organization.listMembers.useQuery({});
  const { data: profile, refetch } = api.organization.getOrganizationProfile.useQuery({}, { retry: false });
  const { data: allChats, isLoading: isChatsLoading, refetch: refetchChats } = api.chat.getHistory.useQuery(
    { type: "recent", limit: 50 },
    { refetchOnWindowFocus: false }
  );
  
  // Join requests section state
  const [activeTab, setActiveTab] = React.useState<"pending" | "accepted" | "rejected">("pending");
  
  const { data: requests, refetch: refetchRequests } = api.organization.getJoinRequests.useQuery({
    status: activeTab.toUpperCase() as "PENDING" | "ACCEPTED" | "REJECTED"
  });
  
  // Members section state
  const [memberSearch, setMemberSearch] = React.useState("");
  const [filterRole, setFilterRole] = React.useState<"ALL" | "ADMIN" | "MEMBER" | "VIEWER">("ALL");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [membersPerPage, setMembersPerPage] = React.useState(10);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = React.useState(false);
  
  // Join requests section state - moved above to use in query
  const [expandedRequestId, setExpandedRequestId] = React.useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = React.useState<string | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
  const [requestActionType, setRequestActionType] = React.useState<"ACCEPT" | "REJECT" | null>(null);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    void refetchChats();
  }, [refetchChats]);

  const role = session?.activeOrganizationMember?.role;
  const isOrgAdmin = role === "ADMIN";
  
  // Mutations
  const updateRole = api.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Member role updated successfully");
      void refetchMembers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const removeMember = api.organization.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed from organization");
      setIsRemoveDialogOpen(false);
      setSelectedMember(null);
      void refetchMembers();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRequest = api.organization.handleJoinRequest.useMutation({
    onSuccess: (data) => {
      toast.success(`Request ${data.action} successfully`);
      setIsRequestDialogOpen(false);
      setSelectedRequest(null);
      setRequestActionType(null);
      void refetchRequests();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Helper functions
  const isCurrentUser = (member: any) => member.user.id === session?.id;
  
  const handleRoleChange = (member: any, newRole: "ADMIN" | "MEMBER" | "VIEWER") => {
    if (isCurrentUser(member)) return;
    if (member.role === newRole) return;
    updateRole.mutate({ memberId: member.id, role: newRole });
  };

  const handleRemoveMember = (member: any) => {
    setSelectedMember(member);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveMember = () => {
    if (!selectedMember) return;
    removeMember.mutate({ memberId: selectedMember.id });
  };
  
  const handleRequestAction = (requestId: string, action: "ACCEPT" | "REJECT") => {
    setSelectedRequest(requestId);
    setRequestActionType(action);
    setIsRequestDialogOpen(true);
  };

  const confirmRequestAction = () => {
    if (!selectedRequest || !requestActionType) return;
    handleRequest.mutate({
      requestId: selectedRequest,
      action: requestActionType,
      ...(requestActionType === "ACCEPT" && { role: selectedRole }),
    });
  };
  
  const chatCountByUser = React.useMemo(() => {
    const map = new Map<string, number>();
    if (!allChats) return map;
    for (const chat of allChats) {
      const uid = (chat as any).userId as string | undefined;
      if (!uid) continue;
      map.set(uid, (map.get(uid) ?? 0) + 1);
    }
    return map;
  }, [allChats]);

  const getMemberChatCount = (memberUserId: string) => {
    return chatCountByUser.get(memberUserId) ?? 0;
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
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Members filtering and pagination
  const normalizedSearch = memberSearch.trim().toLowerCase();
  const filteredMembers = (members || []).filter((m: any) => {
    if (filterRole !== "ALL" && m.role !== filterRole) return false;
    if (!normalizedSearch) return true;
    const name = m.user.name ?? "";
    const email = m.user.email ?? "";
    return name.toLowerCase().includes(normalizedSearch) || email.toLowerCase().includes(normalizedSearch);
  });
  
  const totalMembers = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalMembers / membersPerPage));
  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const memberPreview = filteredMembers.slice(startIndex, endIndex);
  
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!isOrgAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
        <p>You must be an organization admin to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile?.name || session?.activeOrganization?.name || "Organization"}</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your organization profile</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Organization Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">View your organization information</p>
              </div>
              <button 
                onClick={() => setIsEditDialogOpen(true)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
                Edit Profile
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Organization Name
                </div>
                <div className="text-sm text-gray-900">{profile?.name || "Not provided"}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Email
                </div>
                <div className="text-sm text-gray-900">{profile?.adminEmail || session?.email || "Not provided"}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  Website
                </div>
                <div className="text-sm text-gray-500">{profile?.domain || "Not provided"}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Location
                </div>
                <div className="text-sm text-gray-500">{profile?.adminLocation || "Not provided"}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900">IRS Verification Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">Tax-exempt status and financial information</p>
            </div>
            <div className="text-sm text-gray-900">
              {profile?.irsVerified ? (
                <div className="flex items-center gap-2 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span>Organization is IRS verified</span>
                </div>
              ) : (
                <div className="text-gray-900">Organization is not IRS verified.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
            <p className="text-sm text-gray-500">
              Organization workspace overview and statistics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard 
              title="Active Subscriptions" 
              value={subscriptionCount} 
              description="Total active subscriptions"
              icon={<CreditCard className="h-5 w-5 text-gray-400" />}
            />
            <DashboardCard 
              title="Total Members" 
              value={memberCount} 
              description="Total members in the organization"
              icon={<Users className="h-5 w-5 text-gray-400" />}
            />
            <DashboardCard 
              title="Pending Requests" 
              value={requestCount} 
              description="Total pending join requests"
              icon={<Clock className="h-5 w-5 text-gray-400" />}
            />
            <DashboardCard 
              title="Total Chats" 
              value={chatCount} 
              description="Total number of chat conversations"
              icon={<MessageSquare className="h-5 w-5 text-gray-400" />}
            />
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Members</h2>
            <p className="text-xs text-gray-500">
              Manage your organization members and their roles.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setCurrentPage(1);
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
                <Select onValueChange={(v) => { setFilterRole(v as any); setCurrentPage(1); }} value={filterRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">Member</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Chat Count</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberPreview.length > 0 ? memberPreview.map((member: any) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                            {member.user.name?.split(" ").map((n: string) => n[0]).join("") || 
                             (member.organizationEmail || member.user.email)?.slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm text-gray-900">{member.user.name || "Unknown User"}</div>
                            {isCurrentUser(member) && <span className="text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">You</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {member.organizationEmail || member.user.email}
                            <span className="mx-1.5">·</span>
                            Joined {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {isChatsLoading ? "…" : getMemberChatCount(member.user.id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <Select
                        value={member.role}
                        onValueChange={(value: "ADMIN" | "MEMBER" | "VIEWER") => handleRoleChange(member, value)}
                        disabled={isCurrentUser(member) || updateRole.isPending}
                      >
                        <SelectTrigger className="rounded-full bg-purple-50 border-purple-200 px-3 py-1 min-w-[90px] hover:bg-purple-100 transition-colors mx-auto">
                          <div className="flex items-center gap-1.5 justify-center">
                            {member.role === "ADMIN" && <Crown className="h-3 w-3 text-purple-600" />}
                            {member.role === "MEMBER" && <UserIcon className="h-3 w-3 text-blue-600" />}
                            {member.role === "VIEWER" && <Eye className="h-3 w-3 text-gray-600" />}
                            <span className="text-xs font-medium">
                              {member.role === "ADMIN" ? "Admin" : member.role === "MEMBER" ? "Member" : "Viewer"}
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-purple-600" /> Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="MEMBER">
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-blue-600" /> Member
                            </div>
                          </SelectItem>
                          <SelectItem value="VIEWER">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-gray-600" /> Viewer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member)}
                        disabled={isCurrentUser(member) || removeMember.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <UserIcon className="h-10 w-10 mb-2" />
                        <p className="text-sm">No members match your search / filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-gray-600">
                <label className="inline-flex items-center gap-1.5">
                  <span>Show</span>
                  <select
                    value={membersPerPage}
                    onChange={(e) => { setMembersPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>per page</span>
                </label>
                <div className="text-xs text-gray-600">
                  Showing <span className="font-medium">{totalMembers > 0 ? startIndex + 1 : 0}</span>-<span className="font-medium">{Math.min(endIndex, totalMembers)}</span> of <span className="font-medium">{totalMembers}</span> filtered members
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7"
                  >
                    ‹
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7"
                  >
                    ›
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Requests Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Join Requests</h2>
            <p className="text-sm text-gray-500">
              Review and respond to pending membership requests.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value as "pending" | "accepted" | "rejected");
                setExpandedRequestId(null);
              }}
              className="w-full"
            >
              <div className="border-b border-gray-200">
                <TabsList className="h-auto p-0 bg-transparent border-none w-full grid grid-cols-3">
                  <TabsTrigger 
                    value="pending" 
                    className="px-6 py-3 text-sm font-medium border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger 
                    value="accepted"
                    className="px-6 py-3 text-sm font-medium border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700"
                  >
                    Accepted
                  </TabsTrigger>
                  <TabsTrigger 
                    value="rejected"
                    className="px-6 py-3 text-sm font-medium border-b-2 rounded-none data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 hover:text-gray-700"
                  >
                    Rejected
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="m-0">
                {!requests || requests.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                      <UserIcon className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      No pending join requests
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      New requests will appear here when users request to join your organization.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[35%]">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Received</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Status</th>
                          {activeTab === "pending" && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Actions</th>}
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map((request: any) => {
                          const isExpanded = expandedRequestId === request.id;
                          return (
                            <React.Fragment key={request.id}>
                              <tr
                                onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={request.user?.image || undefined} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                                        {request.user?.name
                                          ?.split(" ")
                                          .map((n: string) => n[0])
                                          .join("") || request.email.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm text-gray-900">
                                        {request.user?.name || "Unknown User"}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {request.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-xs text-gray-600">
                                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {getStatusBadge(request.status)}
                                </td>
                                {activeTab === "pending" && (
                                  <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestAction(request.id, "REJECT");
                                        }}
                                        disabled={handleRequest.isPending}
                                        className="text-xs px-2"
                                      >
                                        <X className="h-3 w-3 mr-1" />
                                        Reject
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestAction(request.id, "ACCEPT");
                                        }}
                                        disabled={handleRequest.isPending}
                                        className="text-xs px-2"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Accept
                                      </Button>
                                    </div>
                                  </td>
                                )}
                                <td className="pr-6 py-4">
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform text-gray-400 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                                  />
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={activeTab === "pending" ? 5 : 4} className="bg-gray-50 px-6 py-4">
                                    <div className="space-y-3 ml-[52px]">
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <MapPin className="h-3 w-3" />
                                        <div>{request.user?.location || "Location not provided"}</div>
                                      </div>
                                      {request.message && (
                                        <div className="flex items-start gap-2">
                                          <MessageSquare className="h-3 w-3 mt-0.5 text-gray-400" />
                                          <div>
                                            <p className="text-xs font-medium text-gray-900 mb-0.5">Message from applicant:</p>
                                            <p className="text-xs text-gray-600">{request.message}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        {profile && (
          <EditProfileDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            profile={profile}
            onSuccess={() => {
              void refetch();
              setIsEditDialogOpen(false);
            }}
          />
        )}

        {/* Remove Member Dialog */}
        <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{selectedMember?.user.name || selectedMember?.organizationEmail || selectedMember?.user.email}</strong> from the organization? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)} disabled={removeMember.isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRemoveMember} disabled={removeMember.isPending}>
                {removeMember.isPending ? "Removing..." : "Remove Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Join Request Action Dialog */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {requestActionType === "ACCEPT" ? "Accept" : "Reject"} Join Request
              </DialogTitle>
              <DialogDescription>
                {requestActionType === "ACCEPT"
                  ? `Accept ${requests?.find((r: any) => r.id === selectedRequest)?.user?.name || requests?.find((r: any) => r.id === selectedRequest)?.email} to join your organization?`
                  : `Reject the join request from ${requests?.find((r: any) => r.id === selectedRequest)?.user?.name || requests?.find((r: any) => r.id === selectedRequest)?.email}?`}
              </DialogDescription>
            </DialogHeader>

            {requestActionType === "ACCEPT" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Role</label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value: "ADMIN" | "MEMBER" | "VIEWER") =>
                      setSelectedRole(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">Viewer - Can only view analysis</SelectItem>
                      <SelectItem value="MEMBER">Member - Can create and view analysis</SelectItem>
                      <SelectItem value="ADMIN">Admin - Full organization management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(false)}
                disabled={handleRequest.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmRequestAction}
                disabled={handleRequest.isPending}
                variant={requestActionType === "REJECT" ? "destructive" : "default"}
              >
                {handleRequest.isPending ? "Processing..." : `${requestActionType === "ACCEPT" ? "Accept" : "Reject"} Request`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}