import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  // 1. Logged in?
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    fromAccountId,
    mode, // "internal" (between my accounts) or "external" (send to someone)
    toAccountId, // internal
    toAccountNumber, // external
    recipientName, // external
    amount,
    description,
    pin,
  } = await req.json();

  const numericAmount = Number(amount);

  if (!fromAccountId || !pin || !numericAmount || numericAmount <= 0) {
    return NextResponse.json(
      { error: "Source account, PIN, and a positive amount are required" },
      { status: 400 }
    );
  }

  if (mode === "internal" && !toAccountId) {
    return NextResponse.json({ error: "Destination account is required" }, { status: 400 });
  }
  if (mode === "external" && !toAccountNumber) {
    return NextResponse.json({ error: "Recipient account number is required" }, { status: 400 });
  }

  // 2. PIN correct?
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const pinValid = user && (await bcrypt.compare(String(pin), user.pinHash));
  if (!pinValid) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      // 3. From-account is yours?
      const fromAccount = await tx.account.findFirst({
        where: { id: fromAccountId, userId: session.user.id },
      });
      if (!fromAccount) throw new Error("Source account not found");

      // 4. Transfers blocked?
      if (fromAccount.frozen) {
        throw new Error(fromAccount.frozenReason || "This account has been frozen. Please contact support.");
      }
      if (fromAccount.transferBlocked) {
        throw new Error(fromAccount.frozenReason || "Transfers from this account are currently unavailable.");
      }

      // 5. Enough money?
      if (Number(fromAccount.balance) < numericAmount) {
        throw new Error("Insufficient funds");
      }

      if (mode === "internal") {
        const toAccount = await tx.account.findFirst({
          where: { id: toAccountId, userId: session.user.id },
        });
        if (!toAccount) throw new Error("Destination account not found");
        if (toAccount.id === fromAccount.id) throw new Error("Cannot transfer to the same account");
        if (toAccount.frozen) {
          throw new Error(toAccount.frozenReason || "This account has been frozen. Please contact support.");
        }
        if (toAccount.transferBlocked) {
          throw new Error(toAccount.frozenReason || "Transfers from this account are currently unavailable.");
        }

        await tx.account.update({ where: { id: fromAccount.id }, data: { balance: { decrement: numericAmount } } });
        await tx.account.update({ where: { id: toAccount.id }, data: { balance: { increment: numericAmount } } });

        return tx.transaction.create({
          data: {
            amount: numericAmount,
            description: description || null,
            status: "completed",
            fromId: fromAccount.id,
            toId: toAccount.id,
          },
        });
      }

      // external: send to someone — no recipient account validation by design
      await tx.account.update({ where: { id: fromAccount.id }, data: { balance: { decrement: numericAmount } } });

      return tx.transaction.create({
        data: {
          amount: numericAmount,
          description: description || null,
          status: "completed",
          fromId: fromAccount.id,
          toId: null,
          externalLabel: recipientName || toAccountNumber,
        },
      });
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Transfer failed" }, { status: 400 });
  }
}
