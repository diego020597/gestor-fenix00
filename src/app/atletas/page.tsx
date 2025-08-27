'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserPlus, Trash2, Filter, Edit, LayoutGrid, List, Power, Eye } from 'lucide-react';
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
                  setIsAthleteLimitReached(false);
                }
              }
            }
          } catch(e) { console.error("Failed to check athlete limit", e) }

        } else if (user?.type === 'coach' && user.assignedCategories && user.assignedCategories.length > 0) {
          athletesToDisplay = allStoredAthletes.filter(athlete => 
            !athlete.teamId && user.assignedCategories!.includes(athlete.category)
          );
        } else if (user?.type === 'admin') { 
          athletesToDisplay = allStoredAthletes.filter(athlete => !athlete.teamId);
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

  if (authIsLoading || !mounted) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold text-primary">
              Perfiles de Atletas
            </h1>
          </div>
          <p className="text-muted-foreground">Cargando atletas...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="font-headline text-3xl font-bold text-primary">
            Perfiles de Atletas
          </h1>
          {canCoachRegister && (
            <Button asChild disabled={isAthleteLimitReached}>
              <Link href="/registro/atleta">
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar Atleta
              </Link>
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <Select onValueChange={setFilterCategory} value={filterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {volleyballCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterGender} value={filterGender}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por género" />
            </SelectTrigger>
            <SelectContent>
              {genderOptionsForFilter.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterStatus} value={filterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              {statusOptionsForFilter.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listado de atletas (ejemplo simplificado) */}
        <div className={viewMode === 'grid' ? "grid grid-cols-3 gap-4" : "space-y-2"}>
          {athletes.map((athlete) => (
            <Card key={athlete.id}>
              <CardHeader>
                <CardTitle>{athlete.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Categoría: {athlete.category}</p>
                <p>Género: {athlete.gender}</p>
                <p>Estado: {athlete.isActive ? "Activo" : "Inactivo"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

