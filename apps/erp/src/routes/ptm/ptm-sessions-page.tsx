import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCalendarPlus } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import {
  EntityPageShell,
  EntityPageHeader,
} from "@/components/entities/entity-page-shell";
import { EntityPagePrimaryAction } from "@/components/entities/entity-actions";
import { Field, FieldContent, FieldLabel } from "@repo/ui/components/ui/field";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { APP_FALLBACKS } from "@/constants/api";
import { extractApiError } from "@/lib/api-error";
import { formatFullDate } from "@/lib/format";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

type PtmSession = {
  id: string;
  title: string;
  description: string | null;
  ptmDate: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
};

function usePtmSessionsQuery(enabled: boolean) {
  return useQuery<PtmSession[]>({
    queryKey: ["ptm-sessions"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/ptm/sessions`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch PTM sessions");
      return res.json();
    },
    enabled,
  });
}

const STATUS_COLORS: Record<PtmSession["status"], string> = {
  scheduled: "bg-blue-500/10 text-blue-700 border-blue-200",
  in_progress: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  completed: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

export function PtmSessionsPage() {
  useDocumentTitle("PTM Sessions");
  const session = useAuthStore((store) => store.session);
  const enabled = isStaffContext(session);
  const sessionsQuery = usePtmSessionsQuery(enabled);
  const sessions = sessionsQuery.data ?? [];
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [ptmDate, setPtmDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("14:00");
  const [slotDuration, setSlotDuration] = useState(15);

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`${getApiBaseUrl()}/ptm/sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create PTM session");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ptm-sessions"] });
    },
  });

  const handleCreate = useCallback(async () => {
    try {
      await createMutation.mutateAsync({
        title,
        ptmDate,
        startTime,
        endTime,
        slotDurationMinutes: slotDuration,
      });
      toast.success("PTM session created");
      setDialogOpen(false);
      setTitle("");
      setPtmDate("");
    } catch (error) {
      toast.error(extractApiError(error, "Failed to create PTM session"));
    }
  }, [title, ptmDate, startTime, endTime, slotDuration, createMutation]);

  return (
    <EntityPageShell>
      <EntityPageHeader
        title="PTM Sessions"
        description="Schedule and manage parent-teacher meetings"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <EntityPagePrimaryAction>
                <IconCalendarPlus className="size-4" />
                New PTM session
              </EntityPagePrimaryAction>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New PTM session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Field>
                  <FieldLabel required>Title</FieldLabel>
                  <FieldContent>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Term 1 Parent-Teacher Meeting"
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel required>Date</FieldLabel>
                  <FieldContent>
                    <Input
                      type="date"
                      value={ptmDate}
                      onChange={(e) => setPtmDate(e.target.value)}
                    />
                  </FieldContent>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel required>Start time</FieldLabel>
                    <FieldContent>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel required>End time</FieldLabel>
                    <FieldContent>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                </div>
                <Field>
                  <FieldLabel>Slot duration (minutes)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      min={5}
                      max={60}
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                    />
                  </FieldContent>
                </Field>
                <Button
                  className="w-full"
                  disabled={!title || !ptmDate || createMutation.isPending}
                  onClick={() => void handleCreate()}
                >
                  {createMutation.isPending
                    ? "Creating..."
                    : "Create PTM session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16">
          <p className="text-sm text-muted-foreground">
            No PTM sessions scheduled yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((ptm) => (
            <div
              key={ptm.id}
              className="flex items-center justify-between rounded-xl border bg-card p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{ptm.title}</p>
                  <Badge className={STATUS_COLORS[ptm.status]}>
                    {ptm.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFullDate(new Date(ptm.ptmDate))} &middot;{" "}
                  {ptm.startTime} – {ptm.endTime} &middot;{" "}
                  {ptm.slotDurationMinutes}min slots
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </EntityPageShell>
  );
}
