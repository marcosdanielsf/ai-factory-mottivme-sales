import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // Panels
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;

  // Modals
  nodeDetailModalOpen: boolean;
  simulatorModalOpen: boolean;
  editingNodeId: string | null;

  // Canvas
  showGrid: boolean;
  showMinimap: boolean;
  snapToGrid: boolean;

  // Theme
  isDarkMode: boolean;

  // Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;

  openNodeDetailModal: (nodeId?: string) => void;
  closeNodeDetailModal: () => void;
  openSimulatorModal: () => void;
  closeSimulatorModal: () => void;

  toggleGrid: () => void;
  toggleMinimap: () => void;
  toggleSnapToGrid: () => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      leftPanelOpen: true,
      rightPanelOpen: true,
      nodeDetailModalOpen: false,
      simulatorModalOpen: false,
      editingNodeId: null,
      showGrid: true,
      showMinimap: true,
      snapToGrid: true,
      isDarkMode: false,

      // Actions
      toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

      openNodeDetailModal: (nodeId) => set({
        nodeDetailModalOpen: true,
        editingNodeId: nodeId || null,
      }),
      closeNodeDetailModal: () => set({
        nodeDetailModalOpen: false,
        editingNodeId: null,
      }),

      openSimulatorModal: () => set({ simulatorModalOpen: true }),
      closeSimulatorModal: () => set({ simulatorModalOpen: false }),

      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
      toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
      toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
    }),
    { name: 'ui-store' }
  )
);
