import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DATA_EXCHANGE_ACTIONS,
  type DataExchangeEntityType,
} from "@repo/contracts";
import { toast } from "sonner";
import { IconDownload, IconFileImport, IconUpload } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { EntityToolbarSecondaryAction } from "@/components/entities/entity-actions";
import { EntitySheet } from "@/components/entities/entity-sheet";
import {
  downloadDataExchangeExport,
  downloadDataExchangeTemplate,
  useExecuteDataExchangeImportMutation,
  usePreviewDataExchangeImportMutation,
} from "@/features/data-exchange/api/use-data-exchange";
import {
  DATA_EXCHANGE_ENTITY_DESCRIPTIONS,
  DATA_EXCHANGE_ENTITY_LABELS,
  DATA_EXCHANGE_TAB_VALUES,
} from "@/features/data-exchange/model/data-exchange.constants";
import {
  dataExchangeImportFormSchema,
  type DataExchangeImportFormValues,
} from "@/features/data-exchange/model/data-exchange-form";

type DataExchangeEntityActionsProps = {
  entityType: DataExchangeEntityType;
};

type PreviewResult = {
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
  rows: Array<{
    rowNumber: number;
    identifier: string;
    status: "valid" | "error" | "imported" | "failed";
    messages: string[];
  }>;
};

type ExecuteResult = {
  summary: {
    totalRows: number;
    importedRows: number;
    failedRows: number;
  };
  rows: Array<{
    rowNumber: number;
    identifier: string;
    status: "valid" | "error" | "imported" | "failed";
    messages: string[];
  }>;
};

