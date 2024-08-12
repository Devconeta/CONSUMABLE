import Consume from '@/components/sections/Consume';
import { cookies } from 'next/headers';

const RootConsume = () => {
  const secret = cookies().get('secret')?.value;

  return <Consume secret={secret} />;
};

export default RootConsume;
