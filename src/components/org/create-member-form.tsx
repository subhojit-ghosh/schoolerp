"use client";

import { useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMember } from "@/server/members/actions";
import {
  createMemberSchema,
  type CreateMemberInput,
} from "@/server/members/schemas";
import type { MemberRoleOption } from "@/server/members/queries";

type CreateMemberFormProps = {
  roleOptions: MemberRoleOption[];
};

export function CreateMemberForm({ roleOptions }: CreateMemberFormProps) {
  const [state, action, isPending] = useActionState(createMember, {});
  const {
    control,
    formState: { errors },
  } = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roleId: "",
    },
  });

  const serverError =
    state?.serverError ??
    state?.validationErrors?.email?._errors?.[0] ??
    state?.validationErrors?.roleId?._errors?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5 lg:grid-cols-2">
          {serverError ? (
            <p className="text-destructive rounded-md bg-destructive/10 px-3 py-2 text-sm lg:col-span-2">
              {serverError}
            </p>
          ) : null}

          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input {...field} name="name" placeholder="Jane Smith" />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  {...field}
                  name="email"
                  type="email"
                  placeholder="jane@school.edu"
                />
                <FieldError>{errors.email?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Field>
                <FieldLabel>Temporary password</FieldLabel>
                <Input
                  {...field}
                  name="password"
                  type="password"
                  placeholder="••••••••"
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="roleId"
            render={({ field }) => (
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  name="roleId"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{errors.roleId?.message}</FieldError>
              </Field>
            )}
          />

          <div className="flex items-center justify-end lg:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add member"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
