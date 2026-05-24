import axios from 'axios';

// Replace with your local machine IP address for physical device testing
// 10.0.2.2 is the default for Android Emulator to access localhost
const API_URL = 'http://192.168.1.4:5000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API
export const getProducts = async () => {
  try {
    const response = await api.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Customers API
export const getCustomers = async () => {
  try {
    const response = await api.get('/customers');
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await api.post('/customers', customerData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Invoices API
export const getInvoices = async () => {
  try {
    const response = await api.get('/invoices');
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
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

export const deleteInvoice = async (id) => {
  try {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
};

export default {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getInvoices,
  saveInvoice,
  deleteInvoice,
};
