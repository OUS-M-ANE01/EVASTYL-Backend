import nodemailer from 'nodemailer';

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true pour 465, false pour autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Mot de passe d'application Gmail
  },
});

// Vérifier la configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('✅ Configuration email vérifiée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur de configuration email:', error);
    return false;
  }
};

// Envoyer un email de bienvenue
export const sendWelcomeEmail = async (email: string, name?: string): Promise<void> => {
  const mailOptions = {
    from: `"EvaStyl Newsletter" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Bienvenue dans notre newsletter !',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Bienvenue ${name || 'cher abonné'} !</h2>
        <p>Merci de vous être inscrit à notre newsletter EvaStyl.</p>
        <p>Vous recevrez désormais nos dernières actualités, promotions et nouveautés directement dans votre boîte mail.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ce que vous recevrez :</strong></p>
          <ul>
            <li>Nouvelles collections</li>
            <li>Offres exclusives</li>
            <li>Conseils mode</li>
            <li>Événements spéciaux</li>
          </ul>
        </div>
        <p>Si vous souhaitez vous désabonner, <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe?email=${email}">cliquez ici</a>.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          EvaStyl - Mode et Élégance<br>
          <a href="${process.env.FRONTEND_URL}">Visitez notre site</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Envoyer une newsletter
export const sendNewsletter = async (
  emails: string[],
  subject: string,
  content: string
): Promise<void> => {
  const mailOptions = {
    from: `"EvaStyl Newsletter" <${process.env.SMTP_USER}>`,
    bcc: emails, // Copie cachée pour tous les destinataires
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">EvaStyl Newsletter</h1>
        </div>
        <div style="line-height: 1.6;">
          ${content}
        </div>
        <hr style="margin: 30px 0;">
        <div style="text-align: center; color: #666; font-size: 12px;">
          <p>EvaStyl - Mode et Élégance</p>
          <p>
            <a href="${process.env.FRONTEND_URL}">Visitez notre site</a> | 
            <a href="${process.env.FRONTEND_URL}/newsletter/unsubscribe">Se désabonner</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Envoyer un email de confirmation de désabonnement
export const sendUnsubscribeConfirmation = async (email: string): Promise<void> => {
  const mailOptions = {
    from: `"EvaStyl Newsletter" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Désabonnement confirmé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Désabonnement confirmé</h2>
        <p>Vous avez été désabonné avec succès de notre newsletter.</p>
        <p>Nous sommes désolés de vous voir partir. Si vous changez d'avis, vous pouvez vous réinscrire à tout moment sur notre site.</p>
        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/newsletter" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Se réinscrire
          </a>
        </p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          EvaStyl - Mode et Élégance<br>
          <a href="${process.env.FRONTEND_URL}">Visitez notre site</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default transporter;
// Envoyer un email de confirmation de commande
export const sendOrderConfirmationEmail = async (
  email: string,
  orderDetails: {
    orderId: string;
    customerName: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    shippingAddress: {
      prenom: string;
      nom: string;
      rue: string;
      ville: string;
      telephone: string;
    };
  }
): Promise<void> => {
  const itemsHtml = orderDetails.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price} XOF</td>
      </tr>
    `
    )
    .join('');

  const mailOptions = {
    from: `"EvaStyl" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Confirmation de commande #${orderDetails.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">EvaStyl</h1>
          <h2 style="color: #28a745;">Commande confirmée !</h2>
        </div>
        
        <p>Bonjour ${orderDetails.customerName},</p>
        <p>Nous avons bien reçu votre commande et le paiement a été confirmé.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Détails de la commande #${orderDetails.orderId}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e9ecef;">
                <th style="padding: 10px; text-align: left;">Produit</th>
                <th style="padding: 10px; text-align: center;">Quantité</th>
                <th style="padding: 10px; text-align: right;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #e9ecef; font-weight: bold;">
                <td colspan="2" style="padding: 10px;">Total</td>
                <td style="padding: 10px; text-align: right;">${orderDetails.total} XOF</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Adresse de livraison :</h4>
          <p>
            ${orderDetails.shippingAddress.prenom} ${orderDetails.shippingAddress.nom}<br>
            ${orderDetails.shippingAddress.rue}<br>
            ${orderDetails.shippingAddress.ville}<br>
            Tél: ${orderDetails.shippingAddress.telephone}
          </p>
        </div>
        
        <p>Votre commande sera traitée dans les plus brefs délais. Vous recevrez un email de suivi dès l'expédition.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          EvaStyl - Mode et Élégance<br>
          <a href="${process.env.FRONTEND_URL}">Visitez notre site</a> | 
          <a href="${process.env.FRONTEND_URL}/contact">Nous contacter</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
// Envoyer un email de contact à l'équipe
export const sendContactEmail = async (contactData: {
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  sujet: string;
  message: string;
  dateEnvoi: Date;
}): Promise<void> => {
  const mailOptions = {
    from: `"EvaStyl Contact" <${process.env.SMTP_USER}>`,
    to: process.env.SMTP_USER, // Envoyer à nous-mêmes
    subject: `[EvaStyl Contact] ${contactData.sujet}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">Nouveau message de contact</h2>
          <p style="color: #666; margin: 5px 0 0 0;">Reçu le ${contactData.dateEnvoi.toLocaleString('fr-FR')}</p>
        </div>
        
        <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="color: #333; border-bottom: 2px solid #f0c14b; padding-bottom: 10px;">
            Informations du contact
          </h3>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Nom :</td>
              <td style="padding: 8px 0;">${contactData.prenom ? contactData.prenom + ' ' : ''}${contactData.nom}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Email :</td>
              <td style="padding: 8px 0;"><a href="mailto:${contactData.email}">${contactData.email}</a></td>
            </tr>
            ${contactData.telephone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Téléphone :</td>
              <td style="padding: 8px 0;"><a href="tel:${contactData.telephone}">${contactData.telephone}</a></td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Sujet :</td>
              <td style="padding: 8px 0;">${contactData.sujet}</td>
            </tr>
          </table>
          
          <h3 style="color: #333; border-bottom: 2px solid #f0c14b; padding-bottom: 10px;">
            Message
          </h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
${contactData.message}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-radius: 5px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            <strong>Actions rapides :</strong><br>
            • Répondre : <a href="mailto:${contactData.email}?subject=Re: ${contactData.sujet}">Cliquez ici</a><br>
            ${contactData.telephone ? `• Appeler : <a href="tel:${contactData.telephone}">${contactData.telephone}</a><br>` : ''}
            • WhatsApp : <a href="https://wa.me/221781166720?text=Bonjour%20${contactData.prenom || contactData.nom},%20nous%20avons%20reçu%20votre%20message%20concernant%20${encodeURIComponent(contactData.sujet)}">Répondre sur WhatsApp</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Envoyer un email de confirmation au client
export const sendContactConfirmation = async (
  email: string,
  nom: string
): Promise<void> => {
  const mailOptions = {
    from: `"EvaStyl" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Confirmation de réception - EvaStyl',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">EvaStyl</h1>
          <h2 style="color: #f0c14b;">Message bien reçu !</h2>
        </div>
        
        <p>Bonjour ${nom},</p>
        
        <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Que se passe-t-il maintenant ?</h3>
          <ul style="color: #666; line-height: 1.6;">
            <li>Notre équipe examine votre demande</li>
            <li>Nous vous répondrons dans les <strong>24 heures</strong></li>
            <li>Pour les demandes urgentes, contactez-nous sur WhatsApp</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a
            href="https://wa.me/221781166720?text=Bonjour,%20j'ai%20envoyé%20un%20message%20via%20le%20formulaire%20de%20contact"
            style="display: inline-block; background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;"
          >
            📱 Nous contacter sur WhatsApp
          </a>
        </div>
        
        <hr style="margin: 30px 0;">
        
        <div style="text-align: center; color: #666; font-size: 12px;">
          <p>
            EvaStyl - Mode et Élégance<br>
            <a href="${process.env.FRONTEND_URL}">Visitez notre site</a> | 
            <a href="mailto:contact@evastyl.com">contact@evastyl.com</a> | 
            <a href="tel:+221781166720">+221 78 116 67 20</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};