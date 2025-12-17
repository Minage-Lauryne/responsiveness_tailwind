"use client";

import * as React from "react";
import { User, Eye, Trash2, Mail, Calendar, Crown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { InviteMemberForm } from "./invite-member-form";
import { PendingInvitations } from "./pending-invitations";
import Link from "next/link";

interface Member {
  id: string;
  role: "ADMIN" | "MEMBER" | "VIEWER" | string;
  createdAt: Date;
  organizationEmail?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  chatCount?: number;
  documentsUploaded?: number;
}

export function MembersManager() {
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = React.useState(false);

  const { data: currentUser } = api.me.get.useQuery();
  const { data: members, isLoading, refetch, error } = api.organization.listMembers.useQuery({});
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

  const latestMembers = React.useMemo(() => {
    if (!members) return [];
    return [...members]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
  }, [members]);

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
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
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
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your organization members and their roles.</p>
        </div>
        <InviteMemberForm onInviteSuccess={() => refetch()} />
      </div>

      <PendingInvitations />
      
      <div className="bg-white rounded-md border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-sky-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Member</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">Role</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {latestMembers.map((member) => (
                <tr key={member.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user.image || undefined} />
                        <AvatarFallback>
                          {member.user.name?.split(" ").map((n) => n[0]).join("") || (member.organizationEmail || member.user.email)?.slice(0, 2).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">{member.user.name || "Unknown User"}</div>
                          {isCurrentUser(member) && <span className="text-xs text-muted-foreground border rounded-md px-2 py-0.5">You</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{member.organizationEmail || member.user.email}</span>
                          <span className="mx-1">·</span>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Joined {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center align-top">
                    <div className="inline-flex items-center">
                      <Select
                        value={member.role}
                        onValueChange={(value: "ADMIN" | "MEMBER" | "VIEWER") => handleRoleChange(member, value)}
                        disabled={isCurrentUser(member) || updateRole.isLoading}
                      >
                        <SelectTrigger className="rounded-full bg-slate-100 px-3 py-2 min-w-[120px]">
                          <div className="flex items-center gap-2 justify-center">
                            {member.role === "ADMIN" && <Crown className="h-4 w-4 text-purple-600" />}
                            {member.role === "MEMBER" && <User className="h-4 w-4 text-blue-600" />}
                            {member.role === "VIEWER" && <Eye className="h-4 w-4 text-gray-600" />}
                            <span className="text-sm">
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

                  <td className="px-6 py-4 text-center align-top">
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member)}
                        disabled={isCurrentUser(member) || removeMember.isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center">
        <Link href="/app/organization-admin/members">
          <Button variant="outline" className="flex items-center gap-2 border-gray-600">
            <Users className="h-4 w-4" />
            View All Members
          </Button>
        </Link>
      </div>

      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{selectedMember?.user.name || selectedMember?.user.email}</strong> from the organization? This action cannot be undone.
            </DialogDescription>
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
  );
}