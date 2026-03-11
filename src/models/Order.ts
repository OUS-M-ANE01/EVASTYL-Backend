import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: Array<{
    product: mongoose.Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  isPaid: boolean;
  paidAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [{
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: String,
      image: String,
      price: Number,
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    }],
    shippingAddress: {
      prenom: { type: String, required: true },
      nom: { type: String, required: true },
      email: { type: String, required: true },
      telephone: { type: String, required: true },
      rue: { type: String, required: true },
      ville: { type: String, required: true },
      codePostal: { type: String, required: true },
      pays: { type: String, default: 'Sénégal' },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['carte', 'wave', 'orange-money', 'paypal', 'cod'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    deliveredAt: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Générer numéro de commande automatiquement
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `EVA${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${random}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
