'use client';

import { useMemo } from 'react';
import useConsume from '@/common/hooks/useConsume';

import Spinner from '../ui/Spinner';

interface ConsumeProps {
  secret: string | undefined;
}

const Consume = (props: ConsumeProps) => {
  const {
    secret,
    address,
    isConsuming,
    onSend,
    onChangeAddress,
    onChangeSecret,
  } = useConsume(props.secret);

  const isDisabled = useMemo(() => {
    if (!secret || !address || isConsuming) {
      return true;
    } else {
      return false;
    }
  }, [secret, address, isConsuming]);

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col gap-5 h-[100vh] items-center justify-center">
        <div className="flex flex-col gap-2 items-center">
          <label htmlFor="secret-input">Enter your secret</label>
          <input
            id="secret-input"
            value={secret}
            onChange={onChangeSecret}
            placeholder="Would you mind to tell me... your secret?"
            className="text-black text-xs text-center w-[300px] p-2 rounded input-outline"
          />
        </div>

        <div className="flex flex-col gap-2 items-center">
          <label htmlFor="address-input">Enter your address</label>
          <input
            id="address-input"
            value={address}
            onChange={onChangeAddress}
            placeholder="Free money! Tell me your address"
            className="text-black text-xs text-center w-[300px] p-2 rounded input-outline"
          />
        </div>

        <button
          className="min-w-[150px] py-2 rounded text-center text-sm text-black bg-whitesmoke translate-up disabled-button"
          disabled={isDisabled}
          onClick={onSend}>
          {isConsuming ? <Spinner size="sm" /> : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Consume;
