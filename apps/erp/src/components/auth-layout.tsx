import { readCachedTenantBranding } from "@/lib/tenant-branding";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const branding = readCachedTenantBranding();
  const institutionName = branding?.institutionName ?? "School ERP";
  const shortName = branding?.shortName ?? "ERP";
  const logoUrl = branding?.logoUrl ?? null;
  const initial = shortName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-svh">
      {/* Left: school identity panel */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14"
        style={{
          background: "linear-gradient(155deg, #0d1b2a 0%, #122038 55%, #0f2240 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Decorative rings */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute -bottom-24 -left-24 opacity-[0.08]" width="520" height="520" viewBox="0 0 520 520" fill="none">
            <circle cx="260" cy="260" r="250" stroke="white" strokeWidth="1" />
            <circle cx="260" cy="260" r="190" stroke="white" strokeWidth="1" />
            <circle cx="260" cy="260" r="130" stroke="white" strokeWidth="1" />
          </svg>
          <svg className="absolute -top-36 -right-36 opacity-[0.06]" width="620" height="620" viewBox="0 0 620 620" fill="none">
            <circle cx="310" cy="310" r="300" stroke="white" strokeWidth="1" />
            <circle cx="310" cy="310" r="230" stroke="white" strokeWidth="1" />
            <circle cx="310" cy="310" r="160" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        {/* Top: "School ERP" product mark (small, subtle) */}
        <div className="relative z-10 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <span className="text-white/25 text-xs tracking-widest uppercase font-light">School ERP</span>
        </div>

        {/* Center: school identity */}
        <div className="relative z-10 flex flex-col gap-6">
          {/* Logo or monogram */}
          {logoUrl ? (
            <img
              alt={institutionName}
              className="h-16 w-auto object-contain object-left"
              src={logoUrl}
              style={{ filter: "brightness(0) invert(1) opacity(0.9)" }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-semibold text-white shrink-0"
              style={{ background: "var(--primary, #8a5a44)" }}
            >
              {initial}
            </div>
          )}

          <div>
            <h1
              className="text-[2.6rem] xl:text-5xl leading-[1.1] text-white mb-3"
              style={{ fontFamily: "'Lora', serif", fontWeight: 500 }}
            >
              {institutionName}
            </h1>
            <p
              className="text-xs font-semibold tracking-[0.18em] uppercase"
              style={{ color: "var(--primary, #8a5a44)" }}
            >
              Educator &amp; Staff Portal
            </p>
          </div>
        </div>

        {/* Bottom: warm tagline */}
        <div className="relative z-10">
          <p className="text-white/35 text-sm leading-relaxed font-light max-w-xs">
            Manage admissions, academics, attendance, and fees — all in one place built for your institution.
          </p>
        </div>
      </div>

      {/* Right: form panel */}
      <div
        className="flex flex-1 flex-col items-center justify-center min-h-svh p-8 lg:p-16"
        style={{
          background: "#faf9f7",
        }}
      >
        {/* Mobile-only school name header */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10 self-start">
          {logoUrl ? (
            <img alt={institutionName} className="h-7 w-auto object-contain" src={logoUrl} />
          ) : (
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: "var(--primary, #8a5a44)" }}
            >
              {initial}
            </div>
          )}
          <span className="text-sm font-medium text-foreground/70 truncate max-w-[180px]">{institutionName}</span>
        </div>

        {children}
      </div>
    </div>
  );
}
