# ASMA Backend API

Backend API pour le site e-commerce ASMA - Mode & Bijoux

## 🚀 Technologies

- **Node.js** + **Express** + **TypeScript**
- **MongoDB** avec Mongoose
- **JWT** pour l'authentification
- **Bcrypt** pour le cryptage des mots de passe
- **Express Validator** pour la validation des données
- **Helmet** + **CORS** pour la sécurité

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env

# Modifier les valeurs dans .env selon votre configuration
```

## ⚙️ Configuration

Créer un fichier `.env` à la racine du dossier backend :

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/asma

JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRE=7d

ADMIN_EMAIL=admin@asma.com
ADMIN_PASSWORD=Admin@123456

FRONTEND_URL=http://localhost:5173
```

## 🗄️ Base de données

### Installer MongoDB

```bash
# Sur Ubuntu/Debian
sudo apt install mongodb

# Sur macOS
brew install mongodb-community
```

### Initialiser la base de données avec des données de test

```bash
npm run seed
```

Ceci créera :
- 1 compte administrateur
- 7 catégories (Robes, Colliers, Boucles d'oreilles, etc.)
- 16 produits

## 🏃 Démarrage

```bash
# Mode développement (avec auto-reload)
npm run dev

# Build production
npm run build

# Démarrer en production
npm start
```

Le serveur sera accessible sur `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur (protégé)
- `PUT /api/auth/profile` - Mettre à jour le profil (protégé)
- `PUT /api/auth/password` - Changer le mot de passe (protégé)
- `PUT /api/auth/favoris/:productId` - Ajouter/Retirer des favoris (protégé)

### Products
- `GET /api/products` - Liste des produits (avec filtres, tri, pagination)
- `GET /api/products/featured` - Produits vedettes
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (admin)
- `PUT /api/products/:id` - Modifier un produit (admin)
- `DELETE /api/products/:id` - Supprimer un produit (admin)

### Categories
- `GET /api/categories` - Liste des catégories
- `GET /api/categories/:id` - Détails d'une catégorie
- `POST /api/categories` - Créer une catégorie (admin)
- `PUT /api/categories/:id` - Modifier une catégorie (admin)
- `DELETE /api/categories/:id` - Supprimer une catégorie (admin)

### Orders
- `POST /api/orders` - Créer une commande (protégé)
- `GET /api/orders/my-orders` - Mes commandes (protégé)
- `GET /api/orders/:id` - Détails d'une commande (protégé)
- `PUT /api/orders/:id/cancel` - Annuler une commande (protégé)
- `GET /api/orders` - Toutes les commandes (admin)
- `PUT /api/orders/:id/status` - Changer le statut (admin)
- `PUT /api/orders/:id/pay` - Marquer comme payé (admin)

### Health Check
- `GET /health` - Vérifier l'état du serveur
- `GET /api` - Informations sur l'API

## 🔐 Authentification

Toutes les routes protégées nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

## 👤 Compte Admin par défaut

Après avoir exécuté `npm run seed` :

```
Email: admin@asma.com
Password: Admin@123456
```

⚠️ **Important** : Changez ces identifiants en production !

## 📁 Structure du projet

```
backend/
├── src/
│   ├── config/          # Configuration (database, etc.)
│   ├── controllers/     # Contrôleurs (logique métier)
│   ├── middleware/      # Middleware (auth, error, validation)
│   ├── models/          # Modèles Mongoose
│   ├── routes/          # Routes Express
│   ├── scripts/         # Scripts utilitaires (seed, etc.)
│   └── server.ts        # Point d'entrée
├── .env.example         # Exemple de variables d'environnement
├── package.json
├── tsconfig.json
└── README.md
```

## 🛡️ Sécurité

- Mots de passe cryptés avec bcrypt
- Authentication JWT
- Validation des données avec express-validator
- Protection CORS
- Helmet pour sécuriser les headers HTTP
- Rate limiting (à implémenter)

## 📝 Modèles de données

### User
- Prénom, nom, email, mot de passe
- Téléphone, date de naissance
- Adresse complète
- Rôle (client/admin)
- Liste de favoris

### Product
- Nom, marque, prix
- Image(s)
- Catégorie
- Badge (new/sale/bestseller)
- Description
- Stock
- Couleurs, tailles, matière
- Statistiques (vues, ventes)

### Order
- Numéro de commande auto-généré
- Utilisateur
- Articles commandés
- Adresse de livraison
- Mode de paiement
- Montants (sous-total, livraison, total)
- Statut (pending, confirmed, processing, shipped, delivered, cancelled)
- État de paiement

### Category
- ID unique, nom
- Description, image
- Compteur de produits
- Ordre d'affichage

## 🚧 À venir

- [ ] Upload d'images avec Cloudinary
- [ ] Intégration paiement (Wave, Orange Money)
- [ ] Emails automatiques (confirmation commande, etc.)
- [ ] Rate limiting
- [ ] Statistiques avancées pour l'admin
- [ ] Export de données

## 📞 Support

Pour toute question ou problème, contactez : admin@asma.com
