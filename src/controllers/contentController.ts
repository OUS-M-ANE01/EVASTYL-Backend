import { Request, Response } from 'express';
import Settings from '../models/Settings';
import Testimonial from '../models/Testimonial';
import SiteContent from '../models/SiteContent';
import Category from '../models/Category';

// ==================== SETTINGS ====================

// Get settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    
    // Si aucuns paramètres n'existent, créer les paramètres par défaut
    if (!settings) {
      settings = await Settings.create({
        contactEmail: 'contact@asma.com',
        contactPhone: '+33 1 42 74 59 38',
        contactAddress: '24 Rue des Francs-Bourgeois, 75003 Paris, France',
        trustStrip: [
          { icon: 'Truck', text: 'Livraison offerte dès 52 000 FCFA', isActive: true },
          { icon: 'ShieldCheck', text: 'Paiement 100% sécurisé', isActive: true },
          { icon: 'RotateCcw', text: 'Retours gratuits 30 jours', isActive: true },
          { icon: 'Gem', text: 'Matières sélectionnées', isActive: true }
        ]
      });
    }

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings
export const updateSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findOneAndUpdate(
        {},
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== TESTIMONIALS ====================

// Get all testimonials
export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get active testimonials (for public use)
export const getActiveTestimonials = async (req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: testimonials });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create testimonial
export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update testimonial
export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Témoignage non trouvé' });
    }

    res.json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete testimonial
export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Témoignage non trouvé' });
    }

    res.json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SITE CONTENT ====================

// Get content by section
export const getContentBySection = async (req: Request, res: Response) => {
  try {
    const { section } = req.params;
    let content = await SiteContent.findOne({ section });

    // Si le contenu n'existe pas, créer le contenu par défaut
    if (!content) {
      content = await createDefaultContent(section);
    }

    res.json({ success: true, data: content });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update content by section
export const updateContentBySection = async (req: Request, res: Response) => {
  try {
    const { section } = req.params;
    let content = await SiteContent.findOne({ section });

    if (!content) {
      content = await SiteContent.create({
        section,
        content: req.body.content,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true
      });
    } else {
      content = await SiteContent.findOneAndUpdate(
        { section },
        { content: req.body.content, isActive: req.body.isActive },
        { new: true, runValidators: true }
      );
    }

    res.json({ success: true, data: content });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Helper function to create default content
const createDefaultContent = async (section: string) => {
  const defaultContents: any = {
    hero: {
      title: 'Portez Votre Élégance',
      subtitle: 'au quotidien',
      description: 'Vêtements et bijoux soigneusement sélectionnés pour la femme moderne qui affirme son style avec grâce et assurance.',
      button1Text: 'Découvrez nos produits',
      button1Link: 'collections',
      button2Text: 'Voir les bijoux',
      button2Link: 'bijoux',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=560&fit=crop',
          label: 'Robes'
        },
        {
          url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=480&h=680&fit=crop',
          label: 'Collection'
        },
        {
          url: 'https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=400&h=560&fit=crop',
          label: 'Bijoux'
        }
      ],
      badge: {
        text: '100% Satisfait Garanti',
        isVisible: true
      }
    },
    banner: {
      label: 'Collection Exclusive',
      title: 'Bijoux Fins',
      subtitle: 'Faits à la Main',
      description: 'Chaque pièce est unique, réalisée par des artisans passionnés avec des matériaux précieux soigneusement choisis.',
      buttonText: 'Découvrir les bijoux',
      buttonLink: 'bijoux',
      backgroundImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=600&fit=crop'
    },
    instagram: {
      username: '@evasstyl',
      profileUrl: 'https://instagram.com/evasstyl',
      title: 'Notre univers sur Instagram',
      images: [
        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&q=80',
        'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80'
      ]
    },
    about: {
      heroTitle: 'À propos',
      heroSubtitle: 'L\'histoire d\'une maison de mode parisienne',
      heroImage: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1600&q=80',
      history: {
        label: 'Depuis 2010',
        title: 'Notre Histoire',
        paragraphs: [
          'ASMA est née d\'une passion pour la mode et les bijoux, dans un petit atelier du Marais à Paris. Ce qui a commencé comme un rêve est devenu une maison de création reconnue pour ses pièces élégantes et intemporelles.',
          'Aujourd\'hui, nous continuons de créer chaque pièce avec le même amour du détail et de la qualité, en privilégiant les matériaux nobles et le savoir-faire artisanal français.'
        ],
        image: '/eva-about.png'
      },
      values: [
        {
          title: 'Excellence',
          description: 'Nous sélectionnons rigoureusement chaque matériau et veillons à la perfection de chaque finition.'
        },
        {
          title: 'Élégance',
          description: 'Des designs intemporels qui traversent les modes et subliment avec raffinement et sobriété.'
        },
        {
          title: 'Éthique',
          description: 'Production responsable, artisans équitablement rémunérés, et matières sourcées avec transparence.'
        }
      ],
      team: [
        {
          name: 'Éva Laurent',
          role: 'Fondatrice & Directrice Artistique',
          description: 'Visionnaire derrière chaque collection',
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face'
        },
        {
          name: 'Sophie Martin',
          role: 'Designer Textile',
          description: '15 ans d\'expérience en haute couture',
          image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face'
        },
        {
          name: 'Claire Dubois',
          role: 'Maître Joaillier',
          description: 'Créations sur-mesure et restauration',
          image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face'
        }
      ]
    },
    contact: {
      heroTitle: 'Contactez-nous',
      heroSubtitle: 'Notre équipe est à votre écoute',
      heroImage: 'https://images.unsplash.com/photo-1486308510493-aa64833637bc?w=1600&q=80',
      serviceClientText: 'Notre équipe répond à toutes vos questions sous 24h. Pour un service personnalisé, n\'hésitez pas à prendre rendez-vous dans notre boutique.',
      appointmentButtonText: 'Prendre rendez-vous →'
    }
  };

  const content = await SiteContent.create({
    section,
    content: defaultContents[section] || {},
    isActive: true
  });

  return content;
};

// ==================== CATEGORIES ====================

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ order: 1 });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