export function DataExchangeEntityActions({
  entityType,
}: DataExchangeEntityActionsProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(
    DATA_EXCHANGE_TAB_VALUES.IMPORT,
  );
  const [csvContent, setCsvContent] = useState("");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(
    null,
  );
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(
    null,
  );
  const previewMutation = usePreviewDataExchangeImportMutation();
  const executeMutation = useExecuteDataExchangeImportMutation();

  const form = useForm<DataExchangeImportFormValues>({
    resolver: zodResolver(dataExchangeImportFormSchema),
    defaultValues: {
      entityType,
    },
  });

  function openFor(action: string) {
    setActiveTab(action);
    setOpen(true);
  }

  async function readCsv(file: File) {
    return file.text();
  }

  async function handlePreview(values: DataExchangeImportFormValues) {
    const fileContent = await readCsv(values.file);

    setCsvContent(fileContent);
    setExecuteResult(null);

    const result = await previewMutation.mutateAsync({
      body: {
        entityType,
        csvContent: fileContent,
      },
    });

    setPreviewResult(result as PreviewResult);
  }

  async function handleExecute() {
    if (!csvContent) {
      toast.error("Preview a CSV file before importing.");
      return;
    }

    const result = await executeMutation.mutateAsync({
      body: {
        entityType,
        csvContent,
      },
    });

    setExecuteResult(result as ExecuteResult);
    toast.success("Bulk import finished.");
  }

  async function handleTemplateDownload() {
    try {
      await downloadDataExchangeTemplate(entityType);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Template download failed.",
      );
    }
  }

  async function handleExportDownload() {
    try {
      await downloadDataExchangeExport(entityType);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Export download failed.",
      );
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <EntityToolbarSecondaryAction asChild>
          <button
            onClick={() => openFor(DATA_EXCHANGE_TAB_VALUES.IMPORT)}
            type="button"
          >
            Import
          </button>
        </EntityToolbarSecondaryAction>
        <EntityToolbarSecondaryAction asChild>
          <button
            onClick={() => openFor(DATA_EXCHANGE_TAB_VALUES.EXPORT)}
            type="button"
          >
            Export
          </button>
        </EntityToolbarSecondaryAction>
      </div>

      <EntitySheet
        description={DATA_EXCHANGE_ENTITY_DESCRIPTIONS[entityType]}
        onOpenChange={setOpen}
        open={open}
        title={`${DATA_EXCHANGE_ENTITY_LABELS[entityType]} Data Exchange`}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-auto rounded-2xl bg-muted/70 p-1">
            <TabsTrigger value={DATA_EXCHANGE_TAB_VALUES.IMPORT}>
              Import
            </TabsTrigger>
            <TabsTrigger value={DATA_EXCHANGE_TAB_VALUES.EXPORT}>
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent
            className="mt-5 space-y-5"
            value={DATA_EXCHANGE_TAB_VALUES.IMPORT}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {DATA_EXCHANGE_ENTITY_LABELS[entityType]}
              </p>
              <p className="text-sm text-muted-foreground">
                Download the template, review validation results, then execute
                the import.
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {DATA_EXCHANGE_ACTIONS.IMPORT}
                </Badge>
                <Badge variant="secondary">
                  {DATA_EXCHANGE_ACTIONS.EXPORT}
                </Badge>
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(
                (values) => void handlePreview(values),
              )}
            >
              <Controller
                control={form.control}
                name="file"
                render={({ fieldState }) => (
                  <Field>
                    <FieldLabel>CSV File</FieldLabel>
                    <Input
                      accept=".csv,text/csv"
                      className="h-10 rounded-lg"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        form.setValue("file", file as File, {
                          shouldValidate: true,
                        });
                      }}
                      type="file"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />

              <div className="flex flex-wrap gap-3">
                <Button
                  className="h-10 rounded-lg"
                  onClick={handleTemplateDownload}
                  type="button"
                  variant="outline"
                >
                  <IconDownload className="size-4" />
                  Template
                </Button>
                <Button
                  className="h-10 rounded-lg"
                  disabled={previewMutation.isPending}
                  type="submit"
                >
                  <IconFileImport className="size-4" />
                  Preview import
                </Button>
              </div>
            </form>

            {previewResult ? (
              <div className="space-y-4 rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">
                    Valid {previewResult.summary.validRows}
                  </Badge>
                  <Badge variant="secondary">
                    Invalid {previewResult.summary.invalidRows}
                  </Badge>
                  <Button
                    className="h-10 rounded-lg"
                    disabled={
                      executeMutation.isPending ||
                      previewResult.summary.validRows === 0
                    }
                    onClick={() => void handleExecute()}
                    type="button"
                  >
                    <IconUpload className="size-4" />
                    Execute import
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Messages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewResult.rows.map((row) => (
                      <TableRow key={`${row.rowNumber}-${row.identifier}`}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>{row.identifier}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "valid"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal text-sm text-muted-foreground">
                          {row.messages.length > 0
                            ? row.messages.join(" ")
                            : "Ready to import."}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {executeResult ? (
              <div className="space-y-4 rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">
                    Imported {executeResult.summary.importedRows}
                  </Badge>
                  <Badge variant="secondary">
                    Failed {executeResult.summary.failedRows}
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Messages</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executeResult.rows.map((row) => (
                      <TableRow
                        key={`${row.rowNumber}-${row.identifier}-result`}
                      >
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>{row.identifier}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "imported"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-normal text-sm text-muted-foreground">
                          {row.messages.join(" ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent
            className="mt-5 space-y-4"
            value={DATA_EXCHANGE_TAB_VALUES.EXPORT}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Export {DATA_EXCHANGE_ENTITY_LABELS[entityType].toLowerCase()}
              </p>
              <p className="text-sm text-muted-foreground">
                Download the current institution-scoped CSV for this entity.
              </p>
            </div>
            <Button
              className="h-10 rounded-lg"
              onClick={handleExportDownload}
              type="button"
              variant="outline"
            >
              <IconDownload className="size-4" />
              Export CSV
            </Button>
          </TabsContent>
        </Tabs>
      </EntitySheet>
    </>
  );
}
