
export interface OnboardingFormData {
  email?: string;
  fullName?: string;
  firstName?: string;
  location?: string;
  aiUsage?: string;
  interests?: string[];
  organization?: {
    name: string;
    url: string;
    isUSBased?: boolean;
    irsVerification?: {
      ein: string;
      organizationName: string;
      exemptionStatus: string;
      subsection?: string;
      taxPeriod?: string;
      verificationStatus: "VERIFIED" | "NOT_FOUND" | "SKIPPED" | "INACTIVE";
    };
  };
  joinExistingOrganization?: {
    organizationId: string;
    organizationName: string;
  };
  url?: string; // Legacy field for backwards compatibility
}

// Type guard to check if parsed JSON has the expected structure
export function isValidOnboardingData(data: unknown): data is OnboardingFormData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const obj = data as Record<string, unknown>;
  
  if (obj.interests !== undefined && !Array.isArray(obj.interests)) {
    return false;
  }
  

  if (obj.organization !== undefined) {
    if (typeof obj.organization !== 'object' || obj.organization === null) {
      return false;
    }
    const org = obj.organization as Record<string, unknown>;
    if (typeof org.name !== 'string' || typeof org.url !== 'string') {
      return false;
    }
  }
  

  if (obj.joinExistingOrganization !== undefined) {
    if (typeof obj.joinExistingOrganization !== 'object' || obj.joinExistingOrganization === null) {
      return false;
    }
    const join = obj.joinExistingOrganization as Record<string, unknown>;
    if (typeof join.organizationId !== 'string' || typeof join.organizationName !== 'string') {
      return false;
    }
  }
  
  return true;
}

// Helper function to safely parse onboarding data from sessionStorage
export function parseOnboardingData(jsonString: string): OnboardingFormData | null {
  try {
    const parsed = JSON.parse(jsonString) as unknown;
    if (isValidOnboardingData(parsed)) {
      return parsed;
    }
    console.warn('Invalid onboarding data structure:', parsed);
    return null;
  } catch (error) {
    console.error('Failed to parse onboarding data:', error);
    return null;
  }
}