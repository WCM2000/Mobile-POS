import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  subTotal: 0,
  discountAmount: 0,
  taxRate: 8,
  taxInclusive: false,
  taxAmount: 0,
  grandTotal: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find((i) => i.id === item.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      recalculate(state);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      recalculate(state);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const existingItem = state.items.find((i) => i.id === id);
      if (existingItem) {
        existingItem.quantity = Math.max(0, quantity);
        if (existingItem.quantity === 0) {
          state.items = state.items.filter((i) => i.id !== id);
        }
      }
      recalculate(state);
    },
    applyCartConfig: (state, action) => {
      const { taxRate, taxInclusive, discountAmount } = action.payload;
      if (taxRate !== undefined) state.taxRate = taxRate;
      if (taxInclusive !== undefined) state.taxInclusive = taxInclusive;
      if (discountAmount !== undefined) state.discountAmount = discountAmount;
      recalculate(state);
    },
    clearCart: (state) => {
      return {
        ...initialState,
        taxRate: state.taxRate,
        taxInclusive: state.taxInclusive,
      };
    },
  },
});

const recalculate = (state) => {
  state.subTotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  const discountableSubtotal = Math.max(0, state.subTotal - state.discountAmount);
  
  if (state.taxInclusive) {
    // Tax is included: subtotal contains tax
    // Formula: Tax = Subtotal - (Subtotal / (1 + Rate/100))
    state.taxAmount = discountableSubtotal - (discountableSubtotal / (1 + state.taxRate / 100));
    state.grandTotal = discountableSubtotal;
  } else {
    // Tax is added on top
    state.taxAmount = discountableSubtotal * (state.taxRate / 100);
    state.grandTotal = discountableSubtotal + state.taxAmount;
  }
};

export const { addToCart, removeFromCart, updateQuantity, applyCartConfig, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
