import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { ADMISSIONS_API_PATHS } from "@/features/auth/api/auth.constants";
import {
  ADMISSION_APPLICATION_LIST_SORT_FIELDS,
  ADMISSION_ENQUIRY_LIST_SORT_FIELDS,
} from "@/features/admissions/model/admission-list.constants";
import { apiQueryClient } from "@/lib/api/client";

type AdmissionEnquiryListSort =
  (typeof ADMISSION_ENQUIRY_LIST_SORT_FIELDS)[keyof typeof ADMISSION_ENQUIRY_LIST_SORT_FIELDS];

type AdmissionApplicationListSort =
  (typeof ADMISSION_APPLICATION_LIST_SORT_FIELDS)[keyof typeof ADMISSION_APPLICATION_LIST_SORT_FIELDS];

type AdmissionEnquiriesListQuery = {
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: AdmissionEnquiryListSort;
};

type AdmissionApplicationsListQuery = {
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: AdmissionApplicationListSort;
};

function getEnquiriesListQueryKey(
  _institutionId: string,
  query?: AdmissionEnquiriesListQuery,
) {
  return apiQueryClient.queryOptions(
    "get",
    ADMISSIONS_API_PATHS.LIST_ENQUIRIES,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
  ).queryKey;
}

function getApplicationsListQueryKey(
  _institutionId: string,
  query?: AdmissionApplicationsListQuery,
) {
  return apiQueryClient.queryOptions(
    "get",
    ADMISSIONS_API_PATHS.LIST_APPLICATIONS,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
  ).queryKey;
}

export function useAdmissionEnquiriesQuery(
  institutionId: string | undefined,
  query?: AdmissionEnquiriesListQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    ADMISSIONS_API_PATHS.LIST_ENQUIRIES,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useAdmissionApplicationsQuery(
  institutionId: string | undefined,
  query?: AdmissionApplicationsListQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    ADMISSIONS_API_PATHS.LIST_APPLICATIONS,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useAdmissionEnquiryQuery(
  institutionId: string | undefined,
  enquiryId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    ADMISSIONS_API_PATHS.DETAIL_ENQUIRY,
    {
      params: {
        path: {
          enquiryId: enquiryId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && enquiryId),
    },
  );
}

export function useAdmissionApplicationQuery(
  institutionId: string | undefined,
  applicationId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    ADMISSIONS_API_PATHS.DETAIL_APPLICATION,
    {
      params: {
        path: {
          applicationId: applicationId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && applicationId),
    },
  );
}

export function useCreateAdmissionEnquiryMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", ADMISSIONS_API_PATHS.CREATE_ENQUIRY, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getEnquiriesListQueryKey(institutionId),
      });
    },
  });
}

export function useUpdateAdmissionEnquiryMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", ADMISSIONS_API_PATHS.UPDATE_ENQUIRY, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getEnquiriesListQueryKey(institutionId),
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          ADMISSIONS_API_PATHS.DETAIL_ENQUIRY,
          {
            params: {
              path: {
                enquiryId: variables.params.path.enquiryId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useCreateAdmissionApplicationMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    ADMISSIONS_API_PATHS.CREATE_APPLICATION,
    {
      onSuccess: () => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: getApplicationsListQueryKey(institutionId),
        });
      },
    },
  );
}

export function useUpdateAdmissionApplicationMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    ADMISSIONS_API_PATHS.UPDATE_APPLICATION,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: getApplicationsListQueryKey(institutionId),
        });

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            ADMISSIONS_API_PATHS.DETAIL_APPLICATION,
            {
              params: {
                path: {
                  applicationId: variables.params.path.applicationId,
                },
              },
            },
          ).queryKey,
        });
      },
    },
  );
}
