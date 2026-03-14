import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import Testimonial from '../models/Testimonial';

const testimonialsSenegalais = [
  {
    text: 'La robe est absolument magnifique, la qualité dépasse mes attentes. Je la porte pour toutes mes occasions ici à Dakar !',
    author: 'Fatou Diallo',
    role: 'Cliente fidèle',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    isActive: true,
    order: 0,
  },
  {
    text: "Les bijoux ASMA sont d'une finesse extraordinaire. Le collier doré est ma pièce préférée, je reçois des compliments partout à Dakar !",
    author: 'Aïssatou Ndiaye',
    role: 'Acheteuse vérifiée',
    avatar: 'https://images.unsplash.com/photo-1589156206285-96b2a2f5e870?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    isActive: true,
    order: 1,
  },
  {
    text: 'Livraison rapide et emballage soigné. On sent vraiment le soin apporté à chaque détail. Je recommande sans hésiter à toutes mes amies de Thiès !',
    author: 'Mariama Sow',
    role: 'Nouvelle cliente',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=100&h=100&fit=crop&crop=face',
    rating: 5,
    isActive: true,
    order: 2,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connecté à MongoDB');

    await Testimonial.deleteMany({});
    console.log('🗑️  Anciens témoignages supprimés');

    await Testimonial.insertMany(testimonialsSenegalais);
    console.log('✅ 3 témoignages sénégalais insérés :');
    testimonialsSenegalais.forEach(t => console.log(`   - ${t.author} (${t.role})`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err);
    process.exit(1);
  }
};

seed();
