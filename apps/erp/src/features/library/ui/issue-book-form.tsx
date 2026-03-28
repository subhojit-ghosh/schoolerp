import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useLibraryBooksQuery } from "@/features/library/api/use-library";
import { useStaffQuery } from "@/features/staff/api/use-staff";
import {
  DEFAULT_ISSUE_BOOK_FORM_VALUES,
  issueBookFormSchema,
  type IssueBookFormValues,
} from "@/features/library/model/library-form-schemas";

type IssueBookFormProps = {
  defaultValues?: IssueBookFormValues;
  isPending?: boolean;
  errorMessage?: string;
  onCancel: () => void;
  onSubmit: (values: IssueBookFormValues) => Promise<void> | void;
};

export function IssueBookForm({
  defaultValues = DEFAULT_ISSUE_BOOK_FORM_VALUES,
  isPending = false,
  errorMessage,
  onCancel,
  onSubmit,
}: IssueBookFormProps) {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const isEnabled = Boolean(institutionId);

  const booksQuery = useLibraryBooksQuery(isEnabled, { status: "active", limit: 200 });
  const staffQuery = useStaffQuery(institutionId, { limit: 200 });

  const availableBooks = (booksQuery.data?.rows ?? []).filter(
    (b) => b.availableCopies > 0,
  );
  const staffMembers = staffQuery.data?.rows ?? [];

  const { control, handleSubmit } = useForm<IssueBookFormValues>({
    resolver: zodResolver(issueBookFormSchema),
    mode: "onTouched",
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <Controller
          control={control}
          name="bookId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Book</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select book" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableBooks.map((book) => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title}
                          {book.author ? ` — ${book.author}` : ""}
                          {` (${book.availableCopies} available)`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="memberId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Staff member</FieldLabel>
              <FieldContent>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {staffMembers.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                          {staff.profile?.employeeId
                            ? ` (${staff.profile.employeeId})`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="dueDate"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Due date</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  type="date"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <EntityFormPrimaryAction disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Issue book"}
          </EntityFormPrimaryAction>
          <EntityFormSecondaryAction
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </EntityFormSecondaryAction>
        </div>
      </FieldGroup>
    </form>
  );
}
