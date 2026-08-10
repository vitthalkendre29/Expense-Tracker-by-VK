import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  categoryId: z.string().optional(),
  date: z.string().optional(),
  paymentMethodId: z.string().optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  receiptUrl: z.string().optional(),
});

async function findOwnedExpense(id, userId) {
  return Expense.findOne({ _id: id, userId }); // ensures users can only touch their own data
}

export async function GET(_req, { params }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const expense = await findOwnedExpense(params.id, userId);
  if (!expense) return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  return NextResponse.json({ expense });
}

export async function PATCH(req, { params }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const expense = await findOwnedExpense(params.id, userId);
    if (!expense) return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });

    Object.assign(expense, parsed.data);
    await expense.save();

    return NextResponse.json({ expense });
  } catch (err) {
    console.error('Update expense error:', err);
    return NextResponse.json({ error: 'Unable to update expense.' }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const expense = await findOwnedExpense(params.id, userId);
  if (!expense) return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });

  await expense.deleteOne();
  return NextResponse.json({ success: true });
}
