import { useMemo } from "react";
import { Badge } from "@repo/ui/components/ui/badge";
import { useParams } from "react-router";
import { ADMISSION_FORM_FIELD_TYPES } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import {
  useAdmissionApplicationQuery,
  useAdmissionFormFieldsQuery,
} from "@/features/admissions/api/use-admissions";
import {
  filterAdmissionFormFieldsForScope,
  type AdmissionFormFieldRecord,
} from "@/features/admissions/model/admission-custom-fields";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENT_TITLES } from "@/features/documents/model/document.constants";
import {
  formatDocumentDate,
  formatDocumentReference,
} from "@/features/documents/ui/print-document-formatters";
import {
  PrintDetailItem,
  PrintDocumentShell,
} from "@/features/documents/ui/print-document-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { formatPhone } from "@/lib/format";

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCustomFieldValue(
  field: AdmissionFormFieldRecord | undefined,
  value: unknown,
) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value !== "string" || value.length === 0) {
    return "Not provided";
  }

  if (field?.fieldType === ADMISSION_FORM_FIELD_TYPES.DATE) {
    return formatDocumentDate(value);
  }

  if (field?.fieldType === ADMISSION_FORM_FIELD_TYPES.SELECT) {
    const optionLabel = field.options?.find(
      (option) => option.value === value,
    )?.label;
    return optionLabel ?? value;
  }

  return value;
}

export function AdmissionAcknowledgementPage() {
  useDocumentTitle("Admission Acknowledgement");
  const { applicationId } = useParams();
  const institutionId = useAuthStore(
    (store) => store.session?.activeOrganization?.id,
  );

  const applicationQuery = useAdmissionApplicationQuery(
    institutionId,
    applicationId,
  );
  const formFieldsQuery = useAdmissionFormFieldsQuery(institutionId);

  const customFields = useMemo(
    () =>
      filterAdmissionFormFieldsForScope(
        formFieldsQuery.data?.rows ?? [],
        "application",
      ),
    [formFieldsQuery.data?.rows],
  );

  const customFieldEntries = useMemo(() => {
    const values = applicationQuery.data?.customFieldValues ?? {};

    return Object.entries(values)
      .filter(([, value]) => value !== null && value !== "" && value !== false)
      .map(([key, value]) => {
        const field = customFields.find((candidate) => candidate.key === key);

        return {
          key,
          label: field?.label ?? key,
          value: formatCustomFieldValue(field, value),
        };
      });
  }, [applicationQuery.data?.customFieldValues, customFields]);

  if (applicationQuery.isLoading) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.ADMISSIONS_APPLICATIONS}
        subtitle="Loading application details..."
        title={DOCUMENT_TITLES.ADMISSION_ACKNOWLEDGEMENT}
      >
        <p className="text-sm text-muted-foreground">
          Loading admission application...
        </p>
      </PrintDocumentShell>
    );
  }

  if (!applicationQuery.data) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.ADMISSIONS_APPLICATIONS}
        subtitle="The requested application could not be found."
        title={DOCUMENT_TITLES.ADMISSION_ACKNOWLEDGEMENT}
      >
        <p className="text-sm text-muted-foreground">
          Return to the admissions application list and open a valid record.
        </p>
      </PrintDocumentShell>
    );
  }

  const application = applicationQuery.data;
  const studentFullName = [
    application.studentFirstName,
    application.studentLastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <PrintDocumentShell
      backHref={ERP_ROUTES.ADMISSIONS_APPLICATIONS}
      subtitle={`${studentFullName} · ${application.campusName}`}
      title={DOCUMENT_TITLES.ADMISSION_ACKNOWLEDGEMENT}
    >
      <div className="space-y-8">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PrintDetailItem
            label="Application No."
            value={formatDocumentReference("ADM", application.id)}
          />
          <PrintDetailItem
            label="Submitted On"
            value={formatDocumentDate(application.createdAt)}
          />
          <PrintDetailItem label="Campus" value={application.campusName} />
          <PrintDetailItem
            label="Status"
            value={
              <Badge variant="outline">
                {formatStatus(application.status)}
              </Badge>
            }
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-[24px] border border-border/70 bg-white px-5 py-5">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Applicant details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PrintDetailItem label="Student Name" value={studentFullName} />
              <PrintDetailItem
                label="Guardian Name"
                value={application.guardianName}
              />
              <PrintDetailItem label="Mobile" value={formatPhone(application.mobile)} />
              <PrintDetailItem
                label="Email"
                value={application.email ?? "Not provided"}
              />
              <PrintDetailItem
                label="Desired Class"
                value={application.desiredClassName ?? "Not specified"}
              />
              <PrintDetailItem
                label="Desired Section"
                value={application.desiredSectionName ?? "Not specified"}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-border/70 bg-muted/10 px-5 py-5">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Admission office note
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              This acknowledgement confirms that the application has been
              recorded in the ERP for review by the admissions team. Final
              admission, fee collection, and section allocation remain subject
              to school approval.
            </p>
            {application.notes ? (
              <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Internal note
                </p>
                <p className="mt-1 text-foreground">{application.notes}</p>
              </div>
            ) : null}
          </div>
        </section>

        {customFieldEntries.length > 0 ? (
          <section className="rounded-[24px] border border-border/70 bg-white px-5 py-5">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Additional information
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {customFieldEntries.map((entry) => (
                <PrintDetailItem
                  key={entry.key}
                  label={entry.label}
                  value={entry.value}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PrintDocumentShell>
  );
}
