import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  toggleIsOpen: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useSidebarToggle = create<SidebarState>()((set) => ({
  isOpen: false,
  toggleIsOpen: () => {
    set((state) => ({ isOpen: !state.isOpen }));
  },
  setIsOpen: (isOpen) => {
    set({ isOpen });
  },
}));
