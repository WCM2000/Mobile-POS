import axios from 'axios';

// Replace with your local machine IP address for physical device testing
// 10.0.2.2 is the default for Android Emulator to access localhost
const API_URL = 'http://10.0.2.2:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const saveInvoice = async (invoiceData) => {
  try {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error saving invoice:', error);
    throw error;
  }
};

export default {
  getProducts,
  saveInvoice,
};
