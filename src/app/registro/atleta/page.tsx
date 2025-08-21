
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, type FormEvent, type ChangeEvent, useRef } from 'react';
import Image from 'next/image';
import { Save, UserPlus, Upload, Trash2, AlertTriangle, FileText, Waves, Wind, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { volleyballCategories } from '@/app/atletas/page'; 
import type { TeamStorageItem } from '@/app/gestor-fenix/page';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface AthleteStorageItem {
  id: string;
  teamId?: string; 
  firstName: string;
  lastName: string;
  name: string; 
  birthDate: string;
  birthPlace: string;
  gender: string;
  avatar: string | null; 
  entryDate: string; 
  email: string;
  phone: string;
  address: string;
  schoolName: string;
  position: string;
  team: string; 
  eps: string;
  epsAffiliationType: string;
  bloodType: string;
  pathologies: string;
  conditions: string;
  weight: string;
  height: string;
  isDisplaced: boolean;
  ethnicity: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianRelationship: string;
  guardianPhone: string;
  guardianEmail: string;
  age: number | null;
  category: string;
  imc: number | null;
  imcStatus: string;
  dataAiHint: string;
  termsAccepted: boolean; 
  isActive: boolean;
  statusReason?: string;
  swimmingStyles?: string[];
  athleticEvents?: string[];
  skatingModalities?: string[];
  sportType?: string; // New field
}

const ATHLETES_STORAGE_KEY = 'athletes';
const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';

const futsalaPositions = [
  "Portero (guardameta)",
  "Cierre (defensa central, último hombre)",
  "Alas: derecha e izquierda",
  "Pívot (delantero, referencia ofensiva)"
];

const footballPositions = [
  "Portero / Arquero / Guardameta", "Sweeper keeper (portero-líbero)", "Defensa central (zaguero)", 
  "Defensa central zurdo", "Defensa central diestro", "Líbero (barredor)", "Stoper", 
  "Lateral derecho", "Lateral izquierdo", "Carrilero derecho", "Carrilero izquierdo", 
  "Defensa lateral-volante", "Mediocentro defensivo / Pivote / Contención", "Doble pivote", 
  "Mediocentro mixto", "Mediocentro organizador (regista)", "Mediocentro ofensivo (enganche, “10”)",
  "Interior derecho", "Interior izquierdo", "Volante derecho", "Volante izquierdo", 
  "Extremo derecho (winger)", "Extremo izquierdo", "Ala derecha", "Ala izquierda", 
  "Media punta (segundo delantero)", "Delantero centro (9, ariete)", "Segundo delantero", 
  "Delantero interior derecho", "Delantero interior izquierdo", "Falso 9", "Punta", "Tanque (delantero físico)"
];

const volleyballPositions = [
  "Armador / Colocador (Setter)",
  "Opuesto / Atacante opuesto (Right side hitter)",
  "Punta / Receptor atacante (Outside hitter)",
  "Central / Bloqueador central (Middle blocker)",
  "Libero (especialista defensivo)",
  "Defensa (Back row player, sin rol fijo)",
  "Especialista en servicio (Service specialist)"
];

const basketballPositions = [
  "Base (Point guard, PG)",
  "Escolta (Shooting guard, SG)",
  "Alero (Small forward, SF)",
  "Ala-pívot (Power forward, PF)",
  "Pívot (Center, C)",
  "Sexto hombre (jugador polivalente desde la banca)",
  "Combo guard (base-escolta híbrido)",
  "Stretch four (ala-pívot con buen tiro exterior)",
  "Point forward (alero que organiza el juego)",
  "Swingman (puede jugar como escolta o alero)"
];

const baseballPositions = [
  "Lanzador / Pitcher",
  "Abridor (Starting pitcher)",
  "Relevista (Relief pitcher)",
  "Cerrador (Closer)",
  "Receptor / Catcher",
  "Primera base (1B)",
  "Segunda base (2B)",
  "Campocorto / Shortstop (SS)",
  "Tercera base (3B)",
  "Jardinero izquierdo (LF)",
  "Jardinero central (CF)",
  "Jardinero derecho (RF)",
  "Bateador designado (DH, en Liga Americana)",
  "Utility player (jugador que puede cubrir varias posiciones)"
];

const rugbyPositions = [
    "Pilar izquierdo (Loosehead prop)",
    "Hooker (Talonador)",
    "Pilar derecho (Tighthead prop)",
    "Segunda línea izquierda (Lock 4)",
    "Segunda línea derecha (Lock 5)",
    "Ala ciega (Blindside flanker)",
    "Ala abierta (Openside flanker)",
    "Número 8 (Eightman)",
    "Medio scrum / Medio melé (Scrum-half)",
    "Apertura (Fly-half)",
    "Wing izquierdo (Ala)",
    "Centro interior (Inside centre)",
    "Centro exterior (Outside centre)",
    "Wing derecho (Ala)",
    "Fullback (Zaguero)"
];

const tennisPositions = [
  "Individual",
  "Dobles",
  "Dobles Mixtos"
];

const swimmingStyles = [
    "Mariposa", "Espalda", "Crol", "Pecho", "Habilidades motrices basicas acuaticas"
];

const gymnasticsFocuses = [
    "Hipertrofia (musculación sarcoplasmática)",
    "Fuerza máxima (hipertrofia sarcomérica / powerlifting)",
    "Resistencia muscular",
    "Definición / pérdida de grasa",
    "Híbrido (fuerza + hipertrofia + resistencia)",
    "Funcional",
    "CrossFit / HIIT",
    "Recuperación / rehabilitación",
    "Atletismo / rendimiento deportivo específico",
    "Potencia"
];

const athleticEvents = [
    "Velocidad (100m, 200m, 400m)",
    "Velocidad Resistencia (400m, 800m)",
    "Fondo Resistencia Aeróbica (5k, 10k, 21k, 42k)",
    "Recreativo"
];

const skatingModalities = [
    "Velocista (sprints cortos: 200m, 500m)",
    "Medio fondista (distancias intermedias: 1000m – 5000m)",
    "Fondista (largas distancias: 10.000m, maratones, ultramaratones)",
    "Patinador de relevos (estrategia en pista corta o equipos)",
    "Patinador de pista (óvalos, indoor)",
    "Patinador de ruta (circuitos en carretera o al aire libre)"
];


const volleyballCategoriesWithYears = volleyballCategories.map(cat => {
    const year = new Date().getFullYear();
    if (cat.includes("Sub-8")) return { value: cat, label: `${cat} (Nacidos ${year - 8}-adelante)` };
    if (cat.includes("Sub-10")) return { value: cat, label: `${cat} (Nacidos ${year - 10}-${year - 9})` };
    if (cat.includes("Sub-12")) return { value: cat, label: `${cat} (Nacidos ${year - 12}-${year - 11})` };
    if (cat.includes("Sub-14")) return { value: cat, label: `${cat} (Nacidos ${year - 14}-${year - 13})` };
    if (cat.includes("Sub-16")) return { value: cat, label: `${cat} (Nacidos ${year - 16}-${year - 15})` };
    if (cat.includes("Sub-18")) return { value: cat, label: `${cat} (Nacidos ${year - 18}-${year - 17})` };
    if (cat.includes("Sub-21")) return { value: cat, label: `${cat} (Nacidos ${year - 21}-${year - 19})` };
    return { value: cat, label: cat };
});


const initialFormState: Omit<AthleteStorageItem, 'id' | 'teamId' | 'name' | 'avatar' | 'age' | 'imc' | 'imcStatus' | 'dataAiHint' | 'isActive'> = {
  firstName: '',
  lastName: '',
  birthDate: '',
  birthPlace: '',
  gender: '',
  entryDate: new Date().toISOString().split('T')[0],
  email: '',
  phone: '',
  address: '',
  schoolName: '',
  position: '',
  team: '',
  eps: '',
  epsAffiliationType: '',
  bloodType: '',
  pathologies: '',
  conditions: '',
  weight: '',
  height: '',
  isDisplaced: false,
  ethnicity: '',
  guardianFirstName: '',
  guardianLastName: '',
  guardianRelationship: '',
  guardianPhone: '',
  guardianEmail: '',
  category: '',
  termsAccepted: false,
  swimmingStyles: [],
  athleticEvents: [],
  skatingModalities: [],
  sportType: '',
};

const TermsAndConditionsContent = ({ clubName, onAccept, onScroll, canAccept }: { clubName: string; onAccept: () => void; onScroll: React.UIEventHandler<HTMLDivElement>; canAccept: boolean; }) => (
    <>
        <DialogHeader>
            <DialogTitle className="text-2xl">Términos, Condiciones y Autorizaciones</DialogTitle>
            <DialogDescription>
                Por favor, lee detenidamente antes de aceptar. El consentimiento para menores de edad debe ser otorgado por su representante legal.
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] rounded-md border p-4" onScroll={onScroll}>
            <div className="space-y-4 text-sm text-foreground/80">
                <p>Yo, en mi nombre (si soy mayor de edad) o en calidad de representante legal del menor de edad que se inscribe, declaro que la información proporcionada es veraz y completa. Al aceptar estos términos, manifiesto libre, expresa e inequívocamente mi consentimiento sobre los siguientes puntos:</p>
                
                <h4 className="font-bold text-base text-foreground">1. AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES</h4>
                <p>De conformidad con la Ley Estatutaria 1581 de 2012 de Habeas Data y su Decreto Reglamentario 1377 de 2013, autorizo a <strong>{clubName}</strong> (en adelante "el Club") para que mis datos personales (y/o los del menor que represento), incluyendo datos sensibles como información de salud, sean recolectados, almacenados, usados, circulados, suprimidos y, en general, tratados para las siguientes finalidades:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Realizar el proceso de inscripción, afiliación y gestión administrativa y deportiva dentro del Club.</li>
                    <li>Contactarme para enviar comunicaciones informativas, deportivas, administrativas y comerciales relacionadas con las actividades del Club.</li>
                    <li>Gestionar la participación en entrenamientos, competencias, torneos y otros eventos deportivos.</li>
                    <li>Gestionar la expedición de carnets y documentos de identificación deportiva.</li>
                    <li>En caso de emergencia médica, contactar a los acudientes y proporcionar al personal médico la información de salud relevante.</li>
                    <li>Realizar informes estadísticos y seguimiento al rendimiento deportivo y físico.</li>
                </ul>
                <p>Declaro que he sido informado de que tengo derecho a conocer, actualizar, rectificar y suprimir mis datos personales, así como a revocar esta autorización, a través de los canales de comunicación dispuestos por el Club. La política de tratamiento de datos del Club se encuentra disponible para consulta.</p>

                <h4 className="font-bold text-base text-foreground">2. AUTORIZACIÓN DE USO DE IMAGEN, FOTOGRAFÍAS Y VIDEOS</h4>
                <p>Autorizo de manera voluntaria, explícita e irrevocable al Club para usar mi imagen (o la del menor que represento) en fotografías, procedimientos análogos a la fotografía y producciones audiovisuales (videos) tomadas durante entrenamientos, competencias, eventos y actividades relacionadas con el Club. Esta autorización se extiende a la utilización, publicación, exposición y difusión de dicho material con fines pedagógicos, informativos, periodísticos y de promoción institucional del Club, a través de medios de comunicación físicos o digitales, tales como redes sociales (Facebook, Instagram, etc.), página web oficial, folletos, carteles y otros medios de divulgación, sin que esto genere derecho a contraprestación económica alguna.</p>
                <p>Esta autorización se concede a título gratuito, por tiempo indefinido y para ser utilizada en territorio nacional e internacional.</p>

                <h4 className="font-bold text-base text-foreground">3. DECLARACIÓN DE CONOCIMIENTO Y ACEPTACIÓN DE RIESGOS</h4>
                <p>Reconozco que la práctica del voleibol, como toda actividad deportiva, implica riesgos inherentes de lesiones, contusiones, fracturas u otros percances físicos. Declaro que el atleta se encuentra en condiciones de salud aptas para la práctica deportiva y me comprometo a informar al Club sobre cualquier condición médica preexistente o sobreviniente que pueda afectar su participación. Exonero de responsabilidad al Club, sus directivos, entrenadores y personal por las lesiones que puedan ocurrir durante la práctica deportiva, siempre y cuando no medie dolo o culpa grave por parte de estos.</p>
                
                <h4 className="font-bold text-base text-foreground">4. COMPROMISO CON EL REGLAMENTO INTERNO</h4>
                <p>Me comprometo a leer, comprender y acatar el reglamento interno de disciplina, convivencia y funcionamiento del Club, así como las decisiones de sus órganos directivos y cuerpo técnico, promoviendo los valores de respeto, disciplina, juego limpio y compañerismo.</p>

                <p className="font-bold pt-2">Al hacer clic en "Aceptar y Continuar", certifico que he leído la totalidad de este documento, comprendo su alcance y acepto todas las condiciones aquí estipuladas.</p>
            </div>
        </ScrollArea>
        <DialogFooter>
            <Button onClick={onAccept} disabled={!canAccept}>
                Aceptar y Continuar
            </Button>
        </DialogFooter>
    </>
);


