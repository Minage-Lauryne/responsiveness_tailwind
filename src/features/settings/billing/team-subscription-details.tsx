import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, UserMinus, Mail } from "lucide-react";

interface SeatAllocation {
  id: string;
  userId: string;
  allocatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
}

interface TeamSubscription {
  id: string;
  type: string;
  seats: number;
  status: string;
  seatAllocations?: SeatAllocation[];
}

interface OrganizationMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
  };
}

interface TeamSubscriptionDetailsProps {
  subscription: TeamSubscription;
  organizationMembers?: OrganizationMember[];
  onAllocateSeat?: (userId: string) => void;
  onRevokeSeat?: (userId: string) => void;
  onInviteMembers?: () => void;
}

export function TeamSubscriptionDetails({ 
  subscription, 
  organizationMembers = [],
  onAllocateSeat,
  onRevokeSeat,
  onInviteMembers 
}: TeamSubscriptionDetailsProps) {
  if (subscription.type !== "Team") {
    return null;
  }

  const allocatedSeats = subscription.seatAllocations || [];
  const allocatedUserIds = new Set(allocatedSeats.map((allocation) => allocation.userId));
  const availableSeats = subscription.seats - allocatedSeats.length;
  

  const membersWithSeats = allocatedSeats.map((allocation) => ({
    allocation,
    member: organizationMembers.find(member => member.user.id === allocation.userId),
  }));


  const membersWithoutSeats = organizationMembers.filter(
    member => !allocatedUserIds.has(member.user.id)
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Subscription Seats
        </CardTitle>
        <CardDescription>
          Manage seat allocations for your team members. 
          {availableSeats > 0 ? ` ${availableSeats} seats available.` : " All seats are allocated."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seat Usage Summary */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Seat Usage</p>
            <p className="text-2xl font-bold">
              {allocatedSeats.length} / {subscription.seats}
            </p>
          </div>
          {onInviteMembers && (
            <Button 
              variant="outline" 
              onClick={onInviteMembers}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Invite Members
            </Button>
          )}
        </div>

        {/* Members with seats */}
        {membersWithSeats.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members with Seats ({membersWithSeats.length})
            </h4>
            <div className="space-y-2">
              {membersWithSeats.map(({ allocation, member }) => (
                <div
                  key={allocation.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member?.user.image || undefined} />
                      <AvatarFallback>
                        {member?.user.name?.charAt(0) || member?.user.email?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member?.user.name || member?.user.email || "Unknown User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member?.user.email} • {member?.role || "Member"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Allocated</Badge>
                    {onRevokeSeat && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevokeSeat(allocation.userId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Members without seats */}
        {membersWithoutSeats.length > 0 && availableSeats > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Available Members ({membersWithoutSeats.length})
            </h4>
            <div className="space-y-2">
              {membersWithoutSeats.slice(0, availableSeats).map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>
                        {member.user.name?.charAt(0) || member.user.email?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email} • {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">No Seat</Badge>
                    {onAllocateSeat && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAllocateSeat(member.user.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {membersWithoutSeats.length > availableSeats && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {membersWithoutSeats.length - availableSeats} more members need seats. 
                  Upgrade your subscription to add more seats.
                </p>
              )}
            </div>
          </div>
        )}

        {availableSeats === 0 && membersWithoutSeats.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>All seats are allocated.</strong> You have {membersWithoutSeats.length} more member(s) 
              who need seats. Consider upgrading your subscription to add more seats.
            </p>
          </div>
        )}

        {membersWithSeats.length === 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-800">
              <strong>No seats allocated yet.</strong> Click the buttons above to assign seats to your team members.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
