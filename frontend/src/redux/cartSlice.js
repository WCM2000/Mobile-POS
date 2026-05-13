import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  subTotal: 0,
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
      state.subTotal = state.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      state.taxAmount = state.subTotal * 0.06;
      state.grandTotal = state.subTotal + state.taxAmount;
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.subTotal = state.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      state.taxAmount = state.subTotal * 0.06;
      state.grandTotal = state.subTotal + state.taxAmount;
    },
    clearCart: (state) => {
      return initialState;
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
