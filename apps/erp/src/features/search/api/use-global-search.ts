import { useQuery } from "@tanstack/react-query";
import { APP_FALLBACKS } from "@/constants/api";

export type SearchResultItem = {
  type: "student" | "staff" | "guardian" | "receipt";
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
};

type SearchResponse = {
  results: SearchResultItem[];
};

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

async function fetchGlobalSearch(q: string): Promise<SearchResponse> {
  const response = await fetch(
    `${getApiBaseUrl()}/search?q=${encodeURIComponent(q)}`,
    { credentials: "include" },
  );
  if (!response.ok) throw new Error("Search failed");
  return response.json();
}

export function useGlobalSearchQuery(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["global-search", trimmed],
    queryFn: () => fetchGlobalSearch(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}
