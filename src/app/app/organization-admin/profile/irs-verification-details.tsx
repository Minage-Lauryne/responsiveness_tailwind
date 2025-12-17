import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface IrsVerificationDetailsProps {
  profile: {
    name: string;
    irsVerified: boolean;
    irsEin?: string | null;
    irsSubsectionCode?: string | null;
    irsExemptionStatus?: string | null;
    verificationStatus: string;
    irsVerifiedAt?: Date | null;
    financialData?: {
      totalAssets: bigint | null;
      totalIncome: bigint | null;
      totalRevenue: bigint | null;
    } | null;
  };
}

function getSubsectionLabel(code: string | null | undefined): string {
  if (!code) return "Unknown";
  const map: Record<string, string> = {
    "03": "501(c)(3)",
    "04": "501(c)(4)",
    "05": "501(c)(5)",
    "06": "501(c)(6)",
    "07": "501(c)(7)",
    "19": "501(c)(19)",
  };
  return map[code] || `501(c)(${code})`;
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    "01": "Active",
    "02": "Active",
    "13": "Revoked",
    "25": "Terminating",
  };
  return map[status] || "Active";
}

export function IrsVerificationDetails({ profile }: IrsVerificationDetailsProps) {
  if (!profile.irsVerified) {
    return (
      <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">IRS Verification Details</CardTitle>
          <CardDescription>Tax-exempt status and financial information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Organization is not IRS verified.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold">IRS Verification Details</CardTitle>
          <Badge variant="default" className="bg-green-500 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>
        <CardDescription>Tax-exempt status and financial information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">EIN (Tax ID)</p>
              <p className="text-base text-gray-900 mt-1">
                {profile.irsEin || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">501(c)(3) Status</p>
              <p className="text-base text-gray-900 mt-1">
                {getStatusLabel(profile.irsExemptionStatus || "")}
              </p>
            </div>
          </div>

          {profile.financialData && (
            <>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Financial Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Assets</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {formatCurrency(profile.financialData.totalAssets)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Income</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {formatCurrency(profile.financialData.totalIncome)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {formatCurrency(profile.financialData.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {profile.irsVerifiedAt && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                Last updated: {format(new Date(profile.irsVerifiedAt), "MMMM dd, yyyy")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}