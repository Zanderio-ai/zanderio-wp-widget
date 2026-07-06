/**
 * @module artifacts/InvoiceCard
 * @description Invoice artifact — a compact list of invoices with amount,
 * status, and a download link. Accepts `data.invoices`, a bare array, or a
 * single object.
 */

import { css } from "@emotion/react";
import { tokens } from "@/config/tokens";
import type { Artifact } from "@/core/chat-types";
import { panel, cardTitle } from "./shell";

interface Invoice {
  id?: string;
  stripeInvoiceId?: string;
  invoice_number?: string;
  number?: string;
  planName?: string;
  description?: string;
  date?: string;
  invoice_date?: string;
  amount?: string | number;
  currency?: string;
  status?: string;
  pdfUrl?: string;
  hostedUrl?: string;
  url?: string;
}

function toList(data: unknown): Invoice[] {
  const d = data as { invoices?: Invoice[] } | Invoice[] | Invoice | null | undefined;
  if (Array.isArray((d as { invoices?: Invoice[] })?.invoices)) return (d as { invoices: Invoice[] }).invoices;
  if (Array.isArray(d)) return d as Invoice[];
  return d ? [d as Invoice] : [];
}

export function InvoiceCard({ artifact }: { artifact: Artifact }) {
  const invoices = toList(artifact.data);

  return (
    <div css={[panel, css`max-width: 380px;`]}>
      <div css={[cardTitle, css`margin-bottom: 10px;`]}>{artifact.title ?? "Invoices"}</div>
      {invoices.length === 0 ? (
        <div css={css`font-size: 13px; color: ${tokens.color.textSecondary};`}>No invoices found.</div>
      ) : (
        <div css={css`display: flex; flex-direction: column; gap: 8px;`}>
          {invoices.map((inv, i) => {
            const number = inv.stripeInvoiceId ?? inv.invoice_number ?? inv.number ?? inv.id ?? "—";
            const paid = inv.status?.toLowerCase() === "paid";
            const href = inv.pdfUrl ?? inv.hostedUrl ?? inv.url;
            return (
              <div
                key={i}
                css={css`
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  padding: 8px 10px;
                  border: 1px solid ${tokens.color.border};
                  border-radius: 8px;
                  font-size: 13px;
                `}
              >
                <div css={css`flex: 1; min-width: 0;`}>
                  <div css={css`font-weight: 600;`}>{number}</div>
                  <div css={css`font-size: 11px; color: ${tokens.color.textSecondary};`}>{inv.planName ?? inv.description ?? ""}</div>
                </div>
                <span css={css`font-weight: 500;`}>{inv.amount}{inv.currency ? ` ${inv.currency.toUpperCase()}` : ""}</span>
                <span css={css`font-size: 11px; font-weight: 600; color: ${paid ? tokens.color.success : tokens.color.warning};`}>
                  {inv.status ?? ""}
                </span>
                {href && (
                  <a href={href} target="_blank" rel="noopener noreferrer" css={css`font-size: 12px; color: ${tokens.color.primary}; font-weight: 600;`}>
                    Download
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
