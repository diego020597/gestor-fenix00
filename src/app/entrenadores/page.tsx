
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus, Trash2, Users2, Edit, Layers } from 'lucide-react';
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
import type { CoachStorageItem } from '../registro/entrenador/page'; 
import { useAuth } from '@/contexts/AuthContext';


const COACHES_STORAGE_KEY = 'coaches';
const COACH_PHOTO_STORAGE_KEY_PREFIX = 'coach_photo_';

export default function CoachManagementPage() {
  const [coaches, setCoaches] = useState<CoachStorageItem[]>([]);
  const [coachToDelete, setCoachToDelete] = useState<CoachStorageItem | null>(null);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    try {
      const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoachesString) {
        const allStoredCoaches: Omit<CoachStorageItem, 'avatar'>[] = JSON.parse(storedCoachesString);
        let coachesToDisplay = allStoredCoaches;

        if (user?.type === 'team_admin' && user.teamId) {
          coachesToDisplay = allStoredCoaches.filter(c => c.teamId === user.teamId);
        } else if (user?.type === 'admin') { // Admin global
          coachesToDisplay = allStoredCoaches.filter(c => !c.teamId); // Muestra solo coaches sin teamId (globales)
        } else { // Otros roles (como coach) no ven la lista de gestión de entrenadores.
          coachesToDisplay = [];
        }
        
        const adaptedCoaches = coachesToDisplay.map(sc => {
          const individualPhotoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${sc.id}`;
          const storedPhoto = localStorage.getItem(individualPhotoKey);
          return {
            ...sc,
            name: sc.name || `${sc.firstName} ${sc.lastName}`,
            avatar: storedPhoto, 
            dataAiHint: sc.dataAiHint || 'coach person',
            teamAffiliation: sc.teamAffiliation || sc.specialty,
          };
        });
        setCoaches(adaptedCoaches);
      } else {
        setCoaches([]);
      }
    } catch (error) {
      console.error("Error loading coaches from localStorage:", error);
      setCoaches([]); 
    }
  }, [user, toast]);

  const handleDeleteConfirmation = (coach: CoachStorageItem) => {
    setCoachToDelete(coach);
  };

  const handleDeleteCoach = () => {
    if (coachToDelete) {
      // Optimistically update UI
      setCoaches(prevCoaches => prevCoaches.filter(coach => coach.id !== coachToDelete.id));

      try {
        const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
        let allCoaches: CoachStorageItem[] = storedCoachesString ? JSON.parse(storedCoachesString) : [];
        allCoaches = allCoaches.filter(c => c.id !== coachToDelete.id);
        
        const coachListToStore = allCoaches.map(c => {
            const { avatar, ...rest } = c; 
            return rest;
        });
        localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(coachListToStore));
        
        const individualPhotoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${coachToDelete.id}`;
        localStorage.removeItem(individualPhotoKey);

        toast({
          title: "Entrenador Eliminado",
          description: `${coachToDelete.name} ha sido eliminado.`,
        });
      } catch (error) {
        console.error("Error saving coaches to localStorage after delete:", error);
        toast({
          title: "Error al Guardar",
          description: "No se pudo actualizar la lista de entrenadores.",
          variant: "destructive",
        });
        // Revert UI change if save fails
         if (mounted) {
            const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
            if (storedCoachesString) {
                const allStoredCoaches: Omit<CoachStorageItem, 'avatar'>[] = JSON.parse(storedCoachesString);
                // Re-filter and adapt like in useEffect
                let coachesToDisplay = allStoredCoaches;
                if (user?.type === 'team_admin' && user.teamId) {
                  coachesToDisplay = allStoredCoaches.filter(c => c.teamId === user.teamId);
                } else if (user?.type === 'admin') {
                  coachesToDisplay = allStoredCoaches.filter(c => !c.teamId);
                } else {
                  coachesToDisplay = [];
                }
                const adaptedCoaches = coachesToDisplay.map(sc => {
                  const individualPhotoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${sc.id}`;
                  const storedPhoto = localStorage.getItem(individualPhotoKey);
                  return { ...sc, name: sc.name || `${sc.firstName} ${sc.lastName}`, avatar: storedPhoto, dataAiHint: sc.dataAiHint || 'coach person', teamAffiliation: sc.teamAffiliation || sc.specialty };
                });
                setCoaches(adaptedCoaches);
            }
        }
      }
      setCoachToDelete(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users2 className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-3xl font-bold text-primary">Gestión de Entrenadores</h1>
          </div>
          <Button asChild>
            <Link href="/registro/entrenador">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Entrenador
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <Card key={coach.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={coach.avatar || `https://placehold.co/100x100.png?text=${(coach.name || 'N/A').substring(0,2).toUpperCase()}`} 
                    alt={coach.name || 'Entrenador'} 
                    data-ai-hint={coach.dataAiHint || 'coach person'} 
                  />
                  <AvatarFallback>{(coach.name || 'N/A').substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="font-headline text-xl">{coach.name || 'Nombre no disponible'}</CardTitle>
                  <p className="text-sm text-muted-foreground">{coach.specialty}</p>
                  {coach.teamAffiliation && <p className="text-xs text-muted-foreground">{coach.teamAffiliation}</p>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                {coach.assignedCategories && coach.assignedCategories.length > 0 && (
                  <>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1 mt-2 flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Categorías:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {coach.assignedCategories.slice(0, 3).map(cat => (
                        <span key={cat} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {cat}
                        </span>
                      ))}
                      {coach.assignedCategories.length > 3 && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          +{coach.assignedCategories.length - 3} más
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex-grow flex flex-col sm:flex-row gap-2 mt-auto pt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/ficha-entrenador?id=${coach.id}`}>Ver Perfil</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                    <Link href={`/registro/entrenador?edit=${coach.id}`}>
                      <Edit className="mr-2 h-4 w-4 sm:mr-0" /> <span className="sm:hidden">Editar</span>
                    </Link>
                  </Button>
                <Button variant="destructive" className="w-full sm:w-auto" onClick={() => handleDeleteConfirmation(coach)}>
                  <Trash2 className="mr-2 h-4 w-4 sm:mr-0" /> <span className="sm:hidden">Eliminar</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        {coaches.length === 0 && mounted && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">
                {user?.type === 'team_admin' ? 'No hay entrenadores registrados para este equipo.' : 'No hay entrenadores registrados todavía.'}
              </p>
              <Button asChild>
                <Link href="/registro/entrenador">Registrar Nuevo Entrenador</Link>
              </Button>
            </CardContent>
          </Card>
        )}
         {!mounted && (
             <Card><CardContent className="py-10 text-center text-muted-foreground">Cargando entrenadores...</CardContent></Card>
         )}
      </div>

      {coachToDelete && (
        <AlertDialog open={!!coachToDelete} onOpenChange={(open) => !open && setCoachToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar a {coachToDelete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al entrenador del almacenamiento local.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCoachToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCoach}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}
