import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Simulation, SimulationMessage, Persona } from '@/types/flow';

interface SimulatorState {
  // Data
  currentSimulation: Simulation | null;
  messages: SimulationMessage[];

  // Input
  inputMessage: string;

  // State
  isRunning: boolean;
  isLoading: boolean;
  showReasoning: Record<string, boolean>;

  // Actions
  setSimulation: (simulation: Simulation) => void;
  addMessage: (message: SimulationMessage) => void;
  setMessages: (messages: SimulationMessage[]) => void;

  setInputMessage: (message: string) => void;
  clearInput: () => void;

  setRunning: (running: boolean) => void;
  setLoading: (loading: boolean) => void;

  toggleReasoning: (messageId: string) => void;
  showAllReasoning: () => void;
  hideAllReasoning: () => void;

  reset: () => void;
}

const initialState = {
  currentSimulation: null,
  messages: [],
  inputMessage: '',
  isRunning: false,
  isLoading: false,
  showReasoning: {},
};

export const useSimulatorStore = create<SimulatorState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setSimulation: (simulation) => set({
        currentSimulation: simulation,
        messages: simulation.messages,
        isRunning: simulation.status === 'running',
      }),

      addMessage: (message) => {
        const { messages } = get();
        set({ messages: [...messages, message] });
      },

      setMessages: (messages) => set({ messages }),

      setInputMessage: (inputMessage) => set({ inputMessage }),
      clearInput: () => set({ inputMessage: '' }),

      setRunning: (isRunning) => set({ isRunning }),
      setLoading: (isLoading) => set({ isLoading }),

      toggleReasoning: (messageId) => {
        const { showReasoning } = get();
        set({
          showReasoning: {
            ...showReasoning,
            [messageId]: !showReasoning[messageId],
          },
        });
      },

      showAllReasoning: () => {
        const { messages } = get();
        const showReasoning: Record<string, boolean> = {};
        messages.forEach((m) => {
          if (m.reasoning) showReasoning[m.id] = true;
        });
        set({ showReasoning });
      },

      hideAllReasoning: () => set({ showReasoning: {} }),

      reset: () => set(initialState),
    }),
    { name: 'simulator-store' }
  )
);
