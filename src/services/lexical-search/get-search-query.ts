export function getSearchQuery(query: string) {
  // Clean and prepare the search query
  const searchTerms = query
    .replace(/[!@#$%^&*(),.?":{}|<>]/g, " ")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => word.length > 1); // Filter out single characters

  if (searchTerms.length === 0) {
    return "";
  }

  // Create a tsquery that uses OR between terms and prefix matching
  const searchQuery = searchTerms
    .map((term) => `${term}:*`) // Add prefix matching
    .join(" | "); // Use OR between terms

  return searchQuery;
}
