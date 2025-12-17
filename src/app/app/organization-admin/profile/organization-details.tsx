import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Globe, Mail, MapPin, Edit } from "lucide-react";
import Image from "next/image";

interface OrganizationDetailsProps {
  profile: {
    name: string;
    domain?: string | null;
    adminEmail?: string | null;
    adminLocation?: string | null;
    logo?: string | null;
  };
  onEdit: () => void;
}

export function OrganizationDetails({ profile, onEdit }: OrganizationDetailsProps) {
  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {profile.logo && (
              <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                <Image
                  src={profile.logo}
                  alt={`${profile.name} logo`}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold">Organization Details</CardTitle>
              <CardDescription>View your organization information</CardDescription>
            </div>
          </div>
          <Button onClick={onEdit} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Organization Name</p>
              <p className="text-base text-gray-900">{profile.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base text-gray-900">
                {profile.adminEmail || <span className="text-gray-400">Not provided</span>}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Website</p>
              <p className="text-base text-gray-900">
                {profile.domain ? (
                  <a 
                    href={profile.domain} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profile.domain}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="text-base text-gray-900">
                {profile.adminLocation || <span className="text-gray-400">Not provided</span>}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}