import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteContent extends Document {
  section: 'hero' | 'banner' | 'about' | 'contact' | 'instagram' | 'featured_jewelry' | 'featured_products';
  content: any;
  isActive: boolean;
  updatedAt: Date;
}

const siteContentSchema = new Schema<ISiteContent>({
  section: { 
    type: String, 
    required: true,
    unique: true,
    enum: ['hero', 'banner', 'about', 'contact', 'instagram', 'featured_jewelry', 'featured_products']
  },
  content: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

export default mongoose.model<ISiteContent>('SiteContent', siteContentSchema);
