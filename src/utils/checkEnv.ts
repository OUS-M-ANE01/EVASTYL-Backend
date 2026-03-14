/**
 * Vérifie que toutes les variables d'environnement requises sont définies
 */
export function checkRequiredEnvVars() {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NABOOPAY_API_KEY',
  ];

  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\n💡 Copiez .env.example vers .env et remplissez les valeurs');
    process.exit(1);
  }

  // Warnings pour les variables optionnelles mais recommandées
  const recommended = [
    'BREVO_API_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NABOOPAY_WEBHOOK_SECRET',
  ];

  const missingRecommended: string[] = [];
  for (const varName of recommended) {
    if (!process.env[varName]) {
      missingRecommended.push(varName);
    }
  }

  if (missingRecommended.length > 0) {
    console.warn('⚠️  Variables d\'environnement recommandées manquantes:');
    missingRecommended.forEach(v => console.warn(`   - ${v}`));
    console.warn('');
  }

  console.log('✅ Variables d\'environnement vérifiées');
}
