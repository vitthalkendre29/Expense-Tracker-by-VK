import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

// GET /api/expenses/analytics?range=month&offset=-1
// range: day | week | month | quarter | year | calendar (month heatmap)
// offset: 0 = current period, -1 = previous period, -2 = two periods back, etc.
//         Positive offsets are rejected server-side (no future periods).
function getRange(range, offset = 0) {
  const now = new Date();
  let start, end;

  if (range === 'day') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    start = new Date(d.setHours(0, 0, 0, 0));
    end = new Date(new Date(d).setHours(23, 59, 59, 999));
  } else if (range === 'week') {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - day + offset * 7);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'month' || range === 'calendar') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  } else if (range === 'quarter') {
    const currentQuarterIndex = Math.floor(now.getMonth() / 3); // 0-3
    const totalQuarters = currentQuarterIndex + offset;
    const year = now.getFullYear() + Math.floor(totalQuarters / 4);
    const q = ((totalQuarters % 4) + 4) % 4;
    start = new Date(year, q * 3, 1);
    end = new Date(year, q * 3 + 3, 0, 23, 59, 59, 999);
  } else if (range === 'year') {
    const year = now.getFullYear() + offset;
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  }

  // Never let the window extend past "right now" — clamps the current
  // period's end to the live moment instead of the full period end,
  // and is a hard backstop if a future offset ever slips through.
  if (end.getTime() > now.getTime()) {
    end = now;
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

    let offset = parseInt(searchParams.get('offset') ?? '0', 10);
    if (Number.isNaN(offset)) offset = 0;
    if (offset > 0) {
      return NextResponse.json(
        { error: 'Cannot request analytics for a future period.' },
        { status: 400 }
      );
    }

    const { start, end } = getRange(range, offset);

    if (start.getTime() > end.getTime()) {
      return NextResponse.json(
        { error: 'Requested period has no valid date range.' },
        { status: 400 }
      );
    }

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
        { $project: { _id: 0, date: '$_id', total: 1, count: 1 } },
        { $sort: { date: 1 } },
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
      offset,
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
