import { type Control, Controller } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
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
  BLOOD_GROUP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  STAFF_GENDER_OPTIONS,
  type StaffFormValues,
} from "@/features/staff/model/staff-form-schema";

type StaffProfileFieldsProps = {
  control: Control<StaffFormValues>;
};

export function StaffEmploymentFields({ control }: StaffProfileFieldsProps) {

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Controller
        control={control}
        name="profile.employeeId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-employee-id">Employee ID</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-employee-id"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.designation"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-designation">Designation</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-designation"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.department"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-department">Department</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-department"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.dateOfJoining"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-doj">Date of Joining</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-doj"
                type="date"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.employmentType"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Employment Type</FieldLabel>
            <FieldContent>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
        name="profile.qualification"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-qualification">Qualification</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-qualification"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.experienceYears"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-experience">
              Experience (years)
            </FieldLabel>
            <FieldContent>
              <Input
                {...field}
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
                id="staff-experience"
                inputMode="numeric"
                type="number"
                min={0}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
    </div>
  );
}

export function StaffPersonalFields({ control }: StaffProfileFieldsProps) {

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Controller
        control={control}
        name="profile.dateOfBirth"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-dob">Date of Birth</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-dob"
                type="date"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.gender"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Gender</FieldLabel>
            <FieldContent>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STAFF_GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
        name="profile.bloodGroup"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel>Blood Group</FieldLabel>
            <FieldContent>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {BLOOD_GROUP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
        name="profile.address"
        render={({ field, fieldState }) => (
          <Field
            className="sm:col-span-2"
            data-invalid={fieldState.invalid || undefined}
          >
            <FieldLabel htmlFor="staff-address">Address</FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-address"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.emergencyContactName"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-emergency-name">
              Emergency Contact Name
            </FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-emergency-name"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
      <Controller
        control={control}
        name="profile.emergencyContactMobile"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="staff-emergency-mobile">
              Emergency Contact Mobile
            </FieldLabel>
            <FieldContent>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                id="staff-emergency-mobile"
                inputMode="tel"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldContent>
          </Field>
        )}
      />
    </div>
  );
}
