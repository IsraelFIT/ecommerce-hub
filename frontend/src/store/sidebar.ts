import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      isCollapsed: false,
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (isOpen) => set({ isOpen }),
      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (isCollapsed) => set({ isCollapsed }),
    }),
    {
      name: "sidebar-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useSidebarStore;
