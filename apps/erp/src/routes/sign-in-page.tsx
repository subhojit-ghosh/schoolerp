import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignInPage() {
  return (
    <Card className="max-w-2xl">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sign In</p>
        <h2 className="text-2xl font-semibold tracking-tight">Mobile-first sign in, email as fallback.</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          This screen is intentionally simple for the foundation pass. Auth will be backed by Passport in Nest, not by
          client-managed tokens.
        </p>
      </div>

      <form className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium">
          Mobile number or email
          <Input placeholder="+91 98765 43210" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <Input placeholder="Enter your password" type="password" />
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="button">Continue</Button>
          <Button type="button" variant="outline">
            Forgot password
          </Button>
        </div>
      </form>
    </Card>
  );
}
