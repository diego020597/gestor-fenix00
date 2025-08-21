
'use client';

// Esta página ya no es necesaria ya que la funcionalidad de mensajes
// para team_admin se ha integrado en el dashboard principal (src/app/page.tsx).
// Se mantiene el archivo para evitar errores de build si hay alguna referencia perdida,
// pero se puede eliminar de forma segura.

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function DeprecatedTeamAdminMessagesPage() {
  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <CardTitle>Página de Mensajes Obsoleta</CardTitle>
          <CardDescription>
            La funcionalidad de mensajes ahora está integrada en tu Panel Principal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Puedes ver tus mensajes directamente en el dashboard.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Ir al Panel Principal
          </Link>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
