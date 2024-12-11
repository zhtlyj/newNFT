'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NFTLogoAnimation from './PageTransition';

export const RouteChangeProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 1500); // 动画持续时间

    return () => clearTimeout(timer);
  }, [pathname]); // 当路由变化时触发

  return (
    <>
      <NFTLogoAnimation isVisible={isTransitioning} />
      {children}
    </>
  );
}; 