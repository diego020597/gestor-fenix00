
'use client';

import { useClubName } from '@/hooks/useClubName';

export default function Footer() {
  const { clubName, isLoadingClubName } = useClubName();

  return (
    <footer className="border-t border-border/40 bg-background/95 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-foreground/60">
        <p>&copy; {new Date().getFullYear()} {isLoadingClubName ? 'Cargando...' : clubName}. Todos los derechos reservados.</p>
        <p>Plataforma de gestión para entrenadores y deportistas de voleibol.</p>
      </div>
    </footer>
  );
}
