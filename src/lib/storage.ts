export function buildSupabasePublicUrl(
  supabaseBaseUrl: string,
  bucket: string,
  filePath: string,
) {
  if (!supabaseBaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  const base = supabaseBaseUrl.replace(/\/$/, "");
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export function isAbsoluteUrl(u?: string | null): boolean {
  if (!u) return false;
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}