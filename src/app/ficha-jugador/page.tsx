
'use client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CalendarDays, Edit, ShieldCheck, Trash2, UserCircle, FileText, UserSquare, History, Activity, Eye, ClipboardCheck, WalletCards, LogIn, AlertCircle, CheckCircle2, Clock, Power, PowerOff, EllipsisVertical, MoreVertical, Waves, Wind } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef, type ChangeEvent, useMemo, type FormEvent } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import type { AthleteStorageItem } from '../registro/atleta/page';
import type { TestSession, AthleteTestDataForSession } from '../../types/physical-tests';
import { PHYSICAL_TEST_RESULTS_STORAGE_KEY } from '../../types/physical-tests';
import type { PaymentRecord, PaymentStatus } from '@/types/payments';
import { PAYMENTS_STORAGE_KEY } from '@/types/payments';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Logo from '@/components/Logo';
import { format as formatDate, parseISO, addMonths, startOfMonth, endOfMonth, isBefore, isEqual, subMonths, getDate, getMonth, getYear, isAfter, lastDayOfMonth, isSameMonth, isSameDay, differenceInCalendarMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useClubName } from '@/hooks/useClubName';


interface AthleteDisplayData extends AthleteStorageItem {
  stats: { [key: string]: number }; 
  lastPerformance?: string;
}

interface MonthlyPaymentInfo {
  monthYear: string; 
  monthName: string; 
  dueDate: Date;
  status: 'Pagado' | 'Pendiente' | 'Vencido' | 'Futuro' | 'Manual Pagado' | 'Manual Pendiente' | 'Fecha Ingreso N/A';
  statusColor: string;
  icon: React.ElementType;
  isManual?: boolean;
}

interface MatchEvent {
  id: string;
  date: Date;
  homeTeam: string;
  awayTeam: string;
  location: string;
  time: string;
  coachName?: string;
  category?: string;
}
const MATCH_EVENTS_STORAGE_KEY = 'matchEvents_v1';

const mockStats = { attack: 8, block: 6, serve: 7, reception: 9, defense: 8 };
const mockLastPerformance = '15 puntos, 70% recepción positiva';

const ATHLETES_STORAGE_KEY = 'athletes';
const ATHLETE_SKILLS_STORAGE_KEY_PREFIX = 'athlete_skills_';
const ATHLETE_MANUAL_PAYMENT_STATUS_KEY_PREFIX = 'athlete_manual_payment_';
const CLUB_PROFILE_STORAGE_KEY = 'club_profile_v1';
const DEFAULT_CLUB_NAME_FALLBACK_PDF = 'Club Deportivo BOSS Volleyball';


const getSkillValueColorClass = (value: number): string => {
  if (value <= 4) {
    return 'text-red-600';
  } else if (value <= 8) {
    return 'text-yellow-600';
  } else {
    return 'text-green-600';
  }
};

const getSkillBarColorClass = (value: number): string => {
  if (value <= 4) {
    return 'bg-red-600';
  } else if (value <= 8) {
    return 'bg-yellow-500'; 
  } else {
    return 'bg-green-600';
  }
};

const getPaymentStatusDisplayInfo = (
  status: MonthlyPaymentInfo['status']
): { color: string; icon: React.ElementType; text: string } => {
  switch (status) {
    case 'Pagado': return { color: 'text-green-600', icon: CheckCircle2, text: 'Pagado' };
    case 'Manual Pagado': return { color: 'text-green-500', icon: CheckCircle2, text: 'Pagado (M)' };
    case 'Pendiente': return { color: 'text-yellow-600', icon: Clock, text: 'Pendiente' };
    case 'Manual Pendiente': return { color: 'text-yellow-500', icon: Clock, text: 'Pendiente (M)' };
    case 'Vencido': return { color: 'text-red-600', icon: AlertCircle, text: 'Vencido' };
    case 'Futuro': return { color: 'text-sky-500', icon: CalendarDays, text: 'Futuro' };
    default: return { color: 'text-muted-foreground', icon: AlertCircle, text: 'N/A' };
  }
};

const getPaymentStatusColorClassListTable = (status: PaymentStatus) => {
  switch (status) {
    case 'Pagado': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-700/30';
    case 'Pendiente': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-700/30';
    case 'Vencido': return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-700/30';
    case 'Anulado': return 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/30';
    default: return 'text-muted-foreground bg-muted/50';
  }
};

function getPaymentStatusForMonth(
  monthDate: Date,
  entryDate: Date,
  payments: PaymentRecord[],
  manualStatus: string | null
): MonthlyPaymentInfo['status'] {
  const today = new Date();
  today.setHours(0,0,0,0);
  const firstDayOfPaymentMonth = startOfMonth(monthDate);

  if (isBefore(firstDayOfPaymentMonth, startOfMonth(entryDate))) {
    return 'Fecha Ingreso N/A'; 
  }
  
  if (manualStatus === 'paid') return 'Manual Pagado';
  if (manualStatus === 'pending') return 'Manual Pendiente';

  const hasPaidThisMonth = payments.some(p => {
    if (p.status !== 'Pagado' || !p.concept.toLowerCase().includes('mensualidad')) return false;
    const paymentDate = parseISO(p.paymentDate);
    return isSameMonth(paymentDate, firstDayOfPaymentMonth) || 
           (isSameMonth(subMonths(paymentDate,1), firstDayOfPaymentMonth) && getDate(paymentDate) >= getDate(entryDate) - 5); 
  });

  if (hasPaidThisMonth) return 'Pagado';

  const paymentDueDateThisMonth = new Date(getYear(firstDayOfPaymentMonth), getMonth(firstDayOfPaymentMonth), getDate(entryDate));
  paymentDueDateThisMonth.setHours(0,0,0,0);

  if (isAfter(firstDayOfPaymentMonth, startOfMonth(today))) { 
      return 'Futuro';
  }

  if (isBefore(paymentDueDateThisMonth, today)) return 'Vencido';
  
  return 'Pendiente';
}


export default function PlayerCardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { clubName, isLoadingClubName } = useClubName();
  const athleteId = searchParams.get('id');
  
  const [athlete, setAthlete] = useState<AthleteDisplayData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [participatedTestSessions, setParticipatedTestSessions] = useState<TestSession[]>([]);
  const [athletePayments, setAthletePayments] = useState<PaymentRecord[]>([]);
  const carnetRef = useRef<HTMLDivElement>(null);
  const fichaPdfRef = useRef<HTMLDivElement>(null);

  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [currentResultsInModal, setCurrentResultsInModal] = useState<{ session: TestSession; athleteData: AthleteTestDataForSession } | null>(null);

  const [isEditSkillsModalOpen, setIsEditSkillsModalOpen] = useState(false);
  const [skillsInModal, setSkillsInModal] = useState<{ [key: string]: number }>({});
  
  const [monthlyPaymentHistory, setMonthlyPaymentHistory] = useState<MonthlyPaymentInfo[]>([]);
  const [isStatusReasonModalOpen, setIsStatusReasonModalOpen] = useState(false);
  const [statusReasonInput, setStatusReasonInput] = useState('');
  const [upcomingMatches, setUpcomingMatches] = useState<MatchEvent[]>([]);


  const generateMonthlyPaymentHistory = (currentAthlete: AthleteDisplayData | null, payments: PaymentRecord[]) => {
    if (!currentAthlete || !currentAthlete.entryDate) return [];

    const history: MonthlyPaymentInfo[] = [];
    const athleteEntryDate = parseISO(currentAthlete.entryDate);
    const today = new Date();
    today.setHours(0,0,0,0);

    let currentMonthIterator = startOfMonth(athleteEntryDate);
    const endMonthLimit = addMonths(startOfMonth(today), 1); 

    while (isBefore(currentMonthIterator, endMonthLimit) || isSameMonth(currentMonthIterator, endMonthLimit)) {
        const monthYearStr = formatDate(currentMonthIterator, 'yyyy-MM');
        const manualStatusKey = `${ATHLETE_MANUAL_PAYMENT_STATUS_KEY_PREFIX}${currentAthlete.id}_${monthYearStr}`;
        const manualStatus = localStorage.getItem(manualStatusKey) as 'paid' | 'pending' | null;
        
        const status = getPaymentStatusForMonth(currentMonthIterator, athleteEntryDate, payments, manualStatus);
        const displayInfo = getPaymentStatusDisplayInfo(status);
        
        history.push({
            monthYear: monthYearStr,
            monthName: formatDate(currentMonthIterator, 'MMMM yyyy', { locale: es }),
            dueDate: new Date(getYear(currentMonthIterator), getMonth(currentMonthIterator), getDate(athleteEntryDate)),
            status,
            statusColor: displayInfo.color,
            icon: displayInfo.icon,
            isManual: manualStatus !== null,
        });
        currentMonthIterator = addMonths(currentMonthIterator, 1);
    }
    return history.sort((a,b) => b.dueDate.getTime() - a.dueDate.getTime()); 
  };
  
  useEffect(() => {
    if (athlete && mounted) {
      setMonthlyPaymentHistory(generateMonthlyPaymentHistory(athlete, athletePayments));
    }
  }, [athlete, athletePayments, mounted]);


  useEffect(() => {
    setMounted(true);
    if (!athleteId) {
      router.push('/atletas');
      return;
    }

    let loadedAthleteData: AthleteDisplayData | null = null;

    try {
      const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
      if (storedAthletesString) {
        const storedAthletes: AthleteStorageItem[] = JSON.parse(storedAthletesString);
        const foundAthlete = storedAthletes.find(a => a.id === athleteId);
        
        if (foundAthlete) {
          if (user && user.type === 'coach' && user.assignedCategories && 
              !user.assignedCategories.includes(foundAthlete.category)) {
            toast({ title: "Acceso Denegado", description: "No tienes permiso para ver este atleta.", variant: "destructive" });
            router.push('/atletas');
            return;
          }

          let loadedSkills = { ...mockStats }; 
          const skillsKey = `${ATHLETE_SKILLS_STORAGE_KEY_PREFIX}${athleteId}`;
          try {
              const storedSkillsString = localStorage.getItem(skillsKey);
              if (storedSkillsString) {
                  loadedSkills = JSON.parse(storedSkillsString);
              }
          } catch (skillError) {
              console.error("Error loading skills from localStorage:", skillError);
          }

          loadedAthleteData = {
            ...foundAthlete,
            name: foundAthlete.name || `${foundAthlete.firstName} ${foundAthlete.lastName}`,
            stats: loadedSkills,
            lastPerformance: mockLastPerformance,
            entryDate: foundAthlete.entryDate,
            isActive: foundAthlete.isActive === undefined ? true : foundAthlete.isActive,
            statusReason: foundAthlete.statusReason || '',
          };
          setAthlete(loadedAthleteData);
          setStatusReasonInput(foundAthlete.statusReason || '');

          // Cargar partidos del atleta
          try {
              const storedMatchesString = localStorage.getItem(MATCH_EVENTS_STORAGE_KEY);
              if (storedMatchesString) {
                  const allMatches: MatchEvent[] = JSON.parse(storedMatchesString).map((m: any) => ({...m, date: new Date(m.date)}));
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const athleteMatches = allMatches.filter(match => 
                    match.category === foundAthlete.category && match.date >= today
                  ).sort((a,b) => a.date.getTime() - b.date.getTime());
                  setUpcomingMatches(athleteMatches);
              }
          } catch (e) {
              console.error("Error loading matches for athlete", e);
          }

        } else {
          toast({ title: "Error", description: "Atleta no encontrado.", variant: "destructive" });
          router.push('/atletas');
          return; 
        }
      } else {
        toast({ title: "Error", description: "No hay atletas almacenados.", variant: "destructive" });
        router.push('/atletas');
        return; 
      }
    } catch (error) {
      console.error("Error loading athlete from localStorage:", error);
      toast({ title: "Error", description: "No se pudo cargar el atleta.", variant: "destructive" });
      router.push('/atletas');
      return; 
    }

    if (loadedAthleteData) {
      try {
        const storedTestResultsString = localStorage.getItem(PHYSICAL_TEST_RESULTS_STORAGE_KEY);
        if (storedTestResultsString) {
          const allTestSessions: TestSession[] = JSON.parse(storedTestResultsString);
          const athleteSessions = allTestSessions.filter(session =>
            session.athletesData.some(ad => ad.athleteId === athleteId)
          ).sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
          setParticipatedTestSessions(athleteSessions);
        }
      } catch (error) {
        console.error("Error loading test sessions from localStorage:", error);
      }
    }

    if (loadedAthleteData) {
      try {
        const storedPaymentsString = localStorage.getItem(PAYMENTS_STORAGE_KEY);
        if (storedPaymentsString) {
          const allPayments: PaymentRecord[] = JSON.parse(storedPaymentsString);
          const paymentsForAthlete = allPayments
            .filter(payment => payment.athleteId === athleteId)
            .sort((a, b) => parseISO(b.paymentDate).getTime() - parseISO(a.paymentDate).getTime());
          setAthletePayments(paymentsForAthlete);
        }
      } catch (error) {
        console.error("Error loading payments from localStorage:", error);
      }
    }

  }, [athleteId, router, toast, user]);

  const handleDeleteAthlete = () => {
    if (!athlete) return;
    try {
        const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
        if (storedAthletesString) {
            let storedAthletes: AthleteStorageItem[] = JSON.parse(storedAthletesString);
            storedAthletes = storedAthletes.filter(a => a.id !== athlete.id);
            localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(storedAthletes));
        }
        const skillsKey = `${ATHLETE_SKILLS_STORAGE_KEY_PREFIX}${athlete.id}`;
        localStorage.removeItem(skillsKey);

        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`${ATHLETE_MANUAL_PAYMENT_STATUS_KEY_PREFIX}${athlete.id}_`)) {
            localStorage.removeItem(key);
          }
        });

        toast({ title: "Atleta Eliminado", description: `${athlete.name} ha sido eliminado.` });
    } catch (error) {
        console.error("Error deleting athlete from localStorage:", error);
        toast({ title: "Error", description: "No se pudo eliminar el atleta del almacenamiento local.", variant: "destructive" });
    }
    setShowDeleteConfirm(false);
    router.push('/atletas'); 
  };
  
  const getImcStatusColorClass = (status?: string) => {
    switch (status) {
      case 'Bajo Peso': return 'text-blue-500';
      case 'Normal': return 'text-green-500';
      case 'Sobrepeso': return 'text-yellow-500';
      case 'Obesidad': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const handleDownloadFicha = async () => {
    if (!athlete) {
        toast({ title: "Error", description: "Datos del atleta no disponibles.", variant: "destructive" });
        return;
    }
    if (!fichaPdfRef.current) {
        toast({ title: "Error de Referencia", description: "El elemento de la ficha no está disponible.", variant: "destructive" });
        console.error("fichaPdfRef.current es null");
        return;
    }

    let clubNameToUseInPdf = DEFAULT_CLUB_NAME_FALLBACK_PDF;
    if (typeof window !== 'undefined') {
        try {
            const storedClubProfile = localStorage.getItem(CLUB_PROFILE_STORAGE_KEY);
            if (storedClubProfile) {
                const clubProfile = JSON.parse(storedClubProfile);
                clubNameToUseInPdf = clubProfile.name || DEFAULT_CLUB_NAME_FALLBACK_PDF;
            }
        } catch (e) { console.error("Error reading club name for PDF:", e); }
    }
    const pdfClubNameElement = fichaPdfRef.current.querySelector('#pdf-club-name');
    if (pdfClubNameElement) pdfClubNameElement.textContent = clubNameToUseInPdf;
    const pdfClubNameFooterElement = fichaPdfRef.current.querySelector('#pdf-footer-club-name');
    if (pdfClubNameFooterElement) pdfClubNameFooterElement.textContent = `Plataforma de Gestión ${clubNameToUseInPdf}.`;


    const elementToCapture = fichaPdfRef.current;
    const originalStyles = {
        display: elementToCapture.style.display,
        position: elementToCapture.style.position,
        left: elementToCapture.style.left,
        top: elementToCapture.style.top,
        opacity: elementToCapture.style.opacity,
        visibility: elementToCapture.style.visibility,
        zIndex: elementToCapture.style.zIndex,
        transform: elementToCapture.style.transform,
        minHeight: elementToCapture.style.minHeight,
    };
    const originalBodyOverflow = document.body.style.overflow;

    elementToCapture.style.display = 'block';
    elementToCapture.style.position = 'fixed'; 
    elementToCapture.style.left = '0px';
    elementToCapture.style.top = '0px';
    elementToCapture.style.opacity = '1';
    elementToCapture.style.visibility = 'visible';
    elementToCapture.style.zIndex = '-1000'; 
    elementToCapture.style.transform = 'none';
    elementToCapture.style.minHeight = '297mm'; 
    document.body.style.overflow = 'hidden'; 

    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 700)));

    try {
        const canvas = await html2canvas(elementToCapture, {
            scale: 2,
            useCORS: true,
            logging: true,
            width: elementToCapture.offsetWidth,
            height: elementToCapture.offsetHeight,
            windowWidth: elementToCapture.scrollWidth,
            windowHeight: elementToCapture.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff',
        });

        Object.assign(elementToCapture.style, originalStyles);
        document.body.style.overflow = originalBodyOverflow;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width; 
        
        let pageHeightOnCanvas = canvasWidth * (pdf.internal.pageSize.getHeight() / pdfWidth); 
        let numPages = Math.ceil(canvas.height / pageHeightOnCanvas);

        for (let i = 0; i < numPages; i++) {
            const sy = pageHeightOnCanvas * i; 
            const sh = Math.min(pageHeightOnCanvas, canvas.height - sy); 

            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = sh;
            const ctx = pageCanvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
                const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
                if (i > 0) {
                    pdf.addPage();
                }
                pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, (pdfWidth * sh) / canvas.width, undefined, 'FAST');
            }
        }

        pdf.save(`Ficha_${athlete.name.replace(/\s+/g, '_')}.pdf`);
        toast({ title: "PDF Generado", description: `La ficha de ${athlete.name} ha sido descargada.` });

    } catch (error) {
        console.error("Error generando PDF:", error);
        toast({ title: "Error al generar PDF", description: "No se pudo generar el PDF. Revisa la consola.", variant: "destructive" });
        Object.assign(elementToCapture.style, originalStyles);
        document.body.style.overflow = originalBodyOverflow;
    }
  };

  const handleDownloadCarnet = async () => {
    if (!athlete) {
        toast({ title: "Error", description: "Datos del atleta no disponibles.", variant: "destructive" });
        return;
    }
    if (!carnetRef.current) {
        toast({ title: "Error de Referencia", description: "El elemento del carnet no está disponible en el DOM.", variant: "destructive" });
        console.error("carnetRef.current es null o undefined");
        return;
    }

    let clubNameToUseInCarnet = DEFAULT_CLUB_NAME_FALLBACK_PDF;
    if (typeof window !== 'undefined') {
        try {
            const storedClubProfile = localStorage.getItem(CLUB_PROFILE_STORAGE_KEY);
            if (storedClubProfile) {
                const clubProfile = JSON.parse(storedClubProfile);
                clubNameToUseInCarnet = clubProfile.name || DEFAULT_CLUB_NAME_FALLBACK_PDF;
            }
        } catch (e) { console.error("Error reading club name for carnet:", e); }
    }
    const carnetClubNameElement = carnetRef.current.querySelector('#carnet-club-name');
    if (carnetClubNameElement) carnetClubNameElement.textContent = clubNameToUseInCarnet;

    
    const elementToCapture = carnetRef.current;
    const originalStyles = {
      display: elementToCapture.style.display,
      position: elementToCapture.style.position,
      left: elementToCapture.style.left,
      top: elementToCapture.style.top,
      opacity: elementToCapture.style.opacity,
      visibility: elementToCapture.style.visibility,
      zIndex: elementToCapture.style.zIndex,
      transform: elementToCapture.style.transform,
    };
    const originalBodyOverflow = document.body.style.overflow;

    elementToCapture.style.display = 'flex'; 
    elementToCapture.style.position = 'fixed'; 
    elementToCapture.style.left = '0px';
    elementToCapture.style.top = '0px';
    elementToCapture.style.opacity = '1';    
    elementToCapture.style.visibility = 'visible'; 
    elementToCapture.style.zIndex = '-1000'; 
    elementToCapture.style.transform = 'none'; 
    document.body.style.overflow = 'hidden'; 

    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 500)));

    try {
        const canvas = await html2canvas(elementToCapture, { 
            scale: 2, 
            useCORS: true, 
            logging: true, 
            width: elementToCapture.offsetWidth, 
            height: elementToCapture.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: null, 
        });
        
        Object.assign(elementToCapture.style, originalStyles);
        document.body.style.overflow = originalBodyOverflow;

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Carnet_${athlete.name.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Carnet Generado", description: "La imagen del carnet ha sido descargada." });
    } catch (error) {
        console.error("Error generando carnet:", error);
        toast({ title: "Error al generar carnet", description: "No se pudo generar la imagen del carnet. Revisa la consola.", variant: "destructive" });
        Object.assign(elementToCapture.style, originalStyles);
        document.body.style.overflow = originalBodyOverflow;
    }
  };

  const handleViewResults = (session: TestSession) => {
    if (!athlete) return;
    const athleteData = session.athletesData.find(ad => ad.athleteId === athlete.id);
    if (athleteData) {
      setCurrentResultsInModal({ session, athleteData });
      setIsResultsModalOpen(true);
    } else {
      toast({ title: "Error", description: "Resultados no encontrados para este atleta en esta sesión.", variant: "destructive" });
    }
  };

  const handleOpenEditSkillsModal = () => {
    if (athlete?.stats) {
        setSkillsInModal({ ...athlete.stats });
        setIsEditSkillsModalOpen(true);
    } else {
        setSkillsInModal({ ...mockStats }); 
        setIsEditSkillsModalOpen(true);
    }
  };

  const handleSkillChangeInModal = (skillName: string, value: string) => {
      const numericValue = parseInt(value, 10);
      setSkillsInModal(prev => ({
          ...prev,
          [skillName]: isNaN(numericValue) ? 0 : Math.max(0, Math.min(10, numericValue)),
      }));
  };

  const handleSaveSkills = () => {
      if (!athlete || !athleteId) return;

      setAthlete(prev => {
          if (!prev) return null;
          return { ...prev, stats: { ...skillsInModal } };
      });
      
      const skillsKey = `${ATHLETE_SKILLS_STORAGE_KEY_PREFIX}${athleteId}`;
      try {
          localStorage.setItem(skillsKey, JSON.stringify(skillsInModal));
          toast({ title: "Habilidades Guardadas", description: "Las habilidades del atleta han sido actualizadas." });
      } catch (error) {
          console.error("Error saving skills to localStorage:", error);
          toast({ title: "Error al Guardar Habilidades", variant: "destructive" });
      }
      setIsEditSkillsModalOpen(false);
  };

  const handleManualPaymentStatusChange = (monthYear: string, newStatus: 'paid' | 'pending' | 'remove') => {
    if (!athlete) return;
    const key = `${ATHLETE_MANUAL_PAYMENT_STATUS_KEY_PREFIX}${athlete.id}_${monthYear}`;
    if (newStatus === 'remove') {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, newStatus);
    }
    setMonthlyPaymentHistory(generateMonthlyPaymentHistory(athlete, athletePayments)); 
    toast({ title: "Estado de pago manual actualizado." });
  };

  const handleToggleAthleteProfileStatus = (newIsActive: boolean) => {
    if (!athlete) return;

    if (!newIsActive) {
      setStatusReasonInput(athlete.statusReason || ''); 
      setIsStatusReasonModalOpen(true); 
    } else {
      updateAthleteActiveStatus(true, '');
    }
  };

  const handleSaveStatusReason = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!athlete) return;
    updateAthleteActiveStatus(false, statusReasonInput);
    setIsStatusReasonModalOpen(false);
  };
  
  const updateAthleteActiveStatus = (isActive: boolean, reason: string) => {
    if (!athlete) return;
    
    const updatedAthlete = { ...athlete, isActive, statusReason: isActive ? '' : reason };
    setAthlete(updatedAthlete);

    try {
      const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
      if (storedAthletesString) {
        let athletes: AthleteStorageItem[] = JSON.parse(storedAthletesString);
        athletes = athletes.map(a => a.id === athlete.id ? updatedAthlete : a);
        localStorage.setItem(ATHLETES_STORAGE_KEY, JSON.stringify(athletes));
        toast({ title: "Estado del Atleta Actualizado", description: `${athlete.name} ahora está ${isActive ? 'Activo' : 'Inactivo'}.` });
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado del atleta.", variant: "destructive" });
    }
  };


  if (!mounted || !athlete || isLoadingClubName) {
    return (
      <AppLayout>
        <Card>
          <CardHeader>
            <CardTitle>{!mounted || isLoadingClubName ? 'Cargando...' : (athleteId ? 'Buscando atleta...' : 'ID de atleta no proporcionado')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{!mounted || isLoadingClubName ? 'Cargando información del atleta...' : 'Si el atleta existe, su información aparecerá aquí en breve.'}</p>
            {mounted && !isLoadingClubName && <Button onClick={() => router.push('/atletas')} className="mt-4">Volver a Atletas</Button>}
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const birthDateObj = athlete.birthDate ? parseISO(athlete.birthDate) : null;
  const ageDisplay = birthDateObj ? new Date().getFullYear() - getYear(birthDateObj) - (getMonth(new Date()) < getMonth(birthDateObj) || (getMonth(new Date()) === getMonth(birthDateObj) && getDate(new Date()) < getDate(birthDateObj)) ? 1 : 0) : null;
  const birthDateFormatted = birthDateObj ? formatDate(birthDateObj, 'dd MMMM yyyy', { locale: es }) : 'N/A';
  const entryDateFormatted = athlete.entryDate ? formatDate(parseISO(athlete.entryDate), 'dd MMMM yyyy', { locale: es }) : 'N/A';


  return (
    <AppLayout>
      <div 
        id="carnet-element" 
        ref={carnetRef} 
        className="p-0 m-0"
        style={{ 
            width: '380px', 
            height: '240px', 
            display: 'none', 
            position: 'absolute', 
            left: '-9999px', 
            top: '0px',
            opacity: '0', 
        }} 
      >
        {athlete && (
            <div className="bg-gradient-to-br from-primary to-blue-700 text-primary-foreground w-full h-full flex flex-col items-center justify-between p-4 rounded-lg shadow-lg font-sans">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                        <Logo className="h-10 w-10 mr-2 text-white" />
                        <div>
                            <h2 id="carnet-club-name" className="text-sm font-bold leading-tight">{clubName}</h2>
                            <p className="text-xs leading-tight">Carnet de Atleta</p>
                        </div>
                    </div>
                     <div className="text-right">
                        <p className="text-xs font-semibold">ID: {athlete.id.slice(-6)}</p>
                    </div>
                </div>

                <div className="flex items-center w-full gap-3 my-2">
                    <Avatar className="h-24 w-24 border-2 border-white shrink-0">
                        <AvatarImage 
                            src={athlete.avatar || `https://placehold.co/96x96.png?text=${(athlete.name || 'N/A').substring(0,2).toUpperCase()}`} 
                            alt={athlete.name || 'Atleta'} 
                            data-ai-hint={athlete.dataAiHint}
                            crossOrigin="anonymous"
                        />
                        <AvatarFallback className="text-3xl bg-white/30 text-blue-800">{(athlete.name || 'N/A').substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <h3 className="text-lg font-bold truncate" title={athlete.name}>{athlete.name || 'Nombre no disponible'}</h3>
                        <p className="text-xs leading-tight">Posición: {athlete.position || 'N/A'}</p>
                        <p className="text-xs leading-tight">Equipo: {athlete.team || 'N/A'}</p>
                    </div>
                </div>
                
                <div className="w-full text-center mt-auto">
                    <p className="text-xs font-medium bg-white/20 px-2 py-1 rounded-md inline-block">{athlete.category || 'Categoría N/A'}</p>
                </div>
            </div>
        )}
      </div>

      <div 
        id="ficha-pdf-element" 
        ref={fichaPdfRef} 
        className="p-0 m-0 bg-white text-black" 
        style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            display: 'none', 
            position: 'absolute',
            left: '-9999px',
            top: '0px',
            opacity: '0',
            fontFamily: 'Arial, sans-serif', 
            fontSize: '10px', 
            lineHeight: '1.4',
        }} 
      >
        {athlete && (
            <div className="p-[15mm] space-y-4">
            <header className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                <Logo className="h-20 w-20 mr-4 text-blue-700" />
                <div>
                    <h1 className="text-3xl font-bold text-blue-700">FICHA INTEGRAL DEL ATLETA</h1>
                    <p id="pdf-club-name" className="text-xl text-gray-700">{clubName}</p>
                </div>
                </div>
                {athlete.avatar ? (
                <img 
                    src={athlete.avatar} 
                    alt={athlete.name || "Foto"} 
                    className="w-36 h-40 object-cover rounded-md border-2 border-gray-300" 
                    crossOrigin="anonymous"
                />
                ) : (
                  <div className="w-36 h-40 bg-gray-200 flex items-center justify-center text-gray-500 rounded-md border-2 border-gray-300 text-center">
                    <p>Foto</p>
                  </div>
                )}
            </header>

            <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">I. DATOS PERSONALES</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p><strong>Nombre Completo:</strong> {athlete.name}</p>
                <p><strong>Fecha de Nacimiento:</strong> {birthDateFormatted}</p>
                <p><strong>Edad:</strong> {ageDisplay !== null ? `${ageDisplay} años` : 'N/A'}</p>
                <p><strong>Lugar de Nacimiento:</strong> {athlete.birthPlace || 'N/A'}</p>
                <p><strong>Género:</strong> {athlete.gender || 'N/A'}</p>
                <p><strong>Fecha de Ingreso al Club:</strong> {entryDateFormatted}</p>
                <p><strong>ID Interno:</strong> {athlete.id}</p>
                <p><strong>Estado Actual:</strong> <span className={athlete.isActive ? "text-green-700 font-bold" : "text-red-700 font-bold"}>{athlete.isActive ? 'Activo' : 'Inactivo'}</span></p>
                {!athlete.isActive && athlete.statusReason && <p className="col-span-2"><strong>Motivo Inactividad:</strong> {athlete.statusReason}</p>}
                </div>
            </section>

            <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">II. INFORMACIÓN DE CONTACTO Y RESIDENCIA</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p><strong>Email:</strong> {athlete.email || 'N/A'}</p>
                <p><strong>Teléfono:</strong> {athlete.phone || 'N/A'}</p>
                <p className="col-span-2"><strong>Dirección:</strong> {athlete.address || 'N/A'}</p>
                </div>
            </section>

            <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">III. INFORMACIÓN ACADÉMICA</h2>
                <p className="text-sm"><strong>Institución Educativa:</strong> {athlete.schoolName || 'N/A'}</p>
            </section>

            <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">IV. DATOS DEPORTIVOS</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p><strong>Posición Principal:</strong> {athlete.position || 'N/A'}</p>
                <p><strong>Estilos de Natación:</strong> {athlete.swimmingStyles && athlete.swimmingStyles.length > 0 ? athlete.swimmingStyles.join(', ') : 'N/A'}</p>
                <p><strong>Equipo Actual:</strong> {athlete.team || 'N/A'}</p>
                <p><strong>Categoría Asignada:</strong> {athlete.category || 'N/A'}</p>
                </div>
            </section>

            <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">V. DATOS DE SALUD</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p><strong>Peso:</strong> {athlete.weight ? `${athlete.weight} kg` : 'N/A'}</p>
                <p><strong>Altura:</strong> {athlete.height ? `${athlete.height} m` : 'N/A'}</p>
                <p><strong>IMC:</strong> {athlete.imc !== null && athlete.imc !== undefined ? `${athlete.imc.toFixed(1)} (${athlete.imcStatus || 'N/A'})` : 'N/A'}</p>
                <p><strong>EPS:</strong> {athlete.eps || 'N/A'}</p>
                <p><strong>Tipo Afiliación EPS:</strong> {athlete.epsAffiliationType || 'N/A'}</p>
                <p><strong>Tipo de Sangre:</strong> {athlete.bloodType || 'N/A'}</p>
                <p className="col-span-2"><strong>Patologías (Alergias, Enfermedades):</strong> {athlete.pathologies || 'Ninguna reportada'}</p>
                <p className="col-span-2"><strong>Condiciones Médicas / Medicamentos:</strong> {athlete.conditions || 'Ninguna reportada'}</p>
                </div>
            </section>
            
            <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">VI. INFORMACIÓN ADICIONAL</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p><strong>Etnia:</strong> {athlete.ethnicity || 'N/A'}</p>
                <p><strong>¿Es víctima de desplazamiento?:</strong> {athlete.isDisplaced ? 'Sí' : 'No'}</p>
                </div>
            </section>

            {ageDisplay !== null && ageDisplay < 18 && (
                <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">VII. INFORMACIÓN DEL ACUDIENTE</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <p><strong>Nombre Acudiente:</strong> {`${athlete.guardianFirstName || ''} ${athlete.guardianLastName || ''}`.trim() || 'N/A'}</p>
                    <p><strong>Parentesco:</strong> {athlete.guardianRelationship || 'N/A'}</p>
                    <p><strong>Teléfono Acudiente:</strong> {athlete.guardianPhone || 'N/A'}</p>
                    <p><strong>Email Acudiente:</strong> {athlete.guardianEmail || 'N/A'}</p>
                </div>
                </section>
            )}

            <section className="border-t-2 border-blue-600 pt-3">
                <h2 className="text-lg font-semibold text-blue-600 mb-2">VIII. AUTORIZACIONES Y CONSENTIMIENTOS</h2>
                <p className="text-xs text-gray-600 mb-2 whitespace-pre-line">
                Se certifica que el atleta (o su representante legal) ha leído, comprendido y aceptado los términos y condiciones del Club Deportivo {clubName}, incluyendo la política de tratamiento de datos personales (Ley 1581/2012), la autorización para el uso de imagen con fines institucionales y deportivos del club, y la declaración de conocimiento y aceptación de riesgos inherentes a la práctica del voleibol, conforme al marco normativo colombiano (Ley 181/1995, Ley 1098/2006 y concordantes). Los detalles completos fueron proporcionados y aceptados durante el proceso de registro.
                </p>
                <p className="font-semibold text-base">
                Términos y Condiciones Aceptados: <span className={`font-bold ${athlete.termsAccepted ? "text-green-700" : "text-red-700"}`}>{athlete.termsAccepted ? 'SÍ' : 'NO (Requiere seguimiento)'}</span>
                </p>
            </section>
            
            <footer className="text-center text-xs text-gray-500 pt-6 mt-6 border-t">
                Ficha generada el: {new Date().toLocaleString('es-ES')} por <span id="pdf-footer-club-name">{clubName}</span>.
            </footer>
            </div>
        )}
      </div>

      <div className="space-y-8">
        <Card className="shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 bg-primary/10 p-6 flex flex-col items-center justify-center text-center">
              <Avatar className="h-40 w-40 border-4 border-primary mb-4 shadow-md">
                <AvatarImage src={athlete.avatar || `https://placehold.co/160x160.png?text=${(athlete.name || 'N/A').substring(0,2).toUpperCase()}`} alt={athlete.name || 'Atleta'} data-ai-hint={athlete.dataAiHint} />
                <AvatarFallback className="text-5xl">{(athlete.name || 'N/A').substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="font-headline text-3xl text-primary mb-1">{athlete.name}</CardTitle>
              <div className="flex items-center gap-2 my-2">
                <Switch
                    id="athlete-status-switch"
                    checked={athlete.isActive}
                    onCheckedChange={handleToggleAthleteProfileStatus}
                    aria-label="Estado del atleta"
                />
                <Label htmlFor="athlete-status-switch" className="text-sm font-medium">
                    {athlete.isActive ? 'Activo' : 'Inactivo'}
                </Label>
              </div>
              {athlete.isActive ? (
                <Badge variant="default" className="bg-green-500 text-white hover:bg-green-600">
                    <Power className="mr-1 h-3 w-3" /> Activo
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-500 text-white hover:bg-slate-600">
                    <PowerOff className="mr-1 h-3 w-3" /> Inactivo
                </Badge>
              )}
              {!athlete.isActive && athlete.statusReason && (
                <p className="text-xs text-muted-foreground mt-1 italic">Motivo: {athlete.statusReason}</p>
              )}

              <p className="text-lg text-foreground/80 mt-2">{athlete.position}</p>
              <p className="text-md text-muted-foreground">{athlete.team}</p>
              <p className="text-xs text-muted-foreground">{athlete.category} - {athlete.gender}</p>
              <div className="mt-4 flex flex-wrap gap-2 items-center justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/registro/atleta?edit=${athlete.id}`}>
                    <Edit className="mr-2 h-4 w-4" /> Editar Perfil
                  </Link>
                </Button>
                 {(user?.type === 'admin') && (
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                 )}
                <Button variant="outline" size="sm" onClick={handleDownloadFicha}>
                  <FileText className="mr-2 h-4 w-4" /> Descargar Ficha (PDF)
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadCarnet}>
                  <UserSquare className="mr-2 h-4 w-4" /> Descargar Carnet (Imagen)
                </Button>
              </div>
            </div>
            <div className="md:w-2/3 p-6">
              <CardHeader className="px-0 pt-0 pb-4 mb-4 border-b">
                <CardTitle className="font-headline text-2xl">Información del Jugador</CardTitle>
              </CardHeader>
              <CardContent className="px-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div><strong>Edad:</strong> {ageDisplay !== null ? `${ageDisplay} años` : 'N/A'}</div>
                <div><strong>Altura:</strong> {athlete.height ? `${athlete.height} m` : 'N/A'}</div>
                <div><strong>Peso:</strong> {athlete.weight ? `${athlete.weight} kg` : 'N/A'}</div>
                {athlete.imc !== null && athlete.imc !== undefined && (
                  <div>
                    <strong>IMC:</strong>
                    <span className={`ml-1 font-semibold ${getImcStatusColorClass(athlete.imcStatus)}`}>
                       {athlete.imc.toFixed(1)} ({athlete.imcStatus || 'N/A'})
                    </span>
                  </div>
                )}
                <div><strong>Fecha Nac.:</strong> {birthDateFormatted}</div>
                <div><strong>Lugar Nac.:</strong> {athlete.birthPlace || 'N/A'}</div>
                <div>
                  <strong className="flex items-center gap-1"><LogIn className="h-4 w-4 text-primary" /> Fecha Ingreso:</strong> {entryDateFormatted}
                </div>
                <div><strong>Email:</strong> {athlete.email || 'N/A'}</div>
                <div><strong>Teléfono:</strong> {athlete.phone || 'N/A'}</div>
                <div className="sm:col-span-2"><strong>Dirección:</strong> {athlete.address || 'N/A'}</div>
                <div><strong>Colegio/Univ.:</strong> {athlete.schoolName || 'N/A'}</div>
                {athlete.position && <div className="font-medium"><strong>Posición:</strong> {athlete.position}</div>}
                
                {athlete.swimmingStyles && athlete.swimmingStyles.length > 0 && (
                    <div className="sm:col-span-2">
                        <strong className="flex items-center gap-2"><Waves className="h-4 w-4 text-primary" />Estilos Dominantes:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {athlete.swimmingStyles.map(style => (
                                <Badge key={style} variant="secondary">{style}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                {athlete.athleticEvents && athlete.athleticEvents.length > 0 && (
                    <div className="sm:col-span-2">
                        <strong className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Especialidades de Atletismo:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {athlete.athleticEvents.map(event => (
                                <Badge key={event} variant="secondary">{event}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                {athlete.skatingModalities && athlete.skatingModalities.length > 0 && (
                    <div className="sm:col-span-2">
                        <strong className="flex items-center gap-2"><Wind className="h-4 w-4 text-primary" />Modalidades de Patinaje:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {athlete.skatingModalities.map(modality => (
                                <Badge key={modality} variant="secondary">{modality}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                
                <div><strong>EPS:</strong> {athlete.eps || 'N/A'}</div>
                <div><strong>Tipo Afiliación:</strong> {athlete.epsAffiliationType || 'N/A'}</div>
                <div><strong>Tipo de Sangre:</strong> {athlete.bloodType || 'N/A'}</div>
                <div className="sm:col-span-2"><strong>Patologías:</strong> {athlete.pathologies || 'Ninguna'}</div>
                <div className="sm:col-span-2"><strong>Condiciones Médicas:</strong> {athlete.conditions || 'Ninguna'}</div>
                <div><strong>Etnia:</strong> {athlete.ethnicity || 'N/A'}</div>
                <div><strong>¿Desplazado?:</strong> {athlete.isDisplaced ? 'Sí' : 'No'}</div>
                
                {ageDisplay !== null && ageDisplay < 18 && (
                  <>
                    <div className="sm:col-span-2 mt-4 border-t pt-4">
                      <h3 className="font-semibold text-md text-primary flex items-center gap-1"><UserCircle className="h-4 w-4" /> Info. Acudiente</h3>
                    </div>
                    <div><strong>Nombre Acudiente:</strong> {`${athlete.guardianFirstName || ''} ${athlete.guardianLastName || ''}`.trim() || 'N/A'}</div>
                    <div><strong>Parentesco:</strong> {athlete.guardianRelationship || 'N/A'}</div>
                    <div><strong>Tel. Acudiente:</strong> {athlete.guardianPhone || 'N/A'}</div>
                    <div><strong>Email Acudiente:</strong> {athlete.guardianEmail || 'N/A'}</div>
                  </>
                )}
                
                <div className="sm:col-span-2 mt-2 border-t pt-4">
                    <h3 className="font-semibold text-md text-primary flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Consentimientos</h3>
                    <p><strong>Términos y Condiciones Aceptados:</strong> <span className={athlete.termsAccepted ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{athlete.termsAccepted ? 'SÍ' : 'NO'}</span></p>
                </div>

                {athlete.lastPerformance && (
                    <div className="sm:col-span-2 mt-2">
                    <strong>Último Rendimiento (Ejemplo):</strong>
                    <p className="text-muted-foreground">{athlete.lastPerformance}</p>
                    </div>
                )}
              </CardContent>
            </div>
          </div>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><WalletCards className="h-5 w-5 text-primary" /> Estado de Cuenta Mensual</CardTitle>
                 <CardDescription>Historial de pagos mensuales del atleta. Puedes modificar el estado manualmente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 {monthlyPaymentHistory.length > 0 ? (
                    <ScrollArea className="h-60 w-full rounded-md border">
                    <ul className="p-2">
                        {monthlyPaymentHistory.map((item) => {
                        const display = getPaymentStatusDisplayInfo(item.status);
                        return (
                            <li key={item.monthYear} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2">
                                <display.icon className={`h-5 w-5 ${display.color}`} />
                                <div>
                                <p className={`text-sm font-medium ${display.color}`}>
                                    {item.monthName} - {display.text}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Vence: {formatDate(item.dueDate, 'dd MMM yyyy', { locale: es })}
                                </p>
                                </div>
                            </div>
                            {(item.status !== 'Futuro' && item.status !== 'Pagado' && (user?.type === 'admin' || user?.type === 'coach')) && (
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleManualPaymentStatusChange(item.monthYear, 'paid')}>
                                    Marcar Pagado (Manual)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleManualPaymentStatusChange(item.monthYear, 'pending')}>
                                    Marcar Pendiente (Manual)
                                    </DropdownMenuItem>
                                    {item.isManual && (
                                    <DropdownMenuItem onClick={() => handleManualPaymentStatusChange(item.monthYear, 'remove')}>
                                        Quitar Estado Manual
                                    </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                            </li>
                        );
                        })}
                    </ul>
                    </ScrollArea>
                ) : (
                    <p className="text-muted-foreground text-sm">
                    {athlete.entryDate ? "Calculando historial de pagos..." : "Establece una fecha de ingreso para ver el historial."}
                    </p>
                )}
                <p className="text-xs text-muted-foreground italic mt-2">
                  Este estado se calcula basado en la fecha de ingreso y los pagos registrados como "Mensualidad".
                  (M) indica un estado manual. Un pago real en la sección de Pagos tendrá prioridad sobre un estado manual "Pendiente".
                </p>
            </CardContent>
        </Card>

        {athlete.stats && (
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Habilidades</CardTitle>
                <CardDescription>Evaluación de habilidades clave del jugador.</CardDescription>
              </div>
              {(user?.type === 'admin' || user?.type === 'coach') && (
                <Button variant="outline" size="sm" onClick={handleOpenEditSkillsModal}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(athlete.stats).map(([skill, value]) => (
                <div key={skill}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium capitalize text-foreground/80">{skill.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`text-sm font-semibold ${getSkillValueColorClass(Number(value))}`}>{value}/10</span>
                  </div>
                  <Progress 
                    value={Number(value) * 10} 
                    className="h-2" 
                    indicatorClassName={getSkillBarColorClass(Number(value))} 
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
         <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Historial de Pruebas Físicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participatedTestSessions.length > 0 ? (
                <ul className="space-y-3">
                  {participatedTestSessions.map(session => (
                    <li key={session.id} className="flex flex-col sm:flex-row justify-between items-start p-3 bg-background rounded-md hover:bg-primary/5 border">
                      <div>
                        <h4 className="font-semibold text-foreground">{session.testName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Fecha: {formatDate(parseISO(session.testDate), 'dd MMMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewResults(session)} className="mt-2 sm:mt-0">
                        <Eye className="mr-2 h-4 w-4" /> Ver Resultados
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Este atleta aún no ha participado en ninguna prueba física registrada.
                </p>
              )}
            </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-primary" /> Historial de Pagos del Atleta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {athletePayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Fecha Pago</TableHead>
                        <TableHead>Medio</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {athletePayments.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.concept}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(payment.amount)}
                          </TableCell>
                          <TableCell>{formatDate(parseISO(payment.paymentDate), 'dd MMM yyyy', { locale: es })}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColorClassListTable(payment.status)}`}>
                              {payment.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay pagos registrados para este atleta.
                </p>
              )}
            </CardContent>
        </Card>

         <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length > 0 ? (
                <ul className="space-y-3">
                    {upcomingMatches.slice(0, 5).map(match => (
                        <li key={match.id} className="flex flex-col sm:flex-row justify-between items-start p-3 bg-background rounded-md hover:bg-primary/5 border">
                           <div>
                                <h4 className="font-semibold text-foreground">{match.homeTeam} vs {match.awayTeam}</h4>
                                <p className="text-sm text-muted-foreground">
                                {match.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} - {match.time} hrs
                                </p>
                                <p className="text-xs text-muted-foreground">{match.location}</p>
                            </div>
                            <div className="mt-2 sm:mt-0">
                                <span className="text-xs bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full">{match.category}</span>
                            </div>
                        </li>
                    ))}
                    {upcomingMatches.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">... y {upcomingMatches.length - 5} más.</p>
                    )}
                </ul>
              ) : (
                 <p className="text-muted-foreground text-center py-4">
                  No hay próximos partidos programados para la categoría de este atleta.
                </p>
              )}
            </CardContent>
        </Card>
      </div>

      {showDeleteConfirm && athlete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de eliminar a {athlete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Todos los datos del atleta serán eliminados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAthlete} className="bg-destructive hover:bg-destructive/90">
                Sí, Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isResultsModalOpen && currentResultsInModal && athlete && (
        <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <DialogTitle className="text-xl">Resultados de: {currentResultsInModal.session.testName}</DialogTitle>
              <DialogDescription>
                Atleta: {athlete.name} <br />
                Fecha: {formatDate(parseISO(currentResultsInModal.session.testDate), 'dd MMMM yyyy', { locale: es })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Prueba</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentResultsInModal.session.columnsDefinition.map(colDef => (
                      <TableRow key={colDef.id}>
                        <TableCell className="font-medium">{colDef.name}</TableCell>
                        <TableCell>{String(currentResultsInModal.athleteData.results[colDef.id] ?? 'N/A')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <DialogFooter className="p-4 border-t flex-shrink-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isEditSkillsModalOpen && athlete?.stats && (
          <Dialog open={isEditSkillsModalOpen} onOpenChange={setIsEditSkillsModalOpen}>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle>Editar Habilidades de {athlete?.name}</DialogTitle>
                      <DialogDescription>
                          Modifica los valores de las habilidades (0-10).
                      </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                      {Object.entries(skillsInModal).map(([skill, value]) => (
                          <div key={skill} className="grid grid-cols-3 items-center gap-4">
                              <Label htmlFor={`skill-${skill}`} className="text-right capitalize">
                                  {skill.replace(/([A-Z])/g, ' $1')}
                              </Label>
                              <Input
                                  id={`skill-${skill}`}
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={value}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSkillChangeInModal(skill, e.target.value)}
                                  className="col-span-2 h-8"
                              />
                          </div>
                      ))}
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="button" onClick={handleSaveSkills}>Guardar Cambios</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

       {isStatusReasonModalOpen && athlete && (
        <Dialog open={isStatusReasonModalOpen} onOpenChange={setIsStatusReasonModalOpen}>
          <DialogContent>
            <form onSubmit={handleSaveStatusReason}>
              <DialogHeader>
                <DialogTitle>Motivo de Inactividad para {athlete.name}</DialogTitle>
                <DialogDescription>
                  Por favor, especifica el motivo por el cual este atleta está siendo marcado como inactivo. Este campo es opcional.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="statusReasonInput">Motivo:</Label>
                <Textarea
                  id="statusReasonInput"
                  value={statusReasonInput}
                  onChange={(e) => setStatusReasonInput(e.target.value)}
                  placeholder="Ej: Lesión, Retiro temporal, Viaje, etc."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={() => {
                    if (athlete) updateAthleteActiveStatus(true, athlete.statusReason || '');
                    setIsStatusReasonModalOpen(false);
                  }}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Guardar Motivo y Estado</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

    </AppLayout>
  );
}
