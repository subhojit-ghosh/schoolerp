import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PasswordInput } from "@repo/ui/components/ui/password-input";
import { Button } from "@repo/ui/components/ui/button";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/ui/field";
import {
  useAuthErrorMessage,
  useChangePasswordMutation,
} from "@/features/auth/api/use-auth";
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/features/auth/model/auth-form-schema";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PasswordStrengthBar } from "@/components/feedback/password-strength-bar";
import { extractApiError } from "@/lib/api-error";

export function AccountPage() {
  useDocumentTitle("Account");
  const changePasswordMutation = useChangePasswordMutation();
  const errorMessage = useAuthErrorMessage(
    changePasswordMutation.error,
    "Incorrect current password or something went wrong.",
  );
  const { control, handleSubmit, reset, watch } =
    useForm<ChangePasswordFormValues>({
      resolver: zodResolver(changePasswordFormSchema),
      mode: "onTouched",
      defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      },
    });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePasswordMutation.mutateAsync({
        body: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
      });
      reset();
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not change password. Please check your current password and try again.",
        ),
      );
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-base font-medium mb-1">Change Password</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose a strong password with at least 8 characters.
        </p>

        <form
          className="flex flex-col gap-5 max-w-sm"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            control={control}
            name="currentPassword"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel required>Current password</FieldLabel>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="current-password"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel required>New password</FieldLabel>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
                <PasswordStrengthBar password={watch("newPassword")} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel required>Confirm new password</FieldLabel>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          {changePasswordMutation.error ? (
            <FieldError>{errorMessage}</FieldError>
          ) : null}

          <div className="pt-1">
            <Button
              className="h-10 rounded-lg px-6"
              disabled={changePasswordMutation.isPending}
              type="submit"
            >
              {changePasswordMutation.isPending ? "Saving…" : "Change password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
