// MoMo Payment API Test Examples
// Use with REST client (Postman, Insomnia, Thunder Client, etc.)

// ========================================
// 1. CREATE MOMO PAYMENT
// ========================================
// POST http://localhost:5000/api/payments/momo/create
// Content-Type: application/json

{
  "session_id": 1,
  "amount": 50000,
  "currency": "VND",
  "description": "Test EV Charging Payment"
}

// Expected Response:
// {
//   "success": true,
//   "data": {
//     "payment_id": 1,
//     "order_id": "EV_1_1698472800000",
//     "amount": 50000,
//     "currency": "VND",
//     "payment_url": "https://test-payment.momo.vn/gw_payment/...",
//     "deeplink": "momo://app/payment/...",
//     "qrCodeUrl": "https://test-payment.momo.vn/qr/...",
//     "expires_at": "2024-10-28T12:30:00Z"
//   },
//   "message": "Payment session created successfully"
// }


// ========================================
// 2. CHECK PAYMENT STATUS
// ========================================
// GET http://localhost:5000/api/payments/momo/status/EV_1_1698472800000

// Expected Response:
// {
//   "success": true,
//   "data": {
//     "payment_id": 1,
//     "order_id": "EV_1_1698472800000",
//     "session_id": 1,
//     "amount": 50000,
//     "status": "Completed",
//     "payment_method": "momo",
//     "paid_at": "2024-10-28T12:15:00Z",
//     "momo_trans_id": "2547483940"
//   }
// }


// ========================================
// 3. GET USER PAYMENT HISTORY
// ========================================
// GET http://localhost:5000/api/payments/user/1?limit=10&offset=0

// Expected Response:
// {
//   "success": true,
//   "data": [
//     {
//       "payment_id": 1,
//       "order_id": "EV_1_1698472800000",
//       "amount": 50000,
//       "status": "Completed",
//       "date": "2024-10-28T12:00:00Z",
//       "charging_sessions": {
//         "session_id": 1,
//         "energy_consumed_kwh": 25.5,
//         "charging_points": {
//           "name": "Point #1",
//           "stations": {
//             "name": "Central Station"
//           }
//         }
//       }
//     }
//   ],
//   "total": 1
// }


// ========================================
// 4. MOMO IPN CALLBACK (Internal - for testing only)
// ========================================
// POST http://localhost:5000/api/payments/momo/ipn
// Content-Type: application/json

{
  "partnerCode": "MOMO",
  "orderId": "EV_1_1698472800000",
  "requestId": "MOMO1698472800000",
  "amount": "50000",
  "orderInfo": "EV Charging Payment",
  "orderType": "momo_wallet",
  "transId": "2547483940",
  "resultCode": 0,
  "message": "Success",
  "payType": "qr",
  "responseTime": "1698472900000",
  "extraData": "{\"session_id\":1,\"user_id\":1}",
  "signature": "generated_by_momo"
}

// Note: In production, this is called by MoMo servers only
// Signature verification will fail if called manually


// ========================================
// CURL EXAMPLES
// ========================================

// Create Payment
curl -X POST http://localhost:5000/api/payments/momo/create \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": 1,
    "amount": 50000,
    "description": "Test payment"
  }'

// Check Status
curl http://localhost:5000/api/payments/momo/status/EV_1_1698472800000

// Get User Payments
curl http://localhost:5000/api/payments/user/1?limit=10


// ========================================
// JAVASCRIPT FETCH EXAMPLES
// ========================================

// Create Payment
const createPayment = async () => {
  const response = await fetch('http://localhost:5000/api/payments/momo/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: 1,
      amount: 50000,
      description: 'EV Charging Payment'
    })
  });
  
  const data = await response.json();
  console.log('Payment created:', data);
  
  // Redirect to payment URL
  if (data.success) {
    window.location.href = data.data.payment_url;
    // Or open in new tab:
    // window.open(data.data.payment_url, '_blank');
  }
};

// Check Payment Status
const checkStatus = async (orderId) => {
  const response = await fetch(`http://localhost:5000/api/payments/momo/status/${orderId}`);
  const data = await response.json();
  console.log('Payment status:', data);
  return data;
};

// Poll payment status (for QR code payment)
const pollPaymentStatus = (orderId, interval = 3000, maxAttempts = 40) => {
  let attempts = 0;
  
  const checkInterval = setInterval(async () => {
    attempts++;
    
    const status = await checkStatus(orderId);
    
    if (status.success && status.data.status === 'Completed') {
      clearInterval(checkInterval);
      console.log('Payment completed!');
      // Handle success
      showSuccessMessage();
    } else if (status.success && status.data.status === 'Failed') {
      clearInterval(checkInterval);
      console.log('Payment failed!');
      // Handle failure
      showErrorMessage();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.log('Payment timeout!');
      // Handle timeout
      showTimeoutMessage();
    }
  }, interval);
};


// ========================================
// REACT COMPONENT EXAMPLE
// ========================================

/*
import { useState } from 'react';

function MoMoPayment({ sessionId, amount }) {
  const [paymentUrl, setPaymentUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  const createPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/payments/momo/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          amount: amount,
          description: 'EV Charging Payment'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentUrl(data.data.payment_url);
        setQrCode(data.data.qrCodeUrl);
        
        // Option 1: Redirect to MoMo
        // window.location.href = data.data.payment_url;
        
        // Option 2: Show QR code and poll status
        pollPaymentStatus(data.data.order_id);
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={createPayment} disabled={loading}>
        {loading ? 'Creating payment...' : 'Pay with MoMo'}
      </button>
      
      {qrCode && (
        <div>
          <h3>Scan QR Code to pay</h3>
          <img src={qrCode} alt="MoMo QR Code" />
        </div>
      )}
    </div>
  );
}
*/
