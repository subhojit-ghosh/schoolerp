import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import {
  AUTH_API_PATHS,
  ONBOARDING_API_PATHS,
} from "@/features/auth/api/auth.constants";
import { useAuthStore } from "@/features/auth/model/auth-store";

export function useCreateInstitutionMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((store) => store.setSession);

  return apiQueryClient.useMutation(
    "post",
    ONBOARDING_API_PATHS.CREATE_INSTITUTION,
    {
      onSuccess: (session) => {
        setSession(session);
        queryClient.setQueryData(
          apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME).queryKey,
          session,
        );
      },
    },
  );
}
