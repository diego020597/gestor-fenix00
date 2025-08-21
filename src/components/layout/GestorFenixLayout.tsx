
'use client';

import type { ReactNode } from 'react';
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
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Briefcase, Inbox, LogOut, UserCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface GestorFenixLayoutProps {
  children: ReactNode;
}

const gestorFenixNavLinks = [
  { href: '/gestor-fenix', label: 'Equipos', icon: Briefcase },
  { href: '/gestor-fenix/mensajes', label: 'Comunicados', icon: Inbox },
  { href: '/gestor-fenix/pagos', label: 'Pagos Globales', icon: DollarSign },
];

export default function GestorFenixLayout({ children }: GestorFenixLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // HSL values for the dark green theme for GestorFenix sidebar
  const gestorFenixSidebarThemeStyle = {
    '--sidebar-background': '220 13% 12%', 
    '--sidebar-foreground': '220 10% 89%', 
    '--sidebar-border': '215 14% 25%',     
    '--sidebar-primary': '142 71% 45%', 
    '--sidebar-primary-foreground': '0 0% 100%', 
    '--sidebar-accent': '142 76% 36%', 
    '--sidebar-accent-foreground': '0 0% 100%', 
    '--sidebar-ring': '142 71% 45%', 
  } as React.CSSProperties;

  return (
    <div 
      className="flex min-h-screen bg-gray-900 text-gray-200"
      style={gestorFenixSidebarThemeStyle} 
    >
      <SidebarProvider defaultOpen={true}>
        <Sidebar 
          collapsible="icon" 
          className="border-r border-gray-700" 
        >
          <SidebarHeader className="p-4">
            <Link href="/gestor-fenix" className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors">
              
              <span className="font-headline text-xl font-bold text-gray-100 group-data-[collapsible=icon]:hidden">
                GestorFenix
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {gestorFenixNavLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === link.href || (link.href !== '/gestor-fenix' && pathname.startsWith(link.href))}
                    tooltip={link.label}
                    className={cn(
                      "text-gray-300 hover:bg-green-700/20 hover:text-green-300", 
                      (pathname === link.href || (link.href !== '/gestor-fenix' && pathname.startsWith(link.href))) && 
                      "bg-green-600/20 text-green-200 hover:bg-green-600/30 hover:text-green-100" 
                    )}
                  >
                    <Link href={link.href}>
                      <link.icon />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-3 border-t border-gray-700">
            {user && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded-md bg-gray-700/60 text-sm">
                <UserCircle className="h-5 w-5 text-gray-400" />
                <span className="text-gray-300 group-data-[collapsible=icon]:hidden">{user.name}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start text-gray-300 hover:bg-red-700/30 hover:text-red-200 group-data-[collapsible=icon]:justify-center">
              <LogOut className="h-5 w-5 group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:ml-0 mr-2" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
            </Button>
          </SidebarFooter>
          <SidebarRail className="after:bg-gray-700 hover:after:bg-green-500"/>
        </Sidebar>

        <SidebarInset className="bg-gray-900">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-gray-700 bg-gray-900/95 px-4 backdrop-blur md:hidden">
            <SidebarTrigger className="text-gray-300 hover:text-green-400" />
             <Link href="/gestor-fenix" className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors">
                
                <span className="font-headline text-lg font-bold text-gray-100">
                  GestorFenix
                </span>
              </Link>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-gray-700 bg-gray-900/95 py-6">
            <div className="container mx-auto px-4 text-center text-xs text-gray-400">
              <p>&copy; {new Date().getFullYear()} GestorFenix. Plataforma de Superadministración.</p>
            </div>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
