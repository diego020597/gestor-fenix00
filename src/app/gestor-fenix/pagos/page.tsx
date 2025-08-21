
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Settings, BarChartBig, PlusCircle, LineChart as LineChartIcon, Paperclip, Users, CreditCard, ListChecks, Activity, AlertTriangle, Clock, Receipt, Briefcase, Calendar, Download, FileClock, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, type FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import type { TeamStorageItem } from '../page';
import type { AthleteStorageItem } from '@/app/registro/atleta/page';
import type { CoachStorageItem } from '@/app/registro/entrenador/page';
import type { PaymentRecord, PaymentMethod, PaymentStatus } from '@/types/payments';
import { PAYMENTS_STORAGE_KEY } from '@/types/payments';
import { format, isBefore, isSameMonth, parseISO, getDate, getYear, getMonth, addMonths, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';
const ATHLETES_STORAGE_KEY = 'athletes'; 
const COACHES_STORAGE_KEY = 'coaches';

const paymentMethods: PaymentMethod[] = [
  'Efectivo', 'Transferencia Bancaria', 'Nequi', 'Daviplata', 'PSE', 'Otro'
];

const paymentStatuses: PaymentStatus[] = ['Pagado', 'Pendiente', 'Vencido', 'Anulado'];

const initialPaymentFormState = {
    teamId: '',
    amount: '',
    concept: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Efectivo' as PaymentMethod,
    status: 'Pagado' as PaymentStatus,
    notes: '',
};

interface TeamPaymentAlert {
    teamId: string;
    teamName: string;
    status: 'Pendiente de Verificación';
}

type BalancePeriod = 'day' | 'week' | 'month' | 'bimester' | 'quarter';

const BASE_FEE = 20000; // Cuota base fija

const getPackagePrice = (coachLimitStr?: string, athleteLimitStr?: string): number => {
  const coachLimit = parseInt(coachLimitStr || "0", 10);
  const athleteLimit = parseInt(athleteLimitStr || "0", 10);

  const isMoreThan10Coaches = coachLimitStr === 'más de 10';
  const isMoreThan100Athletes = athleteLimitStr === 'más de 100';

  let coachRate = 0;
  let athleteRate = 0;

  if (isMoreThan10Coaches) coachRate = 17500;
  else if (coachLimit > 5) coachRate = 20000;
  else coachRate = 22500;

  if (isMoreThan100Athletes) athleteRate = 2750;
  else if (athleteLimit > 50) athleteRate = 3500;
  else if (athleteLimit > 15) athleteRate = 4000;
  else athleteRate = 4500;

  const actualCoachCount = isMoreThan10Coaches ? 12 : coachLimit;
  const actualAthleteCount = isMoreThan100Athletes ? 150 : athleteLimit;

  return (actualCoachCount * coachRate) + (actualAthleteCount * athleteRate);
};

const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = -6; i <= 6; i++) {
        const date = addMonths(today, i);
        options.push({
            value: format(date, 'yyyy-MM'),
            label: format(date, 'MMMM yyyy', { locale: es }),
        });
    }
    return options.sort((a, b) => new Date(b.value).getTime() - new Date(a.value).getTime());
};

interface PendingInvoice {
    team: TeamStorageItem;
    amount: number;
    monthLabel: string;
}


