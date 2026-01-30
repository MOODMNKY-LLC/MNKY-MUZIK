import Image from 'next/image';
import { Header } from '@/components/Header';

import { AccountContent } from './components/AccountContent';

const Account = () => {
  return (
    <div className="rounded-lg w-full bg-neutral-900">
      <Header className="from-bg-neutral-900">
        <div className="mb-2 flex flex-col gap-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-y-4 gap-x-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-500/50">
              <Image
                src="/images/mnky-muzik-avatar.png"
                alt="MNKY"
                fill
                className="object-cover object-center"
                sizes="112px"
              />
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h1 className="text-white text-3xl font-semibold">Account Settings</h1>
              <p className="text-neutral-400 text-sm mt-1">Your MNKY profile</p>
            </div>
          </div>
        </div>
      </Header>
      <AccountContent />
    </div>
  );
};

export default Account;
