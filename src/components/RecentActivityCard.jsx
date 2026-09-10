function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount));
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecentActivityCard({ transactions, title = "Recent activity" }) {
  return (
    <div className="bg-surface border border-border rounded-lg">
      <h2 className="px-5 py-4 text-lg font-semibold text-navy border-b border-border">{title}</h2>
      {transactions.length === 0 ? (
        <p className="px-5 py-6 text-sm text-text-secondary">No transactions yet.</p>
      ) : (
        transactions.map((txn) => {
          const isCredit = txn.direction === "received";
          const isFailed = txn.status && txn.status !== "completed";
          const amountClass = isCredit ? "text-success" : isFailed ? "text-danger" : "text-text";

          return (
            <div key={txn.id} className="px-5 py-4 flex items-center justify-between border-b border-border last:border-b-0">
              <div>
                <p className="text-sm text-text">
                  {txn.description || (isCredit ? `Received from ${txn.counterparty}` : `Sent to ${txn.counterparty}`)}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{formatDate(txn.createdAt)}</p>
              </div>
              <p className={`text-sm font-medium ${amountClass}`}>
                {isCredit ? "+" : "-"}
                {formatMoney(txn.amount)}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}