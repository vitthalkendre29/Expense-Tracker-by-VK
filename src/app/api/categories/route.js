import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Category, { DEFAULT_CATEGORIES } from '@/models/Category';
import { getAuthUserId } from '@/lib/session';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  let categories = await Category.find({ userId }).sort({ name: 1 });

  // First-time setup: seed default categories for this user
  if (categories.length === 0) {
    const seeded = await Category.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isDefault: true }))
    );
    categories = seeded.sort((a, b) => a.name.localeCompare(b.name));
  }

  return NextResponse.json({ categories });
}

export async function POST(req) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, icon, color } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400 });
    }

    await connectDB();
    const category = await Category.create({
      userId,
      name: name.trim(),
      icon: icon || '📦',
      color: color || '#1B6B5B',
      isDefault: false,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }
    console.error('Create category error:', err);
    return NextResponse.json({ error: 'Unable to create category.' }, { status: 500 });
  }
}