import nodemailer from 'nodemailer';
import { IOrder } from '../models/Order';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatPrice(amount: number) {
  return new Intl.NumberFormat('fr-SN', { style: 'decimal' }).format(amount) + ' F CFA';
}

function buildItemsHtml(items: IOrder['items']): string {
  return items
    .map(
      item => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #E8E2DA;">
          <span style="font-family:'Georgia',serif;font-size:14px;color:#1A1A18;">${item.name}</span>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #E8E2DA;text-align:center;color:#8C7B6B;font-size:13px;">×${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #E8E2DA;text-align:right;font-size:13px;color:#1A1A18;">${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    )
    .join('');
}

function orderConfirmationHtml(order: IOrder): string {
  const { shippingAddress, items, subtotal, shippingCost, total, orderNumber } = order;
  const methodLabels: Record<string, string> = {
    wave: 'Wave',
    'orange-money': 'Orange Money',
    'free-money': 'Free Money',
    expresso: 'Expresso',
    carte: 'Carte bancaire',
    cod: 'Paiement à la livraison',
    paypal: 'PayPal',
    naboopay: 'NabooPay',
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de commande ASMA</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,0.07);">

        <!-- En-tête -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A1A18 0%,#3A2F25 55%,#8C7B6B 100%);padding:40px 40px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#C9A96E;font-size:10px;letter-spacing:6px;text-transform:uppercase;font-weight:600;">ASMA</p>
            <h1 style="margin:0;font-family:'Georgia',serif;font-size:26px;font-weight:300;color:#ffffff;letter-spacing:1px;">
              Commande confirmée
            </h1>
            <p style="margin:12px 0 0;color:rgba(255,255,255,0.55);font-size:13px;">
              Merci pour votre achat, ${shippingAddress.prenom} !
            </p>
          </td>
        </tr>

        <!-- Numéro de commande -->
        <tr>
          <td style="background:#FAF7F2;padding:20px 40px;text-align:center;border-bottom:1px solid #E8E2DA;">
            <p style="margin:0;font-size:12px;color:#8C7B6B;letter-spacing:2px;text-transform:uppercase;">Numéro de commande</p>
            <p style="margin:6px 0 0;font-family:'Georgia',serif;font-size:22px;color:#1A1A18;font-weight:600;letter-spacing:1px;">${orderNumber}</p>
          </td>
        </tr>

        <!-- Articles -->
        <tr>
          <td style="padding:32px 40px 16px;">
            <p style="margin:0 0 16px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8C7B6B;font-weight:600;">Vos articles</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${buildItemsHtml(items)}
            </table>
          </td>
        </tr>

        <!-- Totaux -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;border-radius:8px;padding:16px;border:1px solid #E8E2DA;">
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#8C7B6B;">Sous-total</td>
                <td style="padding:4px 0;font-size:13px;color:#1A1A18;text-align:right;">${formatPrice(subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#8C7B6B;">Livraison</td>
                <td style="padding:4px 0;font-size:13px;color:#1A1A18;text-align:right;">${shippingCost === 0 ? 'Gratuite' : formatPrice(shippingCost)}</td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#1A1A18;border-top:1px solid #E8E2DA;">Total payé</td>
                <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#C9A96E;text-align:right;border-top:1px solid #E8E2DA;">${formatPrice(total)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Adresse & paiement -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="vertical-align:top;padding-right:12px;">
                  <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8C7B6B;font-weight:600;">Livraison à</p>
                  <p style="margin:0;font-size:13px;color:#1A1A18;line-height:1.6;">
                    ${shippingAddress.prenom} ${shippingAddress.nom}<br/>
                    ${shippingAddress.rue}<br/>
                    ${shippingAddress.ville}, ${shippingAddress.pays}<br/>
                    ${shippingAddress.telephone}
                  </p>
                </td>
                <td width="50%" style="vertical-align:top;padding-left:12px;">
                  <p style="margin:0 0 8px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8C7B6B;font-weight:600;">Mode de paiement</p>
                  <p style="margin:0;font-size:13px;color:#1A1A18;">${methodLabels[(order as any).paymentMethod] || (order as any).paymentMethod}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Pied de page -->
        <tr>
          <td style="background:#1A1A18;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;color:#C9A96E;font-size:10px;letter-spacing:5px;text-transform:uppercase;">ASMA</p>
            <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">Mode & Bijoux · Dakar, Sénégal</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

export async function sendOrderConfirmationEmail(order: IOrder): Promise<void> {
  const email = order.shippingAddress?.email;

  if (!email || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Pas d'email destinataire ou SMTP non configuré — on ignore silencieusement
    return;
  }

  try {
    await transporter.sendMail({
      from: `"ASMA" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✨ Commande confirmée – ${order.orderNumber}`,
      html: orderConfirmationHtml(order),
    });
    console.log(`[Email] Confirmation envoyée à ${email} pour la commande ${order.orderNumber}`);
  } catch (err) {
    // Ne pas bloquer le flux principal si l'email échoue
    console.error('[Email] Échec envoi confirmation:', err);
  }
}
