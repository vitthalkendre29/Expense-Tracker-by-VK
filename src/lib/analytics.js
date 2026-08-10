import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';

export async function getPeriodSummary(userId, start, end) {
  await connectDB();
  const uid = new mongoose.Types.ObjectId(userId);
  const match = { userId: uid, date: { $gte: start, $lte: end } };

  const [totals] = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, highest: { $max: '$amount' } } },
  ]);

  const byCategory = await Expense.aggregate([
    { $match: match },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        name: '$category.name',
        icon: '$category.icon',
        color: '$category.color',
        total: 1,
      },
    },
    { $sort: { total: -1 } },
  ]);

  const byDay = await Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', total: 1 } },
  ]);

  return {
    total: totals?.total || 0,
    count: totals?.count || 0,
    highest: totals?.highest || 0,
    byCategory,
    byDay,
  };
}

export async function getRecentExpenses(userId, limit = 8) {
  await connectDB();
  return Expense.find({ userId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('categoryId', 'name icon color')
    .populate('paymentMethodId', 'name')
    .lean();
}
