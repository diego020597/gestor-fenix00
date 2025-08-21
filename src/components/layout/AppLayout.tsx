
'use client';

import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Settings, 
  LogOut, 
  Palette, 
  UserCog, 
  Shield, 
  Home, 
  Users, 
  CalendarDays, 
  ClipboardList, 
  Users2, 
  BarChart3, 
  Wand2,
  Package, 
  MessagesSquare, 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, type User } from '@/contexts/AuthContext';
import { useClubName } from '@/hooks/useClubName';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavLinkItem {
  href: string;
  label: string;
  icon?: React.ElementType;
  roles: Array<User['type']>; 
}

const allNavLinks: NavLinkItem[] = [
  { href: '/', label: 'Panel Principal', icon: Home, roles: ['admin', 'coach', 'team_admin'] },
  { href: '/atletas', label: 'Atletas', icon: Users, roles: ['admin', 'coach', 'team_admin'] },
  { href: '/entrenadores', label: 'Entrenadores', icon: Users2, roles: ['admin', 'team_admin'] },
  { href: '/planes-entrenamiento', label: 'Entrenamiento', icon: ClipboardList, roles: ['admin', 'coach', 'team_admin'] },
  { href: '/calendario-partidos', label: 'Calendario', icon: CalendarDays, roles: ['admin', 'coach', 'team_admin'] },
  { href: '/pruebas-fisicas', label: 'Pruebas Físicas', icon: BarChart3, roles: ['admin', 'coach', 'team_admin'] },
  { href: '/inventario', label: 'Inventario', icon: Package, roles: ['admin', 'team_admin'] },
  { href: '/chat-entrenadores', label: 'Chat Entrenadores', icon: MessagesSquare, roles: ['admin', 'coach', 'team_admin'] },
  { href: '/recomendaciones-ia', label: 'Recomendaciones IA', icon: Wand2, roles: ['admin'] },
  { href: '/pagos', label: 'Pagos', icon: DollarSign, roles: ['admin', 'team_admin'] },
  { href: '/suscripciones', label: 'Suscripciones', icon: Shield, roles: ['admin'] },
];

const configSubLinks: NavLinkItem[] = [
  { href: '/configuracion/perfil', label: 'Mi Perfil', icon: UserCog, roles: ['admin', 'coach', 'team_admin'] },
  { href: '/configuracion/tema', label: 'Tema Visual', icon: Palette, roles: ['admin', 'coach', 'team_admin'] },
];


export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, logout, isLoading: authIsLoading } = useAuth();
  
  const getVisibleLinks = (linksArray: ReadonlyArray<NavLinkItem>) => {
    if (authIsLoading || !user) return [];
    if (user.type === 'team_admin' && user.passwordChangeRequired) return [];
    if (user.type === 'fenix_master' && pathname.startsWith('/gestor-fenix')) {
        return [];
    }
    return linksArray.filter(link => link.roles.includes(user.type));
  };
  
  const visibleNavLinks = getVisibleLinks(allNavLinks);
  const visibleConfigLinks = getVisibleLinks(configSubLinks);

  if (authIsLoading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }
  
  if (!user || pathname === '/login' || user.type === 'fenix_master') {
    return <>{children}</>;
  }
  
  const userNeedsToChangePassword = user?.type === 'team_admin' && user.passwordChangeRequired;

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
            
            <span className="font-headline text-lg font-bold group-data-[collapsible=icon]:hidden">
              Plataforma Fenix
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {!userNeedsToChangePassword && visibleNavLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                 <SidebarMenuButton 
                    asChild 
                    isActive={pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))} 
                    tooltip={link.label}>
                    <Link href={link.href}>
                      <link.icon />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           {!userNeedsToChangePassword && visibleConfigLinks.length > 0 && (
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    'w-full justify-start',
                    (pathname.startsWith('/configuracion')) && 'bg-primary/10 text-primary'
                  )}
                >
                  <Settings className="shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">Configuración</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                {visibleConfigLinks.map(link => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="flex items-center gap-2 cursor-pointer w-full">
                     {link.icon && <link.icon className="h-4 w-4" />}
                     {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
           )}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                  <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={user.avatar || undefined} alt={user.name} />
                      <AvatarFallback>{user.name ? user.name.substring(0,2).toUpperCase() : 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="group-data-[collapsible=icon]:hidden truncate">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-56">
              <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4"/>
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
           </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Navbar />
        <main className="flex-grow p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
