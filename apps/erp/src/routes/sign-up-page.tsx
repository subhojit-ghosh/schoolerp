import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignUpPage() {
  return (
    <Card className="max-w-3xl">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Free School Signup</p>
        <h2 className="text-2xl font-semibold tracking-tight">Provision a school tenant with the first admin account.</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          This form is the intended ERP-first onboarding flow. The persistence and auth wiring will be implemented in
          `apps/api-erp` next; the shell is here now so future work lands in the right place.
        </p>
      </div>

      <form className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          School name
          <Input placeholder="Springfield High School" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Subdomain slug
          <Input placeholder="springfield-high" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Default campus
          <Input placeholder="Main Campus" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Admin name
          <Input placeholder="Aparna Sen" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Mobile number
          <Input placeholder="+91 98765 43210" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Email
          <Input placeholder="admin@school.edu" type="email" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <Input placeholder="Create a password" type="password" />
        </label>

        <div className="md:col-span-2 flex gap-3 pt-2">
          <Button type="button">Create school</Button>
          <Button type="button" variant="outline">
            Save design for later
          </Button>
        </div>
      </form>
    </Card>
  );
}
