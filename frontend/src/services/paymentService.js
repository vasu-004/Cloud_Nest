// src/services/paymentService.js - Payment API calls
import api from './api';

/**
 * simulated checkout call to the backend
 * @param {Object} paymentData - tier, cardLastFour, amount
 */
export const checkout = async (paymentData) => {
  return api.post('/payments/checkout', paymentData);
};
