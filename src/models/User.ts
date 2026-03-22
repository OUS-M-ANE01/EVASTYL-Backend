import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  telephone?: string;
  dateNaissance?: Date;
  adresse?: {
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
  role: 'client' | 'admin';
  favoris: mongoose.Types.ObjectId[];
  firebaseUid?: string;
  isEmailVerified?: boolean;
  emailVerificationOTP?: string | null;
  emailVerificationExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    prenom: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
    },
    nom: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false,
    },
    telephone: {
      type: String,
      trim: true,
    },
    dateNaissance: {
      type: Date,
    },
    adresse: {
      rue: String,
      ville: String,
      codePostal: String,
      pays: { type: String, default: 'Sénégal' },
    },
    role: {
      type: String,
      enum: ['client', 'admin'],
      default: 'client',
    },
    firebaseUid: {
      type: String,
      default: '',
    },
    favoris: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    emailVerificationOTP: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
