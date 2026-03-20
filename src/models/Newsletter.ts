import mongoose, { Document, Schema } from 'mongoose';

export interface INewsletter extends Document {
  email: string;
  prenom?: string;
  nom?: string;
  isActive: boolean;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  unsubscribeToken: string;
  source: 'website' | 'checkout' | 'admin';
  preferences: {
    newProducts: boolean;
    promotions: boolean;
    orderUpdates: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
    },
    prenom: {
      type: String,
      trim: true,
    },
    nom: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
    },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
    },
    source: {
      type: String,
      enum: ['website', 'checkout', 'admin'],
      default: 'website',
    },
    preferences: {
      newProducts: {
        type: Boolean,
        default: true,
      },
      promotions: {
        type: Boolean,
        default: true,
      },
      orderUpdates: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Index pour les recherches
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ isActive: 1 });
newsletterSchema.index({ unsubscribeToken: 1 });

// Générer un token de désinscription avant la sauvegarde
newsletterSchema.pre('save', function (next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
  }
  next();
});

export default mongoose.model<INewsletter>('Newsletter', newsletterSchema);