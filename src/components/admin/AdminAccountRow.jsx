"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminTransactionHistory from "./AdminTransactionHistory";

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
}

const typeLabels = { checking: "Checking", savings: "Savings" };
const DEFAULT_FROZEN_MESSAGE = "This account has been frozen. Please contact support.";
const DEFAULT_BLOCKED_MESSAGE = "Transfers from this account are currently unavailable.";

export default function AdminAccountRow({ account }) {
  const router = useRouter();
  const [prevBalance, setPrevBalance] = useState(account.balance);
  const [balance, setBalance] = useState(account.balance.toString());
  const [reason, setReason] = useState(account.frozenReason || "");
  const [saving, setSaving] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [savingReason, setSavingReason] = useState(false);
  const [status, setStatus] = useState(null);

  if (account.balance !== prevBalance) {
    setPrevBalance(account.balance);
    setBalance(account.balance.toString());
  }

  async function patch(body) {
    const res = await fetch(`/api/admin/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    return data;
  }

  async function handleBalanceSave(e) {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      await patch({ balance: Number(balance) });
      setStatus({ type: "success", message: "Balance updated." });
      router.refresh();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleFreeze() {
    setStatus(null);
    setFreezing(true);
    try {
      await patch({ frozen: true, frozenReason: reason.trim() || DEFAULT_FROZEN_MESSAGE });
      router.refresh();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setFreezing(false);
    }
  }

  async function handleUnfreeze() {
    setStatus(null);
    setFreezing(true);
    try {
      await patch({ frozen: false, frozenReason: null });
      setReason("");
      router.refresh();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setFreezing(false);
    }
  }

  async function handleBlockTransfers() {
    setStatus(null);
    setBlocking(true);
    try {
      await patch({ transferBlocked: true, frozenReason: reason.trim() || DEFAULT_BLOCKED_MESSAGE });
      router.refresh();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setBlocking(false);
    }
  }

  async function handleAllowTransfers() {
    setStatus(null);
    setBlocking(true);
    try {
      await patch({ transferBlocked: false });
      router.refresh();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setBlocking(false);
    }
  }

  async function handleUpdateReason(e) {
    e.preventDefault();
    setStatus(null);
    setSavingReason(true);
    try {
      await patch({ frozenReason: reason.trim() || DEFAULT_FROZEN_MESSAGE });
      setStatus({ type: "success", message: "Message updated." });
      router.refresh();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSavingReason(false);
    }
  }

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">
          {typeLabels[account.type] || account.type} •••• {account.accountNumber.slice(-4)}
        </p>
        <div className="flex items-center gap-2">
          {account.frozen && <span className="text-xs font-semibold text-danger">FROZEN</span>}
          {account.transferBlocked && <span className="text-xs font-semibold text-danger">TRANSFERS BLOCKED</span>}
        </div>
      </div>

      {status && (
        <p
          className={`mt-2 text-xs rounded px-2 py-1 border ${
            status.type === "success" ? "text-success border-success/30 bg-success/10" : "text-danger border-danger/30 bg-danger/10"
          }`}
        >
          {status.message}
        </p>
      )}

      <form onSubmit={handleBalanceSave} className="mt-3 flex items-center gap-2">
        <span className="text-text-secondary text-sm">$</span>
        <input
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-32 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={saving}
          className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
        >
          {saving ? "Saving…" : "Update balance"}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-border">
        <label className="block text-xs font-medium text-text-secondary">
          {account.frozen || account.transferBlocked
            ? "Message shown to customer"
            : "Message shown to customer if frozen or blocked"}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={DEFAULT_FROZEN_MESSAGE}
          rows={2}
          className="mt-1 w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="mt-1 text-xs text-text-secondary">
          Shared by both controls below — whichever one is on, the customer sees this message (or a generic default if left blank).
        </p>

        <div className="mt-3 flex items-center gap-4 flex-wrap">
          {account.frozen ? (
            <button
              onClick={handleUnfreeze}
              disabled={freezing}
              className="text-sm font-medium text-success hover:underline disabled:opacity-50"
            >
              {freezing ? "Working…" : "Unfreeze account"}
            </button>
          ) : (
            <button
              onClick={handleFreeze}
              disabled={freezing}
              className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
            >
              {freezing ? "Working…" : "Freeze account"}
            </button>
          )}

          {account.transferBlocked ? (
            <button
              onClick={handleAllowTransfers}
              disabled={blocking}
              className="text-sm font-medium text-success hover:underline disabled:opacity-50"
            >
              {blocking ? "Working…" : "Allow transfers"}
            </button>
          ) : (
            <button
              onClick={handleBlockTransfers}
              disabled={blocking}
              className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
            >
              {blocking ? "Working…" : "Block transfers"}
            </button>
          )}

          {(account.frozen || account.transferBlocked) && (
            <button
              onClick={handleUpdateReason}
              disabled={savingReason}
              className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
            >
              {savingReason ? "Saving…" : "Update message"}
            </button>
          )}
        </div>
      </div>

      <AdminTransactionHistory accountId={account.id} transactions={account.transactions || []} />
    </div>
  );
}
