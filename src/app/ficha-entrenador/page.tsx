
'use client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Briefcase, CalendarDays, Edit, Mail, Phone, ShieldCheck, Trash2, Award, Layers, UserCircle, FileText } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import type { CoachStorageItem } from '../registro/entrenador/page'; 
import { useAuth } from '@/contexts/AuthContext';


interface MatchEvent {
  id: string;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  location: string;
  time: string;
  coachIds?: string[];
  coachNames?: string[];
  category?: string;
}
const MATCH_EVENTS_STORAGE_KEY = 'matchEvents_v1';
const COACHES_STORAGE_KEY = 'coaches';
const COACH_PHOTO_STORAGE_KEY_PREFIX = 'coach_photo_';

export default function CoachCardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const coachId = searchParams.get('id');
  const { user } = useAuth();
  
  const [coach, setCoach] = useState<CoachStorageItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [assignedMatches, setAssignedMatches] = useState<MatchEvent[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!coachId) {
      router.push('/entrenadores');
      return;
    }

    let foundCoachData: CoachStorageItem | null = null;
    try {
      const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoachesString) {
        const storedCoaches: Omit<CoachStorageItem, 'avatar'>[] = JSON.parse(storedCoachesString);
        const foundCoachListItem = storedCoaches.find(c => c.id === coachId);
        
        if (foundCoachListItem) {
          if (user?.type === 'team_admin' && foundCoachListItem.teamId !== user.teamId) {
            toast({ title: "Acceso Denegado", description: "Este entrenador no pertenece a tu equipo.", variant: "destructive" });
            router.push('/entrenadores');
            return;
          }
          if (user?.type === 'coach' && foundCoachListItem.id !== user.id) { // Un coach solo puede ver su propia ficha
             toast({ title: "Acceso Denegado", description: "No puedes ver la ficha de otros entrenadores.", variant: "destructive" });
             router.push('/'); // o a /entrenadores si tiene sentido que vea la lista
             return;
          }

          const individualPhotoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${coachId}`;
          const storedPhoto = localStorage.getItem(individualPhotoKey);
          
          foundCoachData = {
            ...foundCoachListItem,
            avatar: storedPhoto, 
          };
          setCoach(foundCoachData);
        } else {
          toast({ title: "Error", description: "Entrenador no encontrado.", variant: "destructive" });
          router.push('/entrenadores');
        }
      } else {
        toast({ title: "Error", description: "No hay entrenadores almacenados o el ID es inválido.", variant: "destructive" });
        router.push('/entrenadores');
      }
    } catch (error) {
      console.error("Error loading coach from localStorage:", error);
      toast({ title: "Error", description: "No se pudo cargar el entrenador.", variant: "destructive" });
      router.push('/entrenadores');
    }

    if (foundCoachData) {
        try {
            const storedMatchesString = localStorage.getItem(MATCH_EVENTS_STORAGE_KEY);
            if (storedMatchesString) {
                const allMatches: MatchEvent[] = JSON.parse(storedMatchesString).map((m: any) => ({ ...m, date: new Date(m.date) }));
                const coachCategories = foundCoachData.assignedCategories || [];
                const relevantMatches = allMatches.filter(match => {
                    const isGlobalMatch = !match.teamId;
                    const categoryMatch = match.category && coachCategories.includes(match.category);
                    const isAssignedCoach = match.coachIds && match.coachIds.includes(foundCoachData!.id);
                    return (isGlobalMatch && categoryMatch) || isAssignedCoach;
                }).sort((a,b) => a.date.getTime() - b.date.getTime());
                setAssignedMatches(relevantMatches);
            }
        } catch (e) {
            console.error("Error loading matches for coach profile", e);
        }
    }

  }, [coachId, router, toast, user]);

  const handleDeleteCoach = () => {
    if (!coach) return;
    try {
        const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
        if (storedCoachesString) {
            let storedCoaches: CoachStorageItem[] = JSON.parse(storedCoachesString);
            storedCoaches = storedCoaches.filter(c => c.id !== coach.id);
            const coachListToStore = storedCoaches.map(c => {
              const { avatar, ...rest } = c;
              return rest;
            });
            localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(coachListToStore));
        }
        const individualPhotoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${coach.id}`;
        localStorage.removeItem(individualPhotoKey);

        toast({ title: "Entrenador Eliminado", description: `${coach.name} ha sido eliminado.` });
    } catch (error) {
        console.error("Error deleting coach from localStorage:", error);
        toast({ title: "Error", description: "No se pudo eliminar el entrenador.", variant: "destructive" });
    }
    setShowDeleteConfirm(false);
    router.push('/entrenadores'); 
  };

  if (!mounted || !coach) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>{!mounted ? 'Cargando...' : (coachId ? 'Buscando entrenador...' : 'ID de entrenador no proporcionado')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{!mounted ? 'Cargando información del entrenador...' : 'Si el entrenador existe, su información aparecerá aquí.'}</p>
            {mounted && <Button onClick={() => router.push('/entrenadores')} className="mt-4">Volver a Entrenadores</Button>}
          </CardContent>
        </Card>
      </AppLayout>
    );
  }
  
  const birthDateObj = coach.birthDate ? new Date(coach.birthDate) : null;
  const age = birthDateObj ? new Date().getFullYear() - birthDateObj.getFullYear() - (new Date().getMonth() < birthDateObj.getMonth() || (new Date().getMonth() === birthDateObj.getMonth() && new Date().getDate() < birthDateObj.getDate()) ? 1 : 0) : null;


  return (
    <AppLayout>
      <div className="space-y-8">
        <Card className="shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-primary/10 p-6 flex flex-col items-center justify-center text-center">
              <Avatar className="h-32 w-32 border-4 border-primary mb-4 shadow-md">
                <AvatarImage src={coach.avatar || `https://placehold.co/150x150.png?text=${(coach.name || "C").substring(0,2).toUpperCase()}`} alt={coach.name} data-ai-hint={coach.dataAiHint}/>
                <AvatarFallback className="text-4xl">{(coach.name || "C").substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-3xl text-primary mb-1">{coach.name}</CardTitle>
              <p className="text-lg text-foreground/80">{coach.specialty || 'Especialidad no definida'}</p>
              {coach.teamAffiliation && <p className="text-md text-muted-foreground">{coach.teamAffiliation}</p>}
              <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center justify-center">
                {(user?.type === 'admin' || user?.type === 'team_admin') && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/registro/entrenador?edit=${coach.id}`}>
                        <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                      </Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                  </>
                )}
                 {user?.type === 'coach' && user.id === coach.id && ( // Coach can edit their own profile
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/configuracion/perfil`}> {/* Coaches edit their photo in config/profile */}
                            <Edit className="mr-2 h-4 w-4" /> Editar Foto
                        </Link>
                    </Button>
                )}
              </div>
            </div>
            <div className="md:w-2/3 p-6">
              <CardHeader className="px-0 pt-0 pb-4 mb-4 border-b">
                <CardTitle className="font-headline text-2xl">Información del Entrenador</CardTitle>
              </CardHeader>
              <CardContent className="px-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <strong className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Documento:</strong> {coach.documentId || 'N/A'}
                </div>
                <div>
                  <strong className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />Fecha Nac.:</strong> 
                  {coach.birthDate ? new Date(coach.birthDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  {age !== null && ` (${age} años)`}
                </div>
                <div>
                    <strong className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />Email:</strong>
                    <a href={`mailto:${coach.email}`} className="text-muted-foreground hover:underline">{coach.email || 'N/A'}</a>
                </div>
                <div>
                    <strong className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />Teléfono:</strong>
                    <span className="text-muted-foreground">{coach.phone || 'N/A'}</span>
                </div>
                <div>
                  <strong className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />Experiencia:</strong> {coach.experience ? `${coach.experience} años` : 'N/A'}
                </div>
                <div>
                  <strong className="flex items-center gap-2"><UserCircle className="h-4 w-4 text-primary" />EPS:</strong> {coach.eps || 'N/A'}
                </div>
                <div>
                  <strong className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />ARL:</strong> {coach.arl || 'N/A'}
                </div>
                {coach.assignedCategories && coach.assignedCategories.length > 0 && (
                    <div className="sm:col-span-2">
                        <strong className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />Categorías Asignadas:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {coach.assignedCategories.map(cat => (
                                <span key={cat} className="text-sm bg-accent/20 text-accent-foreground px-2 py-1 rounded-md">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
              </CardContent>
            </div>
          </div>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Eventos y Partidos Asignados
              </CardTitle>
              <CardDescription>Partidos programados para las categorías que este entrenador gestiona o donde es responsable.</CardDescription>
            </CardHeader>
            <CardContent>
              {assignedMatches.length > 0 ? (
                <ul className="space-y-3">
                  {assignedMatches.slice(0, 5).map(match => (
                    <li key={match.id} className="flex flex-col sm:flex-row justify-between items-start p-3 bg-background rounded-md hover:bg-primary/5 border">
                      <div>
                        <h4 className="font-semibold text-foreground">{match.homeTeam} vs {match.awayTeam}</h4>
                        <p className="text-sm text-muted-foreground">
                          {match.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {match.time} hrs
                        </p>
                        <p className="text-xs text-muted-foreground">{match.location}</p>
                      </div>
                       <div className="mt-2 sm:mt-0">
                        <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full">{match.category}</span>
                       </div>
                    </li>
                  ))}
                  {assignedMatches.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">... y {assignedMatches.length-5} más.</p>
                  )}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay partidos asignados a las categorías de este entrenador.
                </p>
              )}
            </CardContent>
        </Card>

      </div>

      {showDeleteConfirm && coach && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar a {coach.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Todos los datos del entrenador serán eliminados permanentemente del almacenamiento local.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCoach} className="bg-destructive hover:bg-destructive/90">
                Sí, Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}

    
