import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useAnnouncementQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
} from "@/features/communications/api/use-communications";
import {
  DEFAULT_ANNOUNCEMENT_FORM_VALUES,
  type AnnouncementFormValues,
} from "@/features/communications/model/announcement-form-schema";
import { AnnouncementForm } from "@/features/communications/ui/announcement-form";
import { appendSearch } from "@/lib/routes";

type AnnouncementSheetRouteProps = {
  mode: "create" | "edit";
};

export function AnnouncementSheetRoute({
  mode,
}: AnnouncementSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { announcementId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const campuses = session?.campuses ?? [];
  const announcementQuery = useAnnouncementQuery(
    mode === "edit" && Boolean(institutionId),
    announcementId,
  );
  const createAnnouncementMutation = useCreateAnnouncementMutation();
  const updateAnnouncementMutation = useUpdateAnnouncementMutation();

  const defaultValues = useMemo<AnnouncementFormValues>(() => {
    if (mode === "create" || !announcementQuery.data) {
      return {
        ...DEFAULT_ANNOUNCEMENT_FORM_VALUES,
        campusId: session?.activeCampus?.id ?? "",
      };
    }

    return {
      campusId: announcementQuery.data.campusId ?? "",
      title: announcementQuery.data.title,
      summary: announcementQuery.data.summary ?? "",
      body: announcementQuery.data.body,
      audience: announcementQuery.data.audience,
      publishNow: false,
    };
  }, [announcementQuery.data, mode, session?.activeCampus?.id]);

  async function handleSubmit(values: AnnouncementFormValues) {
    if (!institutionId) {
      return;
    }

    if (mode === "create") {
      await createAnnouncementMutation.mutateAsync({
        body: {
          audience: values.audience,
          body: values.body,
          campusId: values.campusId || undefined,
          publishNow: values.publishNow,
          summary: values.summary || undefined,
          title: values.title,
        },
      });
      toast.success("Announcement created.");
    } else if (announcementId) {
      await updateAnnouncementMutation.mutateAsync({
        params: {
          path: {
            announcementId,
          },
        },
        body: {
          audience: values.audience,
          body: values.body,
          campusId: values.campusId || undefined,
          publishNow: values.publishNow,
          summary: values.summary || undefined,
          title: values.title,
        },
      });
      toast.success("Announcement updated.");
    }

    void navigate(appendSearch(ERP_ROUTES.ANNOUNCEMENTS, location.search));
  }

  if (mode === "edit" && announcementQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ANNOUNCEMENTS}
        description="Load the announcement details before editing."
        title="Edit announcement"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading announcement details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !announcementQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ANNOUNCEMENTS}
        description="The requested announcement could not be loaded for this institution."
        title="Announcement not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Announcement not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Return to the announcements list and open the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createAnnouncementMutation.error as Error | null | undefined)?.message ??
        undefined)
      : ((updateAnnouncementMutation.error as Error | null | undefined)?.message ??
        undefined);

  const isPending =
    mode === "create"
      ? createAnnouncementMutation.isPending
      : updateAnnouncementMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.ANNOUNCEMENTS}
      description={
        mode === "create"
          ? "Create a broadcast for staff, guardians, or students."
          : "Update announcement copy and publishing details."
      }
      title={mode === "create" ? "New announcement" : "Edit announcement"}
    >
      <AnnouncementForm
        campuses={campuses}
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(appendSearch(ERP_ROUTES.ANNOUNCEMENTS, location.search));
        }}
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create announcement" : "Save changes"}
      />
    </RouteEntitySheet>
  );
}
