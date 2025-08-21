
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  LogOut, 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClubName } from '@/hooks/useClubName';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isLoading: authIsLoading } = useAuth();
  const { clubName: globalClubName, isLoadingClubName } = useClubName();

  // Determine the name to display in the navbar
  let clubNameToDisplay = isLoadingClubName ? 'Cargando...' : globalClubName;
  if (user?.type === 'team_admin' && user.currentTeamName) {
    clubNameToDisplay = user.currentTeamName;
  } else if (user?.type === 'fenix_master') {
    clubNameToDisplay = 'Plataforma GestorFenix';
  }

  // Do not render Navbar if fenix_master is on a gestor-fenix page
  if (user?.type === 'fenix_master' && pathname.startsWith('/gestor-fenix')) {
    return null;
  }

  // Simplified header for password change screen
  if (user?.type === 'team_admin' && user.passwordChangeRequired) {
    return (
       <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-primary">
                
                <span className="font-headline text-lg font-bold">{clubNameToDisplay}</span>
            </div>
            <p className="text-sm text-destructive font-semibold hidden md:block">Por favor, actualiza tu contraseña.</p>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground/90">{clubNameToDisplay}</h1>
        </div>
      </div>
    </header>
  );
}
