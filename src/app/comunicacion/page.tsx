
'use client';
// This page is deprecated and functionality has moved to /chat-entrenadores
// It can be safely deleted.
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CommunicationPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold text-primary">Herramientas de Comunicación</h1>
         <Card>
            <CardHeader>
              <CardTitle>Página Desactualizada</CardTitle>
              <CardDescription>
                La funcionalidad de comunicación con entrenadores ha sido movida a una nueva página.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/chat-entrenadores">Ir al Chat de Entrenadores</Link>
              </Button>
            </CardContent>
          </Card>
      </div>
    </AppLayout>
  );
}
