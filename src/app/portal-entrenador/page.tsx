
// This page is no longer used as its functionality has been moved to /src/app/page.tsx (Admin Dashboard).
// This file can be safely deleted from the project.
// To prevent build errors if it's still imported somewhere unexpectedly,
// we'll provide a minimal component.

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function DeprecatedCoachPortalPage() {
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>Página Obsoleta</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Esta página ha sido reemplazada por el Panel Principal del Administrador.</p>
          <Link href="/" className="text-primary hover:underline mt-4 block">
            Ir al Panel Principal
          </Link>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
