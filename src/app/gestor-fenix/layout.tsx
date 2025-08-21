
import GestorFenixLayout from '@/components/layout/GestorFenixLayout';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <GestorFenixLayout>{children}</GestorFenixLayout>;
}
    