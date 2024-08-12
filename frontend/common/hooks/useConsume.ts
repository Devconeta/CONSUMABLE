import { ChangeEvent, useState } from 'react';
import { toast as toastFn } from 'react-hot-toast';

import { toast } from '@/common/helpers/toast';
import { deleteCookies } from '@/app/actions';

import { Consumable } from 'consumable-sdk';
import useTransaction from './useTransaction';

const useConsume = (paramSecret: string | undefined) => {
  const [secret, setSecret] = useState<string>(paramSecret ? paramSecret : '');
  const [address, setAddress] = useState<string>('');
  const [isConsuming, setIsConsuming] = useState<boolean>(false);

  const { sendTransaction, transactionHash } = useTransaction();

  const onSend = async () => {
    if (!secret || !address) return;

    setIsConsuming(true);
    const toastId = toastFn.loading('Consuming your secret...');

    try {
      const consumable = new Consumable(secret);

      const {
        contractAddress,
        chainId,
        methodName,
        methodArgs,
        merkleProof,
        privateKey,
      } = consumable.consume();

      const receipt = await sendTransaction({
        chainId: +chainId,
        contractAddress,
        receiverAddress: address,
        privateKey,
        methodName,
        merkleProof,
      });

      toast({
        toastId: toastId,
        message: 'Secret succesfully consumed!',
        success: true,
      });
    } catch (error: any) {
      console.log(error);

      const errorMessage =
        error?.message || 'Something went wrong while consuming your secret';

      toast({ toastId: toastId, message: errorMessage, success: false });
    } finally {
      setSecret('');
      setAddress('');
      setIsConsuming(false);

      deleteCookies();
    }
  };

  const onChangeSecret = (event: ChangeEvent<HTMLInputElement> | undefined) => {
    if (!event) return;

    const value = event.target.value;
    setSecret(value);
  };

  const onChangeAddress = (
    event: ChangeEvent<HTMLInputElement> | undefined
  ) => {
    if (!event) return;

    const value = event.target.value;
    setAddress(value);
  };

  return {
    secret,
    setSecret,
    address,
    setAddress,
    isConsuming,
    setIsConsuming,
    onSend,
    onChangeSecret,
    onChangeAddress,
  };
};

export default useConsume;
