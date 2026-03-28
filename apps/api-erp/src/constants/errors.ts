export const ERROR_MESSAGES = {
  TENANT: {
    SUBDOMAIN_REQUIRED:
      "A tenant subdomain is required for this institution-scoped API.",
    INSTITUTION_NOT_FOUND: "Institution not found for the current subdomain.",
  },
  AUTH: {
    INVALID_CREDENTIALS: "Invalid mobile number, email, or password.",
    SESSION_REQUIRED: "You must be signed in to access this resource.",
    MOBILE_ALREADY_EXISTS: "An account already exists for this mobile number.",
    EMAIL_ALREADY_EXISTS: "An account already exists for this email address.",
    MEMBERSHIP_REQUIRED: "You do not have access to the selected institution.",
    CONTEXT_ACCESS_REQUIRED:
      "You do not have access to the selected context for this institution.",
    CAMPUS_ACCESS_REQUIRED: "You do not have access to the selected campus.",
    PERMISSION_DENIED: "You do not have permission to perform this action.",
    PASSWORD_RESET_REQUEST_BLOCKED:
      "Too many password reset attempts. Try again later.",
    PASSWORD_RESET_TOKEN_INVALID: "The password reset link is invalid.",
    PASSWORD_RESET_TOKEN_EXPIRED: "The password reset link has expired.",
  },
  ONBOARDING: {
    ORGANIZATION_SLUG_EXISTS: "That institution slug is already in use.",
    CAMPUS_SLUG_EXISTS:
      "That campus slug is already in use for this institution.",
  },
  CAMPUSES: {
    CAMPUS_NOT_FOUND: "The selected campus was not found.",
  },
  STUDENTS: {
    STUDENT_NOT_FOUND: "The selected student was not found.",
    ADMISSION_NUMBER_EXISTS:
      "That admission number is already in use for this institution.",
    GUARDIAN_MEMBERSHIP_REQUIRED:
      "Each guardian must belong to the selected institution.",
    CLASS_CAMPUS_MISMATCH:
      "The selected class does not belong to the selected campus.",
    ROLLOVER_TARGET_YEAR_REQUIRED:
      "Student rollover can only target an active academic year.",
    ROLLOVER_DIFFERENT_YEAR_REQUIRED:
      "Select a different source and target academic year for rollover.",
    ROLLOVER_UNMAPPED_STUDENTS:
      "Every continuing student must have a target class and section before rollover can run.",
  },
  STAFF: {
    STAFF_NOT_FOUND: "The selected staff record was not found.",
    STAFF_MEMBERSHIP_EXISTS:
      "That user already has a staff membership in this institution.",
    STAFF_HAS_ATTENDANCE_RECORDS:
      "Cannot delete a staff record that has already marked attendance. Keep the record inactive instead.",
    ROLE_ASSIGNMENT_NOT_FOUND:
      "The selected staff role assignment was not found.",
    ROLE_ASSIGNMENT_SCOPE_INVALID:
      "Select scopes in order: campus, then class, then section.",
    ROLE_ASSIGNMENT_SCOPE_MISMATCH:
      "The selected scope combination does not belong to the same campus, class, and section.",
    ROLE_ASSIGNMENT_SCOPE_FORBIDDEN:
      "You cannot assign a role scope outside your own visible campus, class, or section access.",
    ROLE_ASSIGNMENT_EXISTS:
      "That staff role assignment already exists for this staff member.",
  },
  ROLES: {
    ROLE_NOT_FOUND: "The selected role was not found for this institution.",
  },
  GUARDIANS: {
    GUARDIAN_NOT_FOUND: "The selected guardian was not found.",
    STUDENT_LINK_NOT_FOUND:
      "The selected guardian-student relationship was not found.",
    LAST_GUARDIAN_LINK: "A student must keep at least one linked guardian.",
  },
  ADMISSIONS: {
    ENQUIRY_NOT_FOUND: "The selected admission enquiry was not found.",
    APPLICATION_NOT_FOUND: "The selected admission application was not found.",
  },
  ACADEMIC_YEARS: {
    INVALID_DATE_RANGE: "End date must be after the start date.",
    CURRENT_YEAR_REQUIRED:
      "At least one academic year must remain current for the institution.",
    YEAR_NOT_FOUND: "The selected academic year was not found.",
  },
  CLASSES: {
    CLASS_NOT_FOUND: "The selected class was not found.",
    SECTION_NOT_FOUND: "The selected section was not found for this class.",
    CLASS_NAME_EXISTS:
      "That class name is already in use for the selected campus.",
    SECTION_NAME_EXISTS: "Section names must be unique within a class.",
    CLASS_HAS_STUDENTS:
      "Cannot delete a class that has enrolled students. Remove or reassign the students first.",
    CLASS_HAS_CURRENT_ENROLLMENTS:
      "Cannot delete a class that is still used by current enrollments. Update those enrollments first.",
    SECTION_HAS_STUDENTS:
      "Cannot remove a section that has enrolled students. Reassign the students first.",
    SECTION_HAS_CURRENT_ENROLLMENTS:
      "Cannot remove a section that is still used by current enrollments. Update those enrollments first.",
  },
  SUBJECTS: {
    SUBJECT_NOT_FOUND: "The selected subject was not found.",
    SUBJECT_NAME_EXISTS:
      "That subject name is already in use for the selected campus.",
    SUBJECT_HAS_TIMETABLE_ENTRIES:
      "Cannot disable or delete a subject that is used in the timetable. Update the timetable first.",
  },
  BELL_SCHEDULES: {
    SCHEDULE_NOT_FOUND: "The selected bell schedule was not found.",
    SCHEDULE_NAME_EXISTS:
      "That bell schedule name is already in use for the selected campus.",
    SCHEDULE_HAS_TIMETABLE_ENTRIES:
      "Cannot delete a bell schedule that is already used in the timetable.",
    PERIOD_INVALID_TIME_RANGE:
      "Every bell schedule period must end after it starts.",
    PERIOD_DUPLICATE_INDEX:
      "Bell schedule periods must use unique contiguous period numbers.",
    DEFAULT_SCHEDULE_REQUIRED:
      "Each campus must keep one default bell schedule for new timetable drafts.",
  },
  TIMETABLE: {
    CLASS_SECTION_REQUIRED: "Class and section are required for timetable.",
    INVALID_TIME_RANGE: "End time must be after the start time.",
    DUPLICATE_PERIOD:
      "Each timetable period must be unique for the selected day.",
    ENTRY_NOT_FOUND: "The selected timetable entry was not found.",
    STAFF_NOT_FOUND: "The selected staff member was not found.",
    TEACHER_CONFLICT:
      "The selected teacher is already assigned to another section for that slot.",
    ROOM_CONFLICT:
      "The selected room is already assigned to another section for that slot.",
    COPY_SOURCE_EMPTY: "The source section does not have a timetable yet.",
    COPY_SOURCE_NOT_FOUND: "The source class and section were not found.",
    COPY_SAME_SECTION:
      "Choose a different source section before copying the timetable.",
    VERSION_NOT_FOUND: "The selected timetable version was not found.",
    VERSION_NAME_EXISTS:
      "That timetable version name is already in use for the selected section.",
    VERSION_PUBLISHED_ONLY:
      "Only published timetable versions can be assigned as the live timetable.",
    VERSION_ARCHIVED:
      "Archived timetable versions cannot be edited or published.",
    ASSIGNMENT_DATE_RANGE_INVALID:
      "Assignment end date must be on or after the effective start date.",
  },
  CALENDAR: {
    EVENT_NOT_FOUND: "The selected calendar event was not found.",
    INVALID_TIME_RANGE: "Event end time must be after the start time.",
  },
  COMMUNICATIONS: {
    ANNOUNCEMENT_NOT_FOUND: "The selected announcement was not found.",
    ANNOUNCEMENT_ALREADY_PUBLISHED:
      "That announcement has already been published.",
  },
  ATTENDANCE: {
    CLASS_SECTION_REQUIRED: "Class and section are required for attendance.",
    NO_STUDENTS_FOUND:
      "No students were found for the selected campus, class, and section.",
    ROSTER_MISMATCH:
      "Attendance must be submitted for the full class roster returned by the API.",
  },
  STAFF_ATTENDANCE: {
    NO_STAFF_FOUND:
      "No active staff members were found for the selected campus.",
    ROSTER_MISMATCH:
      "Attendance must be submitted for the full staff roster returned by the API.",
  },
  EXAMS: {
    TERM_NOT_FOUND: "The selected exam term was not found.",
    ACADEMIC_YEAR_REQUIRED:
      "The selected academic year was not found for this institution.",
    INVALID_TERM_DATE_RANGE: "Exam term end date must be after the start date.",
    INVALID_MARK_RANGE:
      "Obtained marks must be between zero and the maximum marks.",
    DUPLICATE_MARK_ENTRY:
      "Each student can only have one mark entry per subject in the same exam term.",
    STUDENT_REQUIRED:
      "Every marks entry must belong to a student in the selected institution.",
  },
  FEES: {
    ACADEMIC_YEAR_NOT_FOUND: "The selected academic year was not found.",
    ACADEMIC_YEAR_ARCHIVED:
      "Fee structures can only be created for active academic years.",
    FEE_STRUCTURE_NOT_FOUND: "The selected fee structure was not found.",
    FEE_STRUCTURE_INACTIVE:
      "Only active fee structures can be assigned to students.",
    FEE_STRUCTURE_NAME_EXISTS:
      "That fee structure already exists for the selected scope.",
    FEE_ASSIGNMENT_NOT_FOUND: "The selected fee assignment was not found.",
    FEE_PAYMENT_NOT_FOUND: "The selected fee payment was not found.",
    FEE_ADJUSTMENT_NOT_FOUND: "The selected fee adjustment was not found.",
    FEE_PAYMENT_REVERSAL_NOT_FOUND:
      "The selected fee payment reversal was not found.",
    FEE_ASSIGNMENT_EXISTS:
      "That student already has an assignment for this installment.",
    FEE_STRUCTURE_AMOUNT_INVALID: "Fee amount must be greater than zero.",
    FEE_ASSIGNMENT_AMOUNT_INVALID: "Assigned amount must be greater than zero.",
    FEE_ADJUSTMENT_AMOUNT_INVALID:
      "Adjustment amount must be greater than zero.",
    FEE_PAYMENT_AMOUNT_INVALID: "Payment amount must be greater than zero.",
    FEE_PAYMENT_EXCEEDS_DUE:
      "Payment amount cannot exceed the outstanding dues for this assignment.",
    FEE_ADJUSTMENT_EXCEEDS_DUE:
      "Adjustment amount cannot exceed the outstanding dues for this assignment.",
    FEE_PAYMENT_ALREADY_REVERSED: "That payment has already been reversed.",
    FEE_STRUCTURE_SCOPE_INVALID:
      "Campus-scoped fee structures must target a campus.",
    FEE_STRUCTURE_CAMPUS_MISMATCH:
      "Student campus must match the selected campus-scoped fee structure.",
    FEE_STRUCTURE_HAS_ASSIGNMENTS:
      "Cannot delete a fee structure that has assignments.",
    FEE_ASSIGNMENT_HAS_PAYMENTS:
      "Cannot delete a fee assignment that already has recorded payments.",
    FEE_ASSIGNMENT_HAS_ADJUSTMENTS:
      "Cannot delete a fee assignment that already has recorded adjustments.",
    FEE_ASSIGNMENT_AMOUNT_LOCKED:
      "Assigned amount cannot be changed after a payment has been recorded.",
    FEE_INSTALLMENT_NOT_FOUND: "The selected fee installment was not found.",
    FEE_INSTALLMENTS_REQUIRED:
      "At least one installment is required for a fee structure.",
    FEE_INSTALLMENTS_LOCKED:
      "Installments cannot be modified after assignments exist, including historical records.",
    FEE_REMINDER_NO_GUARDIAN:
      "No guardian with contact details found for this student.",
    FEE_ASSIGNMENT_ALREADY_PAID:
      "Cannot send a reminder for a fully paid fee assignment.",
  },
  DATA_EXCHANGE: {
    CSV_EMPTY: "Upload a CSV file with a header row and at least one data row.",
    CSV_HEADER_REQUIRED: "The CSV file must include a header row.",
    ENTITY_TYPE_UNSUPPORTED:
      "The selected import/export entity type is not supported.",
    TEMPLATE_NOT_FOUND:
      "No template is available for the selected import/export entity type.",
    NO_ROWS_TO_IMPORT: "No valid rows were found to import.",
  },
  HOMEWORK: {
    NOT_FOUND: "Homework not found.",
    ALREADY_PUBLISHED: "This homework assignment is already published.",
    SCOPE_DENIED: "You do not have access to the selected class or section.",
  },
  LEAVE: {
    TYPE_NOT_FOUND: "Leave type not found.",
    TYPE_INACTIVE: "This leave type is inactive.",
    APPLICATION_NOT_FOUND: "Leave application not found.",
    ALREADY_REVIEWED: "This leave application has already been reviewed.",
    ALREADY_CANCELLED: "This leave application is already cancelled.",
    INVALID_DATE_RANGE: "From date must be on or before to date.",
  },
  LIBRARY: {
    BOOK_NOT_FOUND: "Book not found.",
    BOOK_INACTIVE: "This book is currently inactive.",
    NO_COPIES_AVAILABLE: "No copies of this book are currently available.",
    TRANSACTION_NOT_FOUND: "Library transaction not found.",
    ALREADY_RETURNED: "This book has already been returned.",
    MEMBER_NOT_FOUND: "Member not found in this institution.",
  },
  PAYROLL: {
    COMPONENT_NOT_FOUND: "Salary component not found.",
    COMPONENT_IN_USE: "This salary component is used in one or more templates and cannot be deleted.",
    TEMPLATE_NOT_FOUND: "Salary template not found.",
    TEMPLATE_IN_USE: "This salary template is assigned to one or more staff members and cannot be deleted.",
    ASSIGNMENT_NOT_FOUND: "Salary assignment not found.",
    STAFF_ALREADY_ASSIGNED: "This staff member already has an active salary assignment.",
    RUN_NOT_FOUND: "Payroll run not found.",
    RUN_ALREADY_EXISTS: "A payroll run already exists for this month and campus.",
    RUN_NOT_DRAFT: "This payroll run is no longer in draft status.",
    RUN_NOT_PROCESSED: "This payroll run has not been processed yet.",
    RUN_NOT_APPROVED: "This payroll run has not been approved yet.",
    NO_STAFF_TO_PROCESS: "No staff members with active salary assignments found for this payroll run.",
    PAYSLIP_NOT_FOUND: "Payslip not found.",
  },
  TRANSPORT: {
    ROUTE_NOT_FOUND: "The selected transport route was not found.",
    STOP_NOT_FOUND: "The selected route stop was not found.",
    STOP_SEQUENCE_EXISTS:
      "A stop with that sequence number already exists on this route.",
    VEHICLE_NOT_FOUND: "The selected vehicle was not found.",
    VEHICLE_REG_EXISTS:
      "A vehicle with that registration number already exists for this institution.",
    ASSIGNMENT_NOT_FOUND: "The selected transport assignment was not found.",
    STUDENT_ALREADY_ASSIGNED:
      "This student already has an active transport assignment. Update or deactivate the existing assignment first.",
  },
  INVENTORY: {
    CATEGORY_NOT_FOUND: "Inventory category not found.",
    CATEGORY_HAS_ITEMS:
      "Cannot delete a category that has items. Remove or reassign the items first.",
    CATEGORY_NAME_EXISTS:
      "That category name is already in use for this institution.",
    ITEM_NOT_FOUND: "Inventory item not found.",
    ITEM_HAS_TRANSACTIONS:
      "Cannot delete an item that has stock transactions. Deactivate it instead.",
    ITEM_SKU_EXISTS:
      "That SKU is already in use for another item in this institution.",
    INSUFFICIENT_STOCK:
      "Insufficient stock to complete this transaction.",
    TRANSACTION_NOT_FOUND: "Stock transaction not found.",
    MEMBER_NOT_FOUND: "Member not found in this institution.",
  },
  HOSTEL: {
    BUILDING_NOT_FOUND: "Hostel building not found.",
    BUILDING_NAME_EXISTS:
      "That building name is already in use for this institution.",
    BUILDING_HAS_ROOMS:
      "Cannot delete a building that has rooms. Remove or deactivate the rooms first.",
    ROOM_NOT_FOUND: "Hostel room not found.",
    ROOM_NUMBER_EXISTS:
      "That room number already exists in this building.",
    ROOM_FULL:
      "This room has reached its capacity. No more beds can be allocated.",
    ALLOCATION_NOT_FOUND: "Bed allocation not found.",
    STUDENT_ALREADY_ALLOCATED:
      "This student already has an active bed allocation.",
    ALLOCATION_ALREADY_VACATED:
      "This bed allocation has already been vacated.",
    MESS_PLAN_NOT_FOUND: "Mess plan not found.",
    MESS_PLAN_NAME_EXISTS:
      "That mess plan name is already in use for this institution.",
    STUDENT_NOT_FOUND: "Student not found in this institution.",
  },
} as const;
