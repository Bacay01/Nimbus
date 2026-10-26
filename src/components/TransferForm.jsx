"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FrozenNoticeToast, { useFrozenNotice } from "@/components/FrozenNoticeToast";

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
}

const typeLabels = { checking: "Checking", savings: "Savings" };

function SwapIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3l4 4-4 4" />
      <path d="M21 7H9" />
      <path d="M7 21l-4-4 4-4" />
      <path d="M3 17h12" />
    </svg>
  );
}

function ArrowRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ArrowLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckCircle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

const EMPTY_FORM = {
  mode: "internal",
  fromAccountId: "",
  toAccountId: "",
  toAccountNumber: "",
  recipientName: "",
  amount: "",
  description: "",
};

export default function TransferForm({ accounts, frozenNotice }) {
  const router = useRouter();
  const [step, setStep] = useState("details"); // "details" | "review" | "success"
  const [form, setForm] = useState(EMPTY_FORM);
  const [pin, setPin] = useState("");
  const [detailsError, setDetailsError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const { notice, showNotice, dismiss } = useFrozenNotice();

  function updateForm(patch) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function handleModeChange(mode) {
    setDetailsError(null);
    updateForm({ mode, toAccountId: "", toAccountNumber: "", recipientName: "" });
  }

  function handleReviewClick(e) {
    e.preventDefault();
    setDetailsError(null);

    if (frozenNotice) {
      showNotice(frozenNotice);
      return;
    }

    if (!form.fromAccountId) {
      setDetailsError("Choose a source account");
      return;
    }
    if (form.mode === "internal") {
      if (!form.toAccountId) {
        setDetailsError("Choose a destination account");
        return;
      }
      if (form.toAccountId === form.fromAccountId) {
        setDetailsError("Choose two different accounts");
        return;
      }
    } else if (!form.toAccountNumber) {
      setDetailsError("Enter the recipient's account number");
      return;
    }
    const numericAmount = Number(form.amount);
    if (!numericAmount || numericAmount <= 0) {
      setDetailsError("Enter an amount greater than $0");
      return;
    }

    setReviewError(null);
    setPin("");
    setStep("review");
  }

  function handleEditDetails() {
    setReviewError(null);
    setStep("details");
  }

  async function handleConfirmSend(e) {
    e.preventDefault();

    if (!/^\d{4}$/.test(pin)) {
      setReviewError("Enter your 4-digit PIN");
      return;
    }

    setReviewError(null);
    setLoading(true);

    const res = await fetch("/api/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccountId: form.fromAccountId,
        mode: form.mode,
        toAccountId: form.mode === "internal" ? form.toAccountId : undefined,
        toAccountNumber: form.mode === "external" ? form.toAccountNumber : undefined,
        recipientName: form.mode === "external" ? form.recipientName : undefined,
        amount: form.amount,
        description: form.description,
        pin,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setReviewError(data.error || "Transfer failed");
      return;
    }

    setCompletedTransaction(data.transaction);
    setStep("success");
  }

  function handleMakeAnother() {
    setForm(EMPTY_FORM);
    setPin("");
    setDetailsError(null);
    setReviewError(null);
    setCompletedTransaction(null);
    setStep("details");
  }

  const fromAccount = accounts.find((a) => a.id === form.fromAccountId);
  const toAccount = form.mode === "internal" ? accounts.find((a) => a.id === form.toAccountId) : null;
  const destinationLabel =
    form.mode === "internal"
      ? toAccount
        ? `${typeLabels[toAccount.type] || toAccount.type} •••• ${toAccount.accountNumber.slice(-4)}`
        : ""
      : form.recipientName
      ? `${form.recipientName} (•••• ${form.toAccountNumber.slice(-4)})`
      : `Account •••• ${form.toAccountNumber.slice(-4)}`;

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <SwapIcon className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-text">New Transfer</h1>
      </div>

      {step === "details" && (
        <div className="px-6 py-6">
          <div className="flex bg-page rounded-xl p-1 border border-border">
            <button
              type="button"
              onClick={() => handleModeChange("internal")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                form.mode === "internal" ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              Between my accounts
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("external")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                form.mode === "external" ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              Send to someone
            </button>
          </div>

          {detailsError && (
            <p className="mt-4 text-sm rounded-md px-3 py-2 border text-danger border-danger/30 bg-danger/10">
              {detailsError}
            </p>
          )}

          <form onSubmit={handleReviewClick} className="mt-5">
            <label className="block text-xs font-bold tracking-wide text-text-secondary uppercase">From account</label>
            <select
              required
              value={form.fromAccountId}
              onChange={(e) => updateForm({ fromAccountId: e.target.value })}
              className="mt-2 w-full bg-page border border-border rounded-2xl px-4 py-3.5 text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>
                Select source account
              </option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {typeLabels[acc.type] || acc.type} •••• {acc.accountNumber.slice(-4)} — {formatMoney(acc.balance)}
                </option>
              ))}
            </select>

            {form.mode === "internal" ? (
              <>
                <label className="block mt-5 text-xs font-bold tracking-wide text-text-secondary uppercase">
                  To account
                </label>
                <select
                  required
                  value={form.toAccountId}
                  onChange={(e) => updateForm({ toAccountId: e.target.value })}
                  className="mt-2 w-full bg-page border border-border rounded-2xl px-4 py-3.5 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    Select destination account
                  </option>
                  {accounts
                    .filter((acc) => acc.id !== form.fromAccountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {typeLabels[acc.type] || acc.type} •••• {acc.accountNumber.slice(-4)} — {formatMoney(acc.balance)}
                      </option>
                    ))}
                </select>
              </>
            ) : (
              <>
                <label className="block mt-5 text-xs font-bold tracking-wide text-text-secondary uppercase">
                  Recipient&apos;s account number
                </label>
                <input
                  required
                  value={form.toAccountNumber}
                  onChange={(e) => updateForm({ toAccountNumber: e.target.value })}
                  placeholder="Enter recipient account number"
                  className="mt-2 w-full bg-page border border-border rounded-2xl px-4 py-3.5 text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <label className="block mt-5 text-xs font-bold tracking-wide text-text-secondary uppercase">
                  Recipient&apos;s name (optional)
                </label>
                <input
                  value={form.recipientName}
                  onChange={(e) => updateForm({ recipientName: e.target.value })}
                  placeholder="Who are you sending to?"
                  className="mt-2 w-full bg-page border border-border rounded-2xl px-4 py-3.5 text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </>
            )}

            <label className="block mt-5 text-xs font-bold tracking-wide text-text-secondary uppercase">Amount</label>
            <div className="mt-2 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text font-semibold">$</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateForm({ amount: e.target.value })}
                placeholder="0.00"
                className="w-full bg-page border border-border rounded-2xl pl-8 pr-4 py-3.5 text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <label className="block mt-5 text-xs font-bold tracking-wide text-text-secondary uppercase">
              Description (optional)
            </label>
            <input
              value={form.description}
              onChange={(e) => updateForm({ description: e.target.value })}
              placeholder="What's this transfer for?"
              className="mt-2 w-full bg-page border border-border rounded-2xl px-4 py-3.5 text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              type="submit"
              className="mt-6 w-full bg-primary text-white py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors"
            >
              Review transfer
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {step === "review" && (
        <div className="px-6 py-6">
          <div className="rounded-2xl bg-page border border-border px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">From</span>
              <span className="font-semibold text-text">
                {fromAccount ? `${typeLabels[fromAccount.type] || fromAccount.type} •••• ${fromAccount.accountNumber.slice(-4)}` : ""}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">To</span>
              <span className="font-semibold text-text text-right">{destinationLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Amount</span>
              <span className="font-semibold text-text">{formatMoney(form.amount || 0)}</span>
            </div>
            {form.description && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">For</span>
                <span className="font-semibold text-text text-right">{form.description}</span>
              </div>
            )}
          </div>

          {reviewError && (
            <p className="mt-4 text-sm rounded-md px-3 py-2 border text-danger border-danger/30 bg-danger/10">
              {reviewError}
            </p>
          )}

          <form onSubmit={handleConfirmSend} className="mt-5">
            <label className="block text-xs font-bold tracking-wide text-text-secondary uppercase">
              Confirm with your 4-digit PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className="mt-2 w-full bg-page border border-border rounded-2xl px-4 py-3.5 text-text text-center text-lg tracking-[0.5em] placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleEditDetails}
                disabled={loading}
                className="flex-1 border border-border text-text py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-page disabled:opacity-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Edit details
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending…" : "Confirm & send"}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === "success" && (
        <div className="px-6 py-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-text">Transfer complete</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {formatMoney(completedTransaction?.amount ?? form.amount)} sent to {destinationLabel}.
          </p>

          <div className="mt-8 w-full flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 border border-border text-text py-3.5 rounded-full font-semibold hover:bg-page transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleMakeAnother}
              className="flex-1 bg-primary text-white py-3.5 rounded-full font-semibold hover:bg-primary-dark transition-colors"
            >
              Make another transfer
            </button>
          </div>
        </div>
      )}

      <FrozenNoticeToast notice={notice} onDismiss={dismiss} />
    </div>
  );
}
