import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shopName: 'O3 Professional Retail',
  shopAddress: 'No. 3, High Level Road, Colombo',
  shopPhone: '077 123 4567',
  shopGstNumber: 'GST-O3-998877',
  taxRate: 8, // 8% GST/SST
  taxType: 'GST', // GST, SST, VAT, None
  taxInclusive: false,
  currency: 'Rs.',
  printerSize: '80mm', // 58mm or 80mm
  connectedPrinterAddress: '',
  connectedPrinterName: 'Not Connected',
  showDiscountOnInvoice: true,
  listProductsSeparately: false,
  showCustomerDetailsOnInvoice: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action) => {
      return { ...state, ...action.payload };
    },
    updatePrinter: (state, action) => {
      state.connectedPrinterAddress = action.payload.address;
      state.connectedPrinterName = action.payload.name;
    },
    resetSettings: () => {
      return initialState;
    },
  },
});

export const { updateSettings, updatePrinter, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
