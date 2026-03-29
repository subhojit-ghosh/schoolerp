import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useIssueBookMutation } from "@/features/library/api/use-library";
import {
  DEFAULT_ISSUE_BOOK_FORM_VALUES,
  type IssueBookFormValues,
} from "@/features/library/model/library-form-schemas";
import { IssueBookForm } from "@/features/library/ui/issue-book-form";
import { appendSearch } from "@/lib/routes";

export function IssueBookSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const issueMutation = useIssueBookMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.LIBRARY_TRANSACTIONS, location.search),
    [location.search],
  );

  const isPending = issueMutation.isPending;
  const errorMessage =
    (issueMutation.error as Error | null | undefined)?.message ?? undefined;

  async function handleSubmit(values: IssueBookFormValues) {
    try {
      await issueMutation.mutateAsync({
        body: {
          bookId: values.bookId,
          memberId: values.memberId,
          dueDate: values.dueDate,
        },
      });
      toast.success("Book issued successfully.");
      void navigate(closeTo);
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not issue book. Please try again."),
      );
    }
  }

  return (
    <RouteEntitySheet
      closeTo={closeTo}
      description="Issue a book from the library catalog."
      title="Issue book"
    >
      <IssueBookForm
        defaultValues={DEFAULT_ISSUE_BOOK_FORM_VALUES}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
