
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, type FormEvent, type ChangeEvent, useMemo } from 'react';
import { Edit, Trash2, Eye, KeyRound, Search, Upload, Server, Power, PlusCircle, Users } from 'lucide-react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { CoachStorageItem } from '../registro/entrenador/page';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface TeamStorageItem {
  id: string;
  name: string; // Nombre del equipo
  logo?: string | null; // Cargar imagen del club
  
  legalRepresentativeName?: string; // Nombre del representante legal
  registrationCity?: string; // Ciudad de registro (reemplaza location)
  representativePhone?: string; // Número celular oficial del representante legal
  clubEmail?: string; // Correo electrónico del club
  coachLimit?: string; // Límite de entrenadores
  athleteLimit?: string; // Cantidad de deportistas
  socialMediaLink?: string; // Link de red social del club
  sportType?: string; // Tipo de deporte
  trainingVenues?: string; // Sedes de entrenamiento (puede ser una lista separada por comas o una principal)
  foundationDate?: string; // Fecha de Fundación
  assignedCoaches?: Array<{ id: string, name: string }>; // Este campo ya no se gestiona aquí

  adminUsername: string;
  adminPassword?: string;
  passwordChangeRequired?: boolean; 
  isActive: boolean;
  statusReason?: string;
  inactivationDate?: string;
}

const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';
const COACHES_STORAGE_KEY = 'coaches';

const initialNewTeamFormState: Omit<TeamStorageItem, 'id' | 'adminUsername' | 'adminPassword' | 'isActive'> = {
  name: '',
  logo: null,
  legalRepresentativeName: '',
  registrationCity: '',
  representativePhone: '',
  clubEmail: '',
  coachLimit: '',
  athleteLimit: '',
  socialMediaLink: '',
  sportType: '',
  trainingVenues: '',
  foundationDate: '',
  assignedCoaches: [],
};

const sportOptions = [
  "Voleibol", "Fútbol", "Futsala", "Natación", "Baloncesto",
  "Patinaje", "Tenis", "Atletismo", "Béisbol", "Gimnasio", "Rugby"
];
const coachLimitOptions = ["3", "5", "7", "10", "más de 10"];
const athleteLimitOptions = ["10", "15", "30", "50", "70", "100", "más de 100"];

