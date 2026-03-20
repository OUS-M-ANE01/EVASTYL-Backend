import mongoose, { Document, Schema } from 'mongoose';

export interface IPageBanner extends Document {
  page: string;
  title: string;
  subtitle?: string;
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pageBannerSchema = new Schema<IPageBanner>(
  {
    page: {
      type: String,
      required: [true, 'La page est requise'],
      enum: ['about', 'contact', 'collections', 'bijoux', 'robes', 'manteaux'],
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: [true, "L'image est requise"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPageBanner>('PageBanner', pageBannerSchema);
