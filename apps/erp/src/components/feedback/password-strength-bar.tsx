const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];

function getPasswordStrength(password: string) {
  let level = 0;

  if (password.length >= 8) level++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) level++;
  if (/\d/.test(password)) level++;
  if (/[^a-zA-Z0-9]/.test(password)) level++;

  return { level, label: STRENGTH_LABELS[level] };
}

export function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength.level
                ? strength.level <= 1
                  ? "bg-destructive"
                  : strength.level <= 2
                    ? "bg-orange-400"
                    : strength.level <= 3
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{strength.label}</p>
    </div>
  );
}
