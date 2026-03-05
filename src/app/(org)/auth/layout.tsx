import { getCurrentInstitutionBranding } from "@/server/institutions/get-current";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const branding = await getCurrentInstitutionBranding();

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left panel — institution branding */}
      <div className="bg-primary text-primary-foreground flex flex-col gap-4 p-10">
        <div className="flex items-center gap-2 font-semibold text-lg">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="h-8 w-8 object-contain" />
          ) : (
            <div className="bg-primary-foreground/20 flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold">
              {branding.name.charAt(0)}
            </div>
          )}
          {branding.name}
        </div>
        <div className="flex-1" />
        <p className="text-primary-foreground/60 text-sm">
          &copy; {new Date().getFullYear()} {branding.name}. All rights reserved.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-col p-8">
        <div className="mb-8 flex justify-end">
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm">
          {children}
        </div>
        </div>
      </div>
    </div>
  );
}
