import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, MessageSquare, Files, Users } from "lucide-react";

interface OrganizationMetricsProps {
  metrics: {
    activeSubscriptions: number;
    totalChats: number;
    workspaceDocuments: number;
    members: number;
  };
}

export function OrganizationMetrics({ metrics }: OrganizationMetricsProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Metrics</h2>
      <p className="text-sm text-gray-600 mb-6">Overview of your organization's activity</p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
            <CardTitle className="text-base font-bold text-gray-600">
              Active Subscriptions
            </CardTitle>
            <CreditCard className="h-6 w-6 text-gray-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-bold text-gray-900">
              {metrics.activeSubscriptions.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
            <CardTitle className="text-base font-bold text-gray-600">
              Total Chats
            </CardTitle>
            <MessageSquare className="h-6 w-6 text-gray-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-bold text-gray-900">
              {metrics.totalChats.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
            <CardTitle className="text-base font-bold text-gray-600">
              Workspace Documents
            </CardTitle>
            <Files className="h-6 w-6 text-gray-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-bold text-gray-900">
              {metrics.workspaceDocuments.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
            <CardTitle className="text-base font-bold text-gray-600">
              Members
            </CardTitle>
            <Users className="h-6 w-6 text-gray-400" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-bold text-gray-900">
              {metrics.members.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}