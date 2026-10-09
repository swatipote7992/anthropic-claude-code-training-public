"use client"

import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"
import { Download } from "lucide-react"
import { useState } from "react"

type Scope = "filter" | "all"

const COLUMN_LABELS: Record<string, string> = {
  id: "Payment ID",
  created_at: "Created at",
  merchant: "Merchant",
  description: "Description",
  status: "Status",
  method: "Method",
  card_brand: "Card brand",
  last4: "Card last four",
  amount: "Amount",
  currency: "Currency",
}

/**
 * Options for the payments export. Column names and scope are only a request:
 * the export route validates both again, so nothing here is enforcement.
 * Row counts come from the server page so the file size is known before
 * download.
 */
export function ExportDialog({
  columns,
  defaultColumns,
  filterQuery,
  filterCount,
  allCount,
}: {
  columns: string[]
  defaultColumns: string[]
  /** Active filters as a query string, without the page param. */
  filterQuery: string
  filterCount: number
  allCount: number
}) {
  const [selected, setSelected] = useState<string[]>(defaultColumns)
  const [scope, setScope] = useState<Scope>("filter")

  const toggle = (column: string) =>
    setSelected((current) =>
      current.includes(column)
        ? current.filter((name) => name !== column)
        : [...current, column],
    )

  // Keep the file's column order stable regardless of click order.
  const ordered = columns.filter((column) => selected.includes(column))
  const count = scope === "all" ? allCount : filterCount

  const params = new URLSearchParams(scope === "filter" ? filterQuery : "")
  params.set("scope", scope)
  params.set("columns", ordered.join(","))
  const href = `/api/payments/export?${params.toString()}`
  const canDownload = ordered.length > 0

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full gap-2 py-1.5 sm:w-fit">
          <Download
            className="-ml-0.5 size-4 shrink-0 text-gray-400 dark:text-gray-600"
            aria-hidden="true"
          />
          Export
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Export payments</DrawerTitle>
          <DrawerDescription>
            Choose what goes in the CSV. Card last four is off by default.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Scope
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["filter", "Current filter", filterCount],
                  ["all", "All payments", allCount],
                ] as const
              ).map(([value, label, rows]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="export-scope"
                    value={value}
                    checked={scope === value}
                    onChange={() => setScope(value)}
                  />
                  {label}
                  <span className="text-gray-500">
                    ({rows.toLocaleString()} rows)
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-900 dark:text-gray-50">
              Columns
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {columns.map((column) => (
                <label
                  key={column}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(column)}
                    onChange={() => toggle(column)}
                  />
                  {COLUMN_LABELS[column] ?? column}
                </label>
              ))}
            </div>
            {!canDownload && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                Select at least one column to export.
              </p>
            )}
          </fieldset>
        </DrawerBody>
        <DrawerFooter>
          <p className="self-center text-sm text-gray-500 sm:mr-auto">
            {count.toLocaleString()} rows will be exported
          </p>
          {canDownload ? (
            <Button asChild>
              <a href={href} download>
                Download
              </a>
            </Button>
          ) : (
            <Button disabled>Download</Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
