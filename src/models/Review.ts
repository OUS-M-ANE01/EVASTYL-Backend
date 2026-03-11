import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'La note est requise'],
      min: [1, 'La note minimale est 1'],
      max: [5, 'La note maximale est 5'],
    },
    comment: {
      type: String,
      required: [true, 'Le commentaire est requis'],
      maxlength: [1000, 'Le commentaire est trop long'],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Un utilisateur ne peut laisser qu'un avis par produit
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);
