import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  EntityPageShell,
  EntityPageHeader,
} from "@/components/entities/entity-page-shell";
import { Field, FieldContent, FieldLabel } from "@repo/ui/components/ui/field";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { APP_FALLBACKS } from "@/constants/api";
import { extractApiError } from "@/lib/api-error";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

type NotificationPrefs = {
  channelSms: boolean;
  channelEmail: boolean;
  channelInApp: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  digestMode: "instant" | "daily" | "weekly";
};

function useNotificationPrefsQuery() {
  return useQuery<NotificationPrefs>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/notification-preferences`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch preferences");
      return res.json();
    },
  });
}

export function NotificationPreferencesPage() {
  useDocumentTitle("Notification Preferences");
  const prefsQuery = useNotificationPrefsQuery();
  const queryClient = useQueryClient();

  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(true);
  const [inApp, setInApp] = useState(true);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");
  const [digest, setDigest] = useState<"instant" | "daily" | "weekly">(
    "instant",
  );

  useEffect(() => {
    if (prefsQuery.data) {
      setSms(prefsQuery.data.channelSms);
      setEmail(prefsQuery.data.channelEmail);
      setInApp(prefsQuery.data.channelInApp);
      setQuietStart(prefsQuery.data.quietHoursStart ?? "");
      setQuietEnd(prefsQuery.data.quietHoursEnd ?? "");
      setDigest(prefsQuery.data.digestMode);
    }
  }, [prefsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`${getApiBaseUrl()}/notification-preferences`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["notification-preferences"],
      });
    },
  });

  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync({
        channelSms: sms,
        channelEmail: email,
        channelInApp: inApp,
        quietHoursStart: quietStart || null,
        quietHoursEnd: quietEnd || null,
        digestMode: digest,
      });
      toast.success("Notification preferences saved");
    } catch (error) {
      toast.error(extractApiError(error, "Failed to save preferences"));
    }
  }, [sms, email, inApp, quietStart, quietEnd, digest, saveMutation]);

  return (
    <EntityPageShell width="compact">
      <EntityPageHeader
        title="Notification Preferences"
        description="Choose how and when you receive notifications"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channels</CardTitle>
          <CardDescription>
            Select which channels you want to receive notifications on
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={sms} onCheckedChange={(v) => setSms(!!v)} />
            <span className="text-sm">SMS notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={email} onCheckedChange={(v) => setEmail(!!v)} />
            <span className="text-sm">Email notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={inApp} onCheckedChange={(v) => setInApp(!!v)} />
            <span className="text-sm">In-app notifications</span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiet Hours</CardTitle>
          <CardDescription>
            Pause non-critical notifications during these hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Start</FieldLabel>
              <FieldContent>
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>End</FieldLabel>
              <FieldContent>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                />
              </FieldContent>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Digest Mode</CardTitle>
          <CardDescription>
            Control notification delivery frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={digest}
            onValueChange={(v) => setDigest(v as typeof digest)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant</SelectItem>
              <SelectItem value="daily">Daily digest</SelectItem>
              <SelectItem value="weekly">Weekly digest</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button
        className="w-fit"
        disabled={saveMutation.isPending}
        onClick={() => void handleSave()}
      >
        {saveMutation.isPending ? "Saving..." : "Save preferences"}
      </Button>
    </EntityPageShell>
  );
}
