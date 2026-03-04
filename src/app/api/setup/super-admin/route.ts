import { NextResponse } from "next/server";
import { initialSuperAdminSchema } from "@/lib/auth/initial-super-admin-form";
import { createInitialSuperAdmin, hasAnySuperAdmin } from "@/server/auth/platform-super-admin";

export async function POST(request: Request) {
  if (await hasAnySuperAdmin()) {
    return NextResponse.json(
      { error: "Platform setup has already been completed." },
      { status: 409 },
    );
  }

  try {
    const json = await request.json();
    const values = initialSuperAdminSchema.parse(json);

    await createInitialSuperAdmin(values);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to complete platform setup." },
      { status: 500 },
    );
  }
}