export default function GestorFenixPage() {
  const { user, isLoading: authIsLoading, logoutAndLoginAs } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [teams, setTeams] = useState<TeamStorageItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState(initialNewTeamFormState);
  const [newTeamLogoFile, setNewTeamLogoFile] = useState<File | null>(null);
  const [newTeamLogoPreview, setNewTeamLogoPreview] = useState<string | null>(null);

  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<TeamStorageItem | null>(null);
  const [teamToResetPassword, setTeamToResetPassword] = useState<TeamStorageItem | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<TeamStorageItem | null>(null);

  const [editTeamForm, setEditTeamForm] = useState<Partial<TeamStorageItem>>({});
  const [newTeamAdminPassword, setNewTeamAdminPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);


  useEffect(() => {
    if (!authIsLoading && (!user || user.type !== 'fenix_master')) {
      router.push('/login');
    }
  }, [user, authIsLoading, router]);

  useEffect(() => {
    if (user && user.type === 'fenix_master') {
      try {
        const storedTeamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
        setTeams(storedTeamsString ? JSON.parse(storedTeamsString) : []);
        
      } catch (error) {
        console.error("Error processing initial data:", error); 
        toast({ title: "Error", description: "Hubo un problema al cargar los datos.", variant: "destructive" });
      }
      setIsLoadingData(false);
    }
  }, [user, toast]);

  const saveTeamsToStorage = (updatedTeams: TeamStorageItem[]) => {
    localStorage.setItem(GESTOR_FENIX_TEAMS_STORAGE_KEY, JSON.stringify(updatedTeams));
    setTeams(updatedTeams);
  };

  const handleNewTeamLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast({ title: "Logo Demasiado Grande", description: "Por favor, selecciona una imagen de menos de 1MB.", variant: "destructive" });
        e.target.value = '';
        setNewTeamLogoFile(null);
        setNewTeamLogoPreview(null);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewTeamLogoPreview(reader.result as string);
        setNewTeamLogoFile(file);
      };
      reader.readAsDataURL(file);
    } else {
      setNewTeamLogoPreview(null);
      setNewTeamLogoFile(null);
    }
  };

  const handleCreateTeam = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTeamForm.name.trim()) {
      toast({ title: "Error", description: "El nombre del equipo es obligatorio.", variant: "destructive" });
      return;
    }

    const adminUsername = `admin@${newTeamForm.name.trim().toLowerCase().replace(/\s+/g, '')}`;
    const adminPassword = "admin12345";

    let logoDataUrl: string | null = null;
    if (newTeamLogoFile) {
        logoDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(newTeamLogoFile);
        });
    }

    const newTeam: TeamStorageItem = {
      id: crypto.randomUUID(),
      ...newTeamForm,
      name: newTeamForm.name.trim(),
      logo: logoDataUrl,
      assignedCoaches: [], // Los entrenadores ya no se asignan aquí
      adminUsername,
      adminPassword,
      passwordChangeRequired: true,
      isActive: true,
    };

    saveTeamsToStorage([...teams, newTeam]);
    toast({ title: "Equipo Creado", description: `El equipo "${newTeam.name}" ha sido creado con éxito.` });
    setIsCreateTeamDialogOpen(false);
    setNewTeamForm(initialNewTeamFormState);
    setNewTeamLogoFile(null);
    setNewTeamLogoPreview(null);
  };
  
  const handleEditTeamLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { 
        toast({ title: "Logo Demasiado Grande", description: "Por favor, selecciona una imagen de menos de 1MB.", variant: "destructive" });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setEditLogoPreview(dataUrl);
        setEditTeamForm(prev => ({ ...prev, logo: dataUrl }));
      };
      reader.readAsDataURL(file);
    } else {
      setEditLogoPreview(teamToEdit?.logo || null); 
      setEditTeamForm(prev => ({ ...prev, logo: teamToEdit?.logo || null }));
    }
  };

  const openEditTeamDialog = (team: TeamStorageItem) => {
    setTeamToEdit(team);
    setEditTeamForm({ ...team });
    setEditLogoPreview(team.logo || null);
    setIsEditTeamDialogOpen(true);
  };

  const handleEditTeam = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamToEdit || !editTeamForm.name?.trim()) {
      toast({ title: "Error", description: "El nombre del equipo es obligatorio.", variant: "destructive" });
      return;
    }
    
    const updatedTeam: TeamStorageItem = {
      ...teamToEdit,
      ...editTeamForm,
      name: editTeamForm.name.trim(),
      isActive: editTeamForm.isActive === undefined ? teamToEdit.isActive : editTeamForm.isActive,
      statusReason: editTeamForm.isActive ? undefined : editTeamForm.statusReason, 
      inactivationDate: editTeamForm.isActive ? undefined : editTeamForm.inactivationDate, 
    };

    saveTeamsToStorage(teams.map(t => t.id === teamToEdit.id ? updatedTeam : t));
    toast({ title: "Equipo Actualizado", description: `El equipo "${updatedTeam.name}" ha sido actualizado.` });
    setIsEditTeamDialogOpen(false);
    setTeamToEdit(null);
    setEditLogoPreview(null);
  };

  const openDeleteTeamDialog = (team: TeamStorageItem) => {
    setTeamToDelete(team);
  };

  const handleDeleteTeam = () => {
    if (!teamToDelete) return;
    saveTeamsToStorage(teams.filter(t => t.id !== teamToDelete.id));
    toast({ title: "Equipo Eliminado", description: `El equipo "${teamToDelete.name}" ha sido eliminado.` });
    toast({ title: "Recordatorio", description: "Los datos asociados a este equipo (atletas, entrenadores, etc.) NO han sido eliminados. Esta funcionalidad está pendiente.", variant: "default", duration: 7000 });
    setTeamToDelete(null);
  };

  const openResetPasswordDialog = (team: TeamStorageItem) => {
    setTeamToResetPassword(team);
    setNewTeamAdminPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetTeamAdminPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!teamToResetPassword || !newTeamAdminPassword.trim()) {
      toast({ title: "Error", description: "La nueva contraseña no puede estar vacía.", variant: "destructive" });
      return;
    }
    const updatedTeams = teams.map(t =>
      t.id === teamToResetPassword.id ? { ...t, adminPassword: newTeamAdminPassword.trim(), passwordChangeRequired: true } : t
    );
    saveTeamsToStorage(updatedTeams);
    toast({ title: "Contraseña Restablecida", description: `La contraseña para el administrador de "${teamToResetPassword.name}" ha sido cambiada. Se le pedirá cambiarla al iniciar sesión.` });
    setIsResetPasswordDialogOpen(false);
    setTeamToResetPassword(null);
  };

  const handleAccessTeam = (team: TeamStorageItem) => {
    if (!team.isActive) {
      toast({ title: "Equipo Inactivo", description: `El equipo "${team.name}" está actualmente inactivo. Debes activarlo para acceder.`, variant: "destructive" });
      return;
    }
    logoutAndLoginAs('team_admin', {
        name: `Admin ${team.name}`,
        id: team.adminUsername,
        teamId: team.id,
        currentTeamName: team.name,
        avatar: team.logo,
        passwordChangeRequired: team.passwordChangeRequired,
    });
  };

  const handleToggleTeamStatusInList = (teamId: string, newIsActive: boolean) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    if (!newIsActive) {
      setTeamToEdit(team); 
      setEditTeamForm({ 
        ...team,
        isActive: false,
        statusReason: team.statusReason || '',
        inactivationDate: team.inactivationDate || new Date().toISOString().split('T')[0],
      });
      setEditLogoPreview(team.logo || null); 
      setIsEditTeamDialogOpen(true); 
    } else {
      const updatedTeam = { ...team, isActive: true, statusReason: undefined, inactivationDate: undefined };
      saveTeamsToStorage(teams.map(t => t.id === teamId ? updatedTeam : t));
      toast({ title: "Estado Actualizado", description: `El equipo "${updatedTeam.name}" ahora está Activo.` });
    }
  };


  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.adminUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.registrationCity && team.registrationCity.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const teamStats = useMemo(() => {
    const total = teams.length;
    const active = teams.filter(t => t.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [teams]);

  if (authIsLoading || isLoadingData) {
    return <div className="text-center p-10 text-gray-300">Cargando panel de Gestor de Equipos...</div>;
  }
  if (!user || user.type !== 'fenix_master') {
    return <div className="text-center p-10 text-red-400">Acceso denegado.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="font-headline text-3xl font-bold text-green-400">Gestor de Equipos</h1>
        <Dialog open={isCreateTeamDialogOpen} onOpenChange={(isOpen) => {
            setIsCreateTeamDialogOpen(isOpen);
            if (!isOpen) { setNewTeamForm(initialNewTeamFormState); setNewTeamLogoFile(null); setNewTeamLogoPreview(null); }
        }}>
            <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Equipo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-gray-800 border-gray-700 text-gray-200">
                <DialogHeader>
                    <DialogTitle className="text-gray-100">Crear Nuevo Equipo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-4 py-2 max-h-[75vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="newTeamName" className="text-gray-300">Nombre del Equipo <span className="text-red-400">*</span></Label>
                            <Input id="newTeamName" value={newTeamForm.name} onChange={(e) => setNewTeamForm(prev => ({ ...prev, name: e.target.value }))} required className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                        <div>
                            <Label htmlFor="newLegalRepresentativeName" className="text-gray-300">Nombre del Representante Legal</Label>
                            <Input id="newLegalRepresentativeName" value={newTeamForm.legalRepresentativeName} onChange={(e) => setNewTeamForm(prev => ({ ...prev, legalRepresentativeName: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                        <div>
                            <Label htmlFor="newRegistrationCity" className="text-gray-300">Ciudad de Registro</Label>
                            <Input id="newRegistrationCity" value={newTeamForm.registrationCity} onChange={(e) => setNewTeamForm(prev => ({ ...prev, registrationCity: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                         <div>
                            <Label htmlFor="newRepresentativePhone" className="text-gray-300">Celular Representante Legal</Label>
                            <Input id="newRepresentativePhone" type="tel" value={newTeamForm.representativePhone} onChange={(e) => setNewTeamForm(prev => ({ ...prev, representativePhone: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                        <div>
                            <Label htmlFor="newClubEmail" className="text-gray-300">Correo Electrónico del Club</Label>
                            <Input id="newClubEmail" type="email" value={newTeamForm.clubEmail} onChange={(e) => setNewTeamForm(prev => ({ ...prev, clubEmail: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                        <div>
                            <Label htmlFor="newFoundationDate" className="text-gray-300">Fecha de Fundación</Label>
                            <Input id="newFoundationDate" type="date" value={newTeamForm.foundationDate} onChange={(e) => setNewTeamForm(prev => ({ ...prev, foundationDate: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="newCoachLimit" className="text-gray-300">Límite de Entrenadores</Label>
                            <Select value={newTeamForm.coachLimit} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, coachLimit: value }))}>
                                <SelectTrigger id="newCoachLimit" className="bg-gray-700 border-gray-600 text-gray-100 data-[placeholder]:text-gray-400 focus:ring-green-500"><SelectValue placeholder="Seleccionar límite..." /></SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                                    {coachLimitOptions.map(opt => <SelectItem key={opt} value={opt} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="newAthleteLimit" className="text-gray-300">Cantidad de Deportistas</Label>
                            <Select value={newTeamForm.athleteLimit} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, athleteLimit: value }))}>
                                <SelectTrigger id="newAthleteLimit" className="bg-gray-700 border-gray-600 text-gray-100 data-[placeholder]:text-gray-400 focus:ring-green-500"><SelectValue placeholder="Seleccionar cantidad..." /></SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                                    {athleteLimitOptions.map(opt => <SelectItem key={opt} value={opt} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="newSportType" className="text-gray-300">Tipo de Deporte</Label>
                            <Select value={newTeamForm.sportType} onValueChange={(value) => setNewTeamForm(prev => ({ ...prev, sportType: value }))}>
                                <SelectTrigger id="newSportType" className="bg-gray-700 border-gray-600 text-gray-100 data-[placeholder]:text-gray-400 focus:ring-green-500"><SelectValue placeholder="Seleccionar deporte..." /></SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                                    {sportOptions.map(sport => <SelectItem key={sport} value={sport} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{sport}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="newSocialMediaLink" className="text-gray-300">Link Red Social Principal</Label>
                            <Input id="newSocialMediaLink" type="url" value={newTeamForm.socialMediaLink} onChange={(e) => setNewTeamForm(prev => ({ ...prev, socialMediaLink: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="newTrainingVenues" className="text-gray-300">Sedes de Entrenamiento (Principal o listado)</Label>
                        <Textarea id="newTrainingVenues" value={newTeamForm.trainingVenues} onChange={(e) => setNewTeamForm(prev => ({ ...prev, trainingVenues: e.target.value }))} rows={2} placeholder="Ej: Coliseo Central, Cancha Barrio Sol" className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                    </div>
                    <div>
                        <Label htmlFor="newTeamLogo" className="text-gray-300 flex items-center"><Upload className="inline mr-1 h-4 w-4" />Logo del Equipo (Opcional, Máx. 1MB)</Label>
                        <Input id="newTeamLogo" type="file" accept="image/*" onChange={handleNewTeamLogoChange} className="bg-gray-700 border-gray-600 text-gray-300 file:text-gray-300 file:bg-gray-600 file:border-gray-500" />
                        {newTeamLogoPreview && <Image src={newTeamLogoPreview} alt="Vista previa nuevo logo" width={80} height={80} className="mt-2 rounded border border-gray-600 object-contain" />}
                    </div>
                    
                    <DialogFooter className="pt-4">
                        <DialogClose asChild><Button type="button" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">Cancelar</Button></DialogClose>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Crear Equipo</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md bg-gray-800/50 border-gray-700 text-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-gray-100">
            <Server className="h-5 w-5 text-green-400" />
            Resumen de Equipos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-400">Total de Equipos</p>
            <p className="text-3xl font-bold text-green-400">{teamStats.total}</p>
          </div>
          <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-400">Equipos Activos</p>
            <p className="text-3xl font-bold text-green-400">{teamStats.active}</p>
          </div>
          <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-400">Equipos Inactivos</p>
            <p className="text-3xl font-bold text-red-400">{teamStats.inactive}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg bg-gray-800/50 border-gray-700 text-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-100">Lista de Equipos Creados</CardTitle>
          <div className="flex items-center gap-2 pt-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, admin, ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm h-9 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No se encontraron equipos.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="[&_tr]:border-gray-700">
                  <TableRow>
                    <TableHead className="w-[80px] text-gray-300">Logo</TableHead>
                    <TableHead className="text-gray-300">Nombre Equipo</TableHead>
                    <TableHead className="text-gray-300">Admin Username</TableHead>
                    <TableHead className="text-gray-300">Ciudad de Registro</TableHead>
                    <TableHead className="w-[120px] text-gray-300">Estado</TableHead>
                    <TableHead className="text-right text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_tr]:border-gray-700">
                  {filteredTeams.map(team => (
                    <TableRow key={team.id} className={!team.isActive ? 'opacity-60 bg-gray-700/30 hover:bg-gray-700/40' : 'hover:bg-gray-700/30'}>
                      <TableCell>
                        <Avatar className="h-10 w-10 border-gray-600">
                          <AvatarImage src={team.logo || `https://placehold.co/60x60.png?text=${team.name.substring(0,1)}`} alt={team.name} data-ai-hint="team logo" />
                          <AvatarFallback className="bg-gray-600 text-gray-300">{team.name.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-gray-100">{team.name}</TableCell>
                      <TableCell className="text-gray-300">{team.adminUsername}</TableCell>
                      <TableCell className="text-gray-300">{team.registrationCity || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`status-switch-${team.id}`}
                            checked={team.isActive}
                            onCheckedChange={(checked) => handleToggleTeamStatusInList(team.id, checked)}
                            aria-label={`Estado de ${team.name}`}
                            className="h-5 w-9 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
                          />
                          <Badge variant={team.isActive ? "default" : "secondary"} className={team.isActive ? 'bg-green-600/20 text-green-300 border-green-500/50' : 'bg-gray-600/50 text-gray-300 border-gray-500/50'}>
                            {team.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" title="Ver Panel del Equipo" onClick={() => handleAccessTeam(team)} disabled={!team.isActive} className="text-green-400 hover:bg-gray-700 disabled:text-gray-500 disabled:hover:bg-transparent"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Editar Equipo" onClick={() => openEditTeamDialog(team)} className="text-gray-300 hover:bg-gray-700"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Reiniciar Contraseña Admin" onClick={() => openResetPasswordDialog(team)} className="text-yellow-400 hover:bg-gray-700"><KeyRound className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Eliminar Equipo" onClick={() => openDeleteTeamDialog(team)} className="text-red-400 hover:bg-gray-700"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {teamToEdit && (
        <Dialog open={isEditTeamDialogOpen} onOpenChange={(isOpen) => {
            setIsEditTeamDialogOpen(isOpen);
            if (!isOpen) { setTeamToEdit(null); setEditLogoPreview(null); }
          }}>
          <DialogContent className="sm:max-w-2xl bg-gray-800 border-gray-700 text-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-100">Editar Equipo: {teamToEdit.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditTeam} className="space-y-4 py-2 max-h-[75vh] overflow-y-auto pr-2">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editTeamName" className="text-gray-300">Nombre del Equipo <span className="text-red-400">*</span></Label>
                    <Input id="editTeamName" value={editTeamForm.name || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, name: e.target.value }))} required className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="editLegalRepresentativeName" className="text-gray-300">Nombre del Representante Legal</Label>
                    <Input id="editLegalRepresentativeName" value={editTeamForm.legalRepresentativeName || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, legalRepresentativeName: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="editRegistrationCity" className="text-gray-300">Ciudad de Registro</Label>
                    <Input id="editRegistrationCity" value={editTeamForm.registrationCity || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, registrationCity: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="editRepresentativePhone" className="text-gray-300">Celular Representante Legal</Label>
                    <Input id="editRepresentativePhone" type="tel" value={editTeamForm.representativePhone || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, representativePhone: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="editClubEmail" className="text-gray-300">Correo Electrónico del Club</Label>
                    <Input id="editClubEmail" type="email" value={editTeamForm.clubEmail || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, clubEmail: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="editFoundationDate" className="text-gray-300">Fecha de Fundación</Label>
                    <Input id="editFoundationDate" type="date" value={editTeamForm.foundationDate || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, foundationDate: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editCoachLimit" className="text-gray-300">Límite de Entrenadores</Label>
                    <Select value={editTeamForm.coachLimit || ''} onValueChange={(value) => setEditTeamForm(prev => ({ ...prev, coachLimit: value }))}>
                        <SelectTrigger id="editCoachLimit" className="bg-gray-700 border-gray-600 text-gray-100 data-[placeholder]:text-gray-400 focus:ring-green-500"><SelectValue placeholder="Seleccionar límite..." /></SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                            {coachLimitOptions.map(opt => <SelectItem key={opt} value={opt} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editAthleteLimit" className="text-gray-300">Cantidad de Deportistas</Label>
                    <Select value={editTeamForm.athleteLimit || ''} onValueChange={(value) => setEditTeamForm(prev => ({ ...prev, athleteLimit: value }))}>
                        <SelectTrigger id="editAthleteLimit" className="bg-gray-700 border-gray-600 text-gray-100 data-[placeholder]:text-gray-400 focus:ring-green-500"><SelectValue placeholder="Seleccionar cantidad..." /></SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                            {athleteLimitOptions.map(opt => <SelectItem key={opt} value={opt} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editSportType" className="text-gray-300">Tipo de Deporte</Label>
                    <Select value={editTeamForm.sportType || ''} onValueChange={(value) => setEditTeamForm(prev => ({ ...prev, sportType: value }))}>
                        <SelectTrigger id="editSportType" className="bg-gray-700 border-gray-600 text-gray-100 data-[placeholder]:text-gray-400 focus:ring-green-500"><SelectValue placeholder="Seleccionar deporte..." /></SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                            {sportOptions.map(sport => <SelectItem key={sport} value={sport} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{sport}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editSocialMediaLink" className="text-gray-300">Link Red Social Principal</Label>
                    <Input id="editSocialMediaLink" type="url" value={editTeamForm.socialMediaLink || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, socialMediaLink: e.target.value }))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
              </div>
              <div>
                <Label htmlFor="editTrainingVenues" className="text-gray-300">Sedes de Entrenamiento</Label>
                <Textarea id="editTrainingVenues" value={editTeamForm.trainingVenues || ''} onChange={(e) => setEditTeamForm(prev => ({ ...prev, trainingVenues: e.target.value }))} rows={2} placeholder="Ej: Coliseo Central, Cancha Barrio Sol" className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
              </div>
              <div>
                <Label htmlFor="editTeamLogo" className="text-gray-300 flex items-center"><Upload className="inline mr-1 h-4 w-4" />Logo del Equipo (Opcional, Máx. 1MB)</Label>
                <Input id="editTeamLogo" type="file" accept="image/*" onChange={handleEditTeamLogoChange} className="bg-gray-700 border-gray-600 text-gray-300 file:text-gray-300 file:bg-gray-600 file:border-gray-500" />
                {editLogoPreview && <Image src={editLogoPreview} alt="Vista previa logo" width={80} height={80} className="mt-2 rounded border border-gray-600 object-contain" />}
              </div>
              
              <div className="space-y-2 border-t border-gray-700 pt-4">
                <Label className="flex items-center gap-2 text-gray-300"><Power className="h-4 w-4" />Estado del Equipo</Label>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="editTeamIsActive"
                        checked={editTeamForm.isActive === undefined ? teamToEdit.isActive : editTeamForm.isActive}
                        onCheckedChange={(checked) => setEditTeamForm(prev => ({...prev, isActive: checked, inactivationDate: !checked && !prev.inactivationDate ? new Date().toISOString().split('T')[0] : (checked ? undefined : prev.inactivationDate) }))}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
                    />
                    <Label htmlFor="editTeamIsActive" className="text-gray-300">{(editTeamForm.isActive === undefined ? teamToEdit.isActive : editTeamForm.isActive) ? "Activo" : "Inactivo"}</Label>
                </div>
              </div>
              {!(editTeamForm.isActive === undefined ? teamToEdit.isActive : editTeamForm.isActive) && (
                <>
                    <div>
                        <Label htmlFor="editTeamStatusReason" className="text-gray-300">Motivo de Inactividad (Opcional)</Label>
                        <Textarea id="editTeamStatusReason" value={editTeamForm.statusReason || ''} onChange={(e) => setEditTeamForm(prev => ({...prev, statusReason: e.target.value}))} placeholder="Ej: Fin de temporada, Reestructuración..." className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500"/>
                    </div>
                    <div>
                        <Label htmlFor="editTeamInactivationDate" className="text-gray-300">Fecha de Inactivación</Label>
                        <Input id="editTeamInactivationDate" type="date" value={editTeamForm.inactivationDate || ''} onChange={(e) => setEditTeamForm(prev => ({...prev, inactivationDate: e.target.value}))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                    </div>
                </>
              )}
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">Cancelar</Button></DialogClose>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {teamToResetPassword && (
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700 text-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-100">Restablecer Contraseña para Admin de: {teamToResetPassword.name}</DialogTitle>
              <DialogDescription className="text-gray-400">Usuario: {teamToResetPassword.adminUsername}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetTeamAdminPassword} className="space-y-4 py-2">
              <div>
                <Label htmlFor="newTeamAdminPwd" className="text-gray-300">Nueva Contraseña <span className="text-red-400">*</span></Label>
                <Input id="newTeamAdminPwd" type="password" value={newTeamAdminPassword} onChange={(e) => setNewTeamAdminPassword(e.target.value)} required className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
              </div>
              <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">Cancelar</Button></DialogClose>
                <Button type="submit" variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">Restablecer Contraseña</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {teamToDelete && (
        <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
          <AlertDialogContent className="bg-gray-800 border-gray-700 text-gray-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-100">¿Eliminar Equipo "{teamToDelete.name}"?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Esta acción eliminará el equipo y su configuración de administrador. 
                <strong>¡Importante!</strong> Los datos asociados (atletas, entrenadores, etc.) NO se eliminarán automáticamente en esta versión. 
                Esta acción no se puede deshacer para el equipo en sí.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-600">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTeam} className="bg-red-500 hover:bg-red-600 text-white">Sí, Eliminar Equipo</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
