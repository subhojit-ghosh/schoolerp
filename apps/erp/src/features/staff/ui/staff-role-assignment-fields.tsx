import { useEffect, useMemo } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
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
import { useClassesQuery } from "@/features/classes/api/use-classes";
import type { StaffRoleAssignmentDraft } from "@/features/staff/model/staff-form-schema";

const ALL_SCOPE_VALUE = "__all__";
const UNSELECTED_ROLE_VALUE = "__unselected_role__";

type CampusOption = {
  id: string;
  name: string;
};

type RoleOption = {
  id: string;
  name: string;
};

type ClassOption = {
  id: string;
  name: string;
  status: "active" | "inactive" | "deleted";
  sections: Array<{
    id: string;
    name: string;
  }>;
};

type StaffRoleAssignmentFieldsProps = {
  campuses: CampusOption[];
  disabled?: boolean;
  errorMessage?: string;
  roles: RoleOption[];
  value: StaffRoleAssignmentDraft;
  onChange: (nextValue: StaffRoleAssignmentDraft) => void;
};

export function StaffRoleAssignmentFields({
  campuses,
  disabled = false,
  errorMessage,
  roles,
  value,
  onChange,
}: StaffRoleAssignmentFieldsProps) {
  const classesQuery = useClassesQuery(
    Boolean(value.campusId),
    value.campusId || undefined,
  );

  const classOptions = useMemo(
    () =>
      ((classesQuery.data?.rows ?? []) as ClassOption[]).filter(
        (item) => item.status === "active",
      ),
    [classesQuery.data?.rows],
  );

  const sectionOptions = useMemo(() => {
    const matchedClass =
      classOptions.find((classOption) => classOption.id === value.classId) ??
      null;

    return matchedClass?.sections ?? [];
  }, [classOptions, value.classId]);

  useEffect(() => {
    if (!value.campusId && (value.classId || value.sectionId)) {
      onChange({
        ...value,
        classId: "",
        sectionId: "",
      });
      return;
    }

    if (
      value.classId &&
      !classOptions.some((classOption) => classOption.id === value.classId)
    ) {
      onChange({
        ...value,
        classId: "",
        sectionId: "",
      });
    }
  }, [classOptions, onChange, value]);

  useEffect(() => {
    if (!value.classId && value.sectionId) {
      onChange({
        ...value,
        sectionId: "",
      });
      return;
    }

    if (
      value.sectionId &&
      !sectionOptions.some((section) => section.id === value.sectionId)
    ) {
      onChange({
        ...value,
        sectionId: "",
      });
    }
  }, [onChange, sectionOptions, value]);

  return (
    <div className="rounded-lg border bg-card p-4">
      <FieldGroup className="gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">Initial role assignment</p>
          <p className="text-sm text-muted-foreground">
            Optionally assign the first role while creating the staff record.
          </p>
        </div>

        <Field>
          <FieldLabel>Role</FieldLabel>
          <FieldContent>
            <Select
              disabled={disabled}
              onValueChange={(nextRoleId) =>
                onChange({
                  ...value,
                  roleId:
                    nextRoleId === UNSELECTED_ROLE_VALUE ? "" : nextRoleId,
                })
              }
              value={value.roleId || UNSELECTED_ROLE_VALUE}
            >
              <SelectTrigger>
                <SelectValue placeholder="Skip for now" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={UNSELECTED_ROLE_VALUE}>
                    Skip for now
                  </SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Leave this empty if you only want to create the staff identity
              now.
            </FieldDescription>
          </FieldContent>
        </Field>

        {value.roleId ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>Campus scope</FieldLabel>
              <FieldContent>
                <Select
                  disabled={disabled}
                  onValueChange={(nextCampusId) =>
                    onChange({
                      ...value,
                      campusId:
                        nextCampusId === ALL_SCOPE_VALUE ? "" : nextCampusId,
                      classId: "",
                      sectionId: "",
                    })
                  }
                  value={value.campusId || ALL_SCOPE_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Institution-wide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={ALL_SCOPE_VALUE}>
                        Institution-wide
                      </SelectItem>
                      {campuses.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Class scope</FieldLabel>
              <FieldContent>
                <Select
                  disabled={disabled || !value.campusId}
                  onValueChange={(nextClassId) =>
                    onChange({
                      ...value,
                      classId:
                        nextClassId === ALL_SCOPE_VALUE ? "" : nextClassId,
                      sectionId: "",
                    })
                  }
                  value={value.classId || ALL_SCOPE_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        value.campusId
                          ? "All classes in selected campus"
                          : "Select campus first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={ALL_SCOPE_VALUE}>
                        All classes in selected campus
                      </SelectItem>
                      {classOptions.map((classOption) => (
                        <SelectItem key={classOption.id} value={classOption.id}>
                          {classOption.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Section scope</FieldLabel>
              <FieldContent>
                <Select
                  disabled={disabled || !value.classId}
                  onValueChange={(nextSectionId) =>
                    onChange({
                      ...value,
                      sectionId:
                        nextSectionId === ALL_SCOPE_VALUE ? "" : nextSectionId,
                    })
                  }
                  value={value.sectionId || ALL_SCOPE_VALUE}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        value.classId
                          ? "All sections in selected class"
                          : "Select class first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={ALL_SCOPE_VALUE}>
                        All sections in selected class
                      </SelectItem>
                      {sectionOptions.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          </div>
        ) : null}

        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      </FieldGroup>
    </div>
  );
}
