import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';
import { getAuthUserId } from '@/lib/session';

const methodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.string().default('other'),
});

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const methods = await PaymentMethod.find({ userId }).sort({ isDefault: -1, name: 1 }).lean();
  return NextResponse.json({ methods });
}

export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = methodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const existing = await PaymentMethod.findOne({ userId, name: parsed.data.name });
    if (existing) {
      return NextResponse.json({ error: 'This payment method already exists.' }, { status: 409 });
    }

    const method = await PaymentMethod.create({ ...parsed.data, userId });
    return NextResponse.json({ method }, { status: 201 });
  } catch (err) {
    console.error('Create payment method error:', err);
    return NextResponse.json({ error: 'Unable to create payment method.' }, { status: 500 });
  }
}
