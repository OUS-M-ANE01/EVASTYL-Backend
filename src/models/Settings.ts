import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  shopHours: {
    weekdays: string;
    sunday: string;
  };
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
  };
  ecommerce: {
    freeShippingThreshold: number;
    returnPeriodDays: number;
    shippingFee: number;
    currency: string;
  };
  trustStrip: Array<{
    icon: string;
    text: string;
    isActive: boolean;
  }>;
  newsletter: {
    title: string;
    label: string;
    description: string;
    buttonText: string;
  };
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  siteName: { type: String, default: 'EvaStyl' },
  siteDescription: { type: String, default: 'Votre destination mode pour des vêtements et bijoux raffinés' },
  contactEmail: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactAddress: { type: String, required: true },
  shopHours: {
    weekdays: { type: String, default: 'Lundi - Samedi : 10h - 19h' },
    sunday: { type: String, default: 'Dimanche : 14h - 18h' }
  },
  socialMedia: {
    instagram: { type: String, default: 'https://instagram.com/evasstyl' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  ecommerce: {
    freeShippingThreshold: { type: Number, default: 52000 },
    returnPeriodDays: { type: Number, default: 30 },
    shippingFee: { type: Number, default: 3000 },
    currency: { type: String, default: 'FCFA' }
  },
  trustStrip: [{
    icon: { type: String, required: true },
    text: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  }],
  newsletter: {
    title: { type: String, default: 'Restez dans la Tendance' },
    label: { type: String, default: 'Newsletter' },
    description: { type: String, default: 'Inscrivez-vous et recevez en avant-première nos nouvelles collections' },
    buttonText: { type: String, default: "S'inscrire" }
  }
}, { 
  timestamps: true 
});

export default mongoose.model<ISettings>('Settings', settingsSchema);
