import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Badge } from "@academic-platform/ui/components/ui/badge";
import { Button } from "@academic-platform/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@academic-platform/ui/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@academic-platform/ui/components/ui/field";
import { Input } from "@academic-platform/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@academic-platform/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@academic-platform/ui/components/ui/table";
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

export function StudentsPage() {
  const authSession = useAuthStore((store) => store.session);
  const institutionId = authSession?.activeOrganization?.id;
  const campuses = authSession?.campuses ?? [];
  const studentsQuery = useStudentsQuery(institutionId);
  const createStudentMutation = useCreateStudentMutation(institutionId);
  const createStudentError = createStudentMutation.error as
    | Error
    | null
    | undefined;
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
  const guardiansFieldArray = useFieldArray({
    control,
    name: "guardians",
  });

  async function onSubmit(values: StudentFormValues) {
    if (!institutionId) {
      return;
    }

    await createStudentMutation.mutateAsync({
      params: {
        path: {
          institutionId,
        },
      },
      body: values,
    });

    reset({
      admissionNumber: "",
      firstName: "",
      lastName: "",
      campusId: authSession?.activeCampus?.id ?? "",
      guardians: [DEFAULT_GUARDIAN],
    });
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing student
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline">First ERP Slice</Badge>
              <CardTitle>Students, guardians, and campus assignment</CardTitle>
              <CardDescription>
                This page stays on default shadcn primitives while the backend
                continues to own tenant and membership rules.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create student</CardTitle>
          <CardDescription>
            Add one student, assign a campus, and attach one or more guardians.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Controller
                  control={control}
                  name="admissionNumber"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="admission-number">
                        Admission number
                      </FieldLabel>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || undefined}
                        >
                          <SelectTrigger aria-invalid={fieldState.invalid}>
                            <SelectValue placeholder="Select a campus" />
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
                      <FieldLabel htmlFor="student-first-name">
                        First name
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="student-first-name"
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
                      <FieldLabel htmlFor="student-last-name">
                        Last name
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="student-last-name"
                          placeholder="Sharma"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">Guardians</div>
                    <div className="text-sm text-muted-foreground">
                      Default shadcn fields with tenant-backed guardian links.
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      guardiansFieldArray.append({
                        ...DEFAULT_GUARDIAN,
                        isPrimary: false,
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    Add guardian
                  </Button>
                </div>

                {guardiansFieldArray.fields.map((guardian, index) => (
                  <Card key={guardian.id}>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Controller
                          control={control}
                          name={`guardians.${index}.name`}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid || undefined}>
                              <FieldLabel>Guardian name</FieldLabel>
                              <FieldContent>
                                <Input
                                  {...field}
                                  aria-invalid={fieldState.invalid}
                                  placeholder="Neha Sharma"
                                />
                                <FieldError>
                                  {fieldState.error?.message}
                                </FieldError>
                              </FieldContent>
                            </Field>
                          )}
                        />
                        <Controller
                          control={control}
                          name={`guardians.${index}.mobile`}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid || undefined}>
                              <FieldLabel>Guardian mobile</FieldLabel>
                              <FieldContent>
                                <Input
                                  {...field}
                                  aria-invalid={fieldState.invalid}
                                  inputMode="tel"
                                  placeholder="+91 98765 43210"
                                />
                                <FieldError>
                                  {fieldState.error?.message}
                                </FieldError>
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
                                <FieldError>
                                  {fieldState.error?.message}
                                </FieldError>
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
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger
                                    aria-invalid={fieldState.invalid}
                                  >
                                    <SelectValue placeholder="Select relationship" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectItem value="father">
                                        Father
                                      </SelectItem>
                                      <SelectItem value="mother">
                                        Mother
                                      </SelectItem>
                                      <SelectItem value="guardian">
                                        Guardian
                                      </SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                                <FieldError>
                                  {fieldState.error?.message}
                                </FieldError>
                              </FieldContent>
                            </Field>
                          )}
                        />
                        <Controller
                          control={control}
                          name={`guardians.${index}.isPrimary`}
                          render={({ field }) => (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                checked={field.value}
                                onChange={(event) =>
                                  field.onChange(event.target.checked)
                                }
                                type="checkbox"
                              />
                              Primary guardian
                            </label>
                          )}
                        />
                        {guardiansFieldArray.fields.length > 1 ? (
                          <div className="flex items-end justify-end">
                            <Button
                              onClick={() => guardiansFieldArray.remove(index)}
                              type="button"
                              variant="ghost"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {createStudentError ? (
                <FieldError>
                  {createStudentError.message ?? "Unable to create the student."}
                </FieldError>
              ) : null}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            disabled={createStudentMutation.isPending}
            onClick={handleSubmit(onSubmit)}
            type="button"
          >
            {createStudentMutation.isPending
              ? "Creating student..."
              : "Create student"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active students</CardTitle>
          <CardDescription>
            Institution-scoped records from the current tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Loading students...
            </div>
          ) : null}
          {studentsQuery.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Admission number</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guardians</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsQuery.data.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.fullName}
                    </TableCell>
                    <TableCell>{student.admissionNumber}</TableCell>
                    <TableCell>{student.campusName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.guardians.map((guardian) => (
                          <Badge key={guardian.membershipId} variant="secondary">
                            {guardian.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          {studentsQuery.data?.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No students yet. Create the first record for this institution.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
