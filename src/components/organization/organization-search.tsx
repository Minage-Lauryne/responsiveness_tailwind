"use client";

import * as React from "react";
import { Search, Building2, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { truncateOrganizationName } from "@/lib/utils";

interface OrganizationSearchProps {
  onJoinSuccess?: () => void;
  initialSearchQuery?: string;
}

export function OrganizationSearch({ onJoinSuccess, initialSearchQuery = "" }: OrganizationSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery);
  const [selectedOrg, setSelectedOrg] = React.useState<string | null>(null);
  const [joinMessage, setJoinMessage] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);


  // Search organizations
  const { data: organizations, isLoading: isSearching } = api.organization.searchOrganizations.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 2 }
  );


  // Request to join mutation
  const requestToJoin = api.organization.requestToJoin.useMutation({
    onSuccess: () => {
      toast.success("Join request sent successfully! You'll be notified when it's reviewed.");
      setIsDialogOpen(false);
      setJoinMessage("");
      setSelectedOrg(null);
      onJoinSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleJoinRequest = (orgId: string) => {
    setSelectedOrg(orgId);
    setIsDialogOpen(true);
  };

  const handleSubmitJoinRequest = () => {
    if (!selectedOrg) return;

    requestToJoin.mutate({
      organizationId: selectedOrg,
      message: joinMessage.trim() || undefined,
    });
  };

  const selectedOrgData = organizations?.find((org: any) => org.id === selectedOrg);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="search">Search Organizations</Label>
        {isSearching}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by organization name or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery.length > 0 && searchQuery.length <= 2 && isSearching && (
          <div className="flex flex-col items-center justify-center py-8 gap-y-4">
            <p className="text-sm text-muted-foreground">Type at least 3 characters to search</p>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>

        )}
      </div>

      {organizations && organizations.length === 0 && searchQuery.length > 2 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No organizations found matching "{searchQuery}"</p>
              <p className="text-sm mt-2">Try a different search term or contact your organization admin.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {organizations && organizations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Found {organizations.length}organization{organizations.length === 1 ? '' : 's'}</h3>
          <div className="grid gap-4">
            {organizations.map((org: any) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{truncateOrganizationName(org.name)}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {org.memberCount} member{org.memberCount === 1 ? '' : 's'}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleJoinRequest(org.id)}
                      disabled={requestToJoin.isPending}
                      className="shrink-0"
                    >
                      Request to Join
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {org.domains.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {org.domains.map((domain: any) => (
                        <Badge key={domain} variant="secondary" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Join Organization</DialogTitle>
            <DialogDescription>
              Send a request to join <strong>{selectedOrgData ? truncateOrganizationName(selectedOrgData.name) : ''}</strong>.
              Organization admins will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the admins why you'd like to join this organization..."
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={requestToJoin.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitJoinRequest}
              disabled={requestToJoin.isLoading}
            >
              {requestToJoin.isLoading ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}