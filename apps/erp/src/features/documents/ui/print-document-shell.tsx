import { useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import { IconArrowLeft, IconPrinter } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import { readCachedTenantBranding } from "@/lib/tenant-branding";

type PrintDocumentShellProps = {
  children: ReactNode;
  subtitle: string;
  title: string;
  backHref: string;
};

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PrintDocumentShell({
  backHref,
  children,
  subtitle,
  title,
}: PrintDocumentShellProps) {
  const branding = useMemo(() => readCachedTenantBranding(), []);
  const generatedAt = useMemo(() => formatGeneratedAt(new Date()), []);

  return (
    <div className="print-document-shell min-h-screen bg-[linear-gradient(180deg,var(--background),color-mix(in_srgb,var(--background)_82%,white))] px-4 py-6 sm:px-6 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 print:max-w-none print:gap-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button asChild variant="ghost">
            <Link to={backHref}>
              <IconArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Button onClick={() => window.print()} type="button">
            <IconPrinter className="size-4" />
            Print
          </Button>
        </div>

        <article className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_18px_50px_rgba(15,23,42,0.08)] print:rounded-none print:border-0 print:shadow-none print:overflow-visible">
          <div className="border-b border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_14%,white),white_58%,color-mix(in_srgb,var(--accent)_10%,white))] px-6 py-6 sm:px-8 print:px-0 print:py-3 print:bg-none">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                {branding?.logoUrl ? (
                  <img
                    alt={`${branding.shortName} logo`}
                    className="h-16 w-16 rounded-2xl border border-white/70 bg-white object-contain p-2 shadow-sm"
                    src={branding.logoUrl}
                  />
                ) : null}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    {branding?.institutionName ?? "Institution"}
                  </p>
                  <div>
                    <h1 className="font-[family:var(--font-heading)] text-3xl font-semibold tracking-tight text-foreground">
                      {title}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-52 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Generated
                </p>
                <p className="mt-1 font-medium text-foreground">
                  {generatedAt}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8 print:px-0 print:py-3">{children}</div>
        </article>
      </div>
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value: ReactNode;
};

export function PrintDetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="space-y-1 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 print:rounded-none print:border-border/50 print:px-2 print:py-1.5 print:space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground print:text-[9px] print:tracking-wider">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground print:text-[11px]">{value}</div>
    </div>
  );
}
