import { createSlice } from '@reduxjs/toolkit';

const CART_STORAGE_KEY = 'nk_cart_by_user';

function readStoredCarts() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistCarts(cartsByUser) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartsByUser || {}));
}

function ensureUserCart(cartsByUser, userKey) {
  if (!cartsByUser[userKey]) {
    cartsByUser[userKey] = { items: [], totalQuantity: 0, totalAmount: 0 };
  }
  return cartsByUser[userKey];
}

const storedCarts = readStoredCarts();
const defaultUserKey = 'guest';
const defaultCart = ensureUserCart(storedCarts, defaultUserKey);

const initialState = {
  activeUserKey: defaultUserKey,
  cartsByUser: storedCarts,
  items: defaultCart.items,
  totalQuantity: defaultCart.totalQuantity,
  totalAmount: defaultCart.totalAmount,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setActiveCartUser(state, action) {
      const userKey = String(action.payload || 'guest');
      state.activeUserKey = userKey;
      const activeCart = ensureUserCart(state.cartsByUser, userKey);
      state.items = activeCart.items;
      state.totalQuantity = activeCart.totalQuantity;
      state.totalAmount = activeCart.totalAmount;
      persistCarts(state.cartsByUser);
    },
    addItemToCart(state, action) {
      const newItem = action.payload;
      const existingItem = state.items.find((item) => item.id === newItem.id);
      state.totalQuantity++;
      if (!existingItem) {
        state.items.push({
          id: newItem.id,
          price: newItem.price,
          quantity: 1,
          totalPrice: newItem.price,
          name: newItem.title,
          image: newItem.image
        });
      } else {
        existingItem.quantity++;
        existingItem.totalPrice = existingItem.totalPrice + newItem.price;
      }
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
      state.cartsByUser[state.activeUserKey] = {
        items: state.items,
        totalQuantity: state.totalQuantity,
        totalAmount: state.totalAmount,
      };
      persistCarts(state.cartsByUser);
    },
    removeItemFromCart(state, action) {
      const id = action.payload;
      const existingItem = state.items.find((item) => item.id === id);
      if (!existingItem) return;
      state.totalQuantity--;
      if (existingItem.quantity === 1) {
        state.items = state.items.filter((item) => item.id !== id);
      } else {
        existingItem.quantity--;
        existingItem.totalPrice = existingItem.totalPrice - existingItem.price;
      }
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
      state.cartsByUser[state.activeUserKey] = {
        items: state.items,
        totalQuantity: state.totalQuantity,
        totalAmount: state.totalAmount,
      };
      persistCarts(state.cartsByUser);
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      state.cartsByUser[state.activeUserKey] = {
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
      };
      persistCarts(state.cartsByUser);
    }
  },
});

export const { setActiveCartUser, addItemToCart, removeItemFromCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
