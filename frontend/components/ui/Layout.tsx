import React from 'react';

interface PageProps {
  children: React.ReactNode;
}

const Layout: React.FC<PageProps> = ({ children }) => {
  return <div className="w-[100vw] h-[100vh] bg-black">{children}</div>;
};

export default Layout;
