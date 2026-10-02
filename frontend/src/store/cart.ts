import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  quantity: number;
  size?: string;
  flavor?: string;
}

interface CartStore {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string, size?: string, flavor?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, flavor?: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addToCart: (item, quantity = 1) => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (i) => i.id === item.id && i.size === item.size && i.flavor === item.flavor
      );

      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += quantity;
        return { items: newItems };
      }

      return { items: [...state.items, { ...item, quantity }] };
    });
  },

  removeFromCart: (id, size, flavor) => {
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.id === id && i.size === size && i.flavor === flavor)
      )
    }));
  },

  updateQuantity: (id, quantity, size, flavor) => {
    if (quantity <= 0) {
      get().removeFromCart(id, size, flavor);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id && i.size === size && i.flavor === flavor
          ? { ...i, quantity }
          : i
      )
    }));
  },

  clearCart: () => set({ items: [] }),

  getCartTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getCartCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  }
}));