export default function GestorFenixPagosPage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [teams, setTeams] = useState<TeamStorageItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const invoiceRef =  useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('facturacion');

  // --- State for Invoicing Tab ---
  const [invoiceTeamId, setInvoiceTeamId] = useState<string>('');
  const [invoiceMonth, setInvoiceMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  
  // --- State for Automatic Invoicing ---
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  
  // State for Supervision tab
  const [balancePeriod, setBalancePeriod] = useState<BalancePeriod>('month');
  const [balancePaymentMethod, setBalancePaymentMethod] = useState<string>('all');
  const [isEditingPayment, setIsEditingPayment] = useState<PaymentRecord | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);

  // Form state for registering a team payment
  const [paymentForm, setPaymentForm] = useState(initialPaymentFormState);

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  useEffect(() => {
    setMounted(true);
    if (!authIsLoading && (!user || user.type !== 'fenix_master')) {
      router.push('/login');
    }
  }, [user, authIsLoading, router]);

  useEffect(() => {
    if (user && user.type === 'fenix_master') {
      setIsLoadingData(true);
      try {
        const storedTeams = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
        setTeams(storedTeams ? JSON.parse(storedTeams).filter((team: TeamStorageItem) => team.isActive) : []);
        const storedPayments = localStorage.getItem(PAYMENTS_STORAGE_KEY);
        setPayments(storedPayments ? JSON.parse(storedPayments).sort((a: PaymentRecord, b: PaymentRecord) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()) : []);
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los datos iniciales.", variant: "destructive" });
      }
      setIsLoadingData(false);
    }
  }, [user, toast]);

  // Effect for calculating pending invoices
  useEffect(() => {
    if (isLoadingData) return;

    const teamsWithPendingInvoices = teams.filter(team => {
        const currentMonthLabel = format(new Date(), 'MMMM yyyy', {locale: es});
        const conceptForCurrentMonth = `Cuota Plataforma Fenix - ${currentMonthLabel}`;
        const hasBeenInvoiced = payments.some(p => 
            p.teamId === team.id &&
            p.concept.toLowerCase() === conceptForCurrentMonth.toLowerCase()
        );
        return !hasBeenInvoiced;
    }).map(team => {
        const packagePrice = getPackagePrice(team.coachLimit, team.athleteLimit);
        const total = packagePrice + BASE_FEE;
        return {
            team,
            amount: total,
            monthLabel: format(new Date(), 'MMMM yyyy', {locale: es})
        };
    });
    
    setPendingInvoices(teamsWithPendingInvoices);
  }, [teams, payments, isLoadingData]);


  const savePaymentsToStorage = (updatedPayments: PaymentRecord[]) => {
    try {
      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(updatedPayments));
      setPayments(updatedPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
    } catch (error) {
      console.error("Error saving payments:", error);
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };


  const teamPaymentAlerts: TeamPaymentAlert[] = useMemo(() => {
    return teams.map(team => ({
        teamId: team.id,
        teamName: team.name,
        status: 'Pendiente de Verificación'
    }));
  }, [teams]);


  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentSelectChange = (name: string, value: string) => {
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRegisterTeamPayment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const team = teams.find(t => t.id === paymentForm.teamId);
    if (!team || !paymentForm.amount || !paymentForm.concept || !paymentForm.paymentDate || !paymentForm.paymentMethod) {
        toast({ title: "Campos incompletos", description: "Por favor, complete todos los campos obligatorios para el pago.", variant: "destructive"});
        return;
    }

    let updatedPayments: PaymentRecord[];
    
    if (isEditingPayment) {
        updatedPayments = payments.map(p => 
            p.id === isEditingPayment.id 
                ? { 
                    ...p, 
                    teamId: team.id,
                    teamName: team.name,
                    amount: parseFloat(paymentForm.amount),
                    concept: paymentForm.concept,
                    paymentDate: paymentForm.paymentDate,
                    paymentMethod: paymentForm.paymentMethod as PaymentMethod,
                    status: paymentForm.status as PaymentStatus,
                    notes: paymentForm.notes,
                  } 
                : p
        );
        toast({ title: "Pago Actualizado", description: `El pago para ${team.name} ha sido actualizado.` });
    } else {
        const newPayment: PaymentRecord = {
            id: crypto.randomUUID(),
            teamId: team.id,
            teamName: team.name,
            amount: parseFloat(paymentForm.amount),
            concept: paymentForm.concept,
            paymentDate: paymentForm.paymentDate,
            paymentMethod: paymentForm.paymentMethod as PaymentMethod,
            status: 'Pagado',
            notes: paymentForm.notes,
            sentAt: new Date().toISOString(),
        };
        updatedPayments = [...payments, newPayment];
        toast({ title: "Pago Registrado", description: `El pago para ${team.name} ha sido registrado con éxito.` });
    }

    savePaymentsToStorage(updatedPayments);
    setPaymentForm(initialPaymentFormState);
    setIsEditingPayment(null);
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setIsEditingPayment(payment);
    setPaymentForm({
        teamId: payment.teamId || '',
        amount: String(payment.amount),
        concept: payment.concept,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        notes: payment.notes || ''
    });
    setActiveTab('registrar');
  };
  
  const handleDeletePayment = () => {
    if(!paymentToDelete) return;
    savePaymentsToStorage(payments.filter(p => p.id !== paymentToDelete.id));
    toast({ title: "Pago Eliminado" });
    setPaymentToDelete(null);
  }

  // --- Invoicing Logic ---
 const invoiceCalculation = useMemo(() => {
    if (!invoiceTeamId) return null;
    const selectedTeam = teams.find(t => t.id === invoiceTeamId);
    if (!selectedTeam) return null;

    const packagePrice = getPackagePrice(selectedTeam.coachLimit, selectedTeam.athleteLimit);
    const subtotal = packagePrice + BASE_FEE;
    const discountAmount = subtotal * (invoiceDiscount / 100);
    const total = subtotal - discountAmount;
    const selectedMonthLabel = monthOptions.find(m => m.value === invoiceMonth)?.label || 'Mes no especificado';
    
    return {
      team: selectedTeam,
      packagePrice,
      baseFee: BASE_FEE,
      subtotal,
      discountPercentage: invoiceDiscount,
      discountAmount,
      total,
      monthLabel: selectedMonthLabel
    };
  }, [invoiceTeamId, invoiceDiscount, teams, invoiceMonth, monthOptions]);

  const handleGenerateInvoice = () => {
    if (!invoiceCalculation) {
      toast({ title: "Error", description: "Selecciona un equipo y mes para generar la factura.", variant: "destructive" });
      return;
    }
    setGeneratedInvoiceData(invoiceCalculation);
    setIsInvoiceDialogOpen(true);
  };
  
  const handleDownloadInvoice = async () => {
    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) {
      toast({ title: "Error", description: "No se pudo encontrar el elemento de la factura para descargar.", variant: "destructive" });
      return;
    }

    const canvas = await html2canvas(invoiceElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Factura_${generatedInvoiceData.team.name.replace(/\s+/g, '_')}_${invoiceMonth}.pdf`);
    toast({ title: "Factura Descargada" });
  };
  
  const handleLoadInvoiceDataToForm = () => {
      if (!generatedInvoiceData) return;
      
      setPaymentForm({
        teamId: generatedInvoiceData.team.id,
        amount: String(generatedInvoiceData.total.toFixed(0)), 
        concept: `Cuota Plataforma Fenix - ${generatedInvoiceData.monthLabel}`,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Transferencia Bancaria',
        status: 'Pendiente', 
        notes: `Factura generada automáticamente. Descuento aplicado: ${generatedInvoiceData.discountPercentage}%.`
    });

    setIsInvoiceDialogOpen(false);
    setActiveTab('registrar');
    toast({ title: "Datos Cargados", description: "Los detalles de la factura se han cargado en el formulario de registro de pago." });
  };
  
  const handleGenerateAllPending = () => {
    if (pendingInvoices.length === 0) {
      toast({ title: "Sin pendientes", description: "No hay facturas pendientes por generar.", variant: "destructive" });
      return;
    }

    const newPayments: PaymentRecord[] = pendingInvoices.map(item => ({
        id: crypto.randomUUID(),
        teamId: item.team.id,
        teamName: item.team.name,
        amount: item.amount,
        concept: `Cuota Plataforma Fenix - ${item.monthLabel}`,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Transferencia Bancaria',
        status: 'Pendiente',
        notes: 'Factura generada automáticamente por vencimiento.',
        sentAt: new Date().toISOString(),
    }));

    savePaymentsToStorage([...payments, ...newPayments]);
    toast({ title: "Facturas Generadas", description: `Se han generado ${newPayments.length} registros de pago pendientes.` });
  };


  const calculatedBalance = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    switch (balancePeriod) {
        case 'day':
            startDate = startOfDay(now);
            break;
        case 'week':
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            break;
        case 'month':
            startDate = startOfMonth(now);
            break;
        case 'bimester':
            startDate = subMonths(now, 2);
            break;
        case 'quarter':
            startDate = startOfQuarter(now);
            break;
    }

    const filteredPayments = payments.filter(p => {
        const paymentDate = parseISO(p.paymentDate);
        const isWithinDateRange = paymentDate >= startDate && paymentDate <= endDate;
        if (!isWithinDateRange || p.status !== 'Pagado') return false;

        const isMethodMatch = balancePaymentMethod === 'all' || p.paymentMethod === balancePaymentMethod;
        
        return isMethodMatch;
    });

    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  }, [balancePeriod, balancePaymentMethod, payments]);

  const handleExportReport = () => {
    if (!mounted || payments.length === 0) {
      toast({ title: "No hay datos", description: "No hay pagos registrados para exportar.", variant: "destructive" });
      return;
    }
    
    const escapeCsvCell = (cellData: any): string => {
        if (cellData === undefined || cellData === null) return '';
        let escaped = String(cellData).replace(/"/g, '""'); 
        if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
          escaped = `"${escaped}"`; 
        }
        return escaped;
    };

    const headers = ["ID Pago", "Fecha Pago", "Equipo", "Concepto", "Monto", "Método", "Estado", "Notas", "Fecha Registro"];
    const csvRows = [
      headers.join(','),
      ...payments.map(p => [
        escapeCsvCell(p.id),
        escapeCsvCell(p.paymentDate),
        escapeCsvCell(p.teamName),
        escapeCsvCell(p.concept),
        escapeCsvCell(p.amount),
        escapeCsvCell(p.paymentMethod),
        escapeCsvCell(p.status),
        escapeCsvCell(p.notes),
        escapeCsvCell(p.sentAt ? format(new Date(p.sentAt), 'yyyy-MM-dd HH:mm:ss') : ''),
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Reporte_Pagos_Fenix_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Reporte Generado", description: "El reporte de pagos ha sido descargado." });
    } else {
      toast({ title: "Error", description: "Tu navegador no soporta la descarga directa.", variant: "destructive" });
    }
  };


  if (authIsLoading || !mounted || !user || user.type !== 'fenix_master' || isLoadingData) {
    return <div className="text-center p-10 text-gray-300">Cargando panel de Pagos...</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="bg-gray-800/50 border-gray-700 text-gray-200">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-green-400 flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Gestión Financiera (GestorFenix)
          </CardTitle>
          <CardDescription className="text-gray-400">
            Supervisa, factura y registra pagos centralizados de los equipos.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-700/50 border-gray-600 text-gray-300">
           <TabsTrigger value="facturacion" className="data-[state=active]:bg-green-600/80 data-[state=active]:text-white">
            <Receipt className="mr-2 h-4 w-4" /> Facturación
          </TabsTrigger>
          <TabsTrigger value="registrar" className="data-[state=active]:bg-green-600/80 data-[state=active]:text-white">
            <CreditCard className="mr-2 h-4 w-4" /> Registrar Pago de Equipo
          </TabsTrigger>
          <TabsTrigger value="supervision" className="data-[state=active]:bg-green-600/80 data-[state=active]:text-white">
            <BarChartBig className="mr-2 h-4 w-4" /> Supervisión
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="facturacion">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <Card className="shadow-lg bg-gray-800/50 border-gray-700 text-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-100">
                            <FileClock className="h-5 w-5 text-green-400" />
                            Facturación Automática por Vencimiento
                        </CardTitle>
                        <CardDescription className="text-gray-400">Equipos con cuota pendiente de generar para el mes actual ({format(new Date(), 'MMMM', {locale: es})}).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingInvoices.length > 0 ? (
                             <ScrollArea className="h-60 rounded-md border border-gray-600 p-2 bg-gray-700/30">
                                {pendingInvoices.map(item => (
                                    <div key={item.team.id} className="flex justify-between items-center p-2 rounded hover:bg-gray-700/50">
                                        <div>
                                            <p className="font-medium text-gray-200">{item.team.name}</p>
                                            <p className="text-xs text-gray-400">Día de cobro: {item.team.foundationDate ? format(parseISO(item.team.foundationDate), 'dd', {locale: es}) : 'N/A'}</p>
                                        </div>
                                        <p className="font-mono text-green-300">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.amount)}</p>
                                    </div>
                                ))}
                            </ScrollArea>
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <p>¡Excelente! Todos los equipos ya han sido facturados para este mes.</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleGenerateAllPending} disabled={pendingInvoices.length === 0} className="w-full bg-green-600 hover:bg-green-700 text-white">
                            <FileClock className="mr-2 h-4 w-4" /> Generar Todas las Facturas Pendientes ({pendingInvoices.length})
                        </Button>
                    </CardFooter>
                </Card>
                 <Card className="shadow-lg bg-gray-800/50 border-gray-700 text-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-100">
                            <Receipt className="h-5 w-5 text-green-400" />
                            Facturación Manual
                        </CardTitle>
                        <CardDescription className="text-gray-400">Selecciona un equipo para calcular su cuota y preparar el registro de pago.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceTeamId" className="text-gray-300">Equipo a Facturar <span className="text-red-400">*</span></Label>
                                <Select value={invoiceTeamId} onValueChange={setInvoiceTeamId}>
                                    <SelectTrigger id="invoiceTeamId" className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500 data-[placeholder]:text-gray-400">
                                        <SelectValue placeholder="Seleccionar equipo..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                                        {teams.map(team => (
                                            <SelectItem key={team.id} value={team.id} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{team.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoiceMonth" className="text-gray-300">Mes de Facturación <span className="text-red-400">*</span></Label>
                                <Select value={invoiceMonth} onValueChange={setInvoiceMonth}>
                                    <SelectTrigger id="invoiceMonth" className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500">
                                        <SelectValue placeholder="Seleccionar mes..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                                        {monthOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="invoiceDiscount" className="text-gray-300">Descuento Promocional (%)</Label>
                           <Input id="invoiceDiscount" type="number" min="0" max="100" value={invoiceDiscount} onChange={(e) => setInvoiceDiscount(Number(e.target.value))} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                        </div>
                        {invoiceCalculation && (
                            <Card className="bg-gray-700/50 border-gray-600 p-3 space-y-1">
                               <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4">
                                    <span>Tarifa Base:</span><span className="text-right font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoiceCalculation.baseFee)}</span>
                                    <span className="col-span-2 text-xs">Valor Paquete (Límites: {invoiceCalculation.team.coachLimit || 'N/A'} Entr, {invoiceCalculation.team.athleteLimit || 'N/A'} Dep):</span>
                                    <span className="col-span-2 text-right font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoiceCalculation.packagePrice)}</span>
                                    <span className="font-semibold border-t border-gray-600 pt-1 mt-1">Subtotal:</span><span className="text-right font-semibold border-t border-gray-600 pt-1 mt-1 font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoiceCalculation.subtotal)}</span>
                                    <span>Descuento ({invoiceCalculation.discountPercentage}%):</span><span className="text-right font-mono text-yellow-400">-{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoiceCalculation.discountAmount)}</span>
                                    <span className="font-bold text-base border-t-2 border-gray-500 pt-1 mt-1">Total a Pagar:</span><span className="text-right font-bold text-base border-t-2 border-gray-500 pt-1 mt-1 font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoiceCalculation.total)}</span>
                               </div>
                            </Card>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleGenerateInvoice} disabled={!invoiceTeamId} className="bg-green-600 hover:bg-green-700 text-white">
                            <Receipt className="mr-2 h-4 w-4" /> Generar Factura
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="registrar">
          <Card className="shadow-lg bg-gray-800/50 border-gray-700 text-gray-200 mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <PlusCircle className="h-5 w-5 text-green-400" />
                {isEditingPayment ? 'Editar Pago de Equipo' : 'Registrar Pago Centralizado de Equipo'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isEditingPayment ? `Modificando el pago de ${isEditingPayment.teamName}` : 'Registra un pago recibido de un equipo específico (ej: cuota de plataforma).'}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegisterTeamPayment}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="teamId" className="text-gray-300">Equipo que Paga <span className="text-red-400">*</span></Label>
                    <Select name="teamId" value={paymentForm.teamId} onValueChange={(value) => handlePaymentSelectChange('teamId', value)} required>
                      <SelectTrigger id="teamId" className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500 data-[placeholder]:text-gray-400">
                        <SelectValue placeholder="Seleccionar equipo..." />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                        {isLoadingData ? (
                          <SelectItem value="loading" disabled>Cargando equipos...</SelectItem>
                        ) : teams.length > 0 ? (
                          teams.map(team => (
                            <SelectItem key={team.id} value={team.id} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{team.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-teams" disabled>No hay equipos activos.</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-300">Monto del Pago (COP) <span className="text-red-400">*</span></Label>
                    <Input id="amount" name="amount" type="number" placeholder="Ej: 150000" value={paymentForm.amount} onChange={handlePaymentFormChange} required className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concept" className="text-gray-300">Concepto del Pago <span className="text-red-400">*</span></Label>
                  <Input id="concept" name="concept" placeholder="Ej: Cuota Plataforma Enero, Inscripción Torneo" value={paymentForm.concept} onChange={handlePaymentFormChange} required className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label htmlFor="paymentDate" className="text-gray-300">Fecha de Pago</Label>
                     <Input id="paymentDate" name="paymentDate" type="date" value={paymentForm.paymentDate} onChange={handlePaymentFormChange} className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400" />
                   </div>
                    <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="text-gray-300">Medio de Pago</Label>
                        <Select name="paymentMethod" value={paymentForm.paymentMethod} onValueChange={(value) => handlePaymentSelectChange('paymentMethod', value as PaymentMethod)} required>
                        <SelectTrigger id="paymentMethod" className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-green-500 data-[placeholder]:text-gray-400">
                            <SelectValue placeholder="Seleccionar medio de pago..."/>
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                            {paymentMethods.map(method => <SelectItem key={method} value={method} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{method}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status" className="text-gray-300">Estado del Pago</Label>
                    <Select name="status" value={paymentForm.status} onValueChange={(value) => handlePaymentSelectChange('status', value as PaymentStatus)} required>
                        <SelectTrigger id="status" className="bg-gray-700 border-gray-600 text-gray-100 focus:ring-green-500"><SelectValue/></SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                           {paymentStatuses.map(s => <SelectItem key={s} value={s} className="focus:bg-gray-600 data-[highlighted]:bg-gray-600 hover:bg-gray-600">{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
              </CardContent>
              <CardFooter>
                 <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    {isEditingPayment ? 'Actualizar Pago' : <><DollarSign className="mr-2 h-4 w-4" /> Registrar Pago</>}
                </Button>
                {isEditingPayment && <Button type="button" variant="outline" className="ml-2 border-gray-600 text-gray-300 hover:bg-gray-600" onClick={() => {setIsEditingPayment(null); setPaymentForm(initialPaymentFormState);}}>Cancelar Edición</Button>}
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="supervision">
          <Card className="shadow-lg bg-gray-800/50 border-gray-700 text-gray-200 mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                 <Activity className="h-5 w-5 text-green-400" />
                Supervisión Financiera
              </CardTitle>
              <CardDescription className="text-gray-400">Balances de ingresos e historial de pagos de la plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-gray-700/50 border-gray-600 p-4">
                    <CardTitle className="text-lg text-green-300 mb-4">Balance de Ingresos</CardTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <Label htmlFor="balancePeriod" className="text-gray-300 text-sm">Período</Label>
                            <Select value={balancePeriod} onValueChange={(v) => setBalancePeriod(v as BalancePeriod)}>
                                <SelectTrigger id="balancePeriod" className="bg-gray-600 border-gray-500 text-gray-100 focus:ring-green-500"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                                    <SelectItem value="day" className="focus:bg-gray-600">Hoy</SelectItem>
                                    <SelectItem value="week" className="focus:bg-gray-600">Esta Semana</SelectItem>
                                    <SelectItem value="month" className="focus:bg-gray-600">Este Mes</SelectItem>
                                    <SelectItem value="bimester" className="focus:bg-gray-600">Últimos 2 Meses</SelectItem>
                                    <SelectItem value="quarter" className="focus:bg-gray-600">Este Trimestre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="balancePaymentMethod" className="text-gray-300 text-sm">Método de Pago</Label>
                            <Select value={balancePaymentMethod} onValueChange={setBalancePaymentMethod}>
                                <SelectTrigger id="balancePaymentMethod" className="bg-gray-600 border-gray-500 text-gray-100 focus:ring-green-500"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                                    <SelectItem value="all" className="focus:bg-gray-600">Todos</SelectItem>
                                    {paymentMethods.map(m => <SelectItem key={m} value={m} className="focus:bg-gray-600">{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-full md:col-span-2">
                             <Card className="bg-gray-800/60">
                                <CardContent className="p-3 text-center">
                                    <Label className="text-sm text-gray-400">Total Ingresado (Pagado)</Label>
                                    <p className="text-2xl font-bold text-green-400">
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(calculatedBalance)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </Card>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg flex items-center gap-1.5 text-gray-300"><ListChecks className="h-5 w-5"/>Historial de Pagos de Equipos</h3>
                        <Button variant="outline" onClick={handleExportReport} disabled={payments.length === 0} className="border-gray-600 text-gray-300 hover:bg-gray-600">
                           <Download className="mr-2 h-4 w-4" /> Exportar Reporte (CSV)
                        </Button>
                    </div>
                     <ScrollArea className="h-80 rounded-md border border-gray-600 bg-gray-700/30 p-2">
                        {payments.length > 0 ? (
                           <Table>
                                <TableHeader className="[&_tr]:border-gray-600">
                                    <TableRow>
                                        <TableHead className="text-gray-300">Equipo</TableHead>
                                        <TableHead className="text-gray-300">Concepto</TableHead>
                                        <TableHead className="text-gray-300 text-right">Monto</TableHead>
                                        <TableHead className="text-gray-300">Fecha Pago</TableHead>
                                        <TableHead className="text-gray-300">Método</TableHead>
                                        <TableHead className="text-gray-300 text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="[&_tr]:border-gray-600">
                                    {payments.map(p => (
                                        <TableRow key={p.id} className="hover:bg-gray-600/50">
                                            <TableCell className="font-medium text-gray-200">{p.teamName}</TableCell>
                                            <TableCell className="text-gray-300">{p.concept}</TableCell>
                                            <TableCell className="text-right text-gray-200">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.amount)}</TableCell>
                                            <TableCell className="text-gray-300">{format(parseISO(p.paymentDate), 'dd MMM yyyy', { locale: es })}</TableCell>
                                            <TableCell className="text-gray-300">{p.paymentMethod}</TableCell>
                                            <TableCell className="text-center">
                                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-100" onClick={() => handleEditPayment(p)}><Edit className="h-4 w-4"/></Button>
                                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={() => setPaymentToDelete(p)}><Trash2 className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                           </Table>
                        ) : (
                            <p className="text-sm text-gray-400 text-center pt-8">No hay pagos registrados en el sistema.</p>
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {generatedInvoiceData && (
          <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
              <DialogContent className="sm:max-w-3xl bg-gray-100 text-gray-900">
                  <DialogHeader>
                      <DialogTitle>Vista Previa de Factura</DialogTitle>
                      <DialogDescription>Revisa la factura antes de continuar.</DialogDescription>
                  </DialogHeader>
                  <div ref={invoiceRef} className="p-6 bg-white rounded-md">
                      <header className="flex justify-between items-start pb-4 mb-4 border-b">
                          <div>
                              <h2 className="text-2xl font-bold text-gray-800">Plataforma Fenix</h2>
                              <p className="text-gray-500">Factura de Servicios</p>
                          </div>
                          <div className="text-right">
                              <h3 className="font-semibold text-lg">Factura para:</h3>
                              <p>{generatedInvoiceData.team.name}</p>
                              <p>{generatedInvoiceData.team.clubEmail || 'Email no disponible'}</p>
                          </div>
                      </header>
                      <div className="mb-6">
                          <p><strong>Fecha de Emisión:</strong> {format(new Date(), 'dd MMMM yyyy', { locale: es })}</p>
                          <p><strong>Mes del Servicio:</strong> {generatedInvoiceData.monthLabel}</p>
                          <p><strong>Factura #:</strong> FENIX-{Date.now().toString().slice(-6)}</p>
                      </div>
                      <table className="w-full text-sm text-left">
                          <thead>
                              <tr className="bg-gray-200">
                                  <th className="p-2">Concepto</th>
                                  <th className="p-2 text-right">Valor</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td className="p-2">Cuota Base Plataforma</td>
                                  <td className="p-2 text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(generatedInvoiceData.baseFee)}</td>
                              </tr>
                              <tr>
                                  <td className="p-2">Valor del Paquete (Límites: {generatedInvoiceData.team.coachLimit || 'N/A'} Entr, {generatedInvoiceData.team.athleteLimit || 'N/A'} Dep)</td>
                                  <td className="p-2 text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(generatedInvoiceData.packagePrice)}</td>
                              </tr>
                          </tbody>
                      </table>
                      <div className="w-full flex justify-end mt-4">
                          <div className="w-1/2 space-y-1 text-sm">
                              <div className="flex justify-between border-t pt-2">
                                  <span>Subtotal:</span>
                                  <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(generatedInvoiceData.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span>Descuento ({generatedInvoiceData.discountPercentage}%):</span>
                                  <span className="text-green-600">-{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(generatedInvoiceData.discountAmount)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg border-t-2 pt-2 mt-2">
                                  <span>Total a Pagar:</span>
                                  <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(generatedInvoiceData.total)}</span>
                              </div>
                          </div>
                      </div>
                       <p className="text-xs text-gray-500 mt-6 text-center">Gracias por utilizar la Plataforma Fenix.</p>
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>Cerrar</Button>
                      <Button onClick={handleDownloadInvoice}>Descargar PDF</Button>
                      <Button onClick={handleLoadInvoiceDataToForm}>Cargar Datos a Formulario</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}

      {paymentToDelete && (
        <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
            <AlertDialogContent className="bg-gray-800 border-gray-700 text-gray-200">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-100">¿Eliminar este pago?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                        Se eliminará el pago de <strong>{paymentToDelete.teamName}</strong> por el concepto de "{paymentToDelete.concept}". Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-600">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePayment} className="bg-red-500 hover:bg-red-600 text-white">Sí, Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
