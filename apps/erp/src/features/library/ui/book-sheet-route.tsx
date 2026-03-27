import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateBookMutation,
  useLibraryBooksQuery,
  useUpdateBookMutation,
} from "@/features/library/api/use-library";
import {
  DEFAULT_BOOK_FORM_VALUES,
  type BookFormValues,
} from "@/features/library/model/library-form-schemas";
import { BookForm } from "@/features/library/ui/book-form";
import { appendSearch } from "@/lib/routes";

type BookSheetRouteProps = {
  mode: "create" | "edit";
};

export function BookSheetRoute({ mode }: BookSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const booksQuery = useLibraryBooksQuery(mode === "edit" && isEnabled, { limit: 100 });
  const createMutation = useCreateBookMutation();
  const updateMutation = useUpdateBookMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.LIBRARY_BOOKS, location.search),
    [location.search],
  );

  const editingBook = booksQuery.data?.rows.find((b) => b.id === bookId);

  const defaultValues = useMemo<BookFormValues>(() => {
    if (mode === "create" || !editingBook) {
      return DEFAULT_BOOK_FORM_VALUES;
    }
    return {
      title: editingBook.title,
      author: editingBook.author ?? "",
      isbn: editingBook.isbn ?? "",
      publisher: editingBook.publisher ?? "",
      genre: editingBook.genre ?? "",
      totalCopies: editingBook.totalCopies,
    };
  }, [editingBook, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: BookFormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          title: values.title,
          author: values.author || undefined,
          isbn: values.isbn || undefined,
          publisher: values.publisher || undefined,
          genre: values.genre || undefined,
          totalCopies: values.totalCopies,
        },
      });
      toast.success("Book added to library.");
      void navigate(closeTo);
    } else if (bookId) {
      await updateMutation.mutateAsync({
        params: { path: { bookId } },
        body: {
          title: values.title,
          author: values.author || undefined,
          isbn: values.isbn || undefined,
          publisher: values.publisher || undefined,
          genre: values.genre || undefined,
          totalCopies: values.totalCopies,
        },
      });
      toast.success("Book updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New book" : "Edit book";
  const description =
    mode === "create"
      ? "Add a book to the library catalog."
      : editingBook?.title ?? "Edit this book.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <BookForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create book" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
