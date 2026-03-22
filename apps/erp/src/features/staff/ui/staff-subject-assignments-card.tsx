import { useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card } from "@repo/ui/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/ui/field";
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
  EntityToolbarSecondaryAction,
} from "@/components/entities/entity-actions";
import { EntitySheet } from "@/components/entities/entity-sheet";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { useSubjectsQuery } from "@/features/subjects/api/use-subjects";

type SubjectAssignment = {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string | null;
  className: string | null;
  academicYearId: string | null;
  academicYearName: string | null;
  createdAt: string;
};

type StaffSubjectAssignmentsCardProps = {
  assignments: SubjectAssignment[];
  bare?: boolean;
  createErrorMessage?: string;
  institutionId: string | undefined;
  isCreating: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  onCreateAssignment: (values: {
    subjectId: string;
    classId?: string;
  }) => Promise<void>;
  onDeleteAssignment: (assignmentId: string) => Promise<void>;
};

const UNSELECTED_VALUE = "__unselected__";

export function StaffSubjectAssignmentsCard({
  assignments,
  bare = false,
  createErrorMessage,
  institutionId,
  isCreating,
  isDeleting,
  isLoading,
  onCreateAssignment,
  onDeleteAssignment,
}: StaffSubjectAssignmentsCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(UNSELECTED_VALUE);

  const subjectsQuery = useSubjectsQuery(Boolean(institutionId), {
    limit: 200,
  });
  const subjectOptions =
    (subjectsQuery.data?.rows as { id: string; name: string }[] | undefined) ??
    [];

  const deleteTarget = assignments.find((a) => a.id === deleteTargetId);

  async function handleCreate() {
    if (selectedSubjectId === UNSELECTED_VALUE) {
      return;
    }

    await onCreateAssignment({
      subjectId: selectedSubjectId,
    });

    setSelectedSubjectId(UNSELECTED_VALUE);
    setSheetOpen(false);
  }

  async function handleDelete() {
    if (!deleteTargetId) {
      return;
    }

    await onDeleteAssignment(deleteTargetId);
    setDeleteTargetId(null);
  }

  const content = (
    <>
      <div className="flex items-center justify-end rounded-lg border bg-card px-4 py-3">
        <EntityToolbarSecondaryAction
          onClick={() => setSheetOpen(true)}
          type="button"
        >
          <IconPlus className="size-4" />
          Assign subject
        </EntityToolbarSecondaryAction>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="divide-y">
          {isLoading ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          ) : assignments.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No subjects assigned yet.
            </p>
          ) : (
            assignments.map((assignment) => (
              <div
                className="flex items-center justify-between gap-2 px-5 py-4"
                key={assignment.id}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {assignment.subjectName}
                  </span>
                  {assignment.className ? (
                    <Badge variant="outline">{assignment.className}</Badge>
                  ) : null}
                </div>
                <Button
                  onClick={() => setDeleteTargetId(assignment.id)}
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-destructive"
                >
                  <IconTrash className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {bare ? (
        <div className="space-y-4">{content}</div>
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">Subjects</h3>
              <p className="text-sm text-muted-foreground">
                Subject teaching assignments for this staff member.
              </p>
            </div>
            {content}
          </div>
        </Card>
      )}

      <EntitySheet
        onOpenChange={setSheetOpen}
        open={sheetOpen}
        title="Assign subject"
      >
        <div className="space-y-4 p-4">
          <Field>
            <FieldLabel required>Subject</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={setSelectedSubjectId}
                value={selectedSubjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {subjectOptions.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>

          <FieldError>{createErrorMessage}</FieldError>

          <div className="flex gap-2">
            <EntityFormPrimaryAction
              disabled={isCreating || selectedSubjectId === UNSELECTED_VALUE}
              onClick={() => {
                void handleCreate();
              }}
            >
              {isCreating ? "Assigning..." : "Assign subject"}
            </EntityFormPrimaryAction>
            <EntityFormSecondaryAction onClick={() => setSheetOpen(false)}>
              Cancel
            </EntityFormSecondaryAction>
          </div>
        </div>
      </EntitySheet>

      <ConfirmDialog
        confirmLabel="Remove"
        description={`Remove "${deleteTarget?.subjectName ?? "this subject"}" assignment?`}
        isPending={isDeleting}
        onConfirm={() => {
          void handleDelete();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
        open={Boolean(deleteTargetId)}
        title="Remove subject assignment"
      />
    </>
  );
}
