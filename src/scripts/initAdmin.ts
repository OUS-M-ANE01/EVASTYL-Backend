import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const initAdmin = async () => {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/asma';
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB');

    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Un admin existe déjà:', existingAdmin.email);
      process.exit(0);
    }

    // Créer l'admin par défaut
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@asma.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    const admin = await User.create({
      prenom: 'Admin',
      nom: 'ASMA',
      email: adminEmail,
      password: adminPassword,
      telephone: '+221000000000',
      role: 'admin',
      isVerified: true,
    });

    console.log('✅ Admin créé avec succès!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Mot de passe:', adminPassword);
    console.log('⚠️  CHANGEZ LE MOT DE PASSE APRÈS LA PREMIÈRE CONNEXION!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    process.exit(1);
  }
};

initAdmin();
