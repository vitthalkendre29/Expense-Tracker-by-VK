import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import PaymentMethod from '@/models/PaymentMethod';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

export async function PATCH(req, { params }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid payment method id.' }, { status: 400 });
  }

  try {
    const { name, type } = await req.json();
    await connectDB();

    const method = await PaymentMethod.findOne({ _id: id, userId });
    if (!method) return NextResponse.json({ error: 'Payment method not found.' }, { status: 404 });

    if (name && name.trim()) method.name = name.trim();
    if (type) method.type = type;

    await method.save();
    return NextResponse.json({ method });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A payment method with this name already exists.' }, { status: 409 });
    }
    console.error('Update payment method error:', err);
    return NextResponse.json({ error: 'Unable to update payment method.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid payment method id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const method = await PaymentMethod.findOne({ _id: id, userId });
    if (!method) return NextResponse.json({ error: 'Payment method not found.' }, { status: 404 });

    const inUse = await Expense.countDocuments({ userId, paymentMethodId: id });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `This payment method is used by ${inUse} expense${inUse > 1 ? 's' : ''} and can't be deleted.` },
        { status: 409 }
      );
    }

    await method.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete payment method error:', err);
    return NextResponse.json({ error: 'Unable to delete payment method.' }, { status: 500 });
  }
}