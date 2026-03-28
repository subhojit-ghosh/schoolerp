import { useQueryClient } from "@tanstack/react-query";
import { PAYROLL_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidatePayrollLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", PAYROLL_API_PATHS.LIST_SALARY_COMPONENTS, { params: { query: {} } }).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", PAYROLL_API_PATHS.LIST_SALARY_TEMPLATES, { params: { query: {} } }).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", PAYROLL_API_PATHS.LIST_SALARY_ASSIGNMENTS, { params: { query: {} } }).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", PAYROLL_API_PATHS.LIST_PAYROLL_RUNS, { params: { query: {} } }).queryKey,
  });
}

// Salary Components
export function useSalaryComponentsQuery(enabled: boolean, query: Record<string, unknown> = {}) {
  return apiQueryClient.useQuery("get", PAYROLL_API_PATHS.LIST_SALARY_COMPONENTS, { params: { query } }, { enabled });
}

export function useCreateSalaryComponentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", PAYROLL_API_PATHS.CREATE_SALARY_COMPONENT, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useUpdateSalaryComponentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", PAYROLL_API_PATHS.UPDATE_SALARY_COMPONENT, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useUpdateSalaryComponentStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", PAYROLL_API_PATHS.UPDATE_SALARY_COMPONENT_STATUS, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

// Salary Templates
export function useSalaryTemplatesQuery(enabled: boolean, query: Record<string, unknown> = {}) {
  return apiQueryClient.useQuery("get", PAYROLL_API_PATHS.LIST_SALARY_TEMPLATES, { params: { query } }, { enabled });
}

export function useSalaryTemplateDetailQuery(enabled: boolean, templateId?: string) {
  return apiQueryClient.useQuery(
    "get",
    PAYROLL_API_PATHS.GET_SALARY_TEMPLATE,
    { params: { path: { templateId: templateId! } } },
    { enabled: enabled && Boolean(templateId) },
  );
}

export function useCreateSalaryTemplateMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", PAYROLL_API_PATHS.CREATE_SALARY_TEMPLATE, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useUpdateSalaryTemplateMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", PAYROLL_API_PATHS.UPDATE_SALARY_TEMPLATE, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useUpdateSalaryTemplateStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", PAYROLL_API_PATHS.UPDATE_SALARY_TEMPLATE_STATUS, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

// Salary Assignments
export function useSalaryAssignmentsQuery(enabled: boolean, query: Record<string, unknown> = {}) {
  return apiQueryClient.useQuery("get", PAYROLL_API_PATHS.LIST_SALARY_ASSIGNMENTS, { params: { query } }, { enabled });
}

export function useSalaryAssignmentDetailQuery(enabled: boolean, assignmentId?: string) {
  return apiQueryClient.useQuery(
    "get",
    PAYROLL_API_PATHS.GET_SALARY_ASSIGNMENT,
    { params: { path: { assignmentId: assignmentId! } } },
    { enabled: enabled && Boolean(assignmentId) },
  );
}

export function useCreateSalaryAssignmentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", PAYROLL_API_PATHS.CREATE_SALARY_ASSIGNMENT, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useUpdateSalaryAssignmentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", PAYROLL_API_PATHS.UPDATE_SALARY_ASSIGNMENT, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useUpdateSalaryAssignmentStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", PAYROLL_API_PATHS.UPDATE_SALARY_ASSIGNMENT_STATUS, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

// Payroll Runs
export function usePayrollRunsQuery(enabled: boolean, query: Record<string, unknown> = {}) {
  return apiQueryClient.useQuery("get", PAYROLL_API_PATHS.LIST_PAYROLL_RUNS, { params: { query } }, { enabled });
}

export function usePayrollRunDetailQuery(enabled: boolean, runId?: string) {
  return apiQueryClient.useQuery(
    "get",
    PAYROLL_API_PATHS.GET_PAYROLL_RUN,
    { params: { path: { runId: runId! } } },
    { enabled: enabled && Boolean(runId) },
  );
}

export function useCreatePayrollRunMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", PAYROLL_API_PATHS.CREATE_PAYROLL_RUN, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useProcessPayrollRunMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", PAYROLL_API_PATHS.PROCESS_PAYROLL_RUN, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useApprovePayrollRunMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", PAYROLL_API_PATHS.APPROVE_PAYROLL_RUN, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

export function useMarkPaidPayrollRunMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", PAYROLL_API_PATHS.MARK_PAID_PAYROLL_RUN, {
    onSuccess: () => { invalidatePayrollLists(queryClient); },
  });
}

// Payslips
export function usePayslipsQuery(enabled: boolean, runId: string, query: Record<string, unknown> = {}) {
  return apiQueryClient.useQuery(
    "get",
    PAYROLL_API_PATHS.LIST_PAYSLIPS,
    { params: { path: { runId }, query } },
    { enabled: enabled && Boolean(runId) },
  );
}

export function usePayslipDetailQuery(enabled: boolean, payslipId?: string) {
  return apiQueryClient.useQuery(
    "get",
    PAYROLL_API_PATHS.GET_PAYSLIP,
    { params: { path: { payslipId: payslipId! } } },
    { enabled: enabled && Boolean(payslipId) },
  );
}
