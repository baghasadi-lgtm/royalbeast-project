import crypto from 'crypto';
import { getQrisImage } from './settingsService.js';

const MIDTRANS_BASE = process.env.MIDTRANS_IS_PRODUCTION === 'true'
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com';

const hasMidtrans = Boolean(process.env.MIDTRANS_SERVER_KEY);
const provider = process.env.PAYMENT_PROVIDER || (hasMidtrans ? 'midtrans' : 'static');

export const STATIC_QRIS_IMAGE = '/qris.jpg';

const midtransFetch = async (path, body) => {
  const auth = Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString('base64');
  const response = await fetch(`${MIDTRANS_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.status_message || data.error_messages?.join(', ') || 'Midtrans request failed');
  }
  return data;
};

export const getPaymentProvider = () => provider;

export const createQrisPayment = async ({ orderId, amount }) => {
  const paymentRef = `RB-${orderId}-${Date.now()}`;

  if (provider === 'static' || provider === 'mock') {
    const qrisImage = await getQrisImage();
    return {
      paymentRef,
      paymentStatus: 'pending',
      qrisUrl: null,
      qrString: null,
      qrisImage,
      provider,
    };
  }

  const charge = await midtransFetch('/v2/charge', {
    payment_type: 'qris',
    transaction_details: {
      order_id: paymentRef,
      gross_amount: amount,
    },
    qris: { acquirer: 'gopay' },
  });

  const qrAction = charge.actions?.find((a) => a.name === 'generate-qr-code' || a.name === 'generate-qr-code-v2');

  return {
    paymentRef,
    paymentStatus: charge.transaction_status === 'settlement' ? 'paid' : 'pending',
    qrisUrl: qrAction?.url || null,
    qrString: charge.qr_string || null,
    provider: 'midtrans',
    rawStatus: charge.transaction_status,
  };
};

export const verifyMidtransSignature = (body) => {
  const orderId = body.order_id;
  const statusCode = body.status_code;
  const grossAmount = body.gross_amount;
  const signatureKey = body.signature_key;

  const expected = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${process.env.MIDTRANS_SERVER_KEY}`)
    .digest('hex');

  return expected === signatureKey;
};
