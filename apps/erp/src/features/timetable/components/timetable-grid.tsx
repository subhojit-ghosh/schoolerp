import type { TimetableCellValue } from "@/features/timetable/model/timetable-editor-schema";
import { TimetableCell } from "@/features/timetable/components/timetable-cell";

type BellSchedulePeriod = {
  id: string;
  endTime: string;
  isBreak: boolean;
  label?: string | null;
  periodIndex: number;
  startTime: string;
};

type TimetableGridProps = {
  bellSchedule: {
    id: string;
    name: string;
    periods: BellSchedulePeriod[];
  };
  classId?: string;
  conflictKeys?: Set<string>;
  days: Array<{ label: string; value: string }>;
  entries: Record<string, TimetableCellValue>;
  readOnly?: boolean;
  subjects: Array<{ id: string; name: string }>;
  viewMode?: "section" | "teacher";
  onCellChange?: (key: string, value: TimetableCellValue | null) => void;
};

export function TimetableGrid({
  bellSchedule,
  classId,
  conflictKeys,
  days,
  entries,
  readOnly = false,
  subjects,
  viewMode = "section",
  onCellChange,
}: TimetableGridProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background shadow-sm">
      <div
        className="grid min-w-[820px]"
        style={{
          gridTemplateColumns: `200px repeat(${days.length}, minmax(132px, 1fr))`,
        }}
      >
        <div className="border-b bg-muted/24 px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">
            {bellSchedule.name}
          </p>
          <p className="text-xs text-muted-foreground">
            Period timing template
          </p>
        </div>
        {days.map((day) => (
          <div
            key={day.value}
            className="border-b border-l bg-muted/24 px-3 py-3 text-sm font-semibold"
          >
            {day.label}
          </div>
        ))}

        {bellSchedule.periods.map((period) => (
          <div key={period.id} className="contents">
            <div className="border-b bg-muted/[0.08] px-4 py-3.5">
              <p className="text-sm font-semibold">
                {period.label?.trim() || `Period ${period.periodIndex}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {period.startTime} - {period.endTime}
              </p>
            </div>
            {days.map((day) => {
              const key = `${day.value}:${period.periodIndex}`;

              return (
                <div key={key} className="border-b border-l p-2.5">
                  <TimetableCell
                    classId={classId}
                    conflicted={conflictKeys?.has(key)}
                    dayLabel={day.label}
                    displayMode={viewMode}
                    isBreak={period.isBreak}
                    periodLabel={
                      period.label?.trim() || `Period ${period.periodIndex}`
                    }
                    readOnly={readOnly}
                    subjects={subjects}
                    value={entries[key]}
                    onAssign={
                      onCellChange
                        ? (value) =>
                            onCellChange(key, {
                              bellSchedulePeriodId: period.id,
                              room: value.room ?? "",
                              staffId: value.staffId ?? null,
                              staffName:
                                entries[key]?.staffId === value.staffId
                                  ? entries[key]?.staffName
                                  : null,
                              subjectId: value.subjectId,
                              subjectName:
                                subjects.find(
                                  (subject) => subject.id === value.subjectId,
                                )?.name ??
                                entries[key]?.subjectName ??
                                "",
                            })
                        : undefined
                    }
                    onClear={
                      onCellChange ? () => onCellChange(key, null) : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
