import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types/users";

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  updateUser: (partialUser: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user, error: null }),
      updateUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
          error: null,
        })),
      clearUser: () => set({ user: null, error: null }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export default useUserStore;