export default function AthleteRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [athleteIdToEdit, setAthleteIdToEdit] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [isLimitReached, setIsLimitReached] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [canAcceptTerms, setCanAcceptTerms] = useState(false);
  
  const [teamSportType, setTeamSportType] = useState<string | null>(null);

  const handleScrollTerms = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 5) { // +5 for a little buffer
      setCanAcceptTerms(true);
    }
  };

  const handleAcceptTerms = () => {
    setFormState(prev => ({ ...prev, termsAccepted: true }));
    setIsTermsDialogOpen(false);
  };


  useEffect(() => {
    if (user?.type === 'team_admin' && user.teamId) {
      try {
        const teamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
        const athletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
        if (teamsString) {
          const allTeams: TeamStorageItem[] = JSON.parse(teamsString);
          const currentTeam = allTeams.find(t => t.id === user.teamId);
          
          if(currentTeam) {
            setFormState(prev => ({...prev, sportType: currentTeam.sportType || ''}));
            setTeamSportType(currentTeam.sportType || null);
          }

          if (currentTeam?.athleteLimit) {
            const limit = parseInt(currentTeam.athleteLimit, 10);
            if (!isNaN(limit)) {
              const allAthletes: AthleteStorageItem[] = athletesString ? JSON.parse(athletesString) : [];
              const teamAthletesCount = allAthletes.filter(a => a.teamId === user.teamId).length;
              if (teamAthletesCount >= limit) {
                setIsLimitReached(true);
                setLimitMessage(`Has alcanzado el límite de ${limit} atletas para tu equipo. No puedes registrar más.`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking athlete limit:", error);
      }
    }
  }, [user]);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditMode(true);
      setAthleteIdToEdit(editId);
      try {
        const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
        if (storedAthletesString) {
          const storedAthletes: AthleteStorageItem[] = JSON.parse(storedAthletesString);
          const athleteToEdit = storedAthletes.find(c => c.id === editId);
          if (athleteToEdit) {
            setFormState({
                firstName: athleteToEdit.firstName || '',
                lastName: athleteToEdit.lastName || '',
                birthDate: athleteToEdit.birthDate || '',
                birthPlace: athleteToEdit.birthPlace || '',
                gender: athleteToEdit.gender || '',
                entryDate: athleteToEdit.entryDate || '',
                email: athleteToEdit.email || '',
                phone: athleteToEdit.phone || '',
                address: athleteToEdit.address || '',
                schoolName: athleteToEdit.schoolName || '',
                position: athleteToEdit.position || '',
                team: athleteToEdit.team || '',
                eps: athleteToEdit.eps || '',
                epsAffiliationType: athleteToEdit.epsAffiliationType || '',
                bloodType: athleteToEdit.bloodType || '',
                pathologies: athleteToEdit.pathologies || '',
                conditions: athleteToEdit.conditions || '',
                weight: athleteToEdit.weight || '',
                height: athleteToEdit.height || '',
                isDisplaced: athleteToEdit.isDisplaced || false,
                ethnicity: athleteToEdit.ethnicity || '',
                guardianFirstName: athleteToEdit.guardianFirstName || '',
                guardianLastName: athleteToEdit.guardianLastName || '',
                guardianRelationship: athleteToEdit.guardianRelationship || '',
                guardianPhone: athleteToEdit.guardianPhone || '',
                guardianEmail: athleteToEdit.guardianEmail || '',
                category: athleteToEdit.category || '',
                termsAccepted: athleteToEdit.termsAccepted || false,
                swimmingStyles: athleteToEdit.swimmingStyles || [],
                athleticEvents: athleteToEdit.athleticEvents || [],
                skatingModalities: athleteToEdit.skatingModalities || [],
                sportType: athleteToEdit.sportType || '',
            });
            setAvatarPreview(athleteToEdit.avatar || null);
             if (athleteToEdit.teamId) {
                const teamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
                if (teamsString) {
                    const allTeams: TeamStorageItem[] = JSON.parse(teamsString);
                    const athleteTeam = allTeams.find(t => t.id === athleteToEdit.teamId);
                    if(athleteTeam) setTeamSportType(athleteTeam.sportType || null);
                }
            } else {
                 setTeamSportType(null); // Atleta global
            }
          }
        }
      } catch (error) {
        console.error("Error loading athlete for editing:", error);
        toast({ title: "Error", description: "No se pudo cargar la información del atleta para editar.", variant: "destructive" });
        router.push('/atletas');
      }
    }
  }, [searchParams, router, toast]);
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({...prev, [name]: value}));
  };
  
  const handleSelectChange = (name: keyof typeof formState, value: string) => {
     setFormState(prev => ({...prev, [name]: value}));
  }
  
  const handleCheckboxChange = (name: keyof typeof formState, checked: boolean) => {
     setFormState(prev => ({...prev, [name]: checked}));
  }

  const handleSwimmingStyleChange = (style: string, checked: boolean) => {
    setFormState(prev => {
        const currentStyles = prev.swimmingStyles || [];
        const newStyles = checked 
            ? [...currentStyles, style]
            : currentStyles.filter(s => s !== style);
        return {...prev, swimmingStyles: newStyles };
    });
  }

   const handleAthleticEventChange = (event: string, checked: boolean) => {
    setFormState(prev => {
        const currentEvents = prev.athleticEvents || [];
        const newEvents = checked 
            ? [...currentEvents, event]
            : currentEvents.filter(e => e !== event);
        return {...prev, athleticEvents: newEvents };
    });
  }

  const handleSkatingModalityChange = (modality: string, checked: boolean) => {
    setFormState(prev => {
        const currentModalities = prev.skatingModalities || [];
        const newModalities = checked 
            ? [...currentModalities, modality]
            : currentModalities.filter(m => m !== modality);
        return {...prev, skatingModalities: newModalities };
    });
  }

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Foto Demasiado Grande",
          description: "Por favor, selecciona una imagen de menos de 2MB.",
          variant: "destructive",
        });
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const calculateIMC = (weightStr: string, heightStr: string): { imc: number | null, imcStatus: string } => {
    const weight = parseFloat(weightStr);
    const height = parseFloat(heightStr);
    if (isNaN(weight) || isNaN(height) || height <= 0) {
      return { imc: null, imcStatus: 'No calculado' };
    }
    const imcValue = weight / (height * height);
    let status = 'No calculado';
    if (imcValue < 18.5) status = 'Bajo Peso';
    else if (imcValue < 25) status = 'Normal';
    else if (imcValue < 30) status = 'Sobrepeso';
    else status = 'Obesidad';
    return { imc: imcValue, imcStatus: status };
  };


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLimitReached && !isEditMode) {
      toast({ title: "Límite Alcanzado", description: "No puedes registrar más atletas.", variant: "destructive" });
      return;
    }
    if (!formState.firstName || !formState.lastName || !formState.category) {
      toast({ title: "Campos Obligatorios", description: "Nombres, Apellidos y Categoría son requeridos.", variant: "destructive" });
      return;
    }
    if (!formState.termsAccepted) {
       toast({ title: "Términos y Condiciones", description: "Debes aceptar los términos y condiciones para registrar al atleta.", variant: "destructive" });
       return;
    }

    try {
      const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
      let athletes: AthleteStorageItem[] = storedAthletesString ? JSON.parse(storedAthletesString) : [];

      let finalAvatarUrl: string | null = avatarPreview;
      if (avatarFile) {
        finalAvatarUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
      }

      const { imc, imcStatus } = calculateIMC(formState.weight, formState.height);
      const birthDateObj = formState.birthDate ? new Date(formState.birthDate) : null;
      const age = birthDateObj ? new Date().getFullYear() - birthDateObj.getFullYear() - (new Date().getMonth() < birthDateObj.getMonth() || (new Date().getMonth() === birthDateObj.getMonth() && new Date().getDate() < birthDateObj.getDate()) ? 1 : 0) : null;

      if (isEditMode && athleteIdToEdit) {
        let athleteUpdated = false;
        athletes = athletes.map(athlete => {
          if (athlete.id === athleteIdToEdit) {
            athleteUpdated = true;
            return {
              ...athlete,
              ...formState,
              name: `${formState.firstName} ${formState.lastName}`.trim(),
              avatar: finalAvatarUrl,
              imc,
              imcStatus,
              age,
              dataAiHint: formState.gender === 'Masculino' ? 'male athlete' : formState.gender === 'Femenino' ? 'female athlete' : 'athlete person',
            };
          }
          return athlete;
        });

        if (athleteUpdated) {
          localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(athletes));
          toast({ title: "Atleta Actualizado", description: "La información del atleta ha sido actualizada." });
          router.push('/atletas');
        } else {
          toast({ title: "Error", description: "No se encontró el atleta para actualizar.", variant: "destructive" });
        }
      } else {
        const newAthleteId = crypto.randomUUID();
        const newAthlete: AthleteStorageItem = {
          id: newAthleteId,
          teamId: user?.type === 'team_admin' ? user.teamId : undefined,
          name: `${formState.firstName} ${formState.lastName}`.trim(),
          ...formState,
          avatar: finalAvatarUrl,
          imc,
          imcStatus,
          age,
          isActive: true,
          dataAiHint: formState.gender === 'Masculino' ? 'male athlete' : formState.gender === 'Femenino' ? 'female athlete' : 'athlete person',
        };
        athletes.push(newAthlete);
        localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(athletes));
        toast({ title: "Atleta Registrado", description: `Se ha registrado a ${newAthlete.name}.` });
        router.push('/atletas');
      }
    } catch (error) {
      console.error("Error saving athlete:", error);
      toast({ title: "Error al Guardar", description: "No se pudo guardar la información del atleta.", variant: "destructive" });
    }
  };


  const renderSportSpecificInput = () => {
    let positionList: string[] | null = null;
    let placeholder = "Escribir posición...";
    let label = "Posición Principal";
    
    const sportToRender = teamSportType || formState.sportType;
    
    if (sportToRender === 'Fútbol') {
        positionList = footballPositions;
        placeholder = "Seleccionar posición de fútbol...";
    } else if (sportToRender === 'Voleibol') {
        positionList = volleyballPositions;
        placeholder = "Seleccionar posición de voleibol...";
    } else if (sportToRender === 'Baloncesto') {
        positionList = basketballPositions;
        placeholder = "Seleccionar posición de baloncesto...";
    } else if (sportToRender === 'Béisbol') {
        positionList = baseballPositions;
        placeholder = "Seleccionar posición de béisbol...";
    } else if (sportToRender === 'Rugby') {
        positionList = rugbyPositions;
        placeholder = "Seleccionar posición de rugby...";
    } else if (sportToRender === 'Futsala') {
        positionList = futsalaPositions;
        placeholder = "Seleccionar posición de futsala...";
    } else if (sportToRender === 'Tenis') {
        positionList = tennisPositions;
        label = "Modalidad de Juego";
        placeholder = "Seleccionar modalidad...";
    } else if (sportToRender === 'Gimnasio') {
        positionList = gymnasticsFocuses;
        placeholder = "Seleccionar enfoque principal...";
        label = "Enfoque Principal";
    } else if (sportToRender === 'Natación') {
        return (
            <div className="space-y-2">
                <Label className="flex items-center gap-1"><Waves className="h-4 w-4"/>Estilos Dominantes</Label>
                <div className="p-4 border rounded-md grid grid-cols-2 md:grid-cols-3 gap-4">
                    {swimmingStyles.map(style => (
                        <div key={style} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`style-${style}`} 
                                checked={formState.swimmingStyles?.includes(style)}
                                onCheckedChange={(checked) => handleSwimmingStyleChange(style, !!checked)}
                            />
                            <Label htmlFor={`style-${style}`} className="font-normal">{style}</Label>
                        </div>
                    ))}
                </div>
            </div>
        );
    } else if (sportToRender === 'Atletismo') {
        return (
            <div className="space-y-2">
                <Label className="flex items-center gap-1"><Activity className="h-4 w-4"/>Especialidades del Atleta</Label>
                <div className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                    {athleticEvents.map(event => (
                        <div key={event} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`event-${event.replace(/\s+/g, '-')}`} 
                                checked={formState.athleticEvents?.includes(event)}
                                onCheckedChange={(checked) => handleAthleticEventChange(event, !!checked)}
                            />
                            <Label htmlFor={`event-${event.replace(/\s+/g, '-')}`} className="font-normal">{event}</Label>
                        </div>
                    ))}
                </div>
            </div>
        );
    } else if (sportToRender === 'Patinaje') {
        return (
            <div className="space-y-2">
                <Label className="flex items-center gap-1"><Wind className="h-4 w-4"/>Modalidades del Patinador</Label>
                <div className="p-4 border rounded-md grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skatingModalities.map(modality => (
                        <div key={modality} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`modality-${modality.replace(/\s+/g, '-')}`} 
                                checked={formState.skatingModalities?.includes(modality)}
                                onCheckedChange={(checked) => handleSkatingModalityChange(modality, !!checked)}
                            />
                            <Label htmlFor={`modality-${modality.replace(/\s+/g, '-')}`} className="font-normal">{modality}</Label>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    if (positionList) {
        return (
            <div className="space-y-1">
                <Label htmlFor="position">{label}</Label>
                <Select name="position" value={formState.position} onValueChange={(value) => handleSelectChange('position', value)}>
                    <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
                    <SelectContent>
                        {positionList.map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        );
    }
    
    return (
        <div className="space-y-1">
            <Label htmlFor="position">{label}</Label>
            <Input id="position" name="position" value={formState.position} onChange={handleInputChange} placeholder={placeholder}/>
        </div>
    );
};


  return (
    <AppLayout>
      <div className="flex justify-center">
        <Card className="w-full max-w-4xl shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                {isEditMode ? 'Editar Perfil del Atleta' : 'Registro de Nuevo Atleta'}
              </CardTitle>
              <CardDescription>
                {isEditMode ? 'Actualiza la información del atleta.' : 'Completa los datos para registrar un nuevo atleta en el sistema.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {isLimitReached && !isEditMode && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-md flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5"/>
                  <div>
                    <h4 className="font-bold">Límite de Atletas Alcanzado</h4>
                    <p className="text-sm">{limitMessage}</p>
                  </div>
                </div>
              )}

              <fieldset disabled={isLimitReached && !isEditMode}>
                {/* Personal Info */}
                <section>
                  <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-2">I. Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="firstName">Nombres <span className="text-destructive">*</span></Label>
                      <Input id="firstName" name="firstName" value={formState.firstName} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName">Apellidos <span className="text-destructive">*</span></Label>
                      <Input id="lastName" name="lastName" value={formState.lastName} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                      <Input id="birthDate" name="birthDate" type="date" value={formState.birthDate} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="birthPlace">Lugar de Nacimiento</Label>
                      <Input id="birthPlace" name="birthPlace" value={formState.birthPlace} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gender">Género</Label>
                      <Select name="gender" value={formState.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar género..."/></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                              <SelectItem value="Prefiero no decirlo">Prefiero no decirlo</SelectItem>
                          </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="entryDate">Fecha de Ingreso</Label>
                      <Input id="entryDate" name="entryDate" type="date" value={formState.entryDate} onChange={handleInputChange} />
                    </div>
                  </div>
                </section>

                {/* Contact Info */}
                <section className="mt-8">
                  <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-2">II. Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1">
                          <Label htmlFor="email">Correo Electrónico</Label>
                          <Input id="email" name="email" type="email" value={formState.email} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="phone">Teléfono de Contacto</Label>
                          <Input id="phone" name="phone" type="tel" value={formState.phone} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                          <Label htmlFor="address">Dirección de Residencia</Label>
                          <Input id="address" name="address" value={formState.address} onChange={handleInputChange} />
                      </div>
                  </div>
                </section>

                {/* Sports and Health Info */}
                <section className="mt-8">
                  <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-2">III. Datos Deportivos y de Salud</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1">
                          <Label htmlFor="category">Categoría <span className="text-destructive">*</span></Label>
                          <Select name="category" value={formState.category} onValueChange={(value) => handleSelectChange('category', value)} required>
                              <SelectTrigger><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                              <SelectContent>
                                  {volleyballCategoriesWithYears.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                      
                      {(!teamSportType && !isEditMode) && (
                          <div className="space-y-1">
                              <Label htmlFor="sportType">Tipo de Deporte</Label>
                              <Input id="sportType" name="sportType" value={formState.sportType || ''} onChange={handleInputChange} placeholder="Ej: Voleibol, Fútbol..." />
                          </div>
                      )}

                      {renderSportSpecificInput()}

                      { teamSportType !== 'Natación' && teamSportType !== 'Atletismo' && teamSportType !== 'Gimnasio' && teamSportType !== 'Tenis' && teamSportType !== 'Patinaje' && (
                        <div className="space-y-1">
                            <Label htmlFor="team">Equipo/Grupo</Label>
                            <Input id="team" name="team" value={formState.team} onChange={handleInputChange} />
                        </div>
                      )}

                      <div className="space-y-1">
                          <Label htmlFor="schoolName">Institución Educativa</Label>
                          <Input id="schoolName" name="schoolName" value={formState.schoolName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="weight">Peso (kg)</Label>
                          <Input id="weight" name="weight" type="number" step="0.1" value={formState.weight} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="height">Altura (m)</Label>
                          <Input id="height" name="height" type="number" step="0.01" value={formState.height} onChange={handleInputChange} placeholder="Ej: 1.75"/>
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="eps">EPS</Label>
                          <Input id="eps" name="eps" value={formState.eps} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="epsAffiliationType">Tipo de Afiliación EPS</Label>
                          <Select name="epsAffiliationType" value={formState.epsAffiliationType} onValueChange={(value) => handleSelectChange('epsAffiliationType', value)}>
                              <SelectTrigger><SelectValue placeholder="Seleccionar tipo..."/></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Cotizante">Cotizante</SelectItem>
                                  <SelectItem value="Beneficiario">Beneficiario</SelectItem>
                                  <SelectItem value="Subsidiado">Subsidiado</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="bloodType">Tipo de Sangre</Label>
                          <Input id="bloodType" name="bloodType" value={formState.bloodType} onChange={handleInputChange} />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 gap-y-4 mt-4">
                      <div className="space-y-1">
                          <Label htmlFor="pathologies">Alergias o Patologías</Label>
                          <Textarea id="pathologies" name="pathologies" value={formState.pathologies} onChange={handleInputChange} rows={2} placeholder="Indicar si aplica"/>
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="conditions">Condiciones Médicas o Medicamentos</Label>
                          <Textarea id="conditions" name="conditions" value={formState.conditions} onChange={handleInputChange} rows={2} placeholder="Indicar si aplica"/>
                      </div>
                  </div>
                </section>

                {/* Additional Info */}
                  <section className="mt-8">
                      <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-2">IV. Información Adicional</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div className="space-y-1">
                              <Label htmlFor="ethnicity">Etnia</Label>
                              <Input id="ethnicity" name="ethnicity" value={formState.ethnicity} onChange={handleInputChange} />
                          </div>
                          <div className="flex items-center space-x-2 pt-6">
                              <Checkbox id="isDisplaced" name="isDisplaced" checked={formState.isDisplaced} onCheckedChange={(checked) => handleCheckboxChange('isDisplaced', !!checked)} />
                              <Label htmlFor="isDisplaced" className="font-normal">¿Es víctima de desplazamiento?</Label>
                          </div>
                      </div>
                  </section>

                {/* Guardian Info */}
                <section className="mt-8">
                  <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-2">V. Datos del Acudiente (si es menor de edad)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1">
                          <Label htmlFor="guardianFirstName">Nombres del Acudiente</Label>
                          <Input id="guardianFirstName" name="guardianFirstName" value={formState.guardianFirstName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="guardianLastName">Apellidos del Acudiente</Label>
                          <Input id="guardianLastName" name="guardianLastName" value={formState.guardianLastName} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="guardianRelationship">Parentesco</Label>
                          <Input id="guardianRelationship" name="guardianRelationship" value={formState.guardianRelationship} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1">
                          <Label htmlFor="guardianPhone">Teléfono del Acudiente</Label>
                          <Input id="guardianPhone" name="guardianPhone" type="tel" value={formState.guardianPhone} onChange={handleInputChange} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                          <Label htmlFor="guardianEmail">Email del Acudiente</Label>
                          <Input id="guardianEmail" name="guardianEmail" type="email" value={formState.guardianEmail} onChange={handleInputChange} />
                      </div>
                  </div>
                </section>

                {/* Photo and Terms */}
                <section className="mt-8">
                  <h3 className="text-lg font-semibold text-primary mb-3 border-b pb-2">VI. Foto y Consentimientos</h3>
                  <div>
                      <Label htmlFor="avatar" className="flex items-center gap-1 mb-2"><Upload className="h-4 w-4"/>Foto de Perfil (Opcional, Máx 2MB)</Label>
                      <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} ref={avatarInputRef} />
                      <div className="mt-2 flex items-center gap-4">
                        {avatarPreview && (
                          <div className="relative">
                            <Image src={avatarPreview} alt="Vista previa" width={100} height={100} className="rounded-md border object-cover shadow" />
                            <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute -top-2 -right-2 rounded-full" onClick={handleRemoveAvatar} title="Eliminar foto">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                     <div className="flex items-start space-x-3 mt-6">
                            <Checkbox id="termsAccepted" name="termsAccepted" checked={formState.termsAccepted} onCheckedChange={(checked) => handleCheckboxChange('termsAccepted', !!checked)} />
                            <div className="grid gap-1.5 leading-none">
                                <label htmlFor="termsAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    He leído y acepto los Términos y Condiciones <span className="text-destructive">*</span>
                                </label>
                                 <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="link" className="p-0 h-auto justify-start text-sm" type="button">
                                           <FileText className="mr-1 h-4 w-4"/> Leer Términos y Condiciones Completos
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                         <TermsAndConditionsContent 
                                            clubName={user?.currentTeamName || 'El Club'}
                                            onAccept={handleAcceptTerms}
                                            onScroll={handleScrollTerms}
                                            canAccept={canAcceptTerms}
                                         />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                </section>
              </fieldset>

            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLimitReached && !isEditMode}>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? 'Guardar Cambios' : 'Registrar Atleta'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
