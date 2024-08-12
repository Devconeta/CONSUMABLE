import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="absolute w-[100vw] h-auto py-4">
      <div className="flex justify-center items-center gap-14">
        <Link href="/" className="animated-underline">
          Home
        </Link>

        <Link href="/generate" className="animated-underline">
          Generate
        </Link>

        <Link href="/consume" className="animated-underline">
          Consume
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
