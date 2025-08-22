
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus, Trash2, Filter, Edit, LayoutGrid, List, Power, PowerOff, Eye } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AthleteStorageItem } from '../registro/atleta/page';
import { useAuth } from '@/contexts/AuthContext';
import type { TeamStorageItem } from '../gestor-fenix/page';


import { volleyballCategories } from "@/constants/volleyballCategories";

import { volleyballCategories } from "./constants";

export default function Page() {
  return (
    <div>
      {volleyballCategories.map((cat) => (
        <p key={cat}>{cat}</p>
      ))}
    </div>
  );
}
const genderOptionsForFilter = ['Todos', 'Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'];
const statusOptionsForFilter = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Solo Activos' },
  { value: 'inactive', label: 'Solo Inactivos' },
];

const ATHLETES_STORAGE_KEY = 'athletes';
const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';


export default function AthleteProfilesPage() {
  const [athletes, setAthletes] = useState<AthleteStorageItem[]>([]);
  const [athleteToDelete, setAthleteToDelete] = useState<AthleteStorageItem | null>(null);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const { user, isLoading: authIsLoading } = useAuth();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [canCoachRegister, setCanCoachRegister] = useState(false);

  const [isAthleteLimitReached, setIsAthleteLimitReached] = useState(false);
  const [athleteLimit, setAthleteLimit] = useState<number | null>(null);

  useEffect(() => {
    if (authIsLoading) return; 
    setMounted(true);

    if (user?.type === 'coach') {
        setCanCoachRegister(!!(user.assignedCategories && user.assignedCategories.length > 0));
    } else if (user?.type === 'admin' || user?.type === 'team_admin') {
        setCanCoachRegister(true);
    } else {
        setCanCoachRegister(false);
    }

    try {
      const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
      let athletesToDisplay: AthleteStorageItem[] = [];

      if (storedAthletesString) {
        const allStoredAthletes: AthleteStorageItem[] = JSON.parse(storedAthletesString);
        
        if (user?.type === 'team_admin' && user.teamId) {
          athletesToDisplay = allStoredAthletes.filter(athlete => athlete.teamId === user.teamId);
          // Check athlete limit for team_admin
          try {
            const teamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
            if (teamsString) {
              const allTeams: TeamStorageItem[] = JSON.parse(teamsString);
              const currentTeam = allTeams.find(t => t.id === user.teamId);
              if (currentTeam?.athleteLimit) {
                const limit = parseInt(currentTeam.athleteLimit, 10);
                if (!isNaN(limit)) {
                  setAthleteLimit(limit);
                  setIsAthleteLimitReached(athletesToDisplay.length >= limit);
                } else {
                  setIsAthleteLimitReached(false); // "más de X" means no limit
                }
              }
            }
          } catch(e) { console.error("Failed to check athlete limit", e) }

        } else if (user?.type === 'coach' && user.assignedCategories && user.assignedCategories.length > 0) {
          athletesToDisplay = allStoredAthletes.filter(athlete => 
            !athlete.teamId && user.assignedCategories!.includes(athlete.category)
          );
        } else if (user?.type === 'admin') { 
          athletesToDisplay = allStoredAthletes.filter(athlete => !athlete.teamId); // Admin global ve solo los sin teamId
        } else { 
             athletesToDisplay = [];
        }

        const adaptedAthletes = athletesToDisplay.map(sa => ({
            ...sa,
            name: sa.name || `${sa.firstName} ${sa.lastName}`,
            category: sa.category || 'Por definir',
            gender: sa.gender || 'Prefiero no decirlo',
            dataAiHint: sa.dataAiHint || (sa.gender === 'Masculino' ? 'male athlete' : sa.gender === 'Femenino' ? 'female athlete' : 'athlete person'),
            weight: sa.weight || '',
            height: sa.height || '',
            imc: sa.imc === undefined ? null : sa.imc,
            imcStatus: sa.imcStatus || 'No calculado',
            termsAccepted: sa.termsAccepted !== undefined ? sa.termsAccepted : false,
            isActive: sa.isActive === undefined ? true : sa.isActive,
            statusReason: sa.statusReason || '',
          }));
        setAthletes(adaptedAthletes);
      } else {
        setAthletes([]);
      }
    } catch (error) {
      console.error("Error loading athletes from localStorage:", error);
      setAthletes([]);
    }
  }, [user, authIsLoading, toast]);

  const handleToggleAthleteStatus = (athleteId: string, newIsActive: boolean) => {
    setAthletes(prevAthletes => {
      const updatedAthletesLocalView = prevAthletes.map(athlete => {
        if (athlete.id === athleteId) {
          const updatedAthlete = { ...athlete, isActive: newIsActive };
          if (newIsActive) { 
            updatedAthlete.statusReason = '';
          }
          return updatedAthlete;
        }
        return athlete;
      });

      try {
        const fullStoredAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
        if (fullStoredAthletesString) {
            let fullAthletesList: AthleteStorageItem[] = JSON.parse(fullStoredAthletesString);
            fullAthletesList = fullAthletesList.map(ath => {
                if (ath.id === athleteId) {
                    return {...ath, isActive: newIsActive, statusReason: newIsActive ? '' : (updatedAthletesLocalView.find(ua => ua.id === athleteId)?.statusReason || '')};
                }
                return ath;
            });
            localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(fullAthletesList));
        }
        
        setTimeout(() => {
          toast({
            title: "Estado Actualizado",
            description: `El estado de ${updatedAthletesLocalView.find(a=>a.id === athleteId)?.name} es ahora ${newIsActive ? 'Activo' : 'Inactivo'}.`,
          });
        }, 0);
      } catch (error) {
        console.error("Error saving athlete status to localStorage:", error);
        setTimeout(() => {
          toast({ title: "Error al Guardar", description: "No se pudo actualizar el estado del atleta.", variant: "destructive"});
        }, 0);
      }
      return updatedAthletesLocalView;
    });
  };

  const handleDeleteConfirmation = (athlete: AthleteStorageItem) => {
    setAthleteToDelete(athlete);
  };

  const handleDeleteAthlete = () => {
    if (athleteToDelete) {
      // Optimistically update UI
      setAthletes(prevAthletes => prevAthletes.filter(athlete => athlete.id !== athleteToDelete.id));
      
      try {
        const fullStoredAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
        if (fullStoredAthletesString) {
            let fullAthletesList: AthleteStorageItem[] = JSON.parse(fullStoredAthletesString);
            fullAthletesList = fullAthletesList.filter(ath => ath.id !== athleteToDelete.id);
            localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(fullAthletesList));
        }

        localStorage.removeItem(`athlete_skills_${athleteToDelete.id}`);
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`athlete_manual_payment_${athleteToDelete.id}_`)) {
            localStorage.removeItem(key);
          }
        });
        setTimeout(() => {
          toast({
            title: "Atleta Eliminado",
            description: `${athleteToDelete.name} ha sido eliminado.`,
          });
        }, 0);
      } catch (error) {
        console.error("Error saving athletes to localStorage after delete:", error);
         setTimeout(() => {
          toast({
            title: "Error al Guardar",
            description: "No se pudo actualizar la lista de atletas en el almacenamiento local.",
            variant: "destructive",
          });
        }, 0);
        // Revert UI change if save fails (could be more sophisticated)
        if (mounted) { // Ensure component is still mounted
            const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
            if (storedAthletesString) setAthletes(JSON.parse(storedAthletesString));
        }
      }
      setAthleteToDelete(null);
    }
  };

  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete => {
      const categoryMatch = filterCategory === 'all' || athlete.category === filterCategory;
      const genderMatch = filterGender === 'Todos' || athlete.gender === filterGender;
      const statusMatch = filterStatus === 'all' ||
                          (filterStatus === 'active' && athlete.isActive) ||
                          (filterStatus === 'inactive' && !athlete.isActive);
      return categoryMatch && genderMatch && statusMatch;
    });
  }, [athletes, filterCategory, filterGender, filterStatus]);

  const getImcStatusColorClass = (status?: string) => {
    switch (status) {
      case 'Bajo Peso': return 'text-blue-500';
      case 'Normal': return 'text-green-500';
      case 'Sobrepeso': return 'text-yellow-500';
      case 'Obesidad': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const registerAthleteButton = (user?.type === 'admin' || user?.type === 'team_admin' || (user?.type === 'coach' && canCoachRegister)) && (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="inline-block"> 
                    <Button 
                        asChild 
                        disabled={(user?.type === 'coach' && !canCoachRegister) || isAthleteLimitReached}
                    >
                        <Link href="/registro/atleta">
                            <UserPlus className="mr-2 h-4 w-4" /> Registrar Atleta
                        </Link>
                    </Button>
                </div>
            </TooltipTrigger>
            {(user?.type === 'coach' && !canCoachRegister) && (
                <TooltipContent>
                    <p>Debes tener categorías asignadas para registrar atletas.</p>
                </TooltipContent>
            )}
            {isAthleteLimitReached && (
                 <TooltipContent>
                    <p>Límite de atletas ({athleteLimit}) para el equipo alcanzado.</p>
                </TooltipContent>
            )}
        </Tooltip>
    </TooltipProvider>
);


  if (authIsLoading || !mounted) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold text-primary">Perfiles de Atletas</h1>
          </div>
          <p className="text-muted-foreground">Cargando atletas...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-bold text-primary">Perfiles de Atletas</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="Vista en cuadrícula"
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="Vista en lista"
            >
              <List className="h-5 w-5" />
            </Button>
            {registerAthleteButton}
          </div>
        </div>

        <Card className="p-4 md:p-6 shadow">
          <CardHeader className="p-0 pb-4 mb-4 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtrar Atletas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filterCategory" className="mb-1 block text-sm font-medium">Categoría</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filterCategory">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {(user?.type === 'admin' || user?.type === 'team_admin' ? volleyballCategories : user?.assignedCategories || []).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterGender" className="mb-1 block text-sm font-medium">Género</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger id="filterGender">
                  <SelectValue placeholder="Todos los géneros" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptionsForFilter.map(gender => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatus" className="mb-1 block text-sm font-medium">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filterStatus">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptionsForFilter.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAthletes.map((athlete) => (
              <Card key={athlete.id} className="hover:shadow-lg transition-shadow flex flex-col relative">
                 <Badge
                  variant={athlete.isActive ? "default" : "secondary"}
                  className={`absolute top-2 right-2 text-xs ${athlete.isActive ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'}`}
                >
                  {athlete.isActive ? (
                    <Power className="inline-block h-3 w-3 mr-1" />
                  ) : (
                    <PowerOff className="inline-block h-3 w-3 mr-1" />
                  )}
                  {athlete.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={athlete.avatar || `https://placehold.co/100x100.png?text=${(athlete.name || 'N/A').substring(0,2).toUpperCase()}`}
                      alt={athlete.name || 'Atleta'}
                      data-ai-hint={athlete.dataAiHint}
                    />
                    <AvatarFallback>{(athlete.name || 'N/A').substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="font-headline text-xl">{athlete.name || 'Nombre no disponible'}</CardTitle>
                    <p className="text-sm text-muted-foreground">{athlete.position}</p>
                    <p className="text-sm text-muted-foreground">{athlete.team}</p>
                    <p className="text-xs text-muted-foreground">{athlete.category} - {athlete.gender}</p>
                    {athlete.imc !== null && athlete.imc !== undefined && (
                      <p className={`text-xs font-medium ${getImcStatusColorClass(athlete.imcStatus)}`}>
                        IMC: {athlete.imc.toFixed(1)} ({athlete.imcStatus})
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                   <div className="flex items-center space-x-2 mb-3 mt-1">
                    <Switch
                      id={`status-switch-grid-${athlete.id}`}
                      checked={athlete.isActive}
                      onCheckedChange={(checked) => handleToggleAthleteStatus(athlete.id, checked)}
                      
                    />
                    <Label htmlFor={`status-switch-grid-${athlete.id}`} className="text-xs">
                      {athlete.isActive ? 'Cambiar a Inactivo' : 'Cambiar a Activo'}
                    </Label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/ficha-jugador?id=${athlete.id}`}>Ver Perfil</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                      <Link href={`/registro/atleta?edit=${athlete.id}`}>
                        <Edit className="mr-2 h-4 w-4 sm:mr-0" /> <span className="sm:hidden">Editar</span>
                      </Link>
                    </Button>
                    {(user?.type === 'admin' || user?.type === 'team_admin') && (
                      <Button variant="destructive" className="w-full sm:w-auto" onClick={() => handleDeleteConfirmation(athlete)}>
                        <Trash2 className="mr-2 h-4 w-4 sm:mr-0" /> <span className="sm:hidden">Eliminar</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ( 
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nombre</TableHead>
                    <TableHead className="w-[80px]">Edad</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Género</TableHead>
                    <TableHead className="w-[150px]">Estado</TableHead>
                    <TableHead className="text-right w-[200px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAthletes.map(athlete => (
                    <TableRow key={athlete.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={athlete.avatar || `https://placehold.co/40x40.png?text=${athlete.name.substring(0,2)}`} alt={athlete.name} data-ai-hint={athlete.dataAiHint} />
                            <AvatarFallback>{athlete.name.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{athlete.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{athlete.age}</TableCell>
                      <TableCell>{athlete.category}</TableCell>
                      <TableCell>{athlete.gender}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                           <Switch
                            id={`status-switch-list-${athlete.id}`}
                            checked={athlete.isActive}
                            onCheckedChange={(checked) => handleToggleAthleteStatus(athlete.id, checked)}
                            className="h-5 w-9 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-slate-400"
                          />
                          <Badge variant={athlete.isActive ? "default" : "secondary"} className={athlete.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                            {athlete.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/ficha-jugador?id=${athlete.id}`} title="Ver Perfil">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/registro/atleta?edit=${athlete.id}`} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        {(user?.type === 'admin' || user?.type === 'team_admin') && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteConfirmation(athlete)} title="Eliminar">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {filteredAthletes.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">
                {athletes.length === 0 ? (user?.type === 'coach' && (!user.assignedCategories || user.assignedCategories.length === 0) ? "No tienes categorías asignadas para ver atletas." : (user?.type === 'team_admin' ? "No hay atletas registrados para este equipo." : "No hay atletas registrados que coincidan con tus permisos o filtros.")) : "No hay atletas que coincidan con los filtros seleccionados."}
              </p>
              {registerAthleteButton}
            </CardContent>
          </Card>
        )}
      </div>

      {athleteToDelete && (
        <AlertDialog open={!!athleteToDelete} onOpenChange={(open) => !open && setAthleteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar a {athleteToDelete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente al atleta del almacenamiento local.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAthleteToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAthlete}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}
