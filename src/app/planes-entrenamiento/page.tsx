
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, CalendarIcon, Target, Edit, Trash2, GripVertical, Users2, Users as UsersIcon, Settings2, Palette, Check } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, addDays, startOfWeek, endOfWeek, eachWeekOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CoachStorageItem } from '../registro/entrenador/page';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { volleyballCategories } from '@/app/atletas/page';

interface SesionEntrenamiento {
  id: string;
  tipo: string;
  descripcion?: string;
  diaSemana?: number; 
}

interface Microciclo {
  id: string;
  numeroSemanaGlobal: number; 
  fechaInicioSemana: string;
  fechaFinSemana: string;
  sesiones: SesionEntrenamiento[];
  objetivoSemanal?: string;
}

interface Mesociclo {
  id: string;
  numeroMes: number; 
  nombreMes: string; 
  microciclos: Microciclo[];
  entrenadorEncargadoId?: string;
  entrenadorEncargadoNombre?: string;
  categoriasAsignadas?: string[];
}

interface Macrociclo {
  id: string;
  teamId?: string; // Nuevo campo
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  objetivoPrincipal?: string;
  mesociclos: Mesociclo[];
  categoriasAsignadas: string[]; 
  entrenadoresEncargados: Array<{ id: string; name: string; }>; 
  colorClassName?: string;
}

const tiposDeEntrenamiento = [
  "Fuerza", "Técnica", "Velocidad", "Resistencia", "Tácticos", 
  "Técnico-Tácticos", "Emocionales", "Esparcimiento", 
  "Pruebas Físicas", "Pruebas Técnicas", "Pruebas de Juego"
];

const macrocicloColorOptions = [
  { name: 'Predeterminado', className: 'bg-card hover:bg-primary/5', swatchClass: 'bg-muted border-border' },
  { name: 'Rojo Claro', className: 'bg-red-100 dark:bg-red-900/60 border border-red-200 dark:border-red-700/60 text-red-900 dark:text-red-100 hover:bg-red-200/80 dark:hover:bg-red-800/70', swatchClass: 'bg-red-300 border-red-500' },
  { name: 'Verde Claro', className: 'bg-green-100 dark:bg-green-900/60 border border-green-200 dark:border-green-700/60 text-green-900 dark:text-green-100 hover:bg-green-200/80 dark:hover:bg-green-800/70', swatchClass: 'bg-green-300 border-green-500' },
  { name: 'Azul Claro', className: 'bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700/60 text-blue-900 dark:text-blue-100 hover:bg-blue-200/80 dark:hover:bg-blue-800/70', swatchClass: 'bg-blue-300 border-blue-500' },
  { name: 'Amarillo Claro', className: 'bg-yellow-100 dark:bg-yellow-800/60 border border-yellow-200 dark:border-yellow-700/60 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200/80 dark:hover:bg-yellow-700/70', swatchClass: 'bg-yellow-300 border-yellow-500' },
  { name: 'Púrpura Claro', className: 'bg-purple-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700/60 text-purple-900 dark:text-purple-100 hover:bg-purple-200/80 dark:hover:bg-purple-800/70', swatchClass: 'bg-purple-300 border-purple-500' },
];


const MACROCYCLE_STORAGE_KEY = 'macrociclosV3'; 
const COACHES_STORAGE_KEY = 'coaches';
const MAX_SESIONES_PER_MICRO = 5;

