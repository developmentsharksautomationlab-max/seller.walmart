"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { apiFetch } from "@/lib/client-auth";
import type { ImportResult } from "@/app/api/import/route";
import {
  buildColumnMap,
  toPreview,
  type PreviewRow,
} from "@/lib/import-parse";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

// Format a plain "YYYY-MM-DD" string in local time (avoids the UTC off-by-one
// you get from `new Date("2026-06-01")`).
function formatYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return dateFmt.format(new Date(y, m - 1, d));
}

function downloadTemplate() {
  const csv =
    "Customer,Product,Category,Quantity,Unit Price,Status,Date\n" +
    "Aarav Sharma,Wireless Headphones,Electronics,1,129.00,Delivered,2026-06-01\n" +
    "Diya Patel,Cotton T-Shirt,Apparel,3,19.99,Unshipped,2026-06-03\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "saleshub-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportClient() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, startImport] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  // Date applied to imported rows that have no date of their own in the file.
  const [fallbackDate, setFallbackDate] = useState(today);

  const validRows = rows.filter((r) => r.valid);
  const invalidCount = rows.length - validRows.length;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setResult(null);
    setParseError(null);
    setRows([]);
    setFileName(file.name);

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        setParseError("This file has no sheets.");
        return;
      }
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: null,
        raw: true,
      });
      if (json.length === 0) {
        setParseError("No rows found in the file.");
        return;
      }
      const headers = Array.from(new Set(json.flatMap((r) => Object.keys(r))));
      const colMap = buildColumnMap(headers);
      if (!colMap.customerName || !colMap.productName) {
        setParseError(
          "Couldn't find a Customer and a Product column. Download the template to see the expected columns.",
        );
      }
      setRows(json.map((r) => toPreview(r, colMap)));
    } catch {
      setParseError("Could not read this file. Make sure it's a valid .xlsx, .xls or .csv.");
    }
  }

  function handleImport() {
    // Local midnight so the stored date matches the date shown in the preview.
    const fallbackIso = fallbackDate
      ? new Date(`${fallbackDate}T00:00:00`).toISOString()
      : null;
    startImport(async () => {
      const payload = validRows.map((r) => ({
        customerName: r.customerName,
        productName: r.productName,
        category: r.category,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        amount: r.amount,
        status: r.status,
        date: r.date ?? fallbackIso,
      }));
      const res = await apiFetch("/api/import", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const body: ImportResult = await res.json().catch(() => ({
        imported: 0,
        skipped: 0,
        productsCreated: 0,
        error: "Import failed. Please try again.",
      }));
      setResult(body);
    });
  }

  function reset() {
    setFileName(null);
    setRows([]);
    setParseError(null);
    setResult(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Import data
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload an Excel (.xlsx) or CSV file of sales. We&apos;ll match the
          columns, let you review, then add everything to your dashboard.
        </p>
      </div>

      {/* Result state */}
      {result && (
        <div
          className={`rounded-2xl border p-5 ${
            result.error
              ? "border-rose-200 bg-rose-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          {result.error ? (
            <div className="flex items-start gap-2 text-rose-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{result.error}</p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Import complete</p>
                <p className="mt-1 text-sm text-emerald-700">
                  {result.imported} order{result.imported === 1 ? "" : "s"} added
                  {result.productsCreated > 0 &&
                    `, ${result.productsCreated} new product${
                      result.productsCreated === 1 ? "" : "s"
                    } created`}
                  {result.skipped > 0 && `, ${result.skipped} row(s) skipped`}.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    View dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={reset}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Import another file
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && (
        <>
          {/* Upload zone */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <UploadCloud className="h-6 w-6" />
              </span>
              <span className="text-sm font-medium text-slate-700">
                {fileName ? (
                  <span className="inline-flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    {fileName}
                  </span>
                ) : (
                  "Click to choose a file"
                )}
              </span>
              <span className="text-xs text-slate-400">
                .xlsx, .xls or .csv — up to 5,000 rows
              </span>
              <input
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFile}
                className="hidden"
              />
            </label>

            {/* Date for this upload — fills rows that have no date in the file */}
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <div>
                  <label
                    htmlFor="data-date"
                    className="text-sm font-medium text-slate-700"
                  >
                    Data date
                  </label>
                  <p className="text-xs text-slate-400">
                    Rows without a date in the file will use this date.
                  </p>
                </div>
              </div>
              <input
                id="data-date"
                type="date"
                max={today}
                value={fallbackDate}
                onChange={(e) => setFallbackDate(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Download className="h-4 w-4" />
                Download template
              </button>
              <span className="text-xs text-slate-400">
                Columns: Customer, Product, Category, Quantity, Unit Price,
                Status, Date
              </span>
            </div>
          </div>

          {parseError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-emerald-600">
                      {validRows.length} ready
                    </span>
                    {invalidCount > 0 && (
                      <>
                        {" · "}
                        <span className="font-medium text-rose-600">
                          {invalidCount} will be skipped
                        </span>
                      </>
                    )}
                    {rows.length > 50 && " · showing first 50"}
                  </p>
                </div>
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {importing
                    ? "Importing…"
                    : `Import ${validRows.length} order${validRows.length === 1 ? "" : "s"}`}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-medium"></th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Qty</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 last:border-0 ${
                          r.valid ? "" : "bg-rose-50/40"
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          {r.valid ? (
                            <CheckCircle2
                              className="h-4 w-4 text-emerald-500"
                              aria-label="Will import"
                            />
                          ) : (
                            <span title={r.issues.join(", ")}>
                              <AlertCircle className="h-4 w-4 text-rose-500" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-900">
                          {r.customerName || (
                            <span className="text-rose-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {r.productName || (
                            <span className="text-rose-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{r.category}</td>
                        <td className="px-4 py-2.5 text-slate-700">{r.quantity}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {money.format(r.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{r.status}</td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {r.date ? (
                            dateFmt.format(new Date(r.date))
                          ) : (
                            <span
                              className="text-slate-400"
                              title="No date in the file — using the data date above"
                            >
                              {fallbackDate ? formatYmd(fallbackDate) : "Today"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
