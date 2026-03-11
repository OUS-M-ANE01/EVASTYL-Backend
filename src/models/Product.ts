import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  category: mongoose.Types.ObjectId;
  categoryName: string;
  badge?: 'new' | 'sale' | 'bestseller';
  description?: string;
  stock: number;
  couleurs?: string[];
  tailles?: string[];
  matiere?: string;
  isActive: boolean;
  views: number;
  sales: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'La marque est requise'],
      default: 'EvaStyl',
    },
    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: [0, 'Le prix ne peut pas être négatif'],
    },
    oldPrice: {
      type: Number,
      min: [0, 'Le prix ne peut pas être négatif'],
    },
    image: {
      type: String,
      required: [true, "L'image principale est requise"],
    },
    images: [{
      type: String,
    }],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La catégorie est requise'],
    },
    categoryName: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      enum: ['new', 'sale', 'bestseller', null],
    },
    description: {
      type: String,
      maxlength: [2000, 'La description est trop longue'],
    },
    stock: {
      type: Number,
      required: [true, 'Le stock est requis'],
      min: [0, 'Le stock ne peut pas être négatif'],
      default: 0,
    },
    couleurs: [{
      type: String,
    }],
    tailles: [{
      type: String,
    }],
    matiere: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    sales: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour la recherche
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });

export default mongoose.model<IProduct>('Product', productSchema);
