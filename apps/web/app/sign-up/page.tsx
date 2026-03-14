import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { WEB_ROUTES } from "@/constants/routes";
import { SignupForm } from "@/components/signup-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10 lg:px-12">
      <div className="flex items-center justify-between gap-4 py-4">
        <Button asChild variant="ghost">
          <Link href={WEB_ROUTES.HOME}>
            <ChevronLeft data-icon="inline-start" />
            Back home
          </Link>
        </Button>
      </div>
      <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col gap-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
            School onboarding
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Create the tenant once. Run the ERP on the school subdomain after
            that.
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground">
            This flow provisions the institution record, default campus, first
            admin membership, and an authenticated session. When it succeeds,
            the browser moves straight into the tenant workspace.
          </p>
        </section>
        <SignupForm />
      </div>
    </main>
  );
}
