import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import PaymentMethod, { DEFAULT_PAYMENT_METHODS } from '@/models/PaymentMethod';
import { getAuthUserId } from '@/lib/session';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  let methods = await PaymentMethod.find({ userId }).sort({ name: 1 });

  if (methods.length === 0) {
    const seeded = await PaymentMethod.insertMany(
      DEFAULT_PAYMENT_METHODS.map((name) => ({ userId, name, type: 'other', isDefault: true }))
    );
    methods = seeded.sort((a, b) => a.name.localeCompare(b.name));
  }

  return NextResponse.json({ methods });
}

export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, type } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Payment method name is required.' }, { status: 400 });
    }

    await connectDB();
    const method = await PaymentMethod.create({
      userId,
      name: name.trim(),
      type: type || 'other',
      isDefault: false,
    });

    return NextResponse.json({ method }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A payment method with this name already exists.' }, { status: 409 });
    }
    console.error('Create payment method error:', err);
    return NextResponse.json({ error: 'Unable to create payment method.' }, { status: 500 });
  }
}