import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/**
 * Create a Stripe checkout session for course purchase
 * @param {Object} params - { userId, courseId, courseName, amount, courseUrl, successUrl, cancelUrl }
 * @returns {Promise<Object>}
 */
export const createCheckoutSession = async ({
  userId,
  courseId,
  courseName,
  amount,
  instructorName,
  courseUrl,
  successUrl,
  cancelUrl
}) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: courseName,
              description: `Online Course by ${instructorName}`,
              images: [courseUrl] // Optional course image
            },
            unit_amount: Math.round(amount * 100) // Stripe expects amount in cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        courseId,
        courseTitle: courseName
      }
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    throw new Error(`Stripe session creation failed: ${error.message}`);
  }
};

/**
 * Retrieve checkout session details
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<Object>}
 */
export const getCheckoutSession = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      success: true,
      session: {
        id: session.id,
        status: session.payment_status,
        customer: session.customer_details,
        metadata: session.metadata,
        total: session.amount_total / 100
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve session: ${error.message}`);
  }
};

/**
 * Retrieve payment details by payment intent
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>}
 */
export const getPaymentDetails = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      success: true,
      payment: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve payment: ${error.message}`);
  }
};

/**
 * Create a refund for a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {number} amount - Amount to refund (optional, full refund if not provided)
 * @returns {Promise<Object>}
 */
export const refundPayment = async (paymentIntentId, amount = null) => {
  try {
    const refundArgs = {
      payment_intent: paymentIntentId
    };

    if (amount) {
      refundArgs.amount = Math.round(amount * 100); // Convert to cents
    }

    const refund = await stripe.refunds.create(refundArgs);

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        created: new Date(refund.created * 1000)
      }
    };
  } catch (error) {
    throw new Error(`Refund creation failed: ${error.message}`);
  }
};

/**
 * Verify Stripe webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - Stripe signature from header
 * @returns {Object|null}
 */
export const verifyWebhookSignature = (body, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return null;
  }
};

/**
 * Handle payment success webhook
 * @param {Object} data - Checkout session data from webhook
 * @returns {Object}
 */
export const handlePaymentSuccess = (sessionData) => {
  return {
    userId: sessionData.metadata?.userId,
    courseId: sessionData.metadata?.courseId,
    courseTitle: sessionData.metadata?.courseTitle,
    amount: sessionData.amount_total / 100,
    currency: sessionData.currency,
    customerEmail: sessionData.customer_details?.email,
    paymentIntentId: sessionData.payment_intent
  };
};

/**
 * Get Stripe customer details
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>}
 */
export const getCustomerDetails = async (customerId) => {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return {
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: new Date(customer.created * 1000)
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve customer: ${error.message}`);
  }
};

/**
 * Create or retrieve customer
 * @param {Object} params - { email, name, metadata }
 * @returns {Promise<Object>}
 */
export const createOrGetCustomer = async ({ email, name, metadata = {} }) => {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length > 0) {
      return {
        success: true,
        customerId: customers.data[0].id,
        isNew: false
      };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });

    return {
      success: true,
      customerId: customer.id,
      isNew: true
    };
  } catch (error) {
    throw new Error(`Customer creation failed: ${error.message}`);
  }
};

export default {
  createCheckoutSession,
  getCheckoutSession,
  getPaymentDetails,
  refundPayment,
  verifyWebhookSignature,
  handlePaymentSuccess,
  getCustomerDetails,
  createOrGetCustomer
};
