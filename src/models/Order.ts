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

// Génère un numéro unique : EVA + timestamp base36 + 4 chars random
// Ex: EVA-LK3M2F-X9P2
function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();           // ~8 chars, toujours croissant
  const rand = Math.random().toString(36).substr(2, 4).toUpperCase(); // 4 chars random
  return `EVA-${ts}-${rand}`;
}

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true, // Permet null temporaire — on génère avant save
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
      prenom:     { type: String, required: true },
      nom:        { type: String, required: true },
      email:      { type: String, default: '' },
      telephone:  { type: String, required: true },
      rue:        { type: String, required: true },
      ville:      { type: String, required: true },
      codePostal: { type: String, default: '00000' },
      pays:       { type: String, default: 'Sénégal' },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['carte', 'wave', 'orange-money', 'free-money', 'expresso', 'paypal', 'cod', 'naboopay'],
    },
    subtotal:     { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    total:        { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    isPaid:      { type: Boolean, default: false },
    paidAt:      Date,
    deliveredAt: Date,
    notes:       String,
  },
  { timestamps: true }
);

// Assigne un orderNumber AVANT validation (si absent)
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

// Intercepte les erreurs duplicate key et régénère (max 3 tentatives)
orderSchema.post('save', { errorHandler: true }, async function (error: any, doc: any, next: any) {
  if (error.code === 11000 && error.keyPattern?.orderNumber) {
    // Collision rare (timestamp identique + même random) → régénère et réessaie
    const MAX_RETRIES = 3;
    let saved = false;

    for (let i = 0; i < MAX_RETRIES; i++) {
      doc.orderNumber = generateOrderNumber();
      try {
        await doc.save();
        saved = true;
        break;
      } catch (retryErr: any) {
        if (retryErr.code !== 11000) {
          return next(retryErr);
        }
      }
    }

    if (!saved) {
      return next(new Error('Impossible de générer un numéro de commande unique après plusieurs tentatives.'));
    }
    next();
  } else {
    next(error);
  }
});

export default mongoose.model<IOrder>('Order', orderSchema);