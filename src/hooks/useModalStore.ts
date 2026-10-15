import { create } from 'zustand';

export type ModalType =
  | 'trial-booking'
  | 'batch-booking'
  | 'academy-details'
  | 'compare-academies'
  | 'session-pass'
  | 'trial-credit'
  | 'reschedule'
  | 'payment-security'
  | 'admin-audit'
  | 'coach-batch-edit'
  | 'competition-details'
  | 'competition-rulebook'
  | 'competition-register'
  | 'competition-host'
  | 'support-chat'
  | 'notification'
  | 'attendance-log'
  | 'locality-selector';

export interface ModalData {
  acadId?: string;
  acadName?: string;
  academy?: any;
  childName?: string;
  childAge?: number | string;
  sessionTime?: string;
  courtNumber?: string;
  coachName?: string;
  bookingId?: string;
  competitionId?: string;
  competition?: any;
  title?: string;
  message?: string;
  [key: string]: any;
}

interface ModalStoreState {
  isOpen: boolean;
  activeModal: ModalType | null;
  modalData: ModalData | null;
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  updateModalData: (data: Partial<ModalData>) => void;
}

export const useModalStore = create<ModalStoreState>((set) => ({
  isOpen: false,
  activeModal: null,
  modalData: null,
  openModal: (type: ModalType, data: ModalData = {}) =>
    set({
      isOpen: true,
      activeModal: type,
      modalData: data,
    }),
  closeModal: () =>
    set({
      isOpen: false,
      activeModal: null,
      modalData: null,
    }),
  updateModalData: (data: Partial<ModalData>) =>
    set((state) => ({
      modalData: state.modalData ? { ...state.modalData, ...data } : data,
    })),
}));
