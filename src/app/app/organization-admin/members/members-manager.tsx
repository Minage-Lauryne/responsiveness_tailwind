"use client";

import * as React from "react";
import { User, Eye, Trash2, Mail, Calendar, Crown, Search, Filter, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Member {
  id: string;
  role: "ADMIN" | "MEMBER" | "VIEWER" | string;
  organizationEmail?: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export function MembersManager() {
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filterRole, setFilterRole] = React.useState<"ALL" | "ADMIN" | "MEMBER" | "VIEWER">("ALL");

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState<number>(50);

  const { data: currentUser } = api.me.get.useQuery();
  const { data: members, isLoading, refetch, error } = api.organization.listMembers.useQuery({});
  const { data: allChats, isLoading: isChatsLoading, refetch: refetchChats } = api.chat.getHistory.useQuery(
    { type: "recent", limit: 50 },
    { refetchOnWindowFocus: false }
  );

  React.useEffect(() => {
    void refetchChats();
  }, [refetchChats]);

  const updateRole = api.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Member role updated successfully");
      void refetch();
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
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isCurrentUser = (member: Member) => member.user.id === currentUser?.id;

  const handleRoleChange = (member: Member, newRole: "ADMIN" | "MEMBER" | "VIEWER") => {
    if (isCurrentUser(member)) return;
    if (member.role === newRole) return;
    updateRole.mutate({ memberId: member.id, role: newRole });
  };

  const handleRemoveMember = (member: Member) => {
    setSelectedMember(member);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveMember = () => {
    if (!selectedMember) return;
    removeMember.mutate({ memberId: selectedMember.id });
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

  const normalizedSearch = search.trim().toLowerCase();
  const filteredMembers = (members || []).filter((m) => {
    if (filterRole !== "ALL" && m.role !== filterRole) return false;
    if (!normalizedSearch) return true;
    const name = m.user.name ?? "";
    const email = m.user.email ?? "";
    return name.toLowerCase().includes(normalizedSearch) || email.toLowerCase().includes(normalizedSearch);
  });

  const total = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedMembers = React.useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredMembers.slice(start, start + perPage);
  }, [filteredMembers, page, perPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-destructive">Error loading members</p>
            <p className="text-sm mt-2">{error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No members found</p>
            <p className="text-sm mt-2">Invite members to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-sm text-gray-500 mt-2">Manage your organization members and their roles.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or email"
                className="w-full rounded-lg border border-gray-200 px-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Select onValueChange={(v) => { setFilterRole(v as any); setPage(1); }} value={filterRole}>
              <SelectTrigger className="w-36">
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chat Count</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {member.user.name?.split(" ").map((n) => n[0]).join("") || (member.organizationEmail || member.user.email)?.slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm text-gray-900">{member.user.name || "Unknown User"}</div>
                            {isCurrentUser(member) && <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">You</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[220px]">{member.organizationEmail || member.user.email}</span>
                            <span className="mx-1">·</span>
                            <Calendar className="h-3 w-3" />
                            <span>Joined {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {isChatsLoading ? "…" : getMemberChatCount(member.user.id)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex justify-center">
                        <Select
                          value={member.role}
                          onValueChange={(value: "ADMIN" | "MEMBER" | "VIEWER") => handleRoleChange(member, value)}
                          disabled={isCurrentUser(member) || updateRole.isLoading}
                        >
                          <SelectTrigger className="rounded-full bg-purple-50 border-purple-200 px-4 py-1.5 min-w-[100px] hover:bg-purple-100 transition-colors">
                            <div className="flex items-center gap-2 justify-center">
                              {member.role === "ADMIN" && <Crown className="h-3.5 w-3.5 text-purple-600" />}
                              {member.role === "MEMBER" && <User className="h-3.5 w-3.5 text-blue-600" />}
                              {member.role === "VIEWER" && <Eye className="h-3.5 w-3.5 text-gray-600" />}
                              <span className="text-xs font-medium">
                                {member.role === "ADMIN" ? "Admin" : member.role === "MEMBER" ? "Member" : member.role === "VIEWER" ? "Viewer" : member.role}
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
                                <User className="h-4 w-4 text-blue-600" /> Member
                              </div>
                            </SelectItem>
                            <SelectItem value="VIEWER">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-gray-600" /> Viewer
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member)}
                          disabled={isCurrentUser(member) || removeMember.isLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <User className="h-12 w-12 mb-3" />
                        <p className="text-sm font-medium">No members match your search / filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <label className="inline-flex items-center gap-2">
                <span>Show</span>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
              </label>
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{(page - 1) * perPage + 1}</span>-<span className="font-semibold">{Math.min(page * perPage, total)}</span> of <span className="font-semibold">{total}</span> filtered members
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <div className="text-sm text-muted-foreground">
                Are you sure you want to remove <strong>{selectedMember?.user.name || selectedMember?.organizationEmail || selectedMember?.user.email}</strong> from the organization? 
                This action cannot be undone.
              </div>
            </DialogHeader>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)} disabled={removeMember.isLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRemoveMember} disabled={removeMember.isLoading}>
                {removeMember.isLoading ? "Removing..." : "Remove Member"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default MembersManager;