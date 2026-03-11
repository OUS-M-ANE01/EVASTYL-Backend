const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connecté à MongoDB');
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const admin = await User.findOne({ email: 'admin@evastyl.com' });
  
  console.log('\n📊 Résultat de la recherche:');
  console.log('Admin trouvé:', admin ? 'OUI ✅' : 'NON ❌');
  
  if (admin) {
    console.log('\n👤 Détails de l\'admin:');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Prénom:', admin.prenom);
    console.log('Nom:', admin.nom);
    console.log('Password présent:', admin.password ? 'OUI' : 'NON');
    console.log('Password length:', admin.password ? admin.password.length : 0);
    console.log('Password (premiers 30 chars):', admin.password ? admin.password.substring(0, 30) + '...' : 'N/A');
    
    // Test avec le User model complet
    console.log('\n🔐 Test de comparaison de mot de passe:');
    const bcrypt = require('bcryptjs');
    const plainPassword = 'Admin@123456';
    
    try {
      const isMatch = await bcrypt.compare(plainPassword, admin.password);
      console.log('bcrypt.compare direct:', isMatch ? 'MATCH ✅' : 'NO MATCH ❌');
    } catch (error) {
      console.log('Erreur bcrypt.compare:', error.message);
    }
  } else {
    console.log('\n❌ PROBLÈME: L\'admin n\'existe pas dans la base de données!');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur de connexion:', err.message);
  process.exit(1);
});
