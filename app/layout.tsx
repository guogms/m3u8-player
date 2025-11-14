import './globals.css';

import { Inter } from 'next/font/google';
import type React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'M3U8 Music Hub',
  description: 'Next.js 驱动的多平台音乐解析与 M3U8 播放工具集',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