export default function TrainingPlansPage() {
  const [macrociclos, setMacrociclos] = useState<Macrociclo[]>([]);
  const [entrenadores, setEntrenadores] = useState<CoachStorageItem[]>([]);
  const [isMacrocicloDialogOpen, setIsMacrocicloDialogOpen] = useState(false);
  const [isSesionDialogOpen, setIsSesionDialogOpen] = useState(false);
  const [isMesocicloConfigDialogOpen, setIsMesocicloConfigDialogOpen] = useState(false);
  
  const [isEditMacrocicloDialogOpen, setIsEditMacrocicloDialogOpen] = useState(false);
  const [macrocicloToEdit, setMacrocicloToEdit] = useState<Macrociclo | null>(null);

  const { user } = useAuth();
  
  const [currentMacrocicloData, setCurrentMacrocicloData] = useState({
    nombre: '',
    fechaInicio: new Date(),
    objetivoPrincipal: '',
    categoriasAsignadas: [] as string[],
    entrenadoresEncargadosIds: [] as string[], 
    colorClassName: macrocicloColorOptions[0].className,
  });

  const [currentSesionData, setCurrentSesionData] = useState<{
    macrocicloId: string | null;
    mesocicloId: string | null;
    microcicloId: string | null;
    sesionId?: string; 
    tipo: string;
    descripcion: string;
  }>({
    macrocicloId: null,
    mesocicloId: null,
    microcicloId: null,
    tipo: '',
    descripcion: ''
  });

  const [currentMesocicloConfigData, setCurrentMesocicloConfigData] = useState<{
    macrocicloId: string;
    mesocicloId: string;
    entrenadorEncargadoId: string; 
    categoriasAsignadas: string[]; 
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedMacrociclosString = localStorage.getItem(MACROCYCLE_STORAGE_KEY);
      if (storedMacrociclosString) {
        const allMacrociclos: Macrociclo[] = JSON.parse(storedMacrociclosString);
        let visibleMacrociclos: Macrociclo[] = [];

        if (user?.type === 'team_admin' && user.teamId) {
          visibleMacrociclos = allMacrociclos.filter(m => m.teamId === user.teamId);
        } else if (user?.type === 'admin') { 
           visibleMacrociclos = allMacrociclos.filter(m => !m.teamId); 
        } else if (user?.type === 'coach') {
            visibleMacrociclos = allMacrociclos.filter(m => !m.teamId);
        }
        setMacrociclos(visibleMacrociclos);
      }
    } catch (error) {
      console.error("Error loading macrociclos from localStorage:", error);
      toast({ title: "Error", description: "No se pudieron cargar los planes.", variant: "destructive" });
    }

    try {
      const storedCoachesString = localStorage.getItem(COACHES_STORAGE_KEY);
      if (storedCoachesString) {
         const allCoaches: CoachStorageItem[] = JSON.parse(storedCoachesString);
         if (user?.type === 'team_admin' && user.teamId) {
            setEntrenadores(allCoaches.filter(c => c.teamId === user.teamId));
         } else if (user?.type === 'admin' || user?.type === 'coach') {
            setEntrenadores(allCoaches.filter(c => !c.teamId)); // Admin y coach ven coaches "globales"
         } else {
            setEntrenadores([]);
         }
      }
    } catch (error) {
      console.error("Error loading coaches from localStorage:", error);
      toast({ title: "Error", description: "No se pudieron cargar los entrenadores para la selección.", variant: "destructive" });
    }
  }, [toast, user]);

  const saveMacrociclos = (updatedMacrociclos: Macrociclo[]) => {
    try {
      const storedMacrociclosString = localStorage.getItem(MACROCYCLE_STORAGE_KEY);
      let allSystemMacrociclos: Macrociclo[] = storedMacrociclosString ? JSON.parse(storedMacrociclosString) : [];
      let finalMacrociclosToStore: Macrociclo[];
      
      const macrociclosFromCurrentUserView = updatedMacrociclos;
      const macrocicloIdsFromCurrentUser = new Set(macrociclosFromCurrentUserView.map(m => m.id));
      
      const otherMacrociclos = allSystemMacrociclos.filter(m => {
          if (user?.type === 'team_admin' && user.teamId) {
              return m.teamId !== user.teamId;
          }
          return !!m.teamId; // Keep team-specific if user is admin/coach
      });
      finalMacrociclosToStore = [...otherMacrociclos, ...macrociclosFromCurrentUserView];
      
      localStorage.setItem(MACROCYCLE_STORAGE_KEY, JSON.stringify(finalMacrociclosToStore));
      
      // Update local state based on role visibility
      let visibleMacrociclos: Macrociclo[] = [];
      if (user?.type === 'team_admin' && user.teamId) {
        visibleMacrociclos = finalMacrociclosToStore.filter(m => m.teamId === user.teamId);
      } else if (user?.type === 'admin' || user?.type === 'coach') { 
        visibleMacrociclos = finalMacrociclosToStore.filter(m => !m.teamId); 
      }
      setMacrociclos(visibleMacrociclos);
    } catch (error) {
      console.error("Error saving macrociclos to localStorage:", error);
      toast({ title: "Error", description: "No se pudo guardar el plan.", variant: "destructive" });
    }
  };


  const handleCreateMacrociclo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { nombre, fechaInicio, objetivoPrincipal, categoriasAsignadas, entrenadoresEncargadosIds, colorClassName } = currentMacrocicloData;

    if (!nombre || !fechaInicio) {
      toast({ title: "Error", description: "Nombre y Fecha de Inicio son obligatorios.", variant: "destructive"});
      return;
    }
     if (categoriasAsignadas.length === 0) {
      toast({ title: "Advertencia", description: "Es recomendable asignar al menos una categoría al macrociclo.", variant: "default" });
    }
    if (entrenadoresEncargadosIds.length === 0) {
      toast({ title: "Advertencia", description: "Es recomendable asignar al menos un entrenador al macrociclo.", variant: "default" });
    }

    const selectedCoaches = entrenadores
      .filter(ent => entrenadoresEncargadosIds.includes(ent.id))
      .map(ent => ({ id: ent.id, name: ent.name }));

    const fechaFinMacrociclo = addMonths(fechaInicio, 3);
    const newMesociclos: Mesociclo[] = [];
    let semanaGlobalCounter = 1;

    for (let i = 0; i < 3; i++) { 
      const inicioMesociclo = addMonths(fechaInicio, i);
      const finMesociclo = addMonths(inicioMesociclo, 1);
      const newMicrociclos: Microciclo[] = [];
      
      const weeksInMesociclo = eachWeekOfInterval({
        start: inicioMesociclo,
        end: addDays(finMesociclo, -1) 
      }, { weekStartsOn: 1 });

      for (let j = 0; j < 4; j++) {
        const inicioSemana = j < weeksInMesociclo.length ? startOfWeek(weeksInMesociclo[j], { weekStartsOn: 1 }) : addDays(startOfWeek(weeksInMesociclo[weeksInMesociclo.length-1], { weekStartsOn: 1 }), 7*(j - weeksInMesociclo.length +1 ));
        const finSemana = endOfWeek(inicioSemana, { weekStartsOn: 1 });
        
        newMicrociclos.push({
          id: crypto.randomUUID(),
          numeroSemanaGlobal: semanaGlobalCounter++,
          fechaInicioSemana: format(inicioSemana, 'yyyy-MM-dd'),
          fechaFinSemana: format(finSemana, 'yyyy-MM-dd'),
          sesiones: [],
          objetivoSemanal: `Objetivo Semana ${j + 1} del Mes ${i + 1}`
        });
      }

      newMesociclos.push({
        id: crypto.randomUUID(),
        numeroMes: i + 1,
        nombreMes: `Mes ${i + 1}: ${format(inicioMesociclo, 'MMMM yyyy', { locale: es })}`,
        microciclos: newMicrociclos,
      });
    }
    
    const newMacrociclo: Macrociclo = {
      id: crypto.randomUUID(),
      teamId: user?.type === 'team_admin' ? user.teamId : undefined,
      nombre,
      fechaInicio: format(fechaInicio, 'yyyy-MM-dd'),
      fechaFin: format(fechaFinMacrociclo, 'yyyy-MM-dd'),
      objetivoPrincipal,
      mesociclos: newMesociclos,
      categoriasAsignadas, 
      entrenadoresEncargados: selectedCoaches, 
      colorClassName: colorClassName || macrocicloColorOptions[0].className,
    };

    saveMacrociclos([...macrociclos, newMacrociclo]);
    toast({ title: "Macrociclo Creado", description: `El macrociclo "${nombre}" ha sido creado.` });
    setIsMacrocicloDialogOpen(false);
    setCurrentMacrocicloData({ nombre: '', fechaInicio: new Date(), objetivoPrincipal: '', categoriasAsignadas: [], entrenadoresEncargadosIds: [], colorClassName: macrocicloColorOptions[0].className });
  };

  const handleOpenEditMacrociclo = (macrociclo: Macrociclo) => {
    setMacrocicloToEdit({
      ...macrociclo,
      entrenadoresEncargados: macrociclo.entrenadoresEncargados || [],
      categoriasAsignadas: macrociclo.categoriasAsignadas || [],
      colorClassName: macrociclo.colorClassName || macrocicloColorOptions[0].className,
    });
    setIsEditMacrocicloDialogOpen(true);
  };

  const handleUpdateMacrociclo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!macrocicloToEdit) return;

    const selectedCoaches = entrenadores
      .filter(ent => macrocicloToEdit.entrenadoresEncargados.some(current => current.id === ent.id))
      .map(ent => ({ id: ent.id, name: ent.name }));

    const updatedMacrociclo: Macrociclo = {
      ...macrocicloToEdit,
      entrenadoresEncargados: selectedCoaches,
    };
    
    const updatedList = macrociclos.map(m => m.id === updatedMacrociclo.id ? updatedMacrociclo : m);
    saveMacrociclos(updatedList);
    toast({ title: "Macrociclo Actualizado", description: "Los cambios han sido guardados." });
    setIsEditMacrocicloDialogOpen(false);
    setMacrocicloToEdit(null);
  };

  const handleDeleteMacrociclo = (macrocicloId: string) => {
    const updated = macrociclos.filter(m => m.id !== macrocicloId);
    saveMacrociclos(updated);
    toast({ title: "Macrociclo Eliminado", description: "El plan ha sido eliminado." });
  };

  const openSesionDialog = (macrocicloId: string, mesocicloId: string, microcicloId: string, sesion?: SesionEntrenamiento) => {
    setCurrentSesionData({
      macrocicloId,
      mesocicloId,
      microcicloId,
      sesionId: sesion?.id,
      tipo: sesion?.tipo || '',
      descripcion: sesion?.descripcion || ''
    });
    setIsSesionDialogOpen(true);
  };

  const handleSaveSesion = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { macrocicloId, mesocicloId, microcicloId, sesionId, tipo, descripcion } = currentSesionData;

    if (!macrocicloId || !mesocicloId || !microcicloId || !tipo) {
      toast({ title: "Error", description: "Tipo de sesión es obligatorio.", variant: "destructive" });
      return;
    }

    const updatedMacrociclos = macrociclos.map(macro => {
      if (macro.id === macrocicloId) {
        return {
          ...macro,
          mesociclos: macro.mesociclos.map(meso => {
            if (meso.id === mesocicloId) {
              return {
                ...meso,
                microciclos: meso.microciclos.map(micro => {
                  if (micro.id === microcicloId) {
                    let updatedSesiones;
                    if (sesionId) { 
                      updatedSesiones = micro.sesiones.map(s => 
                        s.id === sesionId ? { ...s, tipo, descripcion } : s
                      );
                    } else { 
                      if (micro.sesiones.length >= MAX_SESIONES_PER_MICRO) {
                        toast({ title: "Límite alcanzado", description: `Máximo ${MAX_SESIONES_PER_MICRO} sesiones por microciclo.`, variant: "destructive"});
                        return micro; 
                      }
                      const newSesion: SesionEntrenamiento = { id: crypto.randomUUID(), tipo, descripcion };
                      updatedSesiones = [...micro.sesiones, newSesion];
                    }
                    return { ...micro, sesiones: updatedSesiones };
                  }
                  return micro;
                })
              };
            }
            return meso;
          })
        };
      }
      return macro;
    });

    saveMacrociclos(updatedMacrociclos);
    toast({ title: sesionId ? "Sesión Actualizada" : "Sesión Añadida", description: "La sesión ha sido guardada." });
    setIsSesionDialogOpen(false);
  };
  
  const handleDeleteSesion = (macrocicloId: string, mesocicloId: string, microcicloId: string, sesionId: string) => {
     const updatedMacrociclos = macrociclos.map(macro => {
      if (macro.id === macrocicloId) {
        return {
          ...macro,
          mesociclos: macro.mesociclos.map(meso => {
            if (meso.id === mesocicloId) {
              return {
                ...meso,
                microciclos: meso.microciclos.map(micro => {
                  if (micro.id === microcicloId) {
                    return { ...micro, sesiones: micro.sesiones.filter(s => s.id !== sesionId) };
                  }
                  return micro;
                })
              };
            }
            return meso;
          })
        };
      }
      return macro;
    });
    saveMacrociclos(updatedMacrociclos);
    toast({ title: "Sesión Eliminada", description: "La sesión ha sido eliminada." });
  };

  const handleOpenMesocicloConfigDialog = (macrocicloId: string, mesociclo: Mesociclo) => {
    setCurrentMesocicloConfigData({
      macrocicloId,
      mesocicloId: mesociclo.id,
      entrenadorEncargadoId: mesociclo.entrenadorEncargadoId || '',
      categoriasAsignadas: mesociclo.categoriasAsignadas || [],
    });
    setIsMesocicloConfigDialogOpen(true);
  };

  const handleSaveMesocicloConfig = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentMesocicloConfigData) return;

    const { macrocicloId, mesocicloId, entrenadorEncargadoId, categoriasAsignadas } = currentMesocicloConfigData;
    const entrenadorSeleccionado = entrenadores.find(ent => ent.id === entrenadorEncargadoId);

    const updatedMacrociclos = macrociclos.map(macro => {
      if (macro.id === macrocicloId) {
        return {
          ...macro,
          mesociclos: macro.mesociclos.map(meso => {
            if (meso.id === mesocicloId) {
              return {
                ...meso,
                entrenadorEncargadoId: entrenadorEncargadoId || undefined,
                entrenadorEncargadoNombre: entrenadorSeleccionado?.name || undefined,
                categoriasAsignadas: categoriasAsignadas,
              };
            }
            return meso;
          }),
        };
      }
      return macro;
    });

    saveMacrociclos(updatedMacrociclos);
    toast({ title: "Configuración Guardada", description: "La configuración del mesociclo ha sido actualizada." });
    setIsMesocicloConfigDialogOpen(false);
    setCurrentMesocicloConfigData(null);
  };


  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="font-headline text-3xl font-bold text-primary">Planificación de Entrenamiento</h1>
          {(user?.type === 'admin' || user?.type === 'team_admin' || user?.type === 'coach') && (
            <Dialog open={isMacrocicloDialogOpen} onOpenChange={setIsMacrocicloDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setCurrentMacrocicloData({ nombre: '', fechaInicio: new Date(), objetivoPrincipal: '', categoriasAsignadas: [], entrenadoresEncargadosIds: [], colorClassName: macrocicloColorOptions[0].className })}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Macrociclo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
                <DialogHeader className="p-4 border-b flex-shrink-0">
                  <DialogTitle>Nuevo Macrociclo (3 Meses)</DialogTitle>
                  <DialogDescription>Define los detalles para tu nuevo ciclo de entrenamiento trimestral.</DialogDescription>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto p-4">
                  <form id="createMacrocicloForm" onSubmit={handleCreateMacrociclo} className="space-y-6">
                    <div>
                      <Label htmlFor="macroNombre">Nombre del Macrociclo</Label>
                      <Input id="macroNombre" value={currentMacrocicloData.nombre} onChange={(e) => setCurrentMacrocicloData(prev => ({...prev, nombre: e.target.value}))} placeholder="Ej: Preparación General Q1" />
                    </div>
                    <div>
                      <Label htmlFor="macroFechaInicio">Fecha de Inicio</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentMacrocicloData.fechaInicio ? format(currentMacrocicloData.fechaInicio, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={currentMacrocicloData.fechaInicio}
                            onSelect={(date) => setCurrentMacrocicloData(prev => ({...prev, fechaInicio: date || new Date()}))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="macroObjetivo">Objetivo Principal del Macrociclo</Label>
                      <Textarea id="macroObjetivo" value={currentMacrocicloData.objetivoPrincipal} onChange={(e) => setCurrentMacrocicloData(prev => ({...prev, objetivoPrincipal: e.target.value}))} placeholder="Ej: Mejorar resistencia y técnica base" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Palette className="h-4 w-4" />Color del Macrociclo</Label>
                      <div className="flex flex-wrap gap-2">
                        {macrocicloColorOptions.map(colorOpt => (
                          <Button
                            key={colorOpt.name}
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 rounded-md border-2",
                              currentMacrocicloData.colorClassName === colorOpt.className ? 'border-ring ring-2 ring-ring' : 'border-transparent',
                              colorOpt.swatchClass
                            )}
                            onClick={() => setCurrentMacrocicloData(prev => ({ ...prev, colorClassName: colorOpt.className }))}
                            title={colorOpt.name}
                          >
                          {currentMacrocicloData.colorClassName === colorOpt.className && <Check className="h-4 w-4 text-primary-foreground mix-blend-difference" />}
                          <span className="sr-only">{colorOpt.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><UsersIcon className="h-4 w-4" />Categorías Generales del Macrociclo</Label>
                      <div className="h-32 rounded-md border p-2 bg-background overflow-y-auto">
                        {volleyballCategories.map(cat => (
                          <div key={`macro-cat-${cat}`} className="flex items-center space-x-2 mb-1 p-1 hover:bg-muted rounded-sm">
                            <Checkbox
                              id={`cat-macro-${cat.replace(/\s+/g, '-')}`}
                              checked={currentMacrocicloData.categoriasAsignadas.includes(cat)}
                              onCheckedChange={(checked) => {
                                const newCats = checked === true
                                  ? [...currentMacrocicloData.categoriasAsignadas, cat]
                                  : currentMacrocicloData.categoriasAsignadas.filter(c => c !== cat);
                                setCurrentMacrocicloData(prev => ({ ...prev, categoriasAsignadas: newCats }));
                              }}
                            />
                            <Label htmlFor={`cat-macro-${cat.replace(/\s+/g, '-')}`} className="text-sm font-normal cursor-pointer">
                              {cat}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Users2 className="h-4 w-4" />Entrenadores Encargados del Macrociclo</Label>
                      <div className="h-32 rounded-md border p-2 bg-background overflow-y-auto">
                        {entrenadores.length > 0 ? entrenadores.map(entrenador => (
                          <div key={`macro-coach-${entrenador.id}`} className="flex items-center space-x-2 mb-1 p-1 hover:bg-muted rounded-sm">
                            <Checkbox
                              id={`coach-macro-${entrenador.id}`}
                              checked={currentMacrocicloData.entrenadoresEncargadosIds.includes(entrenador.id)}
                              onCheckedChange={(checked) => {
                                const newCoachIds = checked === true
                                  ? [...currentMacrocicloData.entrenadoresEncargadosIds, entrenador.id]
                                  : currentMacrocicloData.entrenadoresEncargadosIds.filter(id => id !== entrenador.id);
                                setCurrentMacrocicloData(prev => ({ ...prev, entrenadoresEncargadosIds: newCoachIds }));
                              }}
                            />
                            <Label htmlFor={`coach-macro-${entrenador.id}`} className="text-sm font-normal cursor-pointer">
                              {entrenador.name}
                            </Label>
                          </div>
                        )) : <p className="text-xs text-muted-foreground text-center py-4">No hay entrenadores {user?.type === 'team_admin' ? 'en este equipo.' : 'globales.'}</p>}
                      </div>
                    </div>
                  </form>
                </div>
                <DialogFooter className="p-4 border-t flex-shrink-0">
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" form="createMacrocicloForm">Crear Macrociclo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {macrociclos.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">Aún no has creado ningún macrociclo {user?.type === 'team_admin' ? 'para este equipo.' : 'global.'}</p>
              {(user?.type === 'admin' || user?.type === 'team_admin' || user?.type === 'coach') &&
                <Button onClick={() => setIsMacrocicloDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Tu Primer Macrociclo
                </Button>
              }
            </CardContent>
          </Card>
        )}

        <Accordion type="multiple" className="w-full space-y-4">
          {macrociclos.map((macrociclo) => (
            <AccordionItem value={macrociclo.id} key={macrociclo.id} className={cn("rounded-lg shadow", macrociclo.colorClassName ? macrociclo.colorClassName : 'bg-card hover:bg-primary/5 border')}>
              <AccordionTrigger className={cn("px-6 py-4 text-lg font-semibold rounded-t-lg", macrociclo.colorClassName ? '' : "hover:bg-primary/5")}>
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  {macrociclo.nombre} 
                  <span className="text-sm font-normal text-muted-foreground">
                    ({format(new Date(macrociclo.fechaInicio), 'dd MMM', { locale: es })} - {format(new Date(macrociclo.fechaFin), 'dd MMM yyyy', { locale: es })})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 space-y-3 border-t">
                {macrociclo.objetivoPrincipal && (
                  <div className="p-3 bg-background rounded-md border mt-2">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <Target className="h-4 w-4"/> Objetivo Principal (Macrociclo):
                    </p>
                    <p className="text-sm text-muted-foreground ml-6">{macrociclo.objetivoPrincipal}</p>
                  </div>
                )}
                {macrociclo.entrenadoresEncargados && macrociclo.entrenadoresEncargados.length > 0 && (
                  <div className="p-3 bg-background rounded-md border mt-2">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <Users2 className="h-4 w-4"/> Entrenadores Encargados (Macrociclo):
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-6">
                      {macrociclo.entrenadoresEncargados.map(ent => <li key={ent.id}>{ent.name}</li>)}
                    </ul>
                  </div>
                )}
                {macrociclo.categoriasAsignadas && macrociclo.categoriasAsignadas.length > 0 && (
                  <div className="p-3 bg-background rounded-md border mt-2">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <UsersIcon className="h-4 w-4"/> Categorías (Macrociclo):
                    </p>
                    <div className="flex flex-wrap gap-1 ml-6 mt-1">
                      {macrociclo.categoriasAsignadas.map(cat => (
                        <span key={cat} className="text-xs bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(user?.type === 'admin' || user?.type === 'team_admin' || user?.type === 'coach') && (
                  <div className="mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditMacrociclo(macrociclo)} className="mr-2">
                      <Edit className="mr-2 h-3 w-3" /> Editar Macrociclo
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteMacrociclo(macrociclo.id)}>
                      <Trash2 className="mr-2 h-3 w-3" /> Eliminar Macrociclo
                      </Button>
                  </div>
                )}

                <Accordion type="multiple" className="w-full space-y-2 mt-4">
                  {macrociclo.mesociclos.map((meso) => (
                    <AccordionItem value={meso.id} key={meso.id} className="border bg-background rounded-md">
                      <AccordionTrigger className="px-4 py-3 text-md font-medium hover:bg-primary/5">
                        {meso.nombreMes}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 space-y-3">
                        <Button variant="outline" size="sm" onClick={() => handleOpenMesocicloConfigDialog(macrociclo.id, meso)}>
                          <Settings2 className="mr-2 h-4 w-4" /> Configurar Mesociclo
                        </Button>
                        {meso.entrenadorEncargadoNombre && (
                          <div className="p-2 bg-primary/5 rounded-md border border-primary/20 mt-2">
                            <p className="text-xs font-medium text-primary flex items-center gap-1">
                              <Users2 className="h-3 w-3"/> Ent. Encargado (Mesociclo): <span className="text-muted-foreground font-normal">{meso.entrenadorEncargadoNombre}</span>
                            </p>
                          </div>
                        )}
                        {meso.categoriasAsignadas && meso.categoriasAsignadas.length > 0 && (
                          <div className="p-2 bg-accent/5 rounded-md border border-accent/20 mt-1">
                            <p className="text-xs font-medium text-accent flex items-center gap-1">
                              <UsersIcon className="h-3 w-3"/> Categorías (Mesociclo):
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {meso.categoriasAsignadas.map(cat => (
                                <span key={`meso-cat-${cat}`} className="text-xs bg-accent/10 text-accent-foreground px-1.5 py-0.5 rounded-full">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <Accordion type="multiple" className="w-full space-y-1 mt-3">
                          {meso.microciclos.map((micro) => (
                            <AccordionItem value={micro.id} key={micro.id} className="border bg-background/50 rounded-md">
                              <AccordionTrigger className="px-3 py-2 text-sm font-normal hover:bg-primary/5">
                                <div className="flex justify-between w-full items-center">
                                  <span>Semana {micro.numeroSemanaGlobal}: {format(new Date(micro.fechaInicioSemana), 'dd MMM', { locale: es })} - {format(new Date(micro.fechaFinSemana), 'dd MMM', { locale: es })}</span>
                                  <span className="text-xs text-muted-foreground mr-2">{micro.sesiones.length}/{MAX_SESIONES_PER_MICRO} sesiones</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-2 space-y-2">
                                {micro.objetivoSemanal && <p className="text-xs text-muted-foreground italic mb-2">Objetivo: {micro.objetivoSemanal}</p>}
                                {micro.sesiones.map(sesion => (
                                  <Card key={sesion.id} className="p-2 bg-white dark:bg-card">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-semibold text-xs text-primary">{sesion.tipo}</p>
                                        {sesion.descripcion && <p className="text-xs text-muted-foreground">{sesion.descripcion}</p>}
                                      </div>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openSesionDialog(macrociclo.id, meso.id, micro.id, sesion)}>
                                          <Edit className="h-3 w-3"/>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteSesion(macrociclo.id, meso.id, micro.id, sesion.id)}>
                                          <Trash2 className="h-3 w-3 text-destructive"/>
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                                {micro.sesiones.length < MAX_SESIONES_PER_MICRO && (
                                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openSesionDialog(macrociclo.id, meso.id, micro.id)}>
                                    <PlusCircle className="mr-2 h-3 w-3" /> Añadir Sesión
                                  </Button>
                                )}
                                {micro.sesiones.length === 0 && <p className="text-xs text-muted-foreground text-center py-1">No hay sesiones programadas.</p>}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Dialog open={isSesionDialogOpen} onOpenChange={setIsSesionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentSesionData.sesionId ? 'Editar Sesión' : 'Añadir Nueva Sesión'}</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de entrenamiento y añade una descripción.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSesion}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <Label htmlFor="sesionTipo">Tipo de Entrenamiento</Label>
                <Select value={currentSesionData.tipo} onValueChange={(value) => setCurrentSesionData(prev => ({...prev, tipo: value}))}>
                  <SelectTrigger id="sesionTipo">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDeEntrenamiento.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sesionDescripcion">Descripción (Opcional)</Label>
                <Textarea 
                  id="sesionDescripcion" 
                  value={currentSesionData.descripcion} 
                  onChange={(e) => setCurrentSesionData(prev => ({...prev, descripcion: e.target.value}))}
                  placeholder="Detalles específicos de la sesión..." 
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
              <Button type="submit">{currentSesionData.sesionId ? 'Guardar Cambios' : 'Añadir Sesión'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isMesocicloConfigDialogOpen} onOpenChange={(isOpen) => {
          setIsMesocicloConfigDialogOpen(isOpen);
          if (!isOpen) setCurrentMesocicloConfigData(null);
      }}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle>Configurar Mesociclo</DialogTitle>
            <DialogDescription>Asigna un entrenador y categorías específicas para este mesociclo.</DialogDescription>
          </DialogHeader>
          {currentMesocicloConfigData && (
            <>
              <div className="flex-grow overflow-y-auto p-4">
                <form id="mesocicloConfigForm" onSubmit={handleSaveMesocicloConfig} className="space-y-6">
                    <div className="space-y-1">
                      <Label htmlFor="mesoEntrenador">Entrenador Encargado del Mesociclo</Label>
                      <Select 
                        value={currentMesocicloConfigData.entrenadorEncargadoId} 
                        onValueChange={(value) => setCurrentMesocicloConfigData(prev => prev ? ({...prev, entrenadorEncargadoId: value}) : null)}
                      >
                        <SelectTrigger id="mesoEntrenador">
                          <SelectValue placeholder="Seleccionar entrenador" />
                        </SelectTrigger>
                        <SelectContent>
                          {entrenadores.map(entrenador => (
                            <SelectItem key={entrenador.id} value={entrenador.id}>{entrenador.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categorías para este Mesociclo</Label>
                      <div className="h-32 rounded-md border p-2 bg-background overflow-y-auto">
                        {volleyballCategories.map(cat => (
                          <div key={`meso-config-cat-${cat}`} className="flex items-center space-x-2 mb-1 p-1 hover:bg-muted rounded-sm">
                            <Checkbox
                              id={`meso-cfg-cat-${cat.replace(/\s+/g, '-')}`}
                              checked={currentMesocicloConfigData.categoriasAsignadas.includes(cat)}
                              onCheckedChange={(checked) => {
                                setCurrentMesocicloConfigData(prev => {
                                  if (!prev) return null;
                                  const newCats = checked === true
                                    ? [...prev.categoriasAsignadas, cat]
                                    : prev.categoriasAsignadas.filter(c => c !== cat);
                                  return { ...prev, categoriasAsignadas: newCats };
                                });
                              }}
                            />
                            <Label htmlFor={`meso-cfg-cat-${cat.replace(/\s+/g, '-')}`} className="text-sm font-normal cursor-pointer">
                              {cat}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                </form>
              </div>
              <DialogFooter className="p-4 border-t flex-shrink-0">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" form="mesocicloConfigForm">Guardar Configuración</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Macrociclo Dialog */}
      <Dialog open={isEditMacrocicloDialogOpen} onOpenChange={(isOpen) => {
          if (!isOpen) setMacrocicloToEdit(null);
          setIsEditMacrocicloDialogOpen(isOpen);
        }}>
        <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <DialogTitle>Editar Macrociclo</DialogTitle>
            <DialogDescription>Modifica los detalles de tu ciclo de entrenamiento.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto p-4">
            {macrocicloToEdit && (
              <form id="editMacrocicloForm" onSubmit={handleUpdateMacrociclo} className="space-y-6">
                <div>
                  <Label htmlFor="editMacroNombre">Nombre del Macrociclo</Label>
                  <Input id="editMacroNombre" value={macrocicloToEdit.nombre} onChange={(e) => setMacrocicloToEdit(prev => prev ? ({...prev, nombre: e.target.value}) : null)} />
                </div>
                <div>
                  <Label>Fechas del Macrociclo</Label>
                  <Input value={`${format(parseISO(macrocicloToEdit.fechaInicio), 'dd/MM/yyyy')} - ${format(parseISO(macrocicloToEdit.fechaFin), 'dd/MM/yyyy')}`} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Las fechas no se pueden editar una vez creado el macrociclo.</p>
                </div>
                <div>
                  <Label htmlFor="editMacroObjetivo">Objetivo Principal</Label>
                  <Textarea id="editMacroObjetivo" value={macrocicloToEdit.objetivoPrincipal || ''} onChange={(e) => setMacrocicloToEdit(prev => prev ? ({...prev, objetivoPrincipal: e.target.value}) : null)} />
                </div>
                 <div className="space-y-2">
                  <Label><Palette className="inline-block mr-1 h-4 w-4" />Color del Macrociclo</Label>
                  <div className="flex flex-wrap gap-2">
                    {macrocicloColorOptions.map(colorOpt => (
                      <Button
                        key={`edit-color-${colorOpt.name}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("h-8 w-8 p-0 rounded-md border-2", macrocicloToEdit.colorClassName === colorOpt.className ? 'border-ring ring-2 ring-ring' : 'border-transparent', colorOpt.swatchClass)}
                        onClick={() => setMacrocicloToEdit(prev => prev ? {...prev, colorClassName: colorOpt.className} : null)}
                        title={colorOpt.name}
                      >
                      {macrocicloToEdit.colorClassName === colorOpt.className && <Check className="h-4 w-4 text-primary-foreground mix-blend-difference" />}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label><UsersIcon className="inline-block mr-1 h-4 w-4" />Categorías</Label>
                  <ScrollArea className="h-32 rounded-md border p-2 bg-background">
                    {volleyballCategories.map(cat => (
                      <div key={`edit-cat-${cat}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-cat-check-${cat}`}
                          checked={macrocicloToEdit.categoriasAsignadas.includes(cat)}
                          onCheckedChange={(checked) => setMacrocicloToEdit(prev => {
                            if (!prev) return null;
                            const newCats = checked ? [...prev.categoriasAsignadas, cat] : prev.categoriasAsignadas.filter(c => c !== cat);
                            return {...prev, categoriasAsignadas: newCats};
                          })}
                        />
                        <Label htmlFor={`edit-cat-check-${cat}`} className="font-normal">{cat}</Label>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <div className="space-y-2">
                  <Label><Users2 className="inline-block mr-1 h-4 w-4" />Entrenadores</Label>
                  <ScrollArea className="h-32 rounded-md border p-2 bg-background">
                    {entrenadores.map(ent => (
                      <div key={`edit-coach-${ent.id}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-coach-check-${ent.id}`}
                          checked={macrocicloToEdit.entrenadoresEncargados.some(e => e.id === ent.id)}
                          onCheckedChange={(checked) => setMacrocicloToEdit(prev => {
                            if (!prev) return null;
                            const newCoaches = checked ? [...prev.entrenadoresEncargados, {id: ent.id, name: ent.name}] : prev.entrenadoresEncargados.filter(c => c.id !== ent.id);
                            return {...prev, entrenadoresEncargados: newCoaches};
                          })}
                        />
                        <Label htmlFor={`edit-coach-check-${ent.id}`} className="font-normal">{ent.name}</Label>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </form>
            )}
          </div>
          <DialogFooter className="p-4 border-t flex-shrink-0">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" form="editMacrocicloForm">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
