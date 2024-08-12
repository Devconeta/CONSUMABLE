import { toast as toastFn } from 'react-hot-toast';

interface ToastProps {
  toastId: string;
  message: string;
  success: boolean;
}

export const toast = ({ toastId, message, success }: ToastProps) => {
  const toastConfig = {
    id: toastId,
    duration: 3000,
  };

  if (success) {
    toastFn.success(message, toastConfig);
  } else {
    toastFn.error(message, toastConfig);
  }
};
