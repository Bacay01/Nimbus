import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

export async function PATCH(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await params;
  const { amount, description } = await req.json();
  const numericAmount = Number(amount);

  if (!numericAmount || numericAmount <= 0) {
    return NextResponse.json({ error: "A positive amount is required" }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { id } });
      if (!existing) throw new Error("Transaction not found");

      const delta = numericAmount - Number(existing.amount);

      if (existing.fromId) {
        await tx.account.update({ where: { id: existing.fromId }, data: { balance: { decrement: delta } } });
      }
      if (existing.toId) {
        await tx.account.update({ where: { id: existing.toId }, data: { balance: { increment: delta } } });
      }

      return tx.transaction.update({ where: { id }, data: { amount: numericAmount, description } });
    });

    return NextResponse.json({ transaction: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to update transaction" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { id } = await params;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { id } });
      if (!existing) throw new Error("Transaction not found");

      if (existing.fromId) {
        await tx.account.update({ where: { id: existing.fromId }, data: { balance: { increment: existing.amount } } });
      }
      if (existing.toId) {
        await tx.account.update({ where: { id: existing.toId }, data: { balance: { decrement: existing.amount } } });
      }

      await tx.transaction.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete transaction" }, { status: 400 });
  }
}