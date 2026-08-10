import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  description: z.string().max(500).optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  location: z.string().optional().default(''),
  receiptUrl: z.string().optional().default(''),
});

// GET /api/expenses — paginated, filterable transaction history
export async function GET(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));
    const categoryId = searchParams.get('categoryId');
    const paymentMethodId = searchParams.get('paymentMethodId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || '-date';

    const query = { userId };
    if (categoryId) query.categoryId = categoryId;
    if (paymentMethodId) query.paymentMethodId = paymentMethodId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('categoryId', 'name icon color')
        .populate('paymentMethodId', 'name')
        .lean(),
      Expense.countDocuments(query),
    ]);

    return NextResponse.json({
      expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Fetch expenses error:', err);
    return NextResponse.json({ error: 'Unable to load expenses.' }, { status: 500 });
  }
}

// POST /api/expenses — fast create, optimized for the sub-10-second add flow
export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const expense = await Expense.create({ ...parsed.data, userId });
    const populated = await expense.populate([
      { path: 'categoryId', select: 'name icon color' },
      { path: 'paymentMethodId', select: 'name' },
    ]);

    return NextResponse.json({ expense: populated }, { status: 201 });
  } catch (err) {
    console.error('Create expense error:', err);
    return NextResponse.json(
      { error: 'Unable to save expense. Please try again.' },
      { status: 500 }
    );
  }
}
