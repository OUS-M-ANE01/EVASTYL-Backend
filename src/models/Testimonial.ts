import mongoose, { Document, Schema } from 'mongoose';

export interface ITestimonial extends Document {
  text: string;
  author: string;
  role: string;
  avatar: string;
  rating: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new Schema<ITestimonial>({
  text: { 
    type: String, 
    required: [true, 'Le texte du témoignage est requis'],
    trim: true
  },
  author: { 
    type: String, 
    required: [true, 'Le nom de l\'auteur est requis'],
    trim: true
  },
  role: { 
    type: String, 
    default: 'Cliente vérifiée',
    trim: true
  },
  avatar: { 
    type: String, 
    required: [true, 'L\'image de profil est requise']
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5,
    default: 5
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

// Index pour trier par ordre
testimonialSchema.index({ order: 1 });

export default mongoose.model<ITestimonial>('Testimonial', testimonialSchema);
