import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Category from '@/models/Category';
import Expense from '@/models/Expense';
import { getAuthUserId } from '@/lib/session';

export async function PATCH(req, { params }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid category id.' }, { status: 400 });
  }

  try {
    const { name, icon, color } = await req.json();
    await connectDB();

    const category = await Category.findOne({ _id: id, userId });
    if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

    if (name && name.trim()) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();
    return NextResponse.json({ category });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }
    console.error('Update category error:', err);
    return NextResponse.json({ error: 'Unable to update category.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid category id.' }, { status: 400 });
  }

  try {
    await connectDB();
    const category = await Category.findOne({ _id: id, userId });
    if (!category) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });

    const inUse = await Expense.countDocuments({ userId, categoryId: id });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `This category is used by ${inUse} expense${inUse > 1 ? 's' : ''} and can't be deleted.` },
        { status: 409 }
      );
    }

    await category.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete category error:', err);
    return NextResponse.json({ error: 'Unable to delete category.' }, { status: 500 });
  }
}