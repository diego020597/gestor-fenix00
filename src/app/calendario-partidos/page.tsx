
'use client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Edit3, CalendarDays as CalendarIcon, ListChecks, UserCircle, Layers, Trash2, Download, FileSpreadsheet, ImageDown, Users } from 'lucide-react';
import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import type { CoachStorageItem } from '../registro/entrenador/page';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';


interface MatchEvent {
  id: string;
  teamId?: string; 
  date: Date;
  homeTeam: string;
  awayTeam: string;
  location: string;
  time: string;
  coachNames?: string[];
  coachIds?: string[];
  category?: string;
}

interface NewMatchForm {
  homeTeam: string;
  awayTeam: string;
  location: string;
  date: string;
  time: string;
  coachIds: string[];
  category: string;
}

const volleyballCategories = [
  "Benjamín (Sub-10)",
  "Alevín (Sub-12)",
  "Infantil (Sub-14)",
  "Cadete (Sub-16)",
  "Juvenil (Sub-18)",
  "Junior (Sub-21)",
  "Senior/Absoluta",
  "Master"
];

const MATCH_EVENTS_STORAGE_KEY = 'matchEvents_v1';
const COACHES_STORAGE_KEY = 'coaches';

export default function MatchCalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [matches, setMatches] = useState<MatchEvent[]>([]);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [coaches, setCoaches] = useState<CoachStorageItem[]>([]);

  const [newMatch, setNewMatch] = useState<NewMatchForm>({
    homeTeam: '',
    awayTeam: '',
    location: '',
    date: '',
    time: '',
    coachIds: [],
    category: '',
  });
  const { toast } = useToast();
  const [matchToDelete, setMatchToDelete] = useState<MatchEvent | null>(null);
  const { user } = useAuth();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCoach, setFilterCoach] = useState<string>('all');

  useEffect(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    setNewMatch(prev => ({ ...prev, date: today.toISOString().split('T')[0] }));

    try {
      const storedCoaches = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoaches) {
        const allCoaches: CoachStorageItem[] = JSON.parse(storedCoaches);
        if (user?.type === 'team_admin' && user.teamId) {
          setCoaches(allCoaches.filter(c => c.teamId === user.teamId));
        } else if (user?.type === 'admin') {
          setCoaches(allCoaches.filter(c => !c.teamId));
        }
      }

      const storedMatchesString = localStorage.getItem(MATCH_EVENTS_STORAGE_KEY);
      let allMatches: MatchEvent[] = [];
      if (storedMatchesString) {
          const parsedMatches = JSON.parse(storedMatchesString);
          allMatches = parsedMatches.map((match: any) => ({
              ...match,
              date: new Date(match.date), 
          }));
      }

      let matchesToDisplay: MatchEvent[] = [];

      if (user?.type === 'team_admin' && user.teamId) {
        matchesToDisplay = allMatches.filter(m => m.teamId === user.teamId);
      } else if (user?.type === 'coach') {
        const coachCategories = user.assignedCategories || [];
        matchesToDisplay = allMatches.filter(m => 
            (!m.teamId && m.category && coachCategories.includes(m.category)) || (m.coachIds && m.coachIds.includes(user.id || ''))
        );
      } else if (user?.type === 'admin') {
        const exampleMatches: MatchEvent[] = [
          { id: 'ex1', date: new Date(new Date(today).setDate(today.getDate() + 3)), homeTeam: 'Estrellas Voley Global', awayTeam: 'Titanes Voley Global', location: 'Gimnasio Municipal Global', time: '15:00', coachNames: ['Carlos Ramírez'], category: 'Cadete (Sub-16)' },
          { id: 'ex2', date: new Date(new Date(today).setDate(today.getDate() + 10)), homeTeam: 'Aguilas VCF Global', awayTeam: 'Estrellas Voley Global', location: 'Polideportivo Sur Global', time: '18:30', coachNames: ['Laura Mendez'], category: 'Juvenil (Sub-18)' },
        ];
        const globalMatches = allMatches.filter(m => !m.teamId);
        matchesToDisplay = globalMatches.length > 0 ? globalMatches : exampleMatches;
      }

      setMatches(matchesToDisplay);
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
      setMatches([]);
    }
    setMounted(true);
  }, [user, toast]);
  
  const saveMatchesToStorage = (updatedMatches: MatchEvent[]) => {
    try {
      let allMatches: MatchEvent[] = [];
      const storedMatchesString = localStorage.getItem(MATCH_EVENTS_STORAGE_KEY);
      if (storedMatchesString) {
        allMatches = JSON.parse(storedMatchesString).map((m: any) => ({...m, date: new Date(m.date)}));
      }

      let finalFullList: MatchEvent[] = [];
      if (user?.type === 'team_admin' && user.teamId) {
        const otherTeamMatches = allMatches.filter(m => m.teamId !== user.teamId);
        finalFullList = [...otherTeamMatches, ...updatedMatches];
        setMatches(updatedMatches);
      } else if (user?.type === 'admin') {
        const teamSpecificMatches = allMatches.filter(m => m.teamId);
        finalFullList = [...teamSpecificMatches, ...updatedMatches.filter(m => !m.teamId)];
        setMatches(updatedMatches.filter(m => !m.teamId));
      } else {
        // Coach or other roles might not have rights to save globally, handle as needed
        setMatches(updatedMatches); // Only update local state for coach
        return;
      }
       localStorage.setItem(MATCH_EVENTS_STORAGE_KEY, JSON.stringify(finalFullList));
    } catch (error) {
      console.error("Error saving matches to localStorage:", error);
      toast({ title: "Error al Guardar", description: "No se pudo guardar el calendario de partidos.", variant: "destructive" });
    }
  };


  const handleRegisterMatch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newMatch.homeTeam || !newMatch.awayTeam || !newMatch.location || !newMatch.date || !newMatch.time || !newMatch.category) {
      toast({
        title: 'Error',
        description: 'Por favor, completa todos los campos del partido, incluyendo la categoría.',
        variant: 'destructive',
      });
      return;
    }
     if (newMatch.coachIds.length === 0) {
      toast({
        title: 'Advertencia',
        description: 'No has asignado ningún entrenador a este partido.',
        variant: 'default',
      });
    }


    const [year, month, day] = newMatch.date.split('-').map(Number);
    const [hours, minutes] = newMatch.time.split(':').map(Number);
    const matchDateTime = new Date(year, month - 1, day, hours, minutes);

    if (isNaN(matchDateTime.getTime())) {
        toast({
            title: 'Error de Fecha',
            description: 'La fecha o la hora ingresada no es válida.',
            variant: 'destructive',
        });
        return;
    }
    
    const selectedCoaches = coaches.filter(c => newMatch.coachIds.includes(c.id));

    const newMatchEvent: MatchEvent = {
      id: Date.now().toString(),
      teamId: user?.type === 'team_admin' ? user.teamId : undefined,
      date: matchDateTime,
      homeTeam: newMatch.homeTeam,
      awayTeam: newMatch.awayTeam,
      location: newMatch.location,
      time: newMatch.time,
      coachIds: selectedCoaches.map(c => c.id),
      coachNames: selectedCoaches.map(c => c.name),
      category: newMatch.category,
    };

    saveMatchesToStorage([...matches, newMatchEvent].sort((a,b) => a.date.getTime() - b.date.getTime()));
    toast({
      title: 'Partido Registrado',
      description: `${newMatch.homeTeam} vs ${newMatch.awayTeam} ha sido añadido al calendario.`,
    });
    setIsRegisterModalOpen(false);
    setNewMatch({ homeTeam: '', awayTeam: '', location: '', date: currentDate ? currentDate.toISOString().split('T')[0] : '' , time: '', coachIds: [], category: '' });
  };

  const handleDeleteConfirmation = (match: MatchEvent) => {
    setMatchToDelete(match);
  };

  const handleDeleteMatch = () => {
    if (matchToDelete) {
      const updatedMatches = matches.filter(matchEvent => matchEvent.id !== matchToDelete.id);
      saveMatchesToStorage(updatedMatches);
      toast({
        title: "Partido Eliminado",
        description: `${matchToDelete.homeTeam} vs ${matchToDelete.awayTeam} ha sido eliminado.`,
      });
      setMatchToDelete(null);
    }
  };

  const matchesOnSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return matches.filter(match => match.date.toDateString() === selectedDate.toDateString());
  }, [matches, selectedDate]);

  const uniqueCoaches = useMemo(() => Array.from(new Set(matches.flatMap(match => match.coachNames || []))), [matches]);


  const filteredAndSortedMatches = useMemo(() => {
    return matches
      .filter(match => {
        const categoryMatch = filterCategory === 'all' || match.category === filterCategory;
        const coachMatch = filterCoach === 'all' || (match.coachNames && match.coachNames.includes(filterCoach));
        return categoryMatch && coachMatch;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [matches, filterCategory, filterCoach]);

  const escapeCsvCell = (cellData: any): string => {
    if (cellData === undefined || cellData === null) return '';
    if (Array.isArray(cellData)) cellData = cellData.join('; ');
    let escaped = String(cellData).replace(/"/g, '""'); 
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
      escaped = `"${escaped}"`; 
    }
    return escaped;
  };

  const handleExportCsv = () => {
    if (!mounted) {
      toast({ title: "Cargando...", description: "El calendario aún está cargando." });
      return;
    }
    if (filteredAndSortedMatches.length === 0) {
      toast({ title: "No hay partidos", description: "No hay partidos para exportar.", variant: "destructive" });
      return;
    }

    const headers = ["Fecha", "Hora", "Local", "Visitante", "Ubicación", "Categoría", "Entrenadores"];
    const csvRows = [
      headers.join(','),
      ...filteredAndSortedMatches.map(match => [
        match.date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        escapeCsvCell(match.time),
        escapeCsvCell(match.homeTeam),
        escapeCsvCell(match.awayTeam),
        escapeCsvCell(match.location),
        escapeCsvCell(match.category),
        escapeCsvCell(match.coachNames),
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "calendario_partidos.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "CSV Generado", description: "El archivo CSV de los partidos ha sido descargado." });
    } else {
      toast({ title: "Error", description: "Tu navegador no soporta la descarga directa.", variant: "destructive" });
    }
  };

  const handleExportImage = () => {
     toast({ title: "Próximamente", description: "La exportación de imágenes estará disponible pronto." });
  };


  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="font-headline text-3xl font-bold text-primary">Calendario de Partidos</h1>
          <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                 setNewMatch({
                    homeTeam: '',
                    awayTeam: '',
                    location: '',
                    date: selectedDate ? selectedDate.toISOString().split('T')[0] : (currentDate ? currentDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                    time: '',
                    coachIds: [],
                    category: ''
                  });
                 setIsRegisterModalOpen(true);
              }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Partido
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Partido</DialogTitle>
                <DialogDescription>
                  Completa los detalles del partido para añadirlo al calendario.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterMatch} className="flex-grow overflow-y-auto pr-4 space-y-4">
                
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="homeTeam">Local</Label>
                        <Input id="homeTeam" name="homeTeam" value={newMatch.homeTeam} onChange={(e) => setNewMatch(prev => ({ ...prev, homeTeam: e.target.value }))} placeholder="Equipo Local" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="awayTeam">Visitante</Label>
                        <Input id="awayTeam" name="awayTeam" value={newMatch.awayTeam} onChange={(e) => setNewMatch(prev => ({ ...prev, awayTeam: e.target.value }))} placeholder="Equipo Visitante" />
                      </div>
                  </div>
                   <div className="space-y-1">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" name="location" value={newMatch.location} onChange={(e) => setNewMatch(prev => ({ ...prev, location: e.target.value }))} placeholder="Lugar del partido" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                      <Label htmlFor="date">Fecha</Label>
                      <Input id="date" name="date" type="date" value={newMatch.date} onChange={(e) => setNewMatch(prev => ({ ...prev, date: e.target.value }))} />
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor="time">Hora</Label>
                      <Input id="time" name="time" type="time" value={newMatch.time} onChange={(e) => setNewMatch(prev => ({ ...prev, time: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category">Categoría</Label>
                    <Select name="category" onValueChange={(value) => setNewMatch(prev => ({ ...prev, category: value}))} value={newMatch.category}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {volleyballCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Users className="h-4 w-4"/>Entrenadores a Cargo (Opcional)</Label>
                    <ScrollArea className="h-40 rounded-md border p-2">
                      {coaches.length > 0 ? (coaches.map(coach => (
                          <div key={coach.id} className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-md">
                              <Checkbox
                                  id={`coach-${coach.id}`}
                                  checked={newMatch.coachIds.includes(coach.id)}
                                  onCheckedChange={checked => {
                                      setNewMatch(prev => ({
                                          ...prev,
                                          coachIds: checked
                                              ? [...prev.coachIds, coach.id]
                                              : prev.coachIds.filter(id => id !== coach.id)
                                      }));
                                  }}
                              />
                              <div className="grid gap-1.5 leading-none">
                                  <label htmlFor={`coach-${coach.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                      {coach.name}
                                  </label>
                                  {(coach.assignedCategories && coach.assignedCategories.length > 0) && (
                                    <div className="flex flex-wrap gap-1">
                                        {coach.assignedCategories.map(cat => (
                                            <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                                        ))}
                                    </div>
                                  )}
                              </div>
                          </div>
                      ))) : <p className="text-sm text-center text-muted-foreground p-4">No hay entrenadores para asignar.</p>}
                    </ScrollArea>
                  </div>

                <DialogFooter className="pt-4 flex-shrink-0">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit">Guardar Partido</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Selecciona una Fecha
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {mounted ? (
                  <Calendar
                    key={String(mounted)} 
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => {
                      if (!currentDate) return true; 
                      const yesterday = new Date(currentDate);
                      yesterday.setDate(currentDate.getDate() - 1);
                      return date < yesterday;
                    }}
                    defaultMonth={selectedDate || currentDate || undefined }
                    today={currentDate || undefined}
                  />
                ) : (
                  <div className="rounded-md border p-3 text-center text-muted-foreground h-[298px] flex items-center justify-center w-full max-w-[280px]">
                    Cargando calendario...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="font-headline">
                  {mounted && selectedDate ? `Partidos para ${selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Cargando partidos...'}
                </CardTitle>
                <CardDescription>
                  {mounted && selectedDate ? `Eventos programados para el ${selectedDate.toLocaleDateString('es-ES')}.` : 'Selecciona una fecha para ver los eventos.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mounted && matchesOnSelectedDate.length > 0 ? (
                  matchesOnSelectedDate.map(match => (
                    <div key={match.id} className="p-4 border rounded-lg bg-background hover:bg-primary/5 transition-colors">
                      <div>
                        <h3 className="font-semibold text-foreground">{match.homeTeam} vs {match.awayTeam}</h3>
                        <p className="text-sm text-muted-foreground">{match.location} - {match.time} hrs</p>
                        {match.category && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="h-3 w-3" /> {match.category}</p>
                        )}
                        {match.coachNames && match.coachNames.length > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><UserCircle className="h-3 w-3" /> {match.coachNames.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3 justify-end">
                        <Button variant="outline" size="sm" onClick={() => toast({ title: "Próximamente", description: "La edición de partidos estará disponible pronto."})}>
                          <Edit3 className="mr-2 h-3 w-3" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(match)}>
                          <Trash2 className="mr-2 h-3 w-3" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">{mounted && (selectedDate || currentDate) ? 'No hay partidos programados para esta fecha.' : (mounted ? 'Selecciona una fecha para ver los partidos.' : 'Cargando...')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
                <ListChecks className="h-6 w-6" />
                Todos los Partidos Programados
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!mounted}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Datos
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCsv}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar como CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportImage}>
                    <ImageDown className="mr-2 h-4 w-4" />
                    Exportar como Imagen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>Vista general de los próximos encuentros registrados en el sistema.</CardDescription>
            {mounted && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filterCategory">Filtrar por Categoría</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger id="filterCategory">
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {volleyballCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filterCoach">Filtrar por Entrenador</Label>
                  <Select value={filterCoach} onValueChange={setFilterCoach}>
                    <SelectTrigger id="filterCoach">
                      <SelectValue placeholder="Todos los entrenadores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los entrenadores</SelectItem>
                      {uniqueCoaches.map(coach => (
                        <SelectItem key={coach} value={coach}>{coach}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {mounted && filteredAndSortedMatches.length > 0 ? (
              filteredAndSortedMatches.map(match => (
                <div key={`all-${match.id}`} className="p-4 border rounded-lg bg-background hover:bg-primary/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-accent mb-1">
                        {match.date.toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                      <h3 className="font-semibold text-lg text-foreground">{match.homeTeam} vs {match.awayTeam}</h3>
                      <p className="text-sm text-muted-foreground">{match.location} - {match.time} hrs</p>
                       {match.category && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Layers className="h-3 w-3" /> {match.category}</p>
                      )}
                      {match.coachNames && match.coachNames.length > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><UserCircle className="h-3 w-3" /> {match.coachNames.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast({ title: "Próximamente", description: "La edición de partidos estará disponible pronto."})}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                       <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(match)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{mounted ? 'No hay partidos registrados que coincidan con los filtros.' : 'Cargando partidos...'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {matchToDelete && (
        <AlertDialog open={!!matchToDelete} onOpenChange={(open) => !open && setMatchToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar el partido: {matchToDelete.homeTeam} vs {matchToDelete.awayTeam}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el partido del calendario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setMatchToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteMatch}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}
