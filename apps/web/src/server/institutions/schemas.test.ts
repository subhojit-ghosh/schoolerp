import { describe, expect, test } from "bun:test";
import { createInstitutionSchema, updateInstitutionSchema } from "./schemas";

const validAdminFields = {
  adminName: "Jane Smith",
  adminEmail: "admin@school.edu",
  adminPassword: "password123",
} as const;

describe("createInstitutionSchema", () => {
  test("accepts valid input", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "springfield-elementary",
      institutionType: "primary_school",
      ...validAdminFields,
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = createInstitutionSchema.safeParse({
      name: "",
      slug: "springfield-elementary",
      institutionType: "primary_school",
      ...validAdminFields,
    });
    expect(result.success).toBe(false);
  });

  test("rejects slug with spaces", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "springfield elementary",
      institutionType: "primary_school",
      ...validAdminFields,
    });
    expect(result.success).toBe(false);
  });

  test("rejects slug with uppercase", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "Springfield",
      institutionType: "primary_school",
      ...validAdminFields,
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty institutionType", () => {
    const result = createInstitutionSchema.safeParse({
      name: "Springfield Elementary",
      slug: "springfield-elementary",
      institutionType: "",
      ...validAdminFields,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateInstitutionSchema", () => {
  test("accepts partial update (name only)", () => {
    const result = updateInstitutionSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  test("rejects empty name", () => {
    const result = updateInstitutionSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  test("rejects slug with uppercase in update", () => {
    const result = updateInstitutionSchema.safeParse({ slug: "Bad-Slug" });
    expect(result.success).toBe(false);
  });
});
