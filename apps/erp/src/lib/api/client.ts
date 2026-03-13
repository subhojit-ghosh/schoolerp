import createFetchClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { paths } from "@/lib/api/generated/schema";
import { APP_FALLBACKS } from "@/constants/api";
function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

const fetchWithCredentials: typeof fetch = (input, init) =>
  fetch(input, {
    ...init,
    credentials: "include",
  });

export const apiFetchClient = createFetchClient<paths>({
  baseUrl: getApiBaseUrl(),
  fetch: fetchWithCredentials,
});

export const apiQueryClient = createQueryClient(apiFetchClient);
