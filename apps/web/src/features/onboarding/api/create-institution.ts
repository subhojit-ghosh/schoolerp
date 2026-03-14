import { APP_FALLBACKS } from "@repo/contracts";

type CreateInstitutionBody = {
  institutionName: string;
  institutionSlug: string;
  campusName: string;
  adminName: string;
  mobile: string;
  email: string;
  password: string;
};

type CreateInstitutionResponse = {
  activeOrganization?: {
    slug?: string | null;
  } | null;
};

function getErrorMessage(payload: unknown) {
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message) && typeof message[0] === "string") {
      return message[0];
    }
  }

  return "Unable to create the school right now.";
}

export async function createInstitution(body: CreateInstitutionBody) {
  const response = await fetch(
    `${APP_FALLBACKS.API_URL}/onboarding/institutions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );

  const payload = (await response.json()) as CreateInstitutionResponse;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload;
}
