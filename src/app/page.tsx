
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Users2, Inbox, Eye, Briefcase, ClipboardList, Home } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Message } from '@/types/messages';
import { GESTOR_FENIX_MESSAGES_STORAGE_KEY } from '@/types/messages';
import type { AthleteStorageItem } from '../registro/atleta/page';
import type { CoachStorageItem } from '../registro/entrenador/page';
import type { TeamStorageItem } from '../gestor-fenix/page';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const ATHLETES_STORAGE_KEY = 'athletes';
const COACHES_STORAGE_KEY = 'coaches';
const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';


function AdminDashboard() {
  const [globalAthleteCount, setGlobalAthleteCount] = useState(0);
  const [globalCoachCount, setGlobalCoachCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    // Cargar Atletas Globales
    try {
      const storedAthletes = localStorage.getItem(ATHLETES_STORAGE_KEY);
      if (storedAthletes) {
        const allAthletes: AthleteStorageItem[] = JSON.parse(storedAthletes);
        setGlobalAthleteCount(allAthletes.filter(a => !a.teamId).length);
      }
    } catch (e) { console.error("Error loading global athletes", e); }

    // Cargar Entrenadores Globales
    try {
      const storedCoaches = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoaches) {
        const allCoaches: CoachStorageItem[] = JSON.parse(storedCoaches);
        setGlobalCoachCount(allCoaches.filter(c => !c.teamId).length);
      }
    } catch (e) { console.error("Error loading global coaches", e); }

    // Cargar Equipos
    try {
      const storedTeams = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
      if (storedTeams) {
        const allTeams: TeamStorageItem[] = JSON.parse(storedTeams);
        setTeamCount(allTeams.length);
      }
    } catch (e) { console.error("Error loading teams", e); }
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">Panel de Administrador Global</h1>
          <p className="text-muted-foreground">Bienvenido, {user?.name}. Resumen general de la plataforma.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Equipos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamCount}</div>
              <p className="text-xs text-muted-foreground">Equipos registrados en el sistema.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atletas Globales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalAthleteCount}</div>
              <p className="text-xs text-muted-foreground">Atletas no asignados a un equipo.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrenadores Globales</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalCoachCount}</div>
              <p className="text-xs text-muted-foreground">Entrenadores no asignados a un equipo.</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Navega a las secciones principales de gestión.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" asChild><Link href="/atletas">Gestionar Atletas</Link></Button>
            <Button variant="outline" asChild><Link href="/entrenadores">Gestionar Entrenadores</Link></Button>
            <Button variant="outline" asChild><Link href="/planes-entrenamiento">Planes de Entrenamiento</Link></Button>
            <Button variant="outline" asChild><Link href="/pagos">Ver Pagos</Link></Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function CoachDashboard() {
  const { user } = useAuth();
  const [assignedAthleteCount, setAssignedAthleteCount] = useState(0);

  useEffect(() => {
    if (user?.type === 'coach' && user.assignedCategories && user.assignedCategories.length > 0) {
      try {
        const storedAthletes = localStorage.getItem(ATHLETES_STORAGE_KEY);
        if (storedAthletes) {
          const allAthletes: AthleteStorageItem[] = JSON.parse(storedAthletes);
          const count = allAthletes.filter(a => !a.teamId && user.assignedCategories!.includes(a.category)).length;
          setAssignedAthleteCount(count);
        }
      } catch (e) { console.error("Error loading assigned athletes for coach", e); }
    }
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">Panel de Entrenador</h1>
          <p className="text-muted-foreground">Bienvenido, {user?.name}. Aquí tienes tu resumen y accesos directos.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atletas a tu Cargo</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedAthleteCount}</div>
              <p className="text-xs text-muted-foreground">Atletas en tus categorías asignadas.</p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Categorías Asignadas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {user?.assignedCategories && user.assignedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                      {user.assignedCategories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                  </div>
              ) : (
                  <p className="text-sm text-muted-foreground pt-2">No tienes categorías asignadas.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function TeamAdminDashboard() {
  const { user } = useAuth();
  
  const [athleteCount, setAthleteCount] = useState(0);
  const [coachCount, setCoachCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (user?.type !== 'team_admin' || !user.teamId) {
      return;
    }

    const teamId = user.teamId;

    try {
      const storedAthletes = localStorage.getItem(ATHLETES_STORAGE_KEY);
      if (storedAthletes) {
        const allAthletes: AthleteStorageItem[] = JSON.parse(storedAthletes);
        setAthleteCount(allAthletes.filter(a => a.teamId === teamId).length);
      }
    } catch (e) { console.error("Error loading athletes", e); }

    try {
      const storedCoaches = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoaches) {
        const allCoaches: CoachStorageItem[] = JSON.parse(storedCoaches);
        setCoachCount(allCoaches.filter(c => c.teamId === teamId).length);
      }
    } catch (e) { console.error("Error loading coaches", e); }
    
    try {
      const storedMessages = localStorage.getItem(GESTOR_FENIX_MESSAGES_STORAGE_KEY);
      if (storedMessages) {
        const allMessages: Message[] = JSON.parse(storedMessages);
        const teamMessages = allMessages.filter(msg => 
          msg.recipients.some(r => r.teamId === teamId)
        ).sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        setMessages(teamMessages);
      }
    } catch (e) { console.error("Error loading messages", e); }

  }, [user]);

  const unreadMessagesCount = useMemo(() => {
    if (!user?.teamId) return 0;
    return messages.filter(msg => {
      const recipientInfo = msg.recipients.find(r => r.teamId === user.teamId);
      return recipientInfo && !recipientInfo.readAt;
    }).length;
  }, [messages, user?.teamId]);


  const markMessageAsRead = (messageId: string) => {
    if (!user?.teamId) return;
    const teamId = user.teamId;

    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        const recipientIndex = msg.recipients.findIndex(r => r.teamId === teamId);
        if (recipientIndex !== -1 && !msg.recipients[recipientIndex].readAt) {
          const newRecipients = [...msg.recipients];
          newRecipients[recipientIndex] = {
            ...newRecipients[recipientIndex],
            readAt: new Date().toISOString()
          };
          return { ...msg, recipients: newRecipients };
        }
      }
      return msg;
    });

    setMessages(updatedMessages);

    try {
        const allStoredMessages: Message[] = JSON.parse(localStorage.getItem(GESTOR_FENIX_MESSAGES_STORAGE_KEY) || '[]');
        const messageToUpdateIndex = allStoredMessages.findIndex(m => m.id === messageId);
        if (messageToUpdateIndex !== -1) {
            const recipientIndex = allStoredMessages[messageToUpdateIndex].recipients.findIndex(r => r.teamId === teamId);
            if (recipientIndex !== -1) {
                allStoredMessages[messageToUpdateIndex].recipients[recipientIndex].readAt = new Date().toISOString();
                localStorage.setItem(GESTOR_FENIX_MESSAGES_STORAGE_KEY, JSON.stringify(allStoredMessages));
            }
        }
    } catch (e) { console.error("Error saving read status", e); }
  };
  
  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    markMessageAsRead(message.id);
  };

  const isMessageUnread = (message: Message): boolean => {
    if (!user?.teamId) return false;
    const recipientInfo = message.recipients.find(r => r.teamId === user.teamId);
    return !!recipientInfo && !recipientInfo.readAt;
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
            <h1 className="font-headline text-3xl font-bold text-primary">Panel de Administrador de Equipo</h1>
            <p className="text-muted-foreground">Bienvenido de nuevo, {user.name}. Aquí tienes un resumen de tu equipo.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atletas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{athleteCount}</div>
              <p className="text-xs text-muted-foreground">Atletas registrados en tu equipo.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Entrenadores</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coachCount}</div>
              <p className="text-xs text-muted-foreground">Entrenadores asignados a tu equipo.</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes No Leídos</CardTitle>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadMessagesCount}</div>
              <p className="text-xs text-muted-foreground">De parte del superadministrador.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Buzón de Comunicados</CardTitle>
                <CardDescription>Mensajes importantes enviados por el GestorFenix.</CardDescription>
            </CardHeader>
            <CardContent>
                {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No tienes mensajes.</p>
                ) : (
                    <ul className="space-y-3">
                        {messages.slice(0, 5).map(msg => (
                            <li key={msg.id} className={`flex flex-col sm:flex-row justify-between items-start p-3 border rounded-lg transition-colors ${isMessageUnread(msg) ? 'bg-primary/5 border-primary/20' : 'bg-background hover:bg-muted/50'}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        {isMessageUnread(msg) && <Badge className="bg-primary hover:bg-primary">Nuevo</Badge>}
                                        <h3 className="font-semibold text-foreground">{msg.title}</h3>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Enviado {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleViewMessage(msg)} className="mt-2 sm:mt-0">
                                    <Eye className="mr-2 h-4 w-4"/> Ver Mensaje
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
                 {messages.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground mt-4">Mostrando los 5 mensajes más recientes.</p>
                 )}
            </CardContent>
        </Card>
      </div>
      
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{selectedMessage.title}</DialogTitle>
                    <DialogDescription>
                        Enviado: {formatDistanceToNow(new Date(selectedMessage.sentAt), { addSuffix: true, locale: es })}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 whitespace-pre-wrap text-sm text-foreground">
                    {selectedMessage.content}
                </div>
                <DialogFooter>
                    <Button onClick={() => setSelectedMessage(null)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </AppLayout>
  );
}


export default function DashboardRouter() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user?.type === 'team_admin' && user.passwordChangeRequired) {
            router.push('/configuracion/perfil');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-full">
                    <p>Cargando...</p>
                </div>
            </AppLayout>
        );
    }
    
    if (user?.type === 'team_admin') {
        if (user.passwordChangeRequired) {
             return <AppLayout><p>Redirigiendo a cambiar contraseña...</p></AppLayout>;
        }
        return <TeamAdminDashboard />;
    }
    
    if (user?.type === 'admin') {
        return <AdminDashboard />;
    }
    
    if (user?.type === 'coach') {
        return <CoachDashboard />;
    }

    // This case might be hit if the user is fenix_master before another redirect,
    // or if the user is somehow null after loading and didn't get redirected to login.
    return (
        <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle>Bienvenido</CardTitle>
                    <CardDescription>Panel principal de la Plataforma Fenix.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Redirigiendo a tu panel...</p>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
