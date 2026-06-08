"use client";

import type { ReactNode } from "react";

/**
 * Responsive table that renders as a proper <table> on desktop (md+)
 * and as stacked cards on mobile. Each row becomes a card with
 * label/value pairs defined by `columns`.
 *
 * Usage:
 *   <AdminTable
 *     columns={[
 *       { key: "name", label: "名称", primary: true },
 *       { key: "status", label: "状态" },
 *       { key: "actions", label: "", align: "right" },
 *     ]}
 *     rows={items.map(item => ({
 *       key: item.id,
 *       cells: {
 *         name: item.name,
 *         status: <Badge>{item.status}</Badge>,
 *         actions: <DeleteButton id={item.id} />,
 *       },
 *     }))}
 *   />
 */

export type AdminTableColumn = {
  key: string;
  label: string;
  /** Primary column gets bold treatment on mobile cards. */
  primary?: boolean;
  /** Text alignment. */
  align?: "left" | "center" | "right";
  /** Hide on mobile card view entirely. */
  hideMobile?: boolean;
  /** Column width hint (e.g. "120px", "1fr"). */
  width?: string;
};

export type AdminTableRow = {
  key: string | number;
  cells: Record<string, ReactNode>;
  /** Optional row-level click handler (wraps row in a button/link). */
  onClick?: () => void;
};

export function AdminTable({
  columns,
  rows,
  empty = "暂无数据",
}: {
  columns: AdminTableColumn[];
  rows: AdminTableRow[];
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        {empty}
      </div>
    );
  }

  const alignClass = (a?: string) =>
    a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

  return (
    <>
      {/* Desktop: real table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 font-medium text-zinc-400 text-xs uppercase tracking-wider ${alignClass(col.align)}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {rows.map((row) => (
              <tr
                key={row.key}
                className={`hover:bg-zinc-800/30 transition-colors ${row.onClick ? "cursor-pointer" : ""}`}
                onClick={row.onClick}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-3 ${alignClass(col.align)} ${col.primary ? "font-medium text-zinc-100" : "text-zinc-300"}`}
                  >
                    {row.cells[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className={`rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 space-y-2 ${row.onClick ? "active:bg-zinc-800/50 cursor-pointer" : ""}`}
            onClick={row.onClick}
          >
            {columns
              .filter((col) => !col.hideMobile)
              .map((col) => (
                <div key={col.key} className={`flex items-start gap-2 ${alignClass(col.align)}`}>
                  {col.label && (
                    <span className="shrink-0 text-[11px] uppercase tracking-wider text-zinc-500 min-w-[4rem] pt-px">
                      {col.label}
                    </span>
                  )}
                  <span className={`flex-1 min-w-0 break-words ${col.primary ? "font-medium text-zinc-100" : "text-zinc-300"}`}>
                    {row.cells[col.key]}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
