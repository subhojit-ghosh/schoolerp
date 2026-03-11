import { inngest } from "@/inngest/client";
import { INNGEST } from "@/constants";

export const appPingFunction = inngest.createFunction(
  { id: INNGEST.FUNCTIONS.APP_PING },
  { event: INNGEST.EVENTS.APP_PING_REQUESTED },
  async ({ event, step }) => {
    const payload = await step.run(INNGEST.STEPS.APP_PING_CAPTURE, async () => {
      return {
        source: event.data?.source ?? "unknown",
        requestedAt: event.data?.requestedAt ?? new Date().toISOString(),
      };
    });

    return {
      ok: true,
      payload,
    };
  },
);

