import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  id: string;
  name: string;
  description?: string;
  image: string;
  count: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Le nom de la catégorie est requis'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'La description est trop longue'],
    },
    image: {
      type: String,
      required: [true, "L'image est requise"],
    },
    count: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICategory>('Category', categorySchema);
