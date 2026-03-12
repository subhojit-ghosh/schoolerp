import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { IconPlus, IconTrash, IconUserPlus } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateStudentMutation,
  useStudentsQuery,
} from "@/features/students/api/use-students";
import {
  studentFormSchema,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";

const DEFAULT_GUARDIAN = {
  name: "",
  mobile: "",
  email: "",
  relationship: "guardian" as const,
  isPrimary: true,
};

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudentsPage() {
  const [showForm, setShowForm] = useState(false);
  const authSession = useAuthStore((store) => store.session);
  const institutionId = authSession?.activeOrganization?.id;
  const campuses = authSession?.campuses ?? [];
  const studentsQuery = useStudentsQuery(institutionId);
  const createStudentMutation = useCreateStudentMutation(institutionId);
  const createStudentError = createStudentMutation.error as Error | null | undefined;

  const { control, handleSubmit, reset } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      admissionNumber: "",
      firstName: "",
      lastName: "",
      campusId: authSession?.activeCampus?.id ?? "",
      guardians: [DEFAULT_GUARDIAN],
    },
  });

  const guardiansFieldArray = useFieldArray({ control, name: "guardians" });

  async function onSubmit(values: StudentFormValues) {
    if (!institutionId) return;

    await createStudentMutation.mutateAsync({
      params: { path: { institutionId } },
      body: values,
    });

    reset({
      admissionNumber: "",
      firstName: "",
      lastName: "",
      campusId: authSession?.activeCampus?.id ?? "",
      guardians: [DEFAULT_GUARDIAN],
    });
    setShowForm(false);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing student records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const studentCount = studentsQuery.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {studentsQuery.isLoading
              ? "Loading…"
              : `${studentCount} student${studentCount !== 1 ? "s" : ""} enrolled`}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "outline" : "default"}
        >
          <IconPlus className="size-4" />
          {showForm ? "Cancel" : "Add student"}
        </Button>
      </div>

      {/* Create form — shown on demand */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New student</CardTitle>
            <CardDescription>
              Fill in the student details, assign a campus, and add one or more guardians.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup className="gap-6">
                {/* Student fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="admissionNumber"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="admission-number">Admission number</FieldLabel>
                        <FieldContent>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            id="admission-number"
                            placeholder="ADM-2026-001"
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </FieldContent>
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="campusId"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel>Campus</FieldLabel>
                        <FieldContent>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger aria-invalid={fieldState.invalid}>
                              <SelectValue placeholder="Select campus" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {campuses.map((campus) => (
                                  <SelectItem key={campus.id} value={campus.id}>
                                    {campus.name}
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
                    name="firstName"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="first-name">First name</FieldLabel>
                        <FieldContent>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            id="first-name"
                            placeholder="Aarav"
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </FieldContent>
                      </Field>
                    )}
                  />
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid || undefined}>
                        <FieldLabel htmlFor="last-name">Last name</FieldLabel>
                        <FieldContent>
                          <Input
                            {...field}
                            aria-invalid={fieldState.invalid}
                            id="last-name"
                            placeholder="Sharma"
                          />
                          <FieldError>{fieldState.error?.message}</FieldError>
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>

                {/* Guardian section */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Guardians</p>
                      <p className="text-xs text-muted-foreground">At least one guardian is required.</p>
                    </div>
                    <Button
                      className="gap-1.5"
                      onClick={() => guardiansFieldArray.append({ ...DEFAULT_GUARDIAN, isPrimary: false })}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <IconUserPlus className="size-3.5" />
                      Add guardian
                    </Button>
                  </div>

                  {guardiansFieldArray.fields.map((guardian, index) => (
                    <div
                      key={guardian.id}
                      className="rounded-lg border bg-muted/30 p-4 grid gap-4 sm:grid-cols-2"
                    >
                      <Controller
                        control={control}
                        name={`guardians.${index}.name`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel>Name</FieldLabel>
                            <FieldContent>
                              <Input {...field} aria-invalid={fieldState.invalid} placeholder="Neha Sharma" />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`guardians.${index}.mobile`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel>Mobile</FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                inputMode="tel"
                                placeholder="+91 98765 43210"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`guardians.${index}.email`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel>Email</FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                placeholder="guardian@example.com"
                                type="email"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`guardians.${index}.relationship`}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel>Relationship</FieldLabel>
                            <FieldContent>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger aria-invalid={fieldState.invalid}>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="father">Father</SelectItem>
                                    <SelectItem value="mother">Mother</SelectItem>
                                    <SelectItem value="guardian">Guardian</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <div className="flex items-center justify-between sm:col-span-2">
                        <Controller
                          control={control}
                          name={`guardians.${index}.isPrimary`}
                          render={({ field }) => (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={field.value}
                                id={`primary-${index}`}
                                onCheckedChange={field.onChange}
                              />
                              <Label className="text-sm font-normal" htmlFor={`primary-${index}`}>
                                Primary guardian
                              </Label>
                            </div>
                          )}
                        />
                        {guardiansFieldArray.fields.length > 1 ? (
                          <Button
                            className="gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => guardiansFieldArray.remove(index)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <IconTrash className="size-3.5" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                {createStudentError ? (
                  <FieldError>{createStudentError.message ?? "Unable to create the student."}</FieldError>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    disabled={createStudentMutation.isPending}
                    type="submit"
                  >
                    {createStudentMutation.isPending ? "Creating…" : "Create student"}
                  </Button>
                  <Button
                    onClick={() => setShowForm(false)}
                    type="button"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* Student list */}
      <Card>
        <CardContent className="p-0">
          {studentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading students…
            </div>
          ) : studentsQuery.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <IconUserPlus className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No students yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add the first student record for this institution.
                </p>
              </div>
              <Button
                className="gap-2 mt-1"
                onClick={() => setShowForm(true)}
                size="sm"
                variant="outline"
              >
                <IconPlus className="size-3.5" />
                Add first student
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission no.</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guardians</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsQuery.data?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {toInitials(student.fullName)}
                        </div>
                        <span className="font-medium text-sm">{student.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {student.admissionNumber}
                    </TableCell>
                    <TableCell className="text-sm">{student.campusName}</TableCell>
                    <TableCell>
                      <Badge
                        className="capitalize"
                        variant={student.status === "active" ? "default" : "secondary"}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.guardians.map((guardian) => (
                          <Badge key={guardian.membershipId} variant="outline">
                            {guardian.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
