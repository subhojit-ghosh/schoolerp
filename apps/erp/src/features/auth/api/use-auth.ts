import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { AUTH_API_PATHS } from "./auth.constants";
import { getApiErrorMessage } from "./auth-error";
import { useAuthStore } from "../model/auth-store";

export function useSessionQuery() {
  const setSession = useAuthStore((store) => store.setSession);
  const clearSession = useAuthStore((store) => store.clearSession);
  const query = apiQueryClient.useQuery("get", AUTH_API_PATHS.ME, undefined, {
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setSession(query.data);
      return;
    }

    if (query.error) {
      clearSession();
    }
  }, [clearSession, query.data, query.error, setSession]);

  return query;
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((store) => store.setSession);

  return apiQueryClient.useMutation("post", AUTH_API_PATHS.SIGN_IN, {
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(
        apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME).queryKey,
        session,
      );
    },
  });
}

export function useSignUpMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((store) => store.setSession);

  return apiQueryClient.useMutation("post", AUTH_API_PATHS.SIGN_UP, {
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(
        apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME).queryKey,
        session,
      );
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((store) => store.clearSession);

  return apiQueryClient.useMutation("post", AUTH_API_PATHS.SIGN_OUT, {
    onSuccess: () => {
      clearSession();
      queryClient.removeQueries({
        queryKey: apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME)
          .queryKey,
      });
    },
    onError: () => {
      clearSession();
    },
  });
}

export function useForgotPasswordMutation() {
  return apiQueryClient.useMutation("post", AUTH_API_PATHS.FORGOT_PASSWORD);
}

export function useResetPasswordMutation() {
  return apiQueryClient.useMutation("post", AUTH_API_PATHS.RESET_PASSWORD);
}

export function useSelectCampusMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((store) => store.setSession);

  return apiQueryClient.useMutation("patch", AUTH_API_PATHS.SELECT_CAMPUS, {
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(
        apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME).queryKey,
        session,
      );
      void queryClient.invalidateQueries();
    },
  });
}

export function useSelectContextMutation() {
  const queryClient = useQueryClient();
  const setSession = useAuthStore((store) => store.setSession);

  return apiQueryClient.useMutation("patch", AUTH_API_PATHS.SELECT_CONTEXT, {
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(
        apiQueryClient.queryOptions("get", AUTH_API_PATHS.ME).queryKey,
        session,
      );
      void queryClient.invalidateQueries();
    },
  });
}

export function useAuthErrorMessage(error: unknown, fallbackMessage: string) {
  return getApiErrorMessage(error, fallbackMessage);
}
