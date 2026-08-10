import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import Budget from '@/models/Budget';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

const budgetSchema = z.object({
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive('Budget amount must be greater than 0'),
});

// GET /api/budgets — returns current month's budgets with live utilization
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const budgets = await Budget.find({
    userId,
    startDate: { $lte: monthEnd },
    $or: [{ endDate: null }, { endDate: { $gte: monthStart } }],
  })
    .populate('categoryId', 'name icon color')
    .lean();

  const uid = new mongoose.Types.ObjectId(userId);
  const results = await Promise.all(
    budgets.map(async (b) => {
      const match = { userId: uid, date: { $gte: monthStart, $lte: monthEnd } };
      if (b.categoryId) match.categoryId = b.categoryId._id;
      const [agg] = await Expense.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const spent = agg?.total || 0;
      const percent = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return { ...b, spent, remaining: b.amount - spent, percent, status: percent >= 100 ? 'exceeded' : percent >= 90 ? 'critical' : percent >= 75 ? 'warning' : 'ok' };
    })
  );

  return NextResponse.json({ budgets: results });
}

export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = budgetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const now = new Date();
    const budget = await Budget.create({
      userId,
      categoryId: parsed.data.categoryId || null,
      amount: parsed.data.amount,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (err) {
    console.error('Create budget error:', err);
    return NextResponse.json({ error: 'Unable to save budget.' }, { status: 500 });
  }
}
