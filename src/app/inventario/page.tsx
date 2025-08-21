
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, type FormEvent } from 'react';
import { PlusCircle, Trash2, Edit, Package, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InventoryItem {
  id: string;
  teamId?: string;
  description: string;
  purchaseDate: string;
  value: number;
  quantity: number;
  observations: string;
  assignedTo: string;
}

const INVENTORY_STORAGE_KEY_PREFIX = 'inventory_';

const initialFormState: Omit<InventoryItem, 'id' | 'teamId'> = {
  description: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  value: 0,
  quantity: 1,
  observations: '',
  assignedTo: '',
};

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [formState, setFormState] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [mounted, setMounted] = useState(false);

  const getStorageKey = () => {
    if (!user) return null;
    const teamId = user.type === 'team_admin' ? user.teamId : 'global';
    return `${INVENTORY_STORAGE_KEY_PREFIX}${teamId}`;
  }

  useEffect(() => {
    setMounted(true);
    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const storedInventory = localStorage.getItem(storageKey);
      if (storedInventory) {
        setInventory(JSON.parse(storedInventory));
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast({ title: "Error", description: "No se pudo cargar el inventario.", variant: "destructive" });
    }
  }, [user, toast]);

  const saveInventory = (updatedInventory: InventoryItem[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedInventory));
      setInventory(updatedInventory);
    } catch (error) {
      console.error("Error saving inventory:", error);
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formState.description || formState.quantity <= 0) {
      toast({ title: "Datos inválidos", description: "La descripción y una cantidad válida son requeridas.", variant: "destructive" });
      return;
    }

    if (isEditing) {
      const updatedInventory = inventory.map(item =>
        item.id === isEditing.id ? { ...item, ...formState, value: Number(formState.value), quantity: Number(formState.quantity) } : item
      );
      saveInventory(updatedInventory);
      toast({ title: "Elemento Actualizado" });
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        teamId: user?.type === 'team_admin' ? user.teamId : undefined,
        ...formState,
        value: Number(formState.value),
        quantity: Number(formState.quantity),
      };
      saveInventory([...inventory, newItem]);
      toast({ title: "Elemento Añadido" });
    }
    setFormState(initialFormState);
    setIsEditing(null);
  };
  
  const handleEdit = (item: InventoryItem) => {
    setIsEditing(item);
    setFormState({
        description: item.description,
        purchaseDate: item.purchaseDate,
        value: item.value,
        quantity: item.quantity,
        observations: item.observations,
        assignedTo: item.assignedTo,
    });
  };

  const handleDelete = () => {
    if(!itemToDelete) return;
    const updatedInventory = inventory.filter(item => item.id !== itemToDelete.id);
    saveInventory(updatedInventory);
    toast({title: "Elemento Eliminado"});
    setItemToDelete(null);
  };
  
  const handleExportCsv = () => {
    if (!mounted || inventory.length === 0) {
      toast({ title: "No hay datos", description: "No hay elementos en el inventario para exportar.", variant: "destructive" });
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

    const headers = ["ID", "Descripción", "Cantidad", "Valor Unitario", "Valor Total", "Fecha Compra", "Asignado a", "Observaciones"];
    const csvRows = [
      headers.join(','),
      ...inventory.map(item => [
        escapeCsvCell(item.id),
        escapeCsvCell(item.description),
        escapeCsvCell(item.quantity),
        escapeCsvCell(item.value),
        escapeCsvCell(item.quantity * item.value),
        escapeCsvCell(item.purchaseDate),
        escapeCsvCell(item.assignedTo),
        escapeCsvCell(item.observations),
      ].join(','))
    ];
    const csvString = csvRows.join('\r\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `inventario_${user?.type === 'team_admin' ? user.currentTeamName?.replace(/\s+/g, '_') : 'global'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "CSV Generado", description: "El archivo de inventario ha sido descargado." });
    } else {
      toast({ title: "Error", description: "Tu navegador no soporta la descarga directa.", variant: "destructive" });
    }
  };

  if (!mounted) {
    return <AppLayout><p>Cargando...</p></AppLayout>;
  }
   if (!user || (user.type !== 'admin' && user.type !== 'team_admin')) {
      return (
        <AppLayout>
          <Card>
            <CardHeader><CardTitle>Acceso Denegado</CardTitle></CardHeader>
            <CardContent><p>No tienes permiso para ver esta página.</p></CardContent>
          </Card>
        </AppLayout>
      );
    }

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold text-primary flex items-center gap-2">
            <Package className="h-8 w-8" />
            Gestión de Inventario
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Editar Elemento' : 'Añadir Nuevo Elemento al Inventario'}</CardTitle>
            <CardDescription>
              {isEditing ? `Modificando: ${isEditing.description}` : 'Completa los detalles del nuevo artículo.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1 lg:col-span-3">
                <Label htmlFor="description">Descripción del Elemento</Label>
                <Input id="description" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input id="quantity" type="number" min="1" value={formState.quantity} onChange={e => setFormState({...formState, quantity: Number(e.target.value)})} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="value">Valor Unitario (COP)</Label>
                <Input id="value" type="number" min="0" value={formState.value} onChange={e => setFormState({...formState, value: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="purchaseDate">Fecha de Compra</Label>
                <Input id="purchaseDate" type="date" value={formState.purchaseDate} onChange={e => setFormState({...formState, purchaseDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="assignedTo">Asignado a</Label>
                <Input id="assignedTo" value={formState.assignedTo} onChange={e => setFormState({...formState, assignedTo: e.target.value})} placeholder="Ej: Equipo Sub-14, Entrenador P." />
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea id="observations" value={formState.observations} onChange={e => setFormState({...formState, observations: e.target.value})} rows={2} placeholder="Ej: Estado, ubicación, etc." />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                {isEditing && <Button type="button" variant="outline" onClick={() => { setIsEditing(null); setFormState(initialFormState); }}>Cancelar Edición</Button>}
                <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> {isEditing ? 'Guardar Cambios' : 'Añadir Elemento'}</Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Inventario Actual</CardTitle>
            <Button variant="outline" onClick={handleExportCsv} disabled={inventory.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Descargar CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead>Valor Unitario</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Fecha Compra</TableHead>
                    <TableHead>Asignado a</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventory.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay elementos en el inventario.</TableCell>
                        </TableRow>
                    )}
                    {inventory.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.value)}</TableCell>
                        <TableCell>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.value * item.quantity)}</TableCell>
                        <TableCell>{format(new Date(item.purchaseDate), 'dd MMM yyyy', { locale: es })}</TableCell>
                        <TableCell>{item.assignedTo}</TableCell>
                        <TableCell className="text-right space-x-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setItemToDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
       {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar "{itemToDelete.description}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El elemento será eliminado permanentemente del inventario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Sí, Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AppLayout>
  );
}
