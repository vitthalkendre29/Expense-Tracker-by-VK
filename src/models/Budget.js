import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // null = overall monthly budget
    amount: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ['monthly'], default: 'monthly' },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
