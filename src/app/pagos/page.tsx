
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, type FormEvent, useMemo, type ChangeEvent, useRef } from 'react';
import type { AthleteStorageItem } from '../registro/atleta/page'; 
import { type PaymentRecord, type PaymentMethod, type PaymentStatus, PAYMENTS_STORAGE_KEY } from '@/types/payments';
import { DollarSign, ListOrdered, PlusCircle, Trash2, Edit, AlertTriangle, Clock, TrendingUp, VenetianMask } from 'lucide-react';
import { format, isBefore, isSameMonth, parseISO, startOfMonth, getDate, getYear, getMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
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
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { volleyballCategories } from '@/app/atletas/page';


const ATHLETES_STORAGE_KEY = 'athletes'; 

const paymentMethods: PaymentMethod[] = [
  'Efectivo', 'Transferencia Bancaria', 'Tarjeta de Crédito', 'Tarjeta de Débito', 
  'PSE', 'Nequi', 'Daviplata', 'Otro'
];
const paymentStatuses: PaymentStatus[] = ['Pagado', 'Pendiente', 'Vencido', 'Anulado'];

const initialPaymentFormState = {
  athleteId: '',
  amount: '',
  concept: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'Efectivo' as PaymentMethod,
  status: 'Pagado' as PaymentStatus,
  notes: '',
};

interface PaymentAlert {
    athleteId: string;
    athleteName: string;
    dueDate: Date;
    status: 'Vencido' | 'Pendiente';
}

type BalancePeriod = 'day' | 'week' | 'month' | 'quarter';

export default function PaymentsPage() {
  const [allTeamAthletes, setAllTeamAthletes] = useState<AthleteStorageItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentForm, setPaymentForm] = useState(initialPaymentFormState);
  const [isEditingPayment, setIsEditingPayment] = useState<PaymentRecord | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  const [paymentAlerts, setPaymentAlerts] = useState<PaymentAlert[]>([]);
  const registrationFormRef = useRef<HTMLDivElement>(null);

  // State for balance filters
  const [balancePeriod, setBalancePeriod] = useState<BalancePeriod>('month');
  const [balanceCategory, setBalanceCategory] = useState<string>('all');
  const [balanceAthleteId, setBalanceAthleteId] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
    let athletesForView: AthleteStorageItem[] = [];
    try {
      const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
      if (storedAthletesString) {
        let allFetchedAthletes: AthleteStorageItem[] = JSON.parse(storedAthletesString);
        if (user?.type === 'team_admin' && user.teamId) {
            athletesForView = allFetchedAthletes.filter(athlete => athlete.teamId === user.teamId && athlete.isActive);
        } else if (user?.type === 'admin') {
            athletesForView = allFetchedAthletes.filter(athlete => !athlete.teamId && athlete.isActive); // Admin global ve atletas activos sin teamId
        } else if (user?.type === 'coach' && user.assignedCategories && user.assignedCategories.length > 0) {
            athletesForView = allFetchedAthletes.filter(athlete => !athlete.teamId && user.assignedCategories!.includes(athlete.category) && athlete.isActive);
        } else {
            athletesForView = [];
        }
        setAllTeamAthletes(athletesForView);
      }
    } catch (error) {
      console.error("Error loading athletes:", error);
      toast({ title: "Error", description: "No se pudieron cargar los atletas.", variant: "destructive" });
    }

    try {
      const storedPaymentsString = localStorage.getItem(PAYMENTS_STORAGE_KEY);
      if (storedPaymentsString) {
        const allPayments: PaymentRecord[] = JSON.parse(storedPaymentsString);
        let paymentsToDisplay = allPayments;
        if (user?.type === 'team_admin' && user.teamId) {
            paymentsToDisplay = allPayments.filter(p => p.teamId === user.teamId);
        } else if (user?.type === 'admin') {
            paymentsToDisplay = allPayments.filter(p => !p.teamId);
        } else { // Coaches u otros roles no ven la gestión de pagos directamente
            paymentsToDisplay = [];
        }
        setPayments(paymentsToDisplay.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      toast({ title: "Error", description: "No se pudieron cargar los registros de pago.", variant: "destructive" });
    }
  }, [toast, user]);


    useEffect(() => {
    if (!mounted || allTeamAthletes.length === 0) return;

    const today = new Date();
    const alerts: PaymentAlert[] = [];

    allTeamAthletes.forEach(athlete => {
        if (!athlete.entryDate) return; 

        const entryDate = parseISO(athlete.entryDate);
        const paymentDay = getDate(entryDate);
        const dueDateThisMonth = new Date(getYear(today), getMonth(today), paymentDay);
        
        const hasPaidThisMonth = payments.some(p => {
            const isMonthlyPayment = p.concept.toLowerCase().includes('mensualidad');
            if (p.athleteId !== athlete.id || !isMonthlyPayment || p.status !== 'Pagado') return false;
            
            const paymentDate = parseISO(p.paymentDate);
            return isSameMonth(paymentDate, today);
        });

        if (!hasPaidThisMonth) {
            if (isBefore(dueDateThisMonth, today)) {
                alerts.push({
                    athleteId: athlete.id,
                    athleteName: athlete.name,
                    dueDate: dueDateThisMonth,
                    status: 'Vencido'
                });
            } else {
                 alerts.push({
                    athleteId: athlete.id,
                    athleteName: athlete.name,
                    dueDate: dueDateThisMonth,
                    status: 'Pendiente'
                });
            }
        }
    });

    setPaymentAlerts(alerts.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()));
  }, [allTeamAthletes, payments, mounted]);


  const savePaymentsToStorage = (updatedPaymentsListForView: PaymentRecord[]) => {
    try {
      const storedPaymentsString = localStorage.getItem(PAYMENTS_STORAGE_KEY);
      let allSystemPayments: PaymentRecord[] = storedPaymentsString ? JSON.parse(storedPaymentsString) : [];

      if (user?.type === 'team_admin' && user.teamId) {
        const otherTeamPayments = allSystemPayments.filter(p => p.teamId !== user.teamId);
        allSystemPayments = [...otherTeamPayments, ...updatedPaymentsListForView];
      } else if (user?.type === 'admin') { // Admin global
        const teamSpecificPayments = allSystemPayments.filter(p => p.teamId);
        allSystemPayments = [...teamSpecificPayments, ...updatedPaymentsListForView.filter(p => !p.teamId)];
      }
      
      localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(allSystemPayments));
      setPayments(updatedPaymentsListForView.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()));
    } catch (error) {
      console.error("Error saving payments to localStorage:", error);
      toast({ title: "Error al Guardar", description: "No se pudieron guardar los cambios en los pagos.", variant: "destructive" });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof typeof initialPaymentFormState, value: string) => {
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleQuickRegister = (athleteId: string) => {
    setPaymentForm(prev => ({ ...initialPaymentFormState, athleteId }));
    registrationFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const calculatedBalance = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (balancePeriod) {
        case 'day':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
        case 'week':
            startDate = startOfWeek(now, { weekStartsOn: 1 });
            endDate = endOfWeek(now, { weekStartsOn: 1 });
            break;
        case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
        case 'quarter':
            startDate = startOfQuarter(now);
            endDate = endOfQuarter(now);
            break;
    }

    const athletesInCategory = balanceCategory === 'all' 
        ? allTeamAthletes 
        : allTeamAthletes.filter(a => a.category === balanceCategory);
    
    const athleteIdsToConsider = athletesInCategory.map(a => a.id);

    const filteredPayments = payments.filter(p => {
        const paymentDate = parseISO(p.paymentDate);
        const isWithinDateRange = paymentDate >= startDate && paymentDate <= endDate;
        if (!isWithinDateRange || p.status !== 'Pagado') return false;

        const isCategoryMatch = balanceCategory === 'all' || athleteIdsToConsider.includes(p.athleteId);
        const isAthleteMatch = balanceAthleteId === 'all' || p.athleteId === balanceAthleteId;
        
        return isCategoryMatch && isAthleteMatch;
    });

    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  }, [balancePeriod, balanceCategory, balanceAthleteId, payments, allTeamAthletes]);


  const handleSubmitPayment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedAthlete = allTeamAthletes.find(a => a.id === paymentForm.athleteId);

    if (!selectedAthlete || !paymentForm.amount || !paymentForm.concept) {
      toast({ title: "Campos incompletos", description: "Selecciona un atleta e ingresa monto y concepto.", variant: "destructive" });
      return;
    }

    const amountNumber = parseFloat(paymentForm.amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast({ title: "Monto inválido", description: "El monto debe ser un número positivo.", variant: "destructive" });
      return;
    }

    const paymentTeamId = user?.type === 'team_admin' ? user.teamId : undefined;
    let updatedPaymentsListForView: PaymentRecord[];

    if (isEditingPayment) {
      const paymentToUpdate: PaymentRecord = {
        ...isEditingPayment,
        teamId: paymentTeamId,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        amount: amountNumber,
        concept: paymentForm.concept,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod as PaymentMethod,
        status: paymentForm.status as PaymentStatus,
        notes: paymentForm.notes,
      };
      updatedPaymentsListForView = payments.map(p => p.id === isEditingPayment.id ? paymentToUpdate : p);
      toast({ title: "Pago Actualizado", description: `El pago para ${selectedAthlete.name} ha sido actualizado.` });
    } else {
      const newPayment: PaymentRecord = {
        id: crypto.randomUUID(),
        teamId: paymentTeamId,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        amount: amountNumber,
        concept: paymentForm.concept,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod as PaymentMethod,
        status: paymentForm.status as PaymentStatus,
        notes: paymentForm.notes,
        registeredAt: new Date().toISOString(),
      };
      updatedPaymentsListForView = [newPayment, ...payments];
      toast({ title: "Pago Registrado", description: `Nuevo pago para ${selectedAthlete.name} registrado.` });
    }
    
    savePaymentsToStorage(updatedPaymentsListForView);
    setPaymentForm(initialPaymentFormState);
    setIsEditingPayment(null);
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setIsEditingPayment(payment);
    setPaymentForm({
      athleteId: payment.athleteId,
      amount: String(payment.amount),
      concept: payment.concept,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      notes: payment.notes || '',
    });
    registrationFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const confirmDeletePayment = (payment: PaymentRecord) => {
    setPaymentToDelete(payment);
  };

  const handleDeletePayment = () => {
    if (!paymentToDelete) return;
    const updatedPaymentsListForView = payments.filter(p => p.id !== paymentToDelete.id);
    savePaymentsToStorage(updatedPaymentsListForView);
    toast({ title: "Pago Eliminado", description: `El pago de ${paymentToDelete.athleteName} por ${paymentToDelete.concept} ha sido eliminado.` });
    setPaymentToDelete(null);
  };
  
  const getStatusColorClass = (status: PaymentStatus) => {
    switch (status) {
      case 'Pagado': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-700/30';
      case 'Pendiente': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-700/30';
      case 'Vencido': return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-700/30';
      case 'Anulado': return 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-700/30';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const pendingPayments = useMemo(() => paymentAlerts.filter(a => a.status === 'Pendiente'), [paymentAlerts]);
  const overduePayments = useMemo(() => paymentAlerts.filter(a => a.status === 'Vencido'), [paymentAlerts]);


  if (!mounted) {
    return <AppLayout><div className="text-center p-10">Cargando gestión de pagos...</div></AppLayout>;
  }
  
  if (user?.type === 'coach') {
    return (
      <AppLayout>
        <Card>
          <CardHeader><CardTitle>Acceso Denegado</CardTitle></CardHeader>
          <CardContent><p>Los entrenadores no tienen acceso a la gestión de pagos.</p></CardContent>
        </Card>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Gestión de Pagos
        </h1>
        
        {paymentAlerts.length > 0 && (
          <Card className="shadow-lg border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="h-6 w-6" />
                Alertas de Pago (Mes Actual)
              </CardTitle>
              <CardDescription>
                Atletas con pagos pendientes o vencidos para el mes de {format(new Date(), 'MMMM', { locale: es })}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500"><Clock className="h-4 w-4"/>Pagos Pendientes</h3>
                     <ScrollArea className="h-40 rounded-md border p-2">
                        {pendingPayments.length > 0 ? (
                            <ul className="space-y-1">
                                {pendingPayments.map(alert => (
                                    <li key={`pending-${alert.athleteId}`} className="flex justify-between items-center text-sm p-1.5 rounded hover:bg-muted">
                                        <Link href={`/ficha-jugador?id=${alert.athleteId}`} className="font-medium text-foreground hover:underline">{alert.athleteName}</Link>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Vence: {format(alert.dueDate, 'dd MMM', { locale: es })}</span>
                                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleQuickRegister(alert.athleteId)}>Registrar</Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center pt-4">No hay pagos pendientes.</p>
                        )}
                    </ScrollArea>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-1.5 text-red-600 dark:text-red-500"><AlertTriangle className="h-4 w-4"/>Pagos Vencidos</h3>
                    <ScrollArea className="h-40 rounded-md border p-2">
                        {overduePayments.length > 0 ? (
                             <ul className="space-y-1">
                                {overduePayments.map(alert => (
                                     <li key={`overdue-${alert.athleteId}`} className="flex justify-between items-center text-sm p-1.5 rounded hover:bg-muted">
                                        <Link href={`/ficha-jugador?id=${alert.athleteId}`} className="font-medium text-foreground hover:underline">{alert.athleteName}</Link>
                                        <span className="text-xs text-red-500">Venció: {format(alert.dueDate, 'dd MMM', { locale: es })}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground text-center pt-4">No hay pagos vencidos.</p>
                        )}
                    </ScrollArea>
                </div>
            </CardContent>
             <CardFooter>
                 <p className="text-xs text-muted-foreground italic">Esta alerta se basa en los atletas activos y los pagos registrados con el concepto "Mensualidad".</p>
             </CardFooter>
          </Card>
        )}

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary"/>Balances Financieros</CardTitle>
                <CardDescription>Consulta los ingresos totales filtrando por diferentes criterios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <Label htmlFor="balancePeriod">Período</Label>
                        <Select value={balancePeriod} onValueChange={(v) => setBalancePeriod(v as BalancePeriod)}>
                            <SelectTrigger id="balancePeriod"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Diario</SelectItem>
                                <SelectItem value="week">Semanal</SelectItem>
                                <SelectItem value="month">Mensual</SelectItem>
                                <SelectItem value="quarter">Trimestral</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="balanceCategory">Categoría</Label>
                        <Select value={balanceCategory} onValueChange={setBalanceCategory}>
                            <SelectTrigger id="balanceCategory"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las Categorías</SelectItem>
                                {volleyballCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="balanceAthlete">Atleta</Label>
                        <Select value={balanceAthleteId} onValueChange={setBalanceAthleteId}>
                            <SelectTrigger id="balanceAthlete"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Atletas</SelectItem>
                                {allTeamAthletes.filter(a => balanceCategory === 'all' || a.category === balanceCategory).map(ath => <SelectItem key={ath.id} value={ath.id}>{ath.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Card className="bg-primary/10">
                        <CardContent className="p-3 text-center">
                            <Label className="text-sm text-muted-foreground">Total Calculado</Label>
                            <p className="text-2xl font-bold text-primary">
                               {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(calculatedBalance)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-lg" ref={registrationFormRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-accent" /> 
              {isEditingPayment ? 'Editar Pago Existente' : 'Registrar Nuevo Pago'}
            </CardTitle>
            <CardDescription>
              {isEditingPayment ? `Modificando el pago de ${allTeamAthletes.find(a => a.id === paymentForm.athleteId)?.name || 'un atleta'}` : 'Completa el formulario para añadir un nuevo registro de pago.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitPayment}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label htmlFor="athleteId">Atleta <span className="text-destructive">*</span></Label>
                <Select name="athleteId" value={paymentForm.athleteId} onValueChange={(value) => handleSelectChange('athleteId', value)}>
                  <SelectTrigger id="athleteId" aria-required="true">
                    <SelectValue placeholder="Seleccionar atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeamAthletes.length > 0 ? allTeamAthletes.map(athlete => (
                      <SelectItem key={athlete.id} value={athlete.id}>{athlete.name}</SelectItem>
                    )) : <SelectItem value="" disabled>No hay atletas para seleccionar</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="amount">Monto <span className="text-destructive">*</span></Label>
                <Input id="amount" name="amount" type="number" placeholder="Ej: 50000" value={paymentForm.amount} onChange={handleInputChange} step="1000" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="concept">Concepto <span className="text-destructive">*</span></Label>
                <Input id="concept" name="concept" placeholder="Ej: Mensualidad Julio, Inscripción" value={paymentForm.concept} onChange={handleInputChange} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="paymentDate">Fecha de Pago</Label>
                <Input id="paymentDate" name="paymentDate" type="date" value={paymentForm.paymentDate} onChange={handleInputChange} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="paymentMethod">Medio de Pago</Label>
                <Select name="paymentMethod" value={paymentForm.paymentMethod} onValueChange={(value) => handleSelectChange('paymentMethod', value as PaymentMethod)}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Seleccionar medio" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="status">Estado del Pago</Label>
                <Select name="status" value={paymentForm.status} onValueChange={(value) => handleSelectChange('status', value as PaymentStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea id="notes" name="notes" placeholder="Cualquier observación sobre el pago..." value={paymentForm.notes} onChange={handleInputChange} rows={2} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {isEditingPayment && (
                <Button type="button" variant="outline" onClick={() => {setIsEditingPayment(null); setPaymentForm(initialPaymentFormState);}}>
                  Cancelar Edición
                </Button>
              )}
              <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isEditingPayment ? 'Guardar Cambios' : 'Registrar Pago'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ListOrdered className="h-6 w-6 text-primary" /> Historial de Pagos
            </CardTitle>
            <CardDescription>Lista de todos los pagos registrados {user?.type === 'team_admin' ? `para ${user.currentTeamName || 'este equipo'}` : 'globalmente'}, ordenados por fecha (más recientes primero).</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No hay pagos registrados todavía {user?.type === 'team_admin' ? 'para este equipo.' : ''}.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Atleta</TableHead>
                      <TableHead className="min-w-[180px]">Concepto</TableHead>
                      <TableHead className="text-right min-w-[100px]">Monto</TableHead>
                      <TableHead className="min-w-[120px]">Fecha Pago</TableHead>
                      <TableHead className="min-w-[150px]">Medio de Pago</TableHead>
                      <TableHead className="text-center min-w-[100px]">Estado</TableHead>
                      <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.athleteName}</TableCell>
                        <TableCell>{payment.concept}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(payment.amount)}
                        </TableCell>
                        <TableCell>{format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: es })}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(payment.status)}`}>
                            {payment.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditPayment(payment)} title="Editar Pago">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => confirmDeletePayment(payment)} title="Eliminar Pago">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {paymentToDelete && (
        <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar Pago?</AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de eliminar el pago de <strong>{paymentToDelete.athleteName}</strong> por concepto de "{paymentToDelete.concept}" 
                por un monto de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(paymentToDelete.amount)}. 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
                Sí, Eliminar Pago
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}
