import { useMemo } from "react";
import {
  IconBook,
  IconBookmark,
  IconBooks,
  IconAlertTriangle,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@repo/ui/components/ui/card";
import { PERMISSIONS } from "@repo/contracts";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLibraryDashboardQuery } from "@/features/library/api/use-library";
import { EntityPageShell, EntityPageHeader } from "@/components/entities/entity-page-shell";

const LOADING_VALUE = "\u2014";

type DashboardData = {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedToday: number;
  returnedToday: number;
  overdueCount: number;
  pendingReservations: number;
  popularBooks: Array<{
    bookId: string;
    title: string;
    author: string | null;
    issueCount: number;
  }>;
  recentTransactions: Array<{
    id: string;
    bookTitle: string;
    memberName: string;
    type: "issue" | "return";
    date: string;
  }>;
};

export function LibraryDashboardPage() {
  useDocumentTitle("Library Dashboard");
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.LIBRARY_READ);

  const dashboardQuery = useLibraryDashboardQuery(canRead);
  const isLoading = dashboardQuery.isLoading;
  const data = dashboardQuery.data as DashboardData | undefined;

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }),
    [],
  );

  const statCards = [
    {
      label: "Total Books",
      value: isLoading ? LOADING_VALUE : String(data?.totalBooks ?? 0),
      badge: isLoading
        ? "Syncing..."
        : `${data?.availableCopies ?? 0} available`,
      Icon: IconBooks,
    },
    {
      label: "Issued Today",
      value: isLoading ? LOADING_VALUE : String(data?.issuedToday ?? 0),
      badge: isLoading ? "Syncing..." : "Today",
      Icon: IconArrowUp,
    },
    {
      label: "Returned Today",
      value: isLoading ? LOADING_VALUE : String(data?.returnedToday ?? 0),
      badge: isLoading ? "Syncing..." : "Today",
      Icon: IconArrowDown,
    },
    {
      label: "Overdue",
      value: isLoading ? LOADING_VALUE : String(data?.overdueCount ?? 0),
      badge: isLoading
        ? "Syncing..."
        : (data?.overdueCount ?? 0) > 0
          ? "Needs attention"
          : "All clear",
      Icon: IconAlertTriangle,
    },
    {
      label: "Pending Reservations",
      value: isLoading
        ? LOADING_VALUE
        : String(data?.pendingReservations ?? 0),
      badge: isLoading ? "Syncing..." : "In queue",
      Icon: IconBookmark,
    },
  ];

  return (
    <EntityPageShell>
      <EntityPageHeader
        title="Library Dashboard"
        description="Overview of library activity and statistics."
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label} className="@container/card">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <card.Icon className="size-3" />
                  {card.badge}
                </Badge>
              </CardAction>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Popular books + Recent transactions */}
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        {/* Popular books */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Popular Books</CardTitle>
            <CardDescription>Most issued books</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading...</p>
            ) : !data?.popularBooks?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <IconBook className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No borrowing data yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.popularBooks.map((book, index) => (
                  <div
                    key={book.bookId}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground w-5 shrink-0 text-right">
                        {index + 1}.
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {book.title}
                        </p>
                        {book.author ? (
                          <p className="text-xs text-muted-foreground truncate">
                            {book.author}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {book.issueCount} issues
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <CardDescription>Latest issues and returns</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading...</p>
            ) : !data?.recentTransactions?.length ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <IconBook className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No transactions yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {txn.bookTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {txn.memberName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          txn.type === "issue" ? "secondary" : "outline"
                        }
                        className={
                          txn.type === "return"
                            ? "bg-green-500/10 text-green-700 border-green-200"
                            : ""
                        }
                      >
                        {txn.type === "issue" ? "Issued" : "Returned"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(txn.date))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EntityPageShell>
  );
}
