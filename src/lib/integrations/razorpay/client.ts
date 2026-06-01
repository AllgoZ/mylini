// Razorpay — payment gateway integration (Phase 3).
// Install: npm install razorpay
// This file is a placeholder. Do NOT add payment logic here yet.

// TODO: import Razorpay from 'razorpay'
// export const razorpay = new Razorpay({
//   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// })

export async function createRazorpayOrder(_amount: number, _currency = 'INR'): Promise<never> {
  throw new Error('Razorpay not yet implemented — coming in Phase 3')
}

export async function verifyRazorpaySignature(
  _orderId: string,
  _paymentId: string,
  _signature: string
): Promise<never> {
  throw new Error('Razorpay not yet implemented — coming in Phase 3')
}
