
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { useState, useEffect, type ChangeEvent, type FormEvent, useRef } from 'react';
import type { CoachStorageItem } from '../../registro/entrenador/page';
import { Upload, KeyRound, Save, UserCog, Building, Shield, Palette } from 'lucide-react';
import type { TeamStorageItem } from '../../gestor-fenix/page';
import Link from 'next/link';

const COACHES_STORAGE_KEY = 'coaches';
const COACH_PHOTO_STORAGE_KEY_PREFIX = 'coach_photo_';
const CLUB_PROFILE_STORAGE_KEY = 'club_profile_v1';
const DEFAULT_CLUB_NAME_FALLBACK = 'Club Manager';
const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';


interface ClubProfile {
  name: string;
}

export default function ProfileConfigurationPage() {
  const { user, updateCurrentUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // For admin's own profile
  const [adminNameInput, setAdminNameInput] = useState<string>('');
  const [adminProfilePhotoPreview, setAdminProfilePhotoPreview] = useState<string | null>(null);
  const [newAdminProfilePhotoFile, setNewAdminProfilePhotoFile] = useState<File | null>(null);
  const adminPhotoInputRef = useRef<HTMLInputElement>(null);

  const [clubNameInput, setClubNameInput] = useState<string>('');
  const [adminNewPassword, setAdminNewPassword] = useState<string>('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState<string>('');


  // For coach's own profile management
  const [coachProfilePhotoPreview, setCoachProfilePhotoPreview] = useState<string | null>(null);
  const [newCoachProfilePhotoFile, setNewCoachProfilePhotoFile] = useState<File | null>(null);
  const coachPhotoInputRef = useRef<HTMLInputElement>(null);
  const [coachNewPassword, setCoachNewPassword] = useState('');
  const [coachConfirmPassword, setCoachConfirmPassword] = useState('');


  // For admin managing coach passwords
  const [coaches, setCoaches] = useState<CoachStorageItem[]>([]);
  const [selectedCoachIdForPassword, setSelectedCoachIdForPassword] = useState<string>('');
  const [newCoachPasswordInput, setNewCoachPasswordInput] = useState<string>('');
  
  // For team_admin changing their own password & profile
  const [teamAdminNewPassword, setTeamAdminNewPassword] = useState('');
  const [teamAdminConfirmPassword, setTeamAdminConfirmPassword] = useState('');
  const [teamAdminNameInput, setTeamAdminNameInput] = useState('');
  const [teamAdminLogoPreview, setTeamAdminLogoPreview] = useState<string | null>(null);
  const [newTeamAdminLogoFile, setNewTeamAdminLogoFile] = useState<File | null>(null);
  const teamAdminLogoInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setMounted(true);
    if (authIsLoading || !user) return;

    if (user.type === 'admin') {
      setAdminNameInput(user.name);
      setAdminProfilePhotoPreview(user.avatar || null); 
      
      try {
        const storedClubProfile = localStorage.getItem(CLUB_PROFILE_STORAGE_KEY);
        if (storedClubProfile) {
          const clubProfile: ClubProfile = JSON.parse(storedClubProfile);
          setClubNameInput(clubProfile.name || DEFAULT_CLUB_NAME_FALLBACK);
        } else {
          setClubNameInput(DEFAULT_CLUB_NAME_FALLBACK);
        }
      } catch (error) { console.error("Error loading club profile:", error); setClubNameInput(DEFAULT_CLUB_NAME_FALLBACK); }

      try {
        const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
        if (storedCoachesString) {
          setCoaches(JSON.parse(storedCoachesString));
        }
      } catch (error) { console.error("Error loading coaches for admin:", error); }

    } else if (user.type === 'coach' && user.id) {
      setCoachProfilePhotoPreview(user.avatar || null);
      if (!user.avatar) {
        const photoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${user.id}`;
        const storedPhoto = localStorage.getItem(photoKey);
        if (storedPhoto) {
          setCoachProfilePhotoPreview(storedPhoto);
        }
      }
    } else if (user.type === 'team_admin' && user.teamId) {
      setTeamAdminNameInput(user.currentTeamName || user.name);
      setTeamAdminLogoPreview(user.avatar || null);
    }
  }, [user, toast, authIsLoading]);

  // --- Photo Handling Functions ---
  const createPhotoChangeHandler = (setFile: (file: File | null) => void, setPreview: (url: string | null) => void, currentAvatar: string | null | undefined, inputRef: React.RefObject<HTMLInputElement>) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Foto Demasiado Grande", description: "Por favor, selecciona una imagen de menos de 2MB.", variant: "destructive" });
        if (inputRef.current) inputRef.current.value = '';
        setFile(null);
        setPreview(currentAvatar || null);
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.onerror = () => {
        toast({ title: "Error al leer archivo", description: "No se pudo procesar la imagen.", variant: "destructive" });
        setFile(null);
        setPreview(currentAvatar || null);
      }
      reader.readAsDataURL(file);
    } else {
      setFile(null);
      setPreview(currentAvatar || null);
    }
  };
  const handleAdminProfilePhotoChange = createPhotoChangeHandler(setNewAdminProfilePhotoFile, setAdminProfilePhotoPreview, user?.avatar, adminPhotoInputRef);
  const handleCoachProfilePhotoChange = createPhotoChangeHandler(setNewCoachProfilePhotoFile, setCoachProfilePhotoPreview, user?.avatar, coachPhotoInputRef);
  const handleTeamAdminLogoChange = createPhotoChangeHandler(setNewTeamAdminLogoFile, setTeamAdminLogoPreview, user?.avatar, teamAdminLogoInputRef);

  const createRemovePhotoHandler = (setFile: (file: File | null) => void, setPreview: (url: string | null) => void, inputRef: React.RefObject<HTMLInputElement>) => () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  const handleRemoveAdminPhoto = createRemovePhotoHandler(setNewAdminProfilePhotoFile, setAdminProfilePhotoPreview, adminPhotoInputRef);
  const handleRemoveCoachPhoto = createRemovePhotoHandler(setNewCoachProfilePhotoFile, setCoachProfilePhotoPreview, coachPhotoInputRef);
  const handleRemoveTeamAdminLogo = createRemovePhotoHandler(setNewTeamAdminLogoFile, setTeamAdminLogoPreview, teamAdminLogoInputRef);

  // --- Profile Save Functions ---
  const handleSaveAdminProfileInfo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user?.type !== 'admin' || !updateCurrentUser) return;

    let newAvatarForContext: string | null = user.avatar || null;
    if (newAdminProfilePhotoFile) {
      newAvatarForContext = await new Promise((resolve) => {
        const reader = new FileReader(); reader.onloadend = () => resolve(reader.result as string); reader.readAsDataURL(newAdminProfilePhotoFile);
      });
    } else if (adminProfilePhotoPreview === null && user.avatar !== null) {
      newAvatarForContext = null;
    }
    updateCurrentUser({ name: adminNameInput, avatar: newAvatarForContext });
    toast({ title: "Perfil de Administrador Guardado" });
    setNewAdminProfilePhotoFile(null);
    if (adminPhotoInputRef.current) adminPhotoInputRef.current.value = '';
  };
  
  const handleSaveTeamAdminProfileInfo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user?.type !== 'team_admin' || !user.teamId || !updateCurrentUser) return;

    let newLogoForContext: string | null = user.avatar || null;
    if (newTeamAdminLogoFile) {
       newLogoForContext = await new Promise((resolve) => {
          const reader = new FileReader(); reader.onloadend = () => resolve(reader.result as string); reader.readAsDataURL(newTeamAdminLogoFile);
       });
    } else if (teamAdminLogoPreview === null && user.avatar !== null) {
        newLogoForContext = null;
    }
    
    updateCurrentUser({ name: teamAdminNameInput, avatar: newLogoForContext });

    try {
        const storedTeamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
        if(storedTeamsString){
            let allTeams: TeamStorageItem[] = JSON.parse(storedTeamsString);
            const teamIndex = allTeams.findIndex(t => t.id === user.teamId);
            if(teamIndex > -1) {
                allTeams[teamIndex].name = teamAdminNameInput;
                allTeams[teamIndex].logo = newLogoForContext;
                localStorage.setItem(GESTOR_FENIX_TEAMS_STORAGE_KEY, JSON.stringify(allTeams));
            }
        }
        toast({ title: "Perfil del Equipo Actualizado" });
    } catch(error) {
        toast({ title: "Error al guardar perfil del equipo", variant: "destructive" });
    }
  };


  const handleSaveClubName = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user?.type !== 'admin') return;
    try {
      const clubProfileToStore: ClubProfile = { name: clubNameInput || DEFAULT_CLUB_NAME_FALLBACK };
      localStorage.setItem(CLUB_PROFILE_STORAGE_KEY, JSON.stringify(clubProfileToStore));
      toast({ title: "Nombre del Club Actualizado" });
      window.dispatchEvent(new CustomEvent('clubNameChanged'));
    } catch (error) { toast({ title: "Error al Guardar", variant: "destructive"}); }
  };
  
  // --- Password Change Functions ---
  const handleAdminChangeOwnPassword = () => { toast({ title: "Funcionalidad No Implementada" }); setAdminNewPassword(''); setAdminConfirmPassword(''); };

  const handleAdminChangeCoachPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCoachIdForPassword || !newCoachPasswordInput) {
      toast({ title: "Campos Incompletos", variant: "destructive" }); return;
    }
    try {
      const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoachesString) {
        let existingCoaches: CoachStorageItem[] = JSON.parse(storedCoachesString);
        const coachIndex = existingCoaches.findIndex(c => c.id === selectedCoachIdForPassword);
        if (coachIndex > -1) {
          existingCoaches[coachIndex].documentId = newCoachPasswordInput; // password is the documentId
          localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(existingCoaches));
          toast({ title: "Contraseña de Entrenador Actualizada" });
          setSelectedCoachIdForPassword(''); setNewCoachPasswordInput('');
        }
      }
    } catch (error) { toast({ title: "Error al Actualizar Contraseña", variant: "destructive" }); }
  };
  
  const handleTeamAdminChangePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user?.type !== 'team_admin' || !user.id) return;
    if (!teamAdminNewPassword || teamAdminNewPassword !== teamAdminConfirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden o están vacías.", variant: "destructive" }); return;
    }
    try {
      const storedTeamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
      if (storedTeamsString) {
        let allTeams: TeamStorageItem[] = JSON.parse(storedTeamsString);
        const teamIndex = allTeams.findIndex(t => t.adminUsername === user.id);
        if (teamIndex > -1) {
          allTeams[teamIndex].adminPassword = teamAdminNewPassword;
          allTeams[teamIndex].passwordChangeRequired = false;
          localStorage.setItem(GESTOR_FENIX_TEAMS_STORAGE_KEY, JSON.stringify(allTeams));
          updateCurrentUser({ passwordChangeRequired: false });
          toast({ title: "Contraseña Actualizada" });
          setTeamAdminNewPassword(''); setTeamAdminConfirmPassword('');
        }
      }
    } catch (error) { toast({ title: "Error al Actualizar", variant: "destructive" }); }
  };

  const handleCoachChangePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user?.type !== 'coach' || !user.id) return;
    if (!coachNewPassword || coachNewPassword !== coachConfirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden o están vacías.", variant: "destructive" }); return;
    }
     try {
      const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoachesString) {
        let allCoaches: CoachStorageItem[] = JSON.parse(storedCoachesString);
        const coachIndex = allCoaches.findIndex(c => c.id === user.id);
        if (coachIndex > -1) {
          allCoaches[coachIndex].documentId = coachNewPassword; // Password is the document ID
          localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(allCoaches));
          toast({ title: "Contraseña Actualizada" });
          setCoachNewPassword(''); setCoachConfirmPassword('');
        } else {
          toast({ title: "Error", description: "No se encontró tu perfil para actualizar la contraseña.", variant: "destructive" });
        }
      }
    } catch (error) { toast({ title: "Error al Actualizar", variant: "destructive" }); }
  };


  if (authIsLoading || !mounted || !user) {
    return <AppLayout><div className="text-center p-10">Cargando...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2">
              <UserCog className="h-7 w-7" /> Configuración General
            </CardTitle>
            <CardDescription>Gestiona tu información personal, acceso y la apariencia de la plataforma.</CardDescription>
          </CardHeader>
        </Card>
        
        {/* --- TEAM ADMIN: MANDATORY PASSWORD CHANGE --- */}
        {user.type === 'team_admin' && user.passwordChangeRequired && (
          <Card className="border-destructive ring-2 ring-destructive/50">
            <CardHeader><CardTitle className="text-xl flex items-center gap-2 text-destructive"><KeyRound className="h-5 w-5" /> ¡Acción Requerida!</CardTitle><CardDescription className="text-destructive/90">Por seguridad, debes cambiar tu contraseña inicial.</CardDescription></CardHeader>
            <form onSubmit={handleTeamAdminChangePassword}><CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="teamAdminNewPassword">Nueva Contraseña</Label><Input id="teamAdminNewPassword" type="password" value={teamAdminNewPassword} onChange={(e) => setTeamAdminNewPassword(e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="teamAdminConfirmPassword">Confirmar Nueva Contraseña</Label><Input id="teamAdminConfirmPassword" type="password" value={teamAdminConfirmPassword} onChange={(e) => setTeamAdminConfirmPassword(e.target.value)} required /></div>
            </CardContent><CardFooter><Button type="submit" variant="destructive"><Save className="mr-2 h-4 w-4" /> Guardar Contraseña</Button></CardFooter></form>
          </Card>
        )}

        {/* --- GLOBAL ADMIN VIEW --- */}
        {user.type === 'admin' && (
          <>
            <Card><CardHeader><CardTitle className="text-xl flex items-center gap-2"><UserCog className="h-5 w-5 text-accent" /> Mi Perfil de Administrador</CardTitle></CardHeader><CardContent className="space-y-6">
                <form onSubmit={handleSaveAdminProfileInfo} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="adminNameInput">Nombre de Administrador</Label><Input id="adminNameInput" type="text" value={adminNameInput} onChange={(e) => setAdminNameInput(e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="adminProfilePhoto">Foto de Perfil (Máx. 2MB)</Label><Input id="adminProfilePhoto" type="file" accept="image/*" onChange={handleAdminProfilePhotoChange} ref={adminPhotoInputRef} /></div>
                  {adminProfilePhotoPreview && <div className="mt-2"><Label className="block mb-1">Vista Previa:</Label><Image src={adminProfilePhotoPreview} alt="Vista previa de perfil admin" width={120} height={120} className="rounded-md border object-cover shadow" /></div>}
                  {(adminProfilePhotoPreview || newAdminProfilePhotoFile) && <Button variant="outline" size="sm" type="button" onClick={handleRemoveAdminPhoto} className="mt-2">Eliminar Foto</Button>}
                  <Button type="submit" size="sm"><Save className="mr-2 h-4 w-4" /> Guardar Nombre/Foto</Button>
                </form>
                <form onSubmit={handleSaveClubName} className="space-y-4 border-t pt-6">
                  <div className="space-y-2"><Label htmlFor="clubNameInput" className="flex items-center gap-1"><Building className="h-4 w-4"/>Nombre del Club Deportivo</Label><Input id="clubNameInput" type="text" value={clubNameInput} onChange={(e) => setClubNameInput(e.target.value)} placeholder={DEFAULT_CLUB_NAME_FALLBACK} /></div>
                  <Button type="submit" size="sm"><Save className="mr-2 h-4 w-4" /> Guardar Nombre del Club</Button>
                </form>
                <div className="space-y-4 border-t pt-6">
                  <Label className="flex items-center gap-1"><Shield className="h-4 w-4"/>Cambiar Mi Contraseña de Administrador</Label>
                   <div className="space-y-2"><Label htmlFor="adminNewPassword">Nueva Contraseña</Label><Input id="adminNewPassword" type="password" value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} /></div>
                   <div className="space-y-2"><Label htmlFor="adminConfirmPassword">Confirmar Contraseña</Label><Input id="adminConfirmPassword" type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} /></div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAdminChangeOwnPassword}><KeyRound className="mr-2 h-4 w-4"/> Cambiar Mi Contraseña</Button>
                  <p className="text-xs text-muted-foreground italic">Nota: No funcional en prototipo.</p>
                </div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-xl flex items-center gap-2"><KeyRound className="h-5 w-5 text-destructive" /> Gestionar Contraseñas de Entrenadores</CardTitle><CardDescription>Cambia la contraseña (número de documento) de un entrenador.</CardDescription></CardHeader><form onSubmit={handleAdminChangeCoachPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="selectCoachForPassword">Seleccionar Entrenador</Label><Select value={selectedCoachIdForPassword} onValueChange={setSelectedCoachIdForPassword}><SelectTrigger id="selectCoachForPassword"><SelectValue placeholder="Elige un entrenador" /></SelectTrigger><SelectContent>{coaches.length > 0 ? coaches.map(coach => (<SelectItem key={coach.id} value={coach.id}>{coach.name}</SelectItem>)) : (<div className="px-2 py-1.5 text-sm text-muted-foreground text-center">No hay entrenadores.</div>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label htmlFor="newCoachPasswordInput">Nueva Contraseña (Nuevo Documento ID)</Label><Input id="newCoachPasswordInput" type="text" value={newCoachPasswordInput} onChange={(e) => setNewCoachPasswordInput(e.target.value)} /></div>
                </CardContent><CardFooter><Button type="submit" variant="destructive" disabled={!selectedCoachIdForPassword || !newCoachPasswordInput}><Save className="mr-2 h-4 w-4" /> Cambiar Contraseña</Button></CardFooter></form>
            </Card>
          </>
        )}

        {/* --- TEAM ADMIN VIEW (Not changing password) --- */}
        {user.type === 'team_admin' && !user.passwordChangeRequired && (
            <>
            <Card><CardHeader><CardTitle className="text-xl flex items-center gap-2 text-primary"><UserCog className="h-5 w-5" /> Perfil del Equipo</CardTitle><CardDescription>Gestiona el nombre y el logo de tu equipo.</CardDescription></CardHeader><form onSubmit={handleSaveTeamAdminProfileInfo}>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="teamAdminNameInput">Nombre del Equipo</Label><Input id="teamAdminNameInput" type="text" value={teamAdminNameInput} onChange={(e) => setTeamAdminNameInput(e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="teamAdminLogo">Logo del Equipo (Máx. 2MB)</Label><Input id="teamAdminLogo" type="file" accept="image/*" onChange={handleTeamAdminLogoChange} ref={teamAdminLogoInputRef} /></div>
                    {teamAdminLogoPreview && <div className="mt-2"><Label className="block mb-1">Vista Previa:</Label><Image src={teamAdminLogoPreview} alt="Vista previa logo equipo" width={120} height={120} className="rounded-md border object-cover shadow" /></div>}
                    {(teamAdminLogoPreview || newTeamAdminLogoFile) && <Button variant="outline" size="sm" type="button" onClick={handleRemoveTeamAdminLogo} className="mt-2">Eliminar Logo</Button>}
                </CardContent><CardFooter><Button type="submit"><Save className="mr-2 h-4 w-4" /> Guardar Cambios del Equipo</Button></CardFooter></form>
            </Card>
            <Card><CardHeader><CardTitle className="text-xl flex items-center gap-2 text-primary"><Shield className="h-5 w-5" /> Cambiar mi Contraseña</CardTitle></CardHeader><form onSubmit={handleTeamAdminChangePassword}>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label htmlFor="teamAdminNewPassword">Nueva Contraseña</Label><Input id="teamAdminNewPassword" type="password" value={teamAdminNewPassword} onChange={(e) => setTeamAdminNewPassword(e.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="teamAdminConfirmPassword">Confirmar Nueva Contraseña</Label><Input id="teamAdminConfirmPassword" type="password" value={teamAdminConfirmPassword} onChange={(e) => setTeamAdminConfirmPassword(e.target.value)} required /></div>
                </CardContent><CardFooter><Button type="submit"><Save className="mr-2 h-4 w-4" /> Actualizar Contraseña</Button></CardFooter></form>
            </Card>
            </>
        )}
        
        {/* --- COACH VIEW --- */}
        {user.type === 'coach' && (
          <>
          <Card><CardHeader><CardTitle className="text-xl flex items-center gap-2"><Upload className="h-5 w-5 text-accent" /> Mi Foto de Perfil</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="coachProfilePhotoFile">Nueva Foto (Máx. 2MB)</Label><Input id="coachProfilePhotoFile" type="file" accept="image/*" onChange={handleCoachProfilePhotoChange} ref={coachPhotoInputRef} /></div>
              {coachProfilePhotoPreview && <div className="mt-2"><Label className="block mb-1">Vista Previa:</Label><Image src={coachProfilePhotoPreview} alt="Vista previa de perfil coach" width={120} height={120} className="rounded-md border object-cover shadow" /></div>}
              {(coachProfilePhotoPreview || newCoachProfilePhotoFile) && <Button variant="outline" size="sm" type="button" onClick={handleRemoveCoachPhoto} className="mt-2">Eliminar Foto</Button>}
          </CardContent><CardFooter><Button onClick={() => {/* Logic to save photo already handled in context, maybe just show toast */ toast({title: 'Foto Guardada'})}}><Save className="mr-2 h-4 w-4"/> Guardar Foto</Button></CardFooter></Card>
          
          <Card><CardHeader><CardTitle className="text-xl flex items-center gap-2"><KeyRound className="h-5 w-5" /> Cambiar Mi Contraseña</CardTitle><CardDescription>Tu contraseña es tu número de documento de identidad.</CardDescription></CardHeader><form onSubmit={handleCoachChangePassword}>
              <CardContent className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="coachNewPassword">Nueva Contraseña (Documento)</Label><Input id="coachNewPassword" type="password" value={coachNewPassword} onChange={e => setCoachNewPassword(e.target.value)} required /></div>
                  <div className="space-y-2"><Label htmlFor="coachConfirmPassword">Confirmar Nueva Contraseña</Label><Input id="coachConfirmPassword" type="password" value={coachConfirmPassword} onChange={e => setCoachConfirmPassword(e.target.value)} required /></div>
              </CardContent><CardFooter><Button type="submit"><Save className="mr-2 h-4 w-4"/> Actualizar Contraseña</Button></CardFooter></form>
          </Card>
          </>
        )}
        
        {/* --- THEME SECTION for all roles --- */}
        <Card><CardHeader><CardTitle className="text-xl flex items-center gap-2"><Palette className="h-5 w-5" /> Apariencia Visual</CardTitle><CardDescription>Personaliza la paleta de colores de la plataforma.</CardDescription></CardHeader><CardContent>
            <p className="text-sm text-muted-foreground">Puedes cambiar el tema visual de la aplicación en la página de configuración de tema.</p>
        </CardContent><CardFooter><Button asChild variant="outline"><Link href="/configuracion/tema">Ir a Temas</Link></Button></CardFooter></Card>
      </div>
    </AppLayout>
  );
}
