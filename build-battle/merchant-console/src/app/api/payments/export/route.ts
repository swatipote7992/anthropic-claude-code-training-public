import { filterPayments, parseFilters, sortPayments } from "@/data/queries"
import { exportFilename, parseColumns, toCsv } from "@/lib/csv"
import { NextRequest, NextResponse } from "next/server"

const SCOPES = ["filter", "all"] as const

function badRequest(message: string) {
  return NextResponse.json({ error: { message } }, { status: 400 })
}

/**
 * Exports the payments table as CSV.
 *
 * `columns` (comma-separated) and `scope` (`filter` | `all`) come from the
 * client, so both are checked against allowlists before anything else runs.
 * Rows come from the shared query builder; this never paginates, so the file
 * is the whole result set, not the page on screen.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  const parsed = parseColumns(params.get("columns"))
  if (!parsed.ok) return badRequest(parsed.message)

  const scope = params.get("scope") ?? "filter"
  if (!(SCOPES as readonly string[]).includes(scope)) {
    return badRequest(`Unknown scope: ${scope}`)
  }

  // "all" ignores every filter, so parse an empty query for the defaults.
  const filters = parseFilters(scope === "all" ? new URLSearchParams() : params)
  const rows = sortPayments(
    filterPayments(filters),
    filters.sort,
    filters.direction,
  )

  const label = scope === "all" ? "all" : (filters.status ?? "all")

  return new Response(toCsv(rows, parsed.columns), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${exportFilename(label)}"`,
    },
  })
}
