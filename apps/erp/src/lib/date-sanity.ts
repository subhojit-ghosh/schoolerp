/**
 * Date and value sanity checks for ERP forms.
 *
 * These return warning messages (not errors) for suspicious but
 * technically valid values. They don't block submission — they
 * just surface a yellow warning beneath the field.
 */

const MIN_STUDENT_AGE = 2;
const MAX_STUDENT_AGE = 25;
const MAX_STAFF_AGE = 75;
const MIN_STAFF_AGE = 18;

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
    age--;
  return age;
}

/** Warn if a date of birth looks unreasonable for a student. */
export function checkStudentDob(dob: string): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (d > new Date()) return "Date of birth is in the future.";
  const age = ageFromDob(dob);
  if (age < MIN_STUDENT_AGE)
    return `Student would be ${age} years old. Is the date correct?`;
  if (age > MAX_STUDENT_AGE)
    return `Student would be ${age} years old. Is the date correct?`;
  return null;
}

/** Warn if a date of birth looks unreasonable for a staff member. */
export function checkStaffDob(dob: string): string | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (d > new Date()) return "Date of birth is in the future.";
  const age = ageFromDob(dob);
  if (age < MIN_STAFF_AGE)
    return `Staff member would be ${age} years old. Is the date correct?`;
  if (age > MAX_STAFF_AGE)
    return `Staff member would be ${age} years old. Is the date correct?`;
  return null;
}

/** Warn if an admission date is before the student's DOB. */
export function checkAdmissionAfterDob(
  admissionDate: string,
  dob: string,
): string | null {
  if (!admissionDate || !dob) return null;
  if (new Date(admissionDate) < new Date(dob))
    return "Admission date is before the date of birth.";
  return null;
}

/** Warn if a fee due date is in the past. */
export function checkFeeDueDateNotPast(dueDate: string): string | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(dueDate) < today)
    return "Due date is in the past. Students will immediately show as overdue.";
  return null;
}

/** Warn if a fee amount looks unreasonably large (> ₹50,00,000). */
export function checkFeeAmountReasonable(
  amountInPaise: number,
): string | null {
  const MAX_REASONABLE_PAISE = 50_00_000_00; // ₹50,00,000
  if (amountInPaise > MAX_REASONABLE_PAISE)
    return "Amount is over ₹50,00,000. Is this correct?";
  return null;
}
