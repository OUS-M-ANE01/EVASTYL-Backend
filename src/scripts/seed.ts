import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Charger les variables d'environnement
dotenv.config();

import User from '../models/User';
import Category from '../models/Category';
import Product from '../models/Product';

const seedDatabase = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connecté à MongoDB');

    // Nettoyer la base de données
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Base de données nettoyée');

    // Créer l'admin (le password sera hashé automatiquement par le middleware)
    const admin = await User.create({
      prenom: 'Admin',
      nom: 'EvaStyl',
      email: process.env.ADMIN_EMAIL || 'admin@evastyl.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      telephone: '+221 77 123 45 67',
      adresse: {
        rue: '12 Avenue Hassan II',
        ville: 'Dakar',
        codePostal: '10000',
        pays: 'Sénégal',
      },
    });
    console.log('👤 Admin créé');

    // Créer les catégories
    const categories = await Category.insertMany([
      {
        id: 'robes',
        name: 'Robes',
        description: 'Robes élégantes et modernes',
        image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80',
        count: 0,
        isActive: true,
        order: 1,
      },
      {
        id: 'colliers',
        name: 'Colliers',
        description: 'Bijoux raffinés et précieux',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
        count: 0,
        isActive: true,
        order: 2,
      },
      {
        id: 'boucles',
        name: "Boucles d'oreilles",
        description: 'Boucles élégantes pour toutes occasions',
        image: 'https://images.unsplash.com/photo-1535556116002-6281ff3e9f36?w=600&q=80',
        count: 0,
        isActive: true,
        order: 3,
      },
      {
        id: 'manteaux',
        name: 'Manteaux & Vestes',
        description: 'Vêtements chauds et élégants',
        image: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600&q=80',
        count: 0,
        isActive: true,
        order: 4,
      },
      {
        id: 'pantalons',
        name: 'Pantalons',
        description: 'Pantalons confortables et stylés',
        image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80',
        count: 0,
        isActive: true,
        order: 5,
      },
      {
        id: 'bracelets',
        name: 'Bracelets',
        description: 'Bracelets fins et élégants',
        image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80',
        count: 0,
        isActive: true,
        order: 6,
      },
      {
        id: 'bagues',
        name: 'Bagues',
        description: 'Bagues précieuses et raffinées',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
        count: 0,
        isActive: true,
        order: 7,
      },
    ]);
    console.log('📂 Catégories créées');

    // Trouver les IDs des catégories
    const robesCat = categories.find((c) => c.id === 'robes')!;
    const colliersCat = categories.find((c) => c.id === 'colliers')!;
    const bouclesCat = categories.find((c) => c.id === 'boucles')!;
    const manteauxCat = categories.find((c) => c.id === 'manteaux')!;
    const pantalonsCat = categories.find((c) => c.id === 'pantalons')!;
    const braceletsCat = categories.find((c) => c.id === 'bracelets')!;
    const baguesCat = categories.find((c) => c.id === 'bagues')!;

    // Créer les produits
    const products = await Product.insertMany([
      {
        name: 'Robe Florale Midi',
        brand: 'EvaStyl',
        price: 58000,
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=533&fit=crop',
        category: robesCat._id,
        categoryName: 'Robes',
        badge: 'new',
        description: 'Robe florale midi élégante, parfaite pour les occasions spéciales',
        stock: 15,
        couleurs: ['Bleu', 'Rose', 'Blanc'],
        tailles: ['S', 'M', 'L', 'XL'],
        matiere: 'Coton premium',
        isActive: true,
      },
      {
        name: 'Collier Doré Perles',
        brand: 'Bijoux',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&h=533&fit=crop',
        category: colliersCat._id,
        categoryName: 'Colliers',
        badge: 'bestseller',
        description: 'Collier doré avec perles fines, parfait pour compléter votre tenue',
        stock: 25,
        couleurs: ['Or', 'Argent'],
        matiere: 'Or 18 carats',
        isActive: true,
      },
      {
        name: 'Robe Soirée Noire',
        brand: 'EvaStyl Premium',
        price: 95000,
        oldPrice: 120000,
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=533&fit=crop',
        category: robesCat._id,
        categoryName: 'Robes',
        badge: 'sale',
        description: 'Robe de soirée noire élégante, coupe moderne',
        stock: 8,
        couleurs: ['Noir'],
        tailles: ['S', 'M', 'L'],
        matiere: 'Soie',
        isActive: true,
      },
      {
        name: "Boucles D'oreilles Dorées",
        brand: 'Bijoux',
        price: 28000,
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=533&fit=crop',
        category: bouclesCat._id,
        categoryName: "Boucles d'oreilles",
        badge: 'new',
        description: 'Boucles d\'oreilles dorées élégantes',
        stock: 30,
        couleurs: ['Or', 'Argent', 'Rose Gold'],
        matiere: 'Or plaqué',
        isActive: true,
      },
      {
        name: 'Robe Été Légère',
        brand: 'EvaStyl',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=533&fit=crop',
        category: robesCat._id,
        categoryName: 'Robes',
        description: 'Robe d\'été légère et confortable',
        stock: 20,
        couleurs: ['Blanc', 'Beige', 'Bleu clair'],
        tailles: ['S', 'M', 'L', 'XL'],
        matiere: 'Lin',
        isActive: true,
      },
      {
        name: 'Collier Pendentif Coeur',
        brand: 'Bijoux',
        price: 42000,
        image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=533&fit=crop',
        category: colliersCat._id,
        categoryName: 'Colliers',
        badge: 'bestseller',
        description: 'Collier avec pendentif en forme de coeur',
        stock: 18,
        couleurs: ['Or', 'Argent'],
        matiere: 'Or 14 carats',
        isActive: true,
      },
      {
        name: 'Manteau Laine Beige',
        brand: 'EvaStyl',
        price: 125000,
        image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=533&fit=crop',
        category: manteauxCat._id,
        categoryName: 'Manteaux & Vestes',
        badge: 'new',
        description: 'Manteau en laine de qualité supérieure',
        stock: 10,
        couleurs: ['Beige', 'Noir', 'Gris'],
        tailles: ['S', 'M', 'L'],
        matiere: 'Laine',
        isActive: true,
      },
      {
        name: 'Boucles Perles Fines',
        brand: 'Bijoux',
        price: 32000,
        image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&h=533&fit=crop',
        category: bouclesCat._id,
        categoryName: "Boucles d'oreilles",
        description: 'Boucles d\'oreilles avec perles fines',
        stock: 22,
        couleurs: ['Blanc', 'Crème'],
        matiere: 'Perles naturelles',
        isActive: true,
      },
      {
        name: 'Jupe Plissée Dorée',
        brand: 'EvaStyl',
        price: 47000,
        image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=533&fit=crop',
        category: robesCat._id,
        categoryName: 'Robes',
        badge: 'new',
        description: 'Jupe plissée dorée, parfaite pour les fêtes',
        stock: 12,
        couleurs: ['Or', 'Argent'],
        tailles: ['S', 'M', 'L'],
        matiere: 'Polyester métallisé',
        isActive: true,
      },
      {
        name: 'Pantalon Lin Blanc',
        brand: 'EvaStyl',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=533&fit=crop',
        category: pantalonsCat._id,
        categoryName: 'Pantalons',
        description: 'Pantalon en lin blanc, coupe élégante',
        stock: 16,
        couleurs: ['Blanc', 'Beige', 'Noir'],
        tailles: ['S', 'M', 'L', 'XL'],
        matiere: 'Lin',
        isActive: true,
      },
      {
        name: 'Chemisier Soie Rose',
        brand: 'EvaStyl',
        price: 37000,
        image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=533&fit=crop',
        category: robesCat._id,
        categoryName: 'Robes',
        badge: 'bestseller',
        description: 'Chemisier en soie rose pâle',
        stock: 14,
        couleurs: ['Rose', 'Blanc', 'Bleu clair'],
        tailles: ['S', 'M', 'L'],
        matiere: 'Soie',
        isActive: true,
      },
      {
        name: 'Manteau Long Noir',
        brand: 'EvaStyl Premium',
        price: 118000,
        image: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&h=533&fit=crop',
        category: manteauxCat._id,
        categoryName: 'Manteaux & Vestes',
        description: 'Manteau long noir, style classique',
        stock: 7,
        couleurs: ['Noir'],
        tailles: ['M', 'L'],
        matiere: 'Cachemire',
        isActive: true,
      },
      {
        name: 'Bracelet Jonc Doré',
        brand: 'Bijoux',
        price: 34000,
        image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=533&fit=crop',
        category: braceletsCat._id,
        categoryName: 'Bracelets',
        badge: 'new',
        description: 'Bracelet jonc doré élégant',
        stock: 20,
        couleurs: ['Or', 'Argent'],
        matiere: 'Laiton doré',
        isActive: true,
      },
      {
        name: 'Chaîne Perlée Or',
        brand: 'Bijoux',
        price: 31000,
        image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=533&fit=crop',
        category: colliersCat._id,
        categoryName: 'Colliers',
        description: 'Chaîne dorée avec perles délicates',
        stock: 18,
        couleurs: ['Or'],
        matiere: 'Or 14 carats',
        isActive: true,
      },
      {
        name: "Créoles D'oreilles Or",
        brand: 'Bijoux',
        price: 82000,
        image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=533&fit=crop',
        category: bouclesCat._id,
        categoryName: "Boucles d'oreilles",
        badge: 'bestseller',
        description: 'Créoles dorées de taille moyenne',
        stock: 15,
        couleurs: ['Or', 'Or Rose'],
        matiere: 'Or 18 carats',
        isActive: true,
      },
      {
        name: 'Bague Saphir Bleu',
        brand: 'Bijoux Premium',
        price: 137000,
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=533&fit=crop',
        category: baguesCat._id,
        categoryName: 'Bagues',
        badge: 'new',
        description: 'Bague avec saphir bleu authentique',
        stock: 5,
        couleurs: ['Or blanc'],
        matiere: 'Or blanc 18 carats avec saphir',
        isActive: true,
      },
    ]);

    console.log('📦 Produits créés');

    // Mettre à jour les compteurs des catégories
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category._id });
      category.count = count;
      await category.save();
    }
    console.log('🔄 Compteurs des catégories mis à jour');

    console.log(`
    ✅ Seed terminé avec succès!
    
    📊 Résumé:
    - 1 Admin créé
    - ${categories.length} Catégories créées
    - ${products.length} Produits créés
    
    🔑 Identifiants Admin:
    Email: ${admin.email}
    Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}
    `);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
