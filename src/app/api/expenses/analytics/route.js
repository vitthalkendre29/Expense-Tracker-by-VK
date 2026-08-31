import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

// GET /api/expenses/analytics?range=month&date=2026-08-10
// range: day | week | month | quarter | year | calendar (month heatmap)
function getRange(range, dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  let start, end;

  if (range === 'day') {
    start = new Date(d.setHours(0, 0, 0, 0));
    end = new Date(d.setHours(23, 59, 59, 999));
  } else if (range === 'week') {
    const day = d.getDay();
    start = new Date(d);
    start.setDate(d.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'month' || range === 'calendar') {
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (range === 'quarter') {
    const q = Math.floor(d.getMonth() / 3);
    start = new Date(d.getFullYear(), q * 3, 1);
    end = new Date(d.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  } else if (range === 'year') {
    start = new Date(d.getFullYear(), 0, 1);
    end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return { start, end };
}

export async function GET(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'month';
    const dateParam = searchParams.get('date');
    const { start, end } = getRange(range, dateParam);

    const uid = new mongoose.Types.ObjectId(userId);
    const match = { userId: uid, date: { $gte: start, $lte: end } };

    const [totals, byCategory, byPaymentMethod, byDay] = await Promise.all([
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            highest: { $max: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $project: {
            _id: 0,
            categoryId: '$_id',
            name: '$category.name',
            icon: '$category.icon',
            color: '$category.color',
            total: 1,
            count: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: '$paymentMethodId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'paymentmethods',
            localField: '_id',
            foreignField: '_id',
            as: 'method',
          },
        },
        { $unwind: '$method' },
        { $project: { _id: 0, name: '$method.name', total: 1, count: 1 } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Comparison with the previous equivalent period
    const spanMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - spanMs - 1);
    const prevEnd = new Date(start.getTime() - 1);
    const [prevTotals] = await Expense.aggregate([
      { $match: { userId: uid, date: { $gte: prevStart, $lte: prevEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const currentTotal = totals[0]?.total || 0;
    const previousTotal = prevTotals?.total || 0;
    const percentChange =
      previousTotal > 0
        ? Number((((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1))
        : null;

    return NextResponse.json({
      range,
      start,
      end,
      summary: {
        total: currentTotal,
        count: totals[0]?.count || 0,
        highest: totals[0]?.highest || 0,
        dailyAverage: byDay.length ? Number((currentTotal / byDay.length).toFixed(2)) : 0,
        previousTotal,
        percentChange,
      },
      byCategory,
      byPaymentMethod,
      byDay, // used for calendar heatmap + trend charts
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Unable to load analytics.' }, { status: 500 });
  }
}
