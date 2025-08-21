
'use client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, type FormEvent, type ChangeEvent, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { Save, UserPlus, Upload, Trash2, AlertTriangle } from 'lucide-react';
import type { TeamStorageItem } from '@/app/gestor-fenix/page';
import { volleyballCategories } from '@/app/atletas/page';

export interface CoachStorageItem {
  id: string;
  teamId?: string;
  firstName: string;
  lastName: string;
  name: string;
  documentId: string;
  birthDate: string;
  email: string;
  phone: string;
  eps: string;
  arl: string;
  avatar: string | null;
  assignedCategories: string[];
  specialty: string;
  experience: string;
  dataAiHint: string;
  teamAffiliation?: string;
}

const COACHES_STORAGE_KEY = 'coaches';
const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';
const COACH_PHOTO_STORAGE_KEY_PREFIX = 'coach_photo_';


export default function CoachRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [coachIdToEdit, setCoachIdToEdit] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eps, setEps] = useState('');
  const [arl, setArl] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [teamAffiliation, setTeamAffiliation] = useState('');
  const [assignedCategories, setAssignedCategories] = useState<string[]>([]);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

  useEffect(() => {
    if (user?.type === 'team_admin' && user.teamId && !searchParams.get('edit')) {
      try {
        const teamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
        const coachesString = localStorage.getItem(COACHES_STORAGE_KEY);
        if (teamsString) {
          const allTeams: TeamStorageItem[] = JSON.parse(teamsString);
          const currentTeam = allTeams.find(t => t.id === user.teamId);
          
          if (currentTeam?.coachLimit) {
            const limit = parseInt(currentTeam.coachLimit, 10);
            if (!isNaN(limit)) {
              const allCoaches: CoachStorageItem[] = coachesString ? JSON.parse(coachesString) : [];
              const teamCoachesCount = allCoaches.filter(c => c.teamId === user.teamId).length;
              if (teamCoachesCount >= limit) {
                setIsLimitReached(true);
                setLimitMessage(`Has alcanzado el límite de ${limit} entrenadores para tu equipo. No puedes registrar más.`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking coach limit:", error);
      }
    }
  }, [user, searchParams]);


  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditMode(true);
      setCoachIdToEdit(editId);
      try {
        const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
        if (storedCoachesString) {
          const storedCoaches: CoachStorageItem[] = JSON.parse(storedCoachesString);
          const coachToEdit = storedCoaches.find(c => c.id === editId);
          if (coachToEdit) {
            setFirstName(coachToEdit.firstName);
            setLastName(coachToEdit.lastName);
            setDocumentId(coachToEdit.documentId);
            setBirthDate(coachToEdit.birthDate);
            setEmail(coachToEdit.email);
            setPhone(coachToEdit.phone);
            setEps(coachToEdit.eps);
            setArl(coachToEdit.arl);
            setSpecialty(coachToEdit.specialty);
            setExperience(coachToEdit.experience);
            setTeamAffiliation(coachToEdit.teamAffiliation || '');
            setAssignedCategories(coachToEdit.assignedCategories || []);
            
            const photoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${editId}`;
            const storedPhoto = localStorage.getItem(photoKey);
            if (storedPhoto) {
              setProfilePhotoPreview(storedPhoto);
            }
          }
        }
      } catch (error) {
        console.error("Error loading coach for editing:", error);
        toast({ title: "Error", description: "No se pudo cargar la información del entrenador para editar.", variant: "destructive" });
        router.push('/entrenadores');
      }
    }
  }, [searchParams, router, toast]);

  const handleCategoryChange = (category: string, checked: boolean) => {
    setAssignedCategories(prev => 
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };
  
  const handleProfilePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Foto Demasiado Grande",
          description: "Por favor, selecciona una imagen de menos de 2MB.",
          variant: "destructive",
        });
        if (photoInputRef.current) photoInputRef.current.value = '';
        return;
      }
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLimitReached && !isEditMode) {
      toast({ title: "Límite Alcanzado", description: "No puedes registrar más entrenadores.", variant: "destructive" });
      return;
    }

    if (!firstName || !lastName || !documentId) {
      toast({ title: "Campos Obligatorios", description: "Nombre, Apellido y Documento son requeridos.", variant: "destructive" });
      return;
    }

    try {
      const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
      let coaches: Omit<CoachStorageItem, 'avatar' | 'name'>[] = storedCoachesString ? JSON.parse(storedCoachesString) : [];

      let photoDataUrl: string | null = profilePhotoPreview;
      if (profilePhotoFile) {
        photoDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(profilePhotoFile);
        });
      }
      
      if (isEditMode && coachIdToEdit) {
        let coachUpdated = false;
        coaches = coaches.map(coach => {
          if (coach.id === coachIdToEdit) {
            coachUpdated = true;
            return {
              ...coach,
              firstName,
              lastName,
              documentId,
              birthDate,
              email,
              phone,
              eps,
              arl,
              specialty,
              experience,
              teamAffiliation,
              assignedCategories,
              name: `${firstName} ${lastName}`.trim(),
            };
          }
          return coach;
        });

        if (coachUpdated) {
            localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(coaches));
            const photoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${coachIdToEdit}`;
            if (photoDataUrl) {
                localStorage.setItem(photoKey, photoDataUrl);
            } else {
                localStorage.removeItem(photoKey);
            }
            toast({ title: "Entrenador Actualizado", description: "La información del entrenador ha sido actualizada." });
            router.push('/entrenadores');
        } else {
            toast({ title: "Error", description: "No se encontró el entrenador para actualizar.", variant: "destructive" });
        }

      } else {
        // Create new coach
        const newCoachId = crypto.randomUUID();

        // New username generation logic
        let username = '';
        if (user?.type === 'team_admin' && user.currentTeamName) {
            const teamNamePrefix = user.currentTeamName.toLowerCase().replace(/\s+/g, '');
            const firstInitial = firstName.charAt(0).toLowerCase();
            const firstLastName = (lastName.split(' ')[0] || '').toLowerCase();
            username = `${teamNamePrefix}@${firstInitial}${firstLastName}`;
        } else { // Fallback for global admin
            const firstInitial = firstName.charAt(0).toLowerCase();
            const firstLastName = (lastName.split(' ')[0] || '').toLowerCase();
            username = `${firstInitial}${firstLastName}`;
        }
        
        const newCoachData = {
          id: newCoachId,
          teamId: user?.type === 'team_admin' ? user.teamId : undefined,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim(),
          documentId,
          birthDate,
          email,
          phone,
          eps,
          arl,
          specialty,
          experience,
          teamAffiliation,
          assignedCategories,
          dataAiHint: 'coach person',
        };
        
        coaches.push(newCoachData);
        localStorage.setItem(COACHES_STORAGE_KEY, JSON.stringify(coaches));

        if (photoDataUrl) {
            const photoKey = `${COACH_PHOTO_STORAGE_KEY_PREFIX}${newCoachId}`;
            localStorage.setItem(photoKey, photoDataUrl);
        }

        toast({
          title: "Entrenador Registrado",
          description: `Usuario: ${username} | Contraseña: (número de documento).`,
          duration: 7000,
        });
        router.push('/entrenadores');
      }
    } catch (error) {
      console.error("Error saving coach:", error);
      toast({ title: "Error al Guardar", description: "No se pudo guardar la información del entrenador.", variant: "destructive" });
    }
  };


  return (
    <AppLayout>
      <div className="flex justify-center">
        <Card className="w-full max-w-4xl shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                {isEditMode ? 'Editar Perfil del Entrenador' : 'Registro de Nuevo Entrenador'}
              </CardTitle>
              <CardDescription>
                {isEditMode ? 'Actualiza la información del entrenador.' : 'Completa los datos para registrar un nuevo entrenador en el sistema.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {isLimitReached && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5"/>
                  <div>
                    <h4 className="font-bold">Límite de Entrenadores Alcanzado</h4>
                    <p className="text-sm">{limitMessage}</p>
                  </div>
                </div>
              )}
              
              <fieldset disabled={isLimitReached && !isEditMode} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label htmlFor="firstName">Nombres <span className="text-destructive">*</span></Label>
                    <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="lastName">Apellidos <span className="text-destructive">*</span></Label>
                    <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label htmlFor="documentId">Documento de Identidad (Será la contraseña inicial) <span className="text-destructive">*</span></Label>
                    <Input id="documentId" value={documentId} onChange={e => setDocumentId(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                    <Input id="birthDate" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Teléfono de Contacto</Label>
                    <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label htmlFor="eps">EPS</Label>
                    <Input id="eps" value={eps} onChange={e => setEps(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="arl">ARL</Label>
                    <Input id="arl" value={arl} onChange={e => setArl(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label htmlFor="specialty">Especialidad Principal</Label>
                    <Input id="specialty" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ej: Fundamentos, Bloqueo, etc." />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="experience">Años de Experiencia</Label>
                    <Input id="experience" type="number" value={experience} onChange={e => setExperience(e.target.value)} placeholder="Ej: 5" />
                  </div>
                </div>
                
                <div className="space-y-1">
                    <Label htmlFor="teamAffiliation">Afiliación de Equipo/Club</Label>
                    <Input id="teamAffiliation" value={teamAffiliation} onChange={e => setTeamAffiliation(e.target.value)} placeholder="Ej: Selección Bogotá, Club Fénix" />
                </div>

                <div>
                  <Label>Categorías Asignadas</Label>
                  <div className="p-4 border rounded-md grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-1">
                    {volleyballCategories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={assignedCategories.includes(category)}
                          onCheckedChange={(checked) => handleCategoryChange(category, !!checked)}
                        />
                        <Label htmlFor={`cat-${category}`} className="font-normal">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="profilePhoto" className="flex items-center gap-1"><Upload className="h-4 w-4"/>Foto de Perfil (Opcional, Máx 2MB)</Label>
                  <Input id="profilePhoto" type="file" accept="image/*" onChange={handleProfilePhotoChange} ref={photoInputRef} />
                  <div className="mt-2 flex items-center gap-4">
                    {profilePhotoPreview && (
                      <div className="relative">
                        <Image src={profilePhotoPreview} alt="Vista previa" width={100} height={100} className="rounded-md border object-cover shadow" />
                        <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute -top-2 -right-2 rounded-full" onClick={handleRemovePhoto} title="Eliminar foto">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLimitReached && !isEditMode}>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? 'Guardar Cambios' : 'Registrar Entrenador'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
