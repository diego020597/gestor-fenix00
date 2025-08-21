
export type PaymentMethod = 
  | 'Efectivo' 
  | 'Transferencia Bancaria' 
  | 'Tarjeta de Crédito' 
  | 'Tarjeta de Débito' 
  | 'PSE' 
  | 'Nequi' 
  | 'Daviplata' 
  | 'Otro';

export type PaymentStatus = 'Pagado' | 'Pendiente' | 'Vencido' | 'Anulado';

export interface PaymentRecord {
  id: string; 
  teamId?: string;
  teamName?: string; // Nombre del equipo en el momento del pago
  athleteId: string; 
  athleteName: string; 
  amount: number; 
  concept: string; 
  paymentDate: string; 
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string; 
  sentAt: string; 
}

export const PAYMENTS_STORAGE_KEY = 'paymentRecords_v1';
