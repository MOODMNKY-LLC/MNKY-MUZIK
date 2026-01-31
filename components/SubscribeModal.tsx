'use client';

import { useState, useRef, useCallback } from 'react';

import { toast } from 'react-hot-toast';

import { postData } from '@/libs/helpers';
import { getStripe } from '@/libs/stripeClient';

import { useUser } from '@/hooks/useUser';

import { Price, ProductWithPrice } from '@/types';

import { Modal } from './Modal';
import { Button } from './Button';
import { useSubscribeModal } from '@/hooks/useSubscribeModal';
import { Input } from './ui/input';
import { Label } from './ui/label';

const BETA_PIN_LENGTH = 5;

interface subscribeModalProps {
  products: ProductWithPrice[];
}

const formatPrice = (price: Price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency,
    minimumFractionDigits: 0,
  }).format((price?.unit_amount || 0) / 100);
};

const SubscribeModal: React.FC<subscribeModalProps> = ({ products }) => {
  const subscribeModal = useSubscribeModal();
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const [betaPin, setBetaPin] = useState('');
  const [betaLoading, setBetaLoading] = useState(false);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user, isLoading, subscription, canPlay, role, refetchUserData } = useUser();

  const setPinDigit = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setBetaPin((prev) => {
      const next = prev.slice(0, index) + digit + prev.slice(index + 1);
      return next.slice(0, BETA_PIN_LENGTH);
    });
    if (digit && index < BETA_PIN_LENGTH - 1) {
      pinInputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handlePinKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !betaPin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < BETA_PIN_LENGTH - 1) {
      pinInputRefs.current[index + 1]?.focus();
    }
  }, [betaPin]);

  const handlePinPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, BETA_PIN_LENGTH);
    if (pasted) {
      setBetaPin(pasted);
      const nextIndex = Math.min(pasted.length, BETA_PIN_LENGTH - 1);
      pinInputRefs.current[nextIndex]?.focus();
    }
  }, []);

  const onChange = (open: boolean) => {
    if (!open) {
      subscribeModal.onClose();
    }
  };

  const handleCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return toast.error('Must be logged in to subscribe');
    }

    if (subscription) {
      setPriceIdLoading(undefined);
      return toast('You are already subscribed');
    }

    try {
      const { sessionId } = await postData({
        url: '/api/create-checkout-session',
        data: { price },
      });

      const stripe = await getStripe();

      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      toast.error((error as Error)?.message);
    } finally {
      setPriceIdLoading(undefined);
    }
  };

  const handleBetaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!betaPin.trim() || betaLoading) return;
    setBetaLoading(true);
    try {
      const res = await fetch('/api/beta/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: betaPin.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? 'Invalid code');
        return;
      }
      toast.success('Beta access granted');
      await refetchUserData();
      subscribeModal.onClose();
      setBetaPin('');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBetaLoading(false);
    }
  };

  let content = <div className="text-center">No products available</div>;

  if (products.length) {
    content = (
      <div>
        {products.map((product) => {
          if (!product.prices?.length) {
            return <div key={product.id}>No prices available</div>;
          }

          return product.prices.map((price) => (
            <Button
              onClick={() => handleCheckout(price)}
              disabled={isLoading || price.id === priceIdLoading}
              className="mb-4"
              key={price.id}
            >{`Subscribe for ${formatPrice(price)} a ${price.interval}`}</Button>
          ));
        })}
      </div>
    );
  }

  if (subscription) {
    content = <div className="text-center">Already subscribed!</div>;
  }

  if (canPlay && !subscription) {
    content = (
      <div className="text-center text-sm text-muted-foreground">
        {role === 'admin' && 'You have full access as an admin.'}
        {role === 'beta' && 'You have beta access.'}
      </div>
    );
  }

  return (
    <Modal
      title="Only for premium users"
      description="Subscribe to play music, or enter a beta code"
      isOpen={subscribeModal.isOpen}
      onChange={onChange}
    >
      <div className="space-y-4">
        {content}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">Have a beta code? Ask your admin for one.</p>
          <form onSubmit={handleBetaVerify} className="flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2">
              <Label htmlFor="beta-pin-0" className="sr-only">
                Beta code (5 digits)
              </Label>
              {Array.from({ length: BETA_PIN_LENGTH }, (_, i) => (
                <Input
                  key={i}
                  id={i === 0 ? 'beta-pin-0' : undefined}
                  ref={(el) => { pinInputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  placeholder="•"
                  value={betaPin[i] ?? ''}
                  onChange={(e) => setPinDigit(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  onPaste={i === 0 ? handlePinPaste : undefined}
                  disabled={betaLoading}
                  className="h-11 w-11 text-center text-lg font-semibold tabular-nums"
                  aria-label={`Digit ${i + 1} of 5`}
                />
              ))}
            </div>
            <Button
              type="submit"
              disabled={betaLoading || betaPin.length !== BETA_PIN_LENGTH}
              className="h-9 w-full"
            >
              {betaLoading ? 'Checking...' : 'Apply'}
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default SubscribeModal;
