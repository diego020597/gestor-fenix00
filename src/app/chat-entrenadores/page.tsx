
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Send, Inbox, Users, Mail, Users2, ChevronRight } from 'lucide-react';
import type { CoachStorageItem } from '../registro/entrenador/page';
import { type ClubMessage, CLUB_MESSAGES_STORAGE_KEY } from '@/types/messages';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const COACHES_STORAGE_KEY = 'coaches';

export default function CoachChatPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [coaches, setCoaches] = useState<CoachStorageItem[]>([]);
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // For Admins sending messages
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  // For viewing a specific message
  const [selectedMessage, setSelectedMessage] = useState<ClubMessage | null>(null);

  const isAdmin = user?.type === 'admin' || user?.type === 'team_admin';

  useEffect(() => {
    if (authIsLoading) {
      return; // Espera a que la autenticación termine
    }
    if (!user) {
      router.push('/login');
      return;
    }
    
    setIsLoadingData(true);
    try {
      // Load coaches relevant to the user
      const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoachesString) {
        const allCoaches: CoachStorageItem[] = JSON.parse(storedCoachesString);
        if (user.type === 'team_admin' && user.teamId) {
          setCoaches(allCoaches.filter(c => c.teamId === user.teamId));
        } else if (user.type === 'admin') {
          setCoaches(allCoaches.filter(c => !c.teamId));
        }
      }
      
      // Load messages relevant to the user
      const storedMessagesString = localStorage.getItem(CLUB_MESSAGES_STORAGE_KEY);
      if (storedMessagesString) {
          const allMessages: ClubMessage[] = JSON.parse(storedMessagesString);
          let userMessages: ClubMessage[] = [];
          if(user.type === 'team_admin' && user.teamId){
              // Team admin sees messages sent in their team
              userMessages = allMessages.filter(m => m.teamId === user.teamId);
          } else if (user.type === 'admin') {
              // Global admin sees messages they sent (no teamId)
               userMessages = allMessages.filter(m => !m.teamId && m.sender.id === user.id);
          } else if (user.type === 'coach' && user.id) {
              // Coach sees messages sent to them
              userMessages = allMessages.filter(m => m.recipientIds.includes(user.id!));
          }
         setMessages(userMessages.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
      }

    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    }
    setIsLoadingData(false);
    
  }, [user, authIsLoading, router, toast]);

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin || !user) return;
    
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast({ title: "Campos incompletos", description: "El título y el contenido son obligatorios.", variant: "destructive" });
      return;
    }

    const recipients = sendToAll ? coaches.map(c => c.id) : selectedCoachIds;
    if (recipients.length === 0) {
      toast({ title: "Sin destinatarios", description: "Debes seleccionar al menos un entrenador o enviar a todos.", variant: "destructive" });
      return;
    }
    
    const recipientDetails = coaches.filter(c => recipients.includes(c.id)).map(c => ({
        id: c.id,
        name: c.name,
        readAt: null
    }));

    const newMessage: ClubMessage = {
      id: crypto.randomUUID(),
      teamId: user.type === 'team_admin' ? user.teamId : undefined,
      title: messageTitle.trim(),
      content: messageContent.trim(),
      sender: { id: user.id || 'admin_id', name: user.name },
      sentAt: new Date().toISOString(),
      recipientIds: recipients,
      recipients: recipientDetails,
      isToAllCoaches: sendToAll,
    };

    const updatedMessages = [newMessage, ...messages];
    localStorage.setItem(CLUB_MESSAGES_STORAGE_KEY, JSON.stringify([newMessage, ...JSON.parse(localStorage.getItem(CLUB_MESSAGES_STORAGE_KEY) || '[]')]));
    
    setMessages(updatedMessages.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
    
    toast({ title: "Mensaje Enviado", description: `El mensaje ha sido enviado a ${sendToAll ? 'todos los entrenadores' : `${recipients.length} entrenador(es)`}.` });

    setMessageTitle('');
    setMessageContent('');
    setSelectedCoachIds([]);
    setSendToAll(true);
  };
  
  const handleSelectCoach = (coachId: string, isChecked: boolean) => {
    setSelectedCoachIds(prev => isChecked ? [...prev, coachId] : prev.filter(id => id !== coachId));
  }
  
  const handleViewMessage = (message: ClubMessage) => {
    setSelectedMessage(message);
    if(user?.type === 'coach' && user.id) {
        const fullMessages: ClubMessage[] = JSON.parse(localStorage.getItem(CLUB_MESSAGES_STORAGE_KEY) || '[]');
        const updatedMessages = fullMessages.map(msg => {
            if(msg.id === message.id) {
                const recipient = msg.recipients.find(r => r.id === user.id);
                if(recipient && !recipient.readAt) {
                    recipient.readAt = new Date().toISOString();
                }
            }
            return msg;
        });
        localStorage.setItem(CLUB_MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
        // Also update local state to remove unread badge
        setMessages(prev => prev.map(m => m.id === message.id ? {...m, recipients: m.recipients.map(r => r.id === user.id ? {...r, readAt: new Date().toISOString()}: r)} : m));
    }
  };
  
  const isMessageUnreadForCoach = (message: ClubMessage) => {
      if(user?.type !== 'coach' || !user.id) return false;
      const recipientInfo = message.recipients.find(r => r.id === user.id);
      return recipientInfo && !recipientInfo.readAt;
  };
  

  if (authIsLoading || isLoadingData) {
    return <AppLayout><p>Cargando chat...</p></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {isAdmin && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary"/> Enviar Mensaje a Entrenadores</CardTitle>
                <CardDescription>Redacta y envía comunicados a tu cuerpo técnico.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSendMessage}>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="messageTitle">Título</Label>
                    <Input id="messageTitle" value={messageTitle} onChange={e => setMessageTitle(e.target.value)} required />
                  </div>
                   <div>
                    <Label htmlFor="messageContent">Contenido</Label>
                    <Textarea id="messageContent" value={messageContent} onChange={e => setMessageContent(e.target.value)} required rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Destinatarios</Label>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="sendToAll" checked={sendToAll} onCheckedChange={(checked) => setSendToAll(!!checked)} />
                        <Label htmlFor="sendToAll" className="font-normal">Enviar a todos los entrenadores ({coaches.length})</Label>
                    </div>
                     {!sendToAll && (
                        <ScrollArea className="h-40 rounded-md border p-2">
                          <p className="text-sm text-muted-foreground mb-2">Selecciona entrenadores:</p>
                          {coaches.map(coach => (
                            <div key={coach.id} className="flex items-center space-x-2 p-1">
                              <Checkbox
                                id={`coach-${coach.id}`}
                                checked={selectedCoachIds.includes(coach.id)}
                                onCheckedChange={(checked) => handleSelectCoach(coach.id, !!checked)}
                              />
                              <Label htmlFor={`coach-${coach.id}`} className="font-normal text-sm">{coach.name}</Label>
                            </div>
                          ))}
                        </ScrollArea>
                      )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Enviar Mensaje</Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

        <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Inbox className="h-5 w-5 text-primary"/> {isAdmin ? 'Historial de Enviados' : 'Buzón de Entrada'}</CardTitle>
              <CardDescription>
                {isAdmin ? 'Mensajes que has enviado a los entrenadores.' : 'Comunicados recibidos de la administración.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No hay mensajes.</p>
              ) : (
                <ul className="space-y-3">
                  {messages.map(msg => (
                    <li 
                      key={msg.id} 
                      className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleViewMessage(msg)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                               {isMessageUnreadForCoach(msg) && <Badge>Nuevo</Badge>}
                               <p className="font-semibold">{msg.title}</p>
                            </div>
                           <p className="text-xs text-muted-foreground">
                            {isAdmin ? `Para: ${msg.isToAllCoaches ? 'Todos' : `${msg.recipientIds.length} entr.`}` : `De: ${msg.sender.name}`}
                            {' • '}
                            {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true, locale: es })}
                           </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {selectedMessage && (
        <div 
          onClick={() => setSelectedMessage(null)}
          className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-in fade-in"
        >
          <Card 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-lg animate-in zoom-in-95"
          >
            <CardHeader>
              <CardTitle>{selectedMessage.title}</CardTitle>
              <CardDescription>
                Enviado por {selectedMessage.sender.name} el {format(new Date(selectedMessage.sentAt), 'dd MMM yyyy, HH:mm', {locale: es})}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setSelectedMessage(null)}>Cerrar</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
