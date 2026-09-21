import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

const expenseSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0'),

  categoryId: z
    .string()
    .min(1, 'Category is required'),

  date: z
    .string()
    .min(1, 'Date is required'),

  paymentMethodId: z
    .string()
    .min(1, 'Payment method is required'),

  description: z
    .string()
    .max(500)
    .optional()
    .default(''),

  tags: z
    .array(z.string())
    .optional()
    .default([]),

  location: z
    .string()
    .optional()
    .default(''),

  receiptUrl: z
    .string()
    .optional()
    .default(''),
});

/*
 * Only allow these sorting options.
 * This prevents arbitrary MongoDB sort fields
 * from being passed by the client.
 */
const allowedSorts = {
  '-date': { date: -1 },
  date: { date: 1 },
  '-amount': { amount: -1 },
  amount: { amount: 1 },
};

/*
 * GET /api/expenses
 *
 * Supports:
 *
 * search
 * categoryId
 * startDate
 * endDate
 * minAmount
 * maxAmount
 * sort
 * page
 * limit
 */
export async function GET(req) {
  const userId = await getAuthUserId();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(
      1,
      parseInt(
        searchParams.get('page') || '1',
        10
      )
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(
          searchParams.get('limit') || '20',
          10
        )
      )
    );

    const categoryId =
      searchParams.get('categoryId');

    const paymentMethodId =
      searchParams.get('paymentMethodId');

    const startDate =
      searchParams.get('startDate');

    const endDate =
      searchParams.get('endDate');

    const minAmount =
      searchParams.get('minAmount');

    const maxAmount =
      searchParams.get('maxAmount');

    const search =
      searchParams.get('search')?.trim();

    const sortParam =
      searchParams.get('sort') || '-date';

    /*
     * Only allow known sort options.
     */
    const sort =
      allowedSorts[sortParam] ||
      allowedSorts['-date'];

    /*
     * Base query.
     *
     * IMPORTANT:
     * userId is always included.
     * Therefore users cannot access
     * another user's expenses.
     */
    const query = {
      userId,
    };

    /*
     * Category filter
     */
    if (categoryId) {
      query.categoryId = categoryId;
    }

    /*
     * Payment method filter
     */
    if (paymentMethodId) {
      query.paymentMethodId =
        paymentMethodId;
    }

    /*
     * Date filter
     */
    if (startDate || endDate) {
      query.date = {};

      if (startDate) {
        const parsedStart =
          new Date(startDate);

        if (!Number.isNaN(parsedStart.getTime())) {
          query.date.$gte = parsedStart;
        }
      }

      if (endDate) {
        const parsedEnd =
          new Date(endDate);

        if (!Number.isNaN(parsedEnd.getTime())) {
          query.date.$lte = parsedEnd;
        }
      }

      /*
       * Remove empty date object if neither
       * date was valid.
       */
      if (
        Object.keys(query.date).length === 0
      ) {
        delete query.date;
      }
    }

    /*
     * Amount filter
     */
    if (minAmount || maxAmount) {
      query.amount = {};

      if (minAmount) {
        const value = Number(minAmount);

        if (!Number.isNaN(value)) {
          query.amount.$gte = value;
        }
      }

      if (maxAmount) {
        const value = Number(maxAmount);

        if (!Number.isNaN(value)) {
          query.amount.$lte = value;
        }
      }

      if (
        Object.keys(query.amount).length === 0
      ) {
        delete query.amount;
      }
    }

    /*
     * Description search
     */
    if (search) {
      query.description = {
        $regex: search,
        $options: 'i',
      };
    }

    const skip = (page - 1) * limit;

    const [expenses, total] =
      await Promise.all([
        Expense.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate(
            'categoryId',
            'name icon color'
          )
          .populate(
            'paymentMethodId',
            'name'
          )
          .lean(),

        Expense.countDocuments(query),
      ]);

    return NextResponse.json({
      expenses,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit
        ),
      },
    });
  } catch (err) {
    console.error(
      'Fetch expenses error:',
      err
    );

    return NextResponse.json(
      {
        error:
          'Unable to load expenses.',
      },
      { status: 500 }
    );
  }
}

/*
 * POST /api/expenses
 */
export async function POST(req) {
  const userId = await getAuthUserId();

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const parsed =
      expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]
              .message,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const expense =
      await Expense.create({
        ...parsed.data,
        userId,
      });

    const populated =
      await expense.populate([
        {
          path: 'categoryId',
          select:
            'name icon color',
        },
        {
          path: 'paymentMethodId',
          select: 'name',
        },
      ]);

    return NextResponse.json(
      {
        expense: populated,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(
      'Create expense error:',
      err
    );

    return NextResponse.json(
      {
        error:
          'Unable to save expense. Please try again.',
      },
      { status: 500 }
    );
  }
}
