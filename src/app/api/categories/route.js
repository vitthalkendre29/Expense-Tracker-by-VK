import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import { getAuthUserId } from '@/lib/session';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  icon: z.string().min(1).max(10).default('📦'),
  color: z.string().min(1).default('#1B6B5B'),
});

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const categories = await Category.find({ userId }).sort({ isDefault: -1, name: 1 }).lean();
  return NextResponse.json({ categories });
}

export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await connectDB();
    const existing = await Category.findOne({ userId, name: parsed.data.name });
    if (existing) {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }

    const category = await Category.create({ ...parsed.data, userId });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error('Create category error:', err);
    return NextResponse.json({ error: 'Unable to create category.' }, { status: 500 });
  }
}
