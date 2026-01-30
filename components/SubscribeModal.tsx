'use client';

import { useState } from 'react';

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
  const { user, isLoading, subscription, canPlay, role, refetchUserData } = useUser();

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

  let content = <div className="text-center">No products avaliable</div>;

  if (products.length) {
    content = (
      <div>
        {products.map((product) => {
          if (!product.prices?.length) {
            return <div key={product.id}>No prices avaliable</div>;
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
          <p className="text-xs text-muted-foreground mb-2">Have a beta code?</p>
          <form onSubmit={handleBetaVerify} className="flex gap-2">
            <div className="flex-1 grid gap-1">
              <Label htmlFor="beta-pin" className="sr-only">
                Beta code
              </Label>
              <Input
                id="beta-pin"
                type="text"
                placeholder="Enter code"
                value={betaPin}
                onChange={(e) => setBetaPin(e.target.value)}
                disabled={betaLoading}
                className="h-9"
              />
            </div>
            <Button type="submit" disabled={betaLoading || !betaPin.trim()} className="h-9">
              {betaLoading ? 'Checking...' : 'Apply'}
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default SubscribeModal;
