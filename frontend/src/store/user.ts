import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types/users";
import { getSession } from "@/lib/session";
import { getCurrentUserProfile } from "@/lib/api/auth";

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  updateUser: (partialUser: Partial<User>) => void;
  clearUser: () => void;
  syncSession: () => Promise<User | null>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
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
      syncSession: async () => {
        try {
          const session = await getSession();
          if (!session || !session.accessToken) {
            return get().user;
          }

          set({ isLoading: true });
          const profile = await getCurrentUserProfile(session.accessToken);
          if (profile) {
            const userWithRole: User = {
              ...profile,
              role: (session.role as User["role"]) || profile.role,
            };
            set({ user: userWithRole, isLoading: false, error: null });
            return userWithRole;
          }
          set({ isLoading: false });
          return get().user;
        } catch (err: unknown) {
          console.warn("Could not sync session with backend profile:", err);
          set({ isLoading: false });
          return get().user;
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        if (!state.user) return { user: null };
        const userCopy = { ...state.user };
        delete userCopy.auth;
        return { user: userCopy };
      },
    },
  ),
);

export default useUserStore;
