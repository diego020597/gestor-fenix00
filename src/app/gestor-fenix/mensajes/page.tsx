
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, type FormEvent } from 'react';
import { Send, Inbox, ListChecks, Users, User, Users2 } from 'lucide-react';
import type { TeamStorageItem } from '../page'; 
import { type Message, type MessageRecipientInfo, GESTOR_FENIX_MESSAGES_STORAGE_KEY } from '@/types/messages';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1'; 

export default function GestorFenixMessagesPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [teams, setTeams] = useState<TeamStorageItem[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'specific' | 'multiple'>('all');
  const [selectedSpecificTeamId, setSelectedSpecificTeamId] = useState<string>('');
  const [selectedMultipleTeamIds, setSelectedMultipleTeamIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authIsLoading && (!user || user.type !== 'fenix_master')) {
      router.push('/login');
    }
  }, [user, authIsLoading, router]);

  useEffect(() => {
    if (user && user.type === 'fenix_master') {
      try {
        const storedTeams = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
        if (storedTeams) {
          setTeams(JSON.parse(storedTeams).filter((team: TeamStorageItem) => team.isActive));
        }
        const storedMessages = localStorage.getItem(GESTOR_FENIX_MESSAGES_STORAGE_KEY);
        if (storedMessages) {
          setSentMessages(JSON.parse(storedMessages).sort((a: Message, b: Message) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
        }
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
      }
      setIsLoadingData(false);
    }
  }, [user, toast]);

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast({ title: "Campos incompletos", description: "El título y el contenido son obligatorios.", variant: "destructive" });
      return;
    }

    let finalRecipients: MessageRecipientInfo[] = [];
    let isGlobalMessage = false;

    if (recipientType === 'all') {
      isGlobalMessage = true;
      finalRecipients = teams.map(team => ({
        teamId: team.id,
        teamName: team.name,
        teamAdminUsername: team.adminUsername,
        readAt: null,
      }));
    } else if (recipientType === 'specific') {
      if (!selectedSpecificTeamId) {
        toast({ title: "Sin destinatario", description: "Selecciona un equipo específico.", variant: "destructive" });
        return;
      }
      const team = teams.find(t => t.id === selectedSpecificTeamId);
      if (team) {
        finalRecipients.push({
          teamId: team.id,
          teamName: team.name,
          teamAdminUsername: team.adminUsername,
          readAt: null,
        });
      }
    } else if (recipientType === 'multiple') {
      if (selectedMultipleTeamIds.length === 0) {
        toast({ title: "Sin destinatarios", description: "Selecciona al menos un equipo.", variant: "destructive" });
        return;
      }
      finalRecipients = teams
        .filter(team => selectedMultipleTeamIds.includes(team.id))
        .map(team => ({
          teamId: team.id,
          teamName: team.name,
          teamAdminUsername: team.adminUsername,
          readAt: null,
        }));
    }

    if (finalRecipients.length === 0 && !isGlobalMessage) { 
        toast({ title: "Sin Destinatarios Válidos", description: "No se pudieron determinar destinatarios para este mensaje.", variant: "destructive"});
        return;
    }
     if (isGlobalMessage && teams.length === 0) {
        toast({ title: "Sin Equipos", description: "No hay equipos activos para enviar un mensaje global.", variant: "destructive"});
        return;
    }


    const newMessage: Message = {
      id: crypto.randomUUID(),
      title: messageTitle.trim(),
      content: messageContent.trim(),
      senderId: 'gestorfenix',
      sentAt: new Date().toISOString(),
      recipients: finalRecipients,
      isGlobal: isGlobalMessage,
    };

    const updatedMessages = [newMessage, ...sentMessages];
    localStorage.setItem(GESTOR_FENIX_MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));
    setSentMessages(updatedMessages.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
    toast({ title: "Mensaje Enviado", description: "El mensaje ha sido enviado a los destinatarios seleccionados." });

    setMessageTitle('');
    setMessageContent('');
    setRecipientType('all');
    setSelectedSpecificTeamId('');
    setSelectedMultipleTeamIds([]);
  };
  
  const handleRecipientTypeChange = (value: 'all' | 'specific' | 'multiple') => {
    setRecipientType(value);
    setSelectedSpecificTeamId('');
    setSelectedMultipleTeamIds([]);
  }

  const getRecipientDisplay = (message: Message): string => {
    if (message.isGlobal) return "Todos los Equipos";
    if (message.recipients.length === 1) return message.recipients[0].teamName;
    if (message.recipients.length > 1) return `${message.recipients.length} equipos seleccionados`;
    return "N/A";
  }


  if (authIsLoading || isLoadingData) {
    return <div className="text-center p-10 text-gray-300">Cargando panel de Mensajes...</div>;
  }
  if (!user || user.type !== 'fenix_master') {
    return <div className="text-center p-10 text-red-400">Acceso denegado.</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="bg-gray-800/50 border-gray-700 text-gray-200">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-green-400 flex items-center gap-2">
            <Inbox className="h-8 w-8" />
            Panel de Mensajería de GestorFenix
          </CardTitle>
          <CardDescription className="text-gray-400">Envía comunicados a los administradores de los equipos.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="shadow-lg bg-gray-800/50 border-gray-700 text-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100"><Send className="h-5 w-5 text-green-400" /> Crear Nuevo Mensaje</CardTitle>
        </CardHeader>
        <form onSubmit={handleSendMessage}>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="messageTitle" className="text-gray-300">Título del Mensaje <span className="text-red-400">*</span></Label>
              <Input id="messageTitle" value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} required className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
            </div>
            <div>
              <Label htmlFor="messageContent" className="text-gray-300">Contenido del Mensaje <span className="text-red-400">*</span></Label>
              <Textarea id="messageContent" value={messageContent} onChange={(e) => setMessageContent(e.target.value)} required rows={5} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
            </div>
            <div className="space-y-3">
              <Label className="text-gray-300">Destinatarios <span className="text-red-400">*</span></Label>
              <RadioGroup value={recipientType} onValueChange={handleRecipientTypeChange} className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="r-all" className="border-green-500 text-green-500 focus:ring-green-500" />
                  <Label htmlFor="r-all" className="font-normal flex items-center gap-1 text-gray-300"><Users2 className="h-4 w-4"/>Todos los Equipos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="r-specific" className="border-green-500 text-green-500 focus:ring-green-500" />
                  <Label htmlFor="r-specific" className="font-normal flex items-center gap-1 text-gray-300"><User className="h-4 w-4"/>Un Equipo Específico</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="r-multiple" className="border-green-500 text-green-500 focus:ring-green-500" />
                  <Label htmlFor="r-multiple" className="font-normal flex items-center gap-1 text-gray-300"><Users className="h-4 w-4"/>Varios Equipos</Label>
                </div>
              </RadioGroup>

              {recipientType === 'specific' && (
                <Select value={selectedSpecificTeamId} onValueChange={setSelectedSpecificTeamId}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500 data-[placeholder]:text-gray-400"><SelectValue placeholder="Seleccionar un equipo..." /></SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{team.name} ({team.adminUsername})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {recipientType === 'multiple' && (
                <ScrollArea className="h-40 rounded-md border border-gray-600 p-2 bg-gray-700/50">
                  <p className="text-sm text-gray-400 mb-2">Selecciona los equipos:</p>
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center space-x-2 mb-1 p-1 hover:bg-gray-600/50 rounded-sm">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={selectedMultipleTeamIds.includes(team.id)}
                        onCheckedChange={(checked) => {
                          setSelectedMultipleTeamIds(prev =>
                            checked ? [...prev, team.id] : prev.filter(id => id !== team.id)
                          );
                        }}
                        className="border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
                      />
                      <Label htmlFor={`team-${team.id}`} className="font-normal text-sm text-gray-300">{team.name} ({team.adminUsername})</Label>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
              <Send className="mr-2 h-4 w-4" /> Enviar Mensaje
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg bg-gray-800/50 border-gray-700 text-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100"><ListChecks className="h-5 w-5 text-green-400" /> Historial de Mensajes Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          {sentMessages.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Aún no has enviado ningún mensaje.</p>
          ) : (
            <Table>
              <TableHeader className="[&_tr]:border-gray-700">
                <TableRow>
                  <TableHead className="text-gray-300">Título</TableHead>
                  <TableHead className="text-gray-300">Fecha de Envío</TableHead>
                  <TableHead className="text-gray-300">Destinatario(s)</TableHead>
                  <TableHead className="text-right text-gray-300">Leídos (referencial)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:border-gray-700">
                {sentMessages.map(msg => (
                  <TableRow key={msg.id} className="hover:bg-gray-700/30">
                    <TableCell className="font-medium max-w-xs truncate text-gray-100" title={msg.title}>{msg.title}</TableCell>
                    <TableCell className="text-gray-300">{format(new Date(msg.sentAt), "dd MMM yyyy, HH:mm", { locale: es })}</TableCell>
                    <TableCell className="text-gray-300">{getRecipientDisplay(msg)}</TableCell>
                    <TableCell className="text-right text-gray-300">
                      {msg.recipients.filter(r => r.readAt).length} / {msg.recipients.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
