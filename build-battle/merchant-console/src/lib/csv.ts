import { merchantById } from "@/data/merchants"
import { Payment } from "@/data/types"
import { formatMoney } from "./money"

/**
 * CSV export for the payments table.
 *
 * Callers choose the columns (validated by parseColumns). The default set
 * leaves out the card last four.
 */

export const EXPORT_COLUMNS = [
  "id",
  "created_at",
  "merchant",
  "description",
  "status",
  "method",
  "card_brand",
  "last4",
  "amount",
  "currency",
] as const

export type ExportColumn = (typeof EXPORT_COLUMNS)[number]

/** Card last four is opt-in: files go to merchants, so it is off unless asked for. */
export const DEFAULT_EXPORT_COLUMNS: readonly ExportColumn[] =
  EXPORT_COLUMNS.filter((column) => column !== "last4")

export type ParsedColumns =
  | { ok: true; columns: ExportColumn[] }
  | { ok: false; message: string }

/**
 * Turns the client's comma-separated `columns` param into an allowlisted,
 * ordered, de-duplicated list. An absent param means the defaults; a present
 * but empty one is an error, never an empty file.
 */
export function parseColumns(raw: string | null): ParsedColumns {
  if (raw === null) return { ok: true, columns: [...DEFAULT_EXPORT_COLUMNS] }

  const requested = raw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
  if (requested.length === 0) {
    return { ok: false, message: "Select at least one column to export." }
  }

  const allowed: readonly string[] = EXPORT_COLUMNS
  const unknown = requested.filter((name) => !allowed.includes(name))
  if (unknown.length > 0) {
    return { ok: false, message: `Unknown column: ${unknown[0]}` }
  }

  return {
    ok: true,
    columns: [...new Set(requested)] as ExportColumn[],
  }
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function cell(payment: Payment, column: ExportColumn): string {
  switch (column) {
    case "id":
      return payment.id
    case "created_at":
      return payment.createdAt
    case "merchant":
      return merchantById(payment.merchantId)?.name ?? payment.merchantId
    case "description":
      return payment.description
    case "status":
      return payment.status
    case "method":
      return payment.method
    case "card_brand":
      return payment.cardBrand ?? ""
    case "last4":
      return payment.last4 ?? ""
    case "amount":
      return formatMoney(payment.amount, payment.currency)
    case "currency":
      return payment.currency
  }
}

export function toCsv(
  payments: Payment[],
  columns: readonly ExportColumn[] = DEFAULT_EXPORT_COLUMNS,
): string {
  const header = columns.join(",")
  const rows = payments.map((payment) =>
    columns.map((column) => escapeCell(cell(payment, column))).join(","),
  )
  return [header, ...rows].join("\n")
}

/** `scope` must be an allowlisted label (a status or "all"), never raw input. */
export function exportFilename(scope = "all", date = new Date()): string {
  return `payments-${scope}-${date.toISOString().slice(0, 10)}.csv`
}
