# Admission Custom Fields

## Goal
Allow each institution to configure extra fields for admission applications and student records without changing the core schema for every school-specific requirement.

## Scope
- Tenant-scoped custom field definitions for admissions settings
- Supported scopes:
  - `application`
  - `student`
  - `both`
- Supported field types:
  - text
  - textarea
  - number
  - date
  - select
  - email
  - phone
  - url
  - checkbox

## Backend
- Add `admission_form_fields` table in `packages/database`
- Add `custom_field_values` JSONB storage on:
  - `admission_applications`
  - `students`
- Add admissions endpoints:
  - `GET /admissions/form-fields`
  - `POST /admissions/form-fields`
  - `PATCH /admissions/form-fields/:fieldId`
- Validate custom field payloads in NestJS before persisting application/student records
- Reject unknown field keys and invalid values fail-closed

## Frontend
- Add settings page at `/settings/admission-fields`
- Support create/edit of tenant custom field definitions
- Render active custom fields on:
  - admission application form
  - student create form
  - student edit form

## Constraints
- Core workflow fields remain typed first-class columns
- Custom fields are additive only, not a replacement for the main schema
- Inactive fields remain visible in settings but stop rendering in forms
