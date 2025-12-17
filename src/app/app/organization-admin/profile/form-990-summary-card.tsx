"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { api } from "@/trpc/react";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

interface Form990SummaryCardProps {
  organizationId: string;
  onViewAll: () => void;
}

export function Form990SummaryCard({ organizationId, onViewAll }: Form990SummaryCardProps) {
  const [pollingTimeout, setPollingTimeout] = useState(false);

  const { data, isLoading } = api.form990.getFilings.useQuery(
    { organizationId },
    {
      refetchInterval: (data) => {
        const hasFilings = data?.filings && data.filings.length > 0;
        return hasFilings || pollingTimeout ? false : 2000;
      },
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setPollingTimeout(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [organizationId]);

  const filings = data?.filings || [];
  const isPolling = !isLoading && filings.length === 0 && !pollingTimeout;

  if (isLoading || isPolling) {
    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Form 990 Tax Filings</CardTitle>
          <CardDescription>Annual tax returns and financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-gray-600">Loading filings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filings.length === 0) {
    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Form 990 Tax Filings</CardTitle>
          <CardDescription>Annual tax returns and financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No Form 990 filings available</p>
        </CardContent>
      </Card>
    );
  }

  const latestFiling = filings[0];

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Form 990 Tax Filings</CardTitle>
            <CardDescription>Annual tax returns and financial data</CardDescription>
          </div>
          <Button onClick={onViewAll} variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {filings.length} filing{filings.length !== 1 ? 's' : ''} available
            </span>
            {latestFiling && filings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {latestFiling.taxYear - filings[filings.length - 1]!.taxYear + 1} years
              </Badge>
            )}
          </div>

          {latestFiling && (
            <>
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-500 mb-3">
                  Latest Filing: Tax Year {latestFiling.taxYear}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatCurrency(latestFiling.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Expenses</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatCurrency(latestFiling.totalExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Assets</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {formatCurrency(latestFiling.totalAssets)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}