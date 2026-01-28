
// Midtrans Payment Gateway Service
// Untuk integrasi pembayaran QRIS dan Virtual Account

const MIDTRANS_CLIENT_KEY = (import.meta as any).env.VITE_MIDTRANS_CLIENT_KEY;
const MIDTRANS_SERVER_KEY = (import.meta as any).env.VITE_MIDTRANS_SERVER_KEY;
const IS_PRODUCTION = (import.meta as any).env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

export const isMidtransConfigured = !!MIDTRANS_CLIENT_KEY && !!MIDTRANS_SERVER_KEY;

// Payment channel types
export type PaymentChannel = 'qris' | 'va_bca' | 'va_bni' | 'va_bri' | 'va_mandiri' | 'gopay' | 'shopeepay';

export interface MidtransTransactionRequest {
    orderId: string;
    grossAmount: number;
    customerDetails: {
        firstName: string;
        email?: string;
        phone?: string;
    };
    itemDetails: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    paymentType: PaymentChannel;
}

export interface MidtransTransactionResponse {
    token?: string;
    redirectUrl?: string;
    qrCode?: string;
    vaNumber?: string;
    bank?: string;
    orderId: string;
    grossAmount: number;
    transactionStatus: string;
    fraudStatus?: string;
}

export const midtrans = {
    /**
     * Create a transaction using Midtrans Snap API
     */
    createTransaction: async (request: MidtransTransactionRequest): Promise<MidtransTransactionResponse> => {
        if (!isMidtransConfigured) {
            // Mock response for demo mode
            return {
                orderId: request.orderId,
                grossAmount: request.grossAmount,
                transactionStatus: 'pending',
                qrCode: request.paymentType === 'qris'
                    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=QRIS_${request.orderId}`
                    : undefined,
                vaNumber: request.paymentType.startsWith('va_')
                    ? request.paymentType.replace('va_', '').toUpperCase() + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
                    : undefined,
                bank: request.paymentType.startsWith('va_')
                    ? request.paymentType.replace('va_', '').toUpperCase()
                    : undefined
            };
        }

        try {
            // Encode server key for basic auth
            const auth = btoa(MIDTRANS_SERVER_KEY + ':');
            const apiUrl = IS_PRODUCTION
                ? 'https://api.midtrans.com/v2/charge'
                : 'https://api.sandbox.midtrans.com/v2/charge';

            const paymentPayload = buildPaymentPayload(request);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify(paymentPayload)
            });

            if (!response.ok) {
                throw new Error(`Midtrans API error: ${response.status}`);
            }

            const data = await response.json();

            return {
                orderId: data.order_id,
                grossAmount: data.gross_amount,
                transactionStatus: data.transaction_status,
                fraudStatus: data.fraud_status,
                qrCode: data.actions?.find((a: any) => a.name === 'generate-qr-code')?.url,
                vaNumber: data.va_numbers?.[0]?.va_number,
                bank: data.va_numbers?.[0]?.bank
            };

        } catch (error: any) {
            console.error('Midtrans create transaction error:', error);
            throw error;
        }
    },

    /**
     * Check transaction status
     */
    checkStatus: async (orderId: string): Promise<MidtransTransactionResponse> => {
        if (!isMidtransConfigured) {
            return {
                orderId,
                grossAmount: 0,
                transactionStatus: 'pending'
            };
        }

        try {
            const auth = btoa(MIDTRANS_SERVER_KEY + ':');
            const apiUrl = IS_PRODUCTION
                ? `https://api.midtrans.com/v2/${orderId}/status`
                : `https://api.sandbox.midtrans.com/v2/${orderId}/status`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Basic ${auth}`
                }
            });

            if (!response.ok) {
                throw new Error(`Midtrans API error: ${response.status}`);
            }

            const data = await response.json();

            return {
                orderId: data.order_id,
                grossAmount: parseFloat(data.gross_amount),
                transactionStatus: data.transaction_status,
                fraudStatus: data.fraud_status
            };

        } catch (error: any) {
            console.error('Midtrans check status error:', error);
            throw error;
        }
    },

    /**
     * Cancel transaction
     */
    cancelTransaction: async (orderId: string): Promise<boolean> => {
        if (!isMidtransConfigured) {
            return true;
        }

        try {
            const auth = btoa(MIDTRANS_SERVER_KEY + ':');
            const apiUrl = IS_PRODUCTION
                ? `https://api.midtrans.com/v2/${orderId}/cancel`
                : `https://api.sandbox.midtrans.com/v2/${orderId}/cancel`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Basic ${auth}`
                }
            });

            return response.ok;

        } catch (error: any) {
            console.error('Midtrans cancel transaction error:', error);
            return false;
        }
    }
};

/**
 * Build payment payload based on payment type
 */
function buildPaymentPayload(request: MidtransTransactionRequest) {
    const basePayload = {
        transaction_details: {
            order_id: request.orderId,
            gross_amount: request.grossAmount
        },
        customer_details: {
            first_name: request.customerDetails.firstName,
            email: request.customerDetails.email,
            phone: request.customerDetails.phone
        },
        item_details: request.itemDetails.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };

    // Add payment type specific fields
    if (request.paymentType === 'qris') {
        return {
            ...basePayload,
            payment_type: 'qris'
        };
    } else if (request.paymentType.startsWith('va_')) {
        const bank = request.paymentType.replace('va_', '');
        return {
            ...basePayload,
            payment_type: 'bank_transfer',
            bank_transfer: {
                bank: bank
            }
        };
    } else if (request.paymentType === 'gopay') {
        return {
            ...basePayload,
            payment_type: 'gopay'
        };
    } else if (request.paymentType === 'shopeepay') {
        return {
            ...basePayload,
            payment_type: 'shopeepay'
        };
    }

    return basePayload;
}
