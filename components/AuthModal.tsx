'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LoginForm } from './login-form';
import { Modal } from './Modal';
import { useAuthModal } from '@/hooks/useAuthModal';
import { useUser } from '@/hooks/useUser';

export const AuthModal = () => {
  const router = useRouter();
  const { user } = useUser();
  const { onClose, isOpen } = useAuthModal();

  useEffect(() => {
    if (user) {
      router.refresh();
      onClose();
    }
  }, [user, router, onClose]);

  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSuccess = () => {
    router.refresh();
    onClose();
  };

  return (
    <Modal
      title="Welcome back"
      description="Login into your account"
      isOpen={isOpen}
      onChange={onChange}
    >
      <LoginForm onSuccess={handleSuccess} />
    </Modal>
  );
};
