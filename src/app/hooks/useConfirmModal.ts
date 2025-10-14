import { useState } from 'react';

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'danger' | 'warning' | 'info';
  icon: string;
  onConfirm: () => void;
}

export const useConfirmModal = () => {
  const [modalState, setModalState] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Onayla',
    cancelText: 'İptal',
    type: 'danger',
    icon: '⚠️',
    onConfirm: () => {}
  });

  const showConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
      icon?: string;
    }
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      confirmText: options?.confirmText || 'Onayla',
      cancelText: options?.cancelText || 'İptal',
      type: options?.type || 'danger',
      icon: options?.icon || '⚠️',
      onConfirm
    });
  };

  const hideConfirmModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    modalState.onConfirm();
    hideConfirmModal();
  };

  return {
    modalState,
    showConfirmModal,
    hideConfirmModal,
    handleConfirm
  };
}; 