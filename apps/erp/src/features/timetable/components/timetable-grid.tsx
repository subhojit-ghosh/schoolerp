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
    <div className="overflow-x-auto rounded-lg border">
      <div
        className="grid min-w-[880px]"
        style={{
          gridTemplateColumns: `220px repeat(${days.length}, minmax(140px, 1fr))`,
        }}
      >
        <div className="border-b bg-muted/40 px-4 py-3">
          <p className="text-sm font-medium">{bellSchedule.name}</p>
          <p className="text-xs text-muted-foreground">Period timing template</p>
        </div>
        {days.map((day) => (
          <div
            key={day.value}
            className="border-b border-l bg-muted/40 px-4 py-3 text-sm font-medium"
          >
            {day.label}
          </div>
        ))}

        {bellSchedule.periods.map((period) => (
          <div
            key={period.id}
            className="contents"
          >
            <div
              className="border-b px-4 py-4"
            >
              <p className="text-sm font-medium">
                {period.label?.trim() || `Period ${period.periodIndex}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {period.startTime} - {period.endTime}
              </p>
            </div>
            {days.map((day) => {
              const key = `${day.value}:${period.periodIndex}`;

              return (
                <div key={key} className="border-b border-l p-3">
                  <TimetableCell
                    classId={classId}
                    conflicted={conflictKeys?.has(key)}
                    dayLabel={day.label}
                    displayMode={viewMode}
                    isBreak={period.isBreak}
                    periodLabel={period.label?.trim() || `Period ${period.periodIndex}`}
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
                                subjects.find((subject) => subject.id === value.subjectId)
                                  ?.name ?? entries[key]?.subjectName ?? "",
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
