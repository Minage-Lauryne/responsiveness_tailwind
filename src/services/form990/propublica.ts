const PROPUBLICA_API_BASE = process.env.NEXT_PUBLIC_PROPUBLICA_API_URL;

export interface PropublicaFiling {
  tax_prd: number;
  tax_prd_yr: number;
  formtype: string;
  pdf_url: string;
  totrevenue: number;
  totfuncexpns: number;
  totassetsend: number;
  totliabend: number;
  totnetassetend: number;
}

export interface PropublicaOrganization {
  ein: string;
  name: string;
}

export interface PropublicaResponse {
  organization: PropublicaOrganization;
  filings_with_data: PropublicaFiling[];
  filings_without_data: PropublicaFiling[];
}

/**
 * Fetch organization data and filings from ProPublica Nonprofit Explorer API
 */
export async function getOrganizationFilings(ein: string): Promise<PropublicaResponse | null> {
  try {
    const response = await fetch(`${PROPUBLICA_API_BASE}/organizations/${ein}.json`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`ProPublica API error: ${response.status}`);
    }

    const data = await response.json() as PropublicaResponse;
    return data;
  } catch (error) {
    console.error("Error fetching Form 990 data from ProPublica:", error);
    throw error;
  }
}