import { describe, it } from 'node:test';
import assert from 'node:assert';
import { useModalStore, ModalType, ModalData } from '@/hooks/useModalStore';

describe('Phase 24: Global Modal Store State Machine Tests', () => {
  it('should initialize with closed modal and null data', () => {
    useModalStore.getState().closeModal();

    const state = useModalStore.getState();
    assert.strictEqual(state.isOpen, false);
    assert.strictEqual(state.activeModal, null);
    assert.strictEqual(state.modalData, null);
  });

  it('should open trial-booking modal with provided academy data payload', () => {
    const payload: ModalData = {
      acadId: 'acad-delhi-01',
      acadName: 'Delhi Olympic Badminton',
      locality: 'Connaught Place',
      category: 'badminton',
    };

    useModalStore.getState().openModal('trial-booking', payload);

    const state = useModalStore.getState();
    assert.strictEqual(state.isOpen, true);
    assert.strictEqual(state.activeModal, 'trial-booking');
    assert.strictEqual(state.modalData?.acadId, 'acad-delhi-01');
    assert.strictEqual(state.modalData?.acadName, 'Delhi Olympic Badminton');
  });

  it('should update modal data partially without losing existing properties', () => {
    // Current data has acadId and acadName
    useModalStore.getState().updateModalData({
      childName: 'Aarav Sharma',
      childAge: 9,
    });

    const state = useModalStore.getState();
    assert.strictEqual(state.modalData?.acadId, 'acad-delhi-01');
    assert.strictEqual(state.modalData?.acadName, 'Delhi Olympic Badminton');
    assert.strictEqual(state.modalData?.childName, 'Aarav Sharma');
    assert.strictEqual(state.modalData?.childAge, 9);
  });

  it('should completely reset modal state on closeModal()', () => {
    useModalStore.getState().closeModal();

    const state = useModalStore.getState();
    assert.strictEqual(state.isOpen, false);
    assert.strictEqual(state.activeModal, null);
    assert.strictEqual(state.modalData, null);
  });

  it('should correctly support various operational modal types', () => {
    const testTypes: ModalType[] = [
      'batch-booking',
      'academy-details',
      'compare-academies',
      'session-pass',
      'reschedule',
      'payment-security',
      'admin-audit',
      'coach-batch-edit',
      'competition-register',
      'competition-host',
      'attendance-log',
      'locality-selector',
    ];

    testTypes.forEach((type) => {
      useModalStore.getState().openModal(type, { title: `Test for ${type}` });
      const state = useModalStore.getState();
      assert.strictEqual(state.isOpen, true);
      assert.strictEqual(state.activeModal, type);
      assert.strictEqual(state.modalData?.title, `Test for ${type}`);
    });

    useModalStore.getState().closeModal();
  });
});
