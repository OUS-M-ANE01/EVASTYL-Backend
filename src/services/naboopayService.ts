import axios from 'axios';

const NABOO_BASE = 'https://api.naboopay.com/api/v2';

function getApiKey(): string {
  const key = process.env.NABOOPAY_API_KEY;
  if (!key) throw new Error('NABOOPAY_API_KEY non configuré dans .env');
  return key;
}

function headers() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

export interface NabooProduct {
  name: string;
  price: number;
  quantity: number;
  description: string;
}

export interface NabooCustomer {
  first_name: string;
  last_name: string;
  phone: string;
}

export type NabooPaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'EXPRESSO';

export interface CreateTransactionPayload {
  method_of_payment: NabooPaymentMethod[];
  products: NabooProduct[];
  customer: NabooCustomer;
  success_url: string;
  error_url: string;
  is_escrow?: boolean;
  is_merchant?: boolean;
  fees_customer_side?: boolean;
}

export interface NabooTransactionResponse {
  order_id: string;
  checkout_url: string;
  token: string;
  created_at: string;
}

export interface NabooTransactionStatus {
  order_id: string;
  price: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  transaction_status?: string;
  payment_method?: string;
  paid_at?: string;
}


/**
 * Crée une transaction de paiement NabooPay (v2).
 */
export async function createNabooTransaction(
  payload: CreateTransactionPayload
): Promise<NabooTransactionResponse> {
  // Log du payload envoyé à NabooPay
  console.log('[NabooPay] Payload envoyé:', JSON.stringify(payload, null, 2));

  // Validation stricte du payload
  if (!payload.method_of_payment || !Array.isArray(payload.method_of_payment) || payload.method_of_payment.length === 0) {
    throw new Error('method_of_payment manquant ou vide');
  }
  if (!payload.products || !Array.isArray(payload.products) || payload.products.length === 0) {
    throw new Error('products manquant ou vide');
  }
  if (!payload.customer || !payload.customer.first_name || !payload.customer.last_name || !payload.customer.phone) {
    throw new Error('customer manquant ou incomplet');
  }
  if (!payload.success_url || typeof payload.success_url !== 'string') {
    throw new Error('success_url manquant ou invalide');
  }
  if (!payload.error_url || typeof payload.error_url !== 'string') {
    throw new Error('error_url manquant ou invalide');
  }

  const { data } = await axios.post<NabooTransactionResponse>(
    `${NABOO_BASE}/transactions`,
    {
      method_of_payment: payload.method_of_payment,
      products: payload.products,
      customer: payload.customer,
      success_url: payload.success_url,
      error_url: payload.error_url,
      is_escrow: payload.is_escrow ?? false,
      is_merchant: payload.is_merchant ?? false,
      fees_customer_side: payload.fees_customer_side ?? true,
    },
    { headers: headers() }
  );
  return data;
}

/**
 * Récupère le statut d'une transaction NabooPay (v2).
 * Normalise transaction_status (minuscules) → status (majuscules).
 */
export async function getNabooTransaction(
  nabooOrderId: string
): Promise<NabooTransactionStatus> {
  const { data } = await axios.get<any>(
    `${NABOO_BASE}/transactions/${nabooOrderId}`,
    { headers: headers() }
  );

  console.log('[NabooPay] getNabooTransaction réponse brute:', JSON.stringify(data, null, 2));

  const rawStatus = data.transaction_status || data.status || 'PENDING';
  return {
    ...data,
    status: (rawStatus as string).toUpperCase() as NabooTransactionStatus['status'],
  };
}
