
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PHYSICAL_TEST_RESULTS_STORAGE_KEY, type TestSession, type TestColumn } from '@/types/physical-tests';
import { ListChecks, Eye, Trash2, BarChart2, TrendingUp, Info, LineChart as LineChartIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
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
import { Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, ComposedChart, Line, BarChart, Cell as RechartsPrimitive } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface TestResultsViewerProps {
  refreshTrigger: number;
}

interface AthleteHistoricalChartProps {
  athleteId: string;
  currentSessionId: string;
  testMetricId: string;
  testMetricName: string;
  allSavedSessions: TestSession[];
}

// --- New component for Aerobic Test Charts ---
interface AerobicChartCardProps {
    title: string;
    data: { name: string; value: number; fill: string }[];
    dataKey: string;
    chartConfig: ChartConfig;
}

const AerobicChartCard: React.FC<AerobicChartCardProps> = ({ title, data, dataKey, chartConfig }) => {
    return (
        <Card className="bg-muted/30">
            <CardHeader className="p-2">
                <CardTitle className="text-xs font-medium text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-1">
                <ChartContainer config={chartConfig} className="h-[120px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10 }}
                                width={80}
                            />
                            <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey={dataKey} radius={4} layout="vertical">
                                {data.map((entry, index) => (
                                    <RechartsPrimitive key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};


const AthleteHistoricalChart: React.FC<AthleteHistoricalChartProps> = ({
  athleteId,
  currentSessionId,
  testMetricId,
  testMetricName,
  allSavedSessions,
}) => {
  const historicalData = useMemo(() => {
    const data: { date: string; value: number | null; formattedDate: string }[] = [];
    // Filtro más específico para la métrica. Adaptar si se quieren comparar otras métricas.
    const relevantSessions = allSavedSessions.filter(
      s => s.mainTestType === 'alpha_fitness' && s.selectedVariant === 'basica'
    );

    relevantSessions.forEach(session => {
      const athleteDataInSession = session.athletesData.find(ad => ad.athleteId === athleteId);
      if (athleteDataInSession) {
        const metricValue = athleteDataInSession.results[testMetricId];
        let numericValue: number | null = null;
        if (typeof metricValue === 'number') {
          numericValue = metricValue;
        } else if (typeof metricValue === 'string') {
          const parsed = parseFloat(metricValue);
          if (!isNaN(parsed)) {
            numericValue = parsed;
          }
        }
        data.push({
          date: session.testDate,
          value: numericValue,
          formattedDate: format(new Date(session.testDate), 'dd/MM/yy', { locale: es }),
        });
      }
    });
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [athleteId, testMetricId, allSavedSessions]);

  if (historicalData.length < 2) {
    return <p className="text-xs text-muted-foreground/70 italic">No hay suficientes datos históricos para esta métrica ({testMetricName}).</p>;
  }

  const chartConfig: ChartConfig = {
    [testMetricId]: {
      label: testMetricName,
      color: "hsl(var(--accent))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} fontSize={9} />
          <YAxis tickLine={false} axisLine={false} fontSize={9} domain={['auto', 'auto']} />
          <RechartsTooltip content={<ChartTooltipContent indicator="line" />} />
          <Line type="monotone" dataKey="value" name={testMetricName} stroke={`var(--color-${testMetricId})`} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};


export default function TestResultsViewer({ refreshTrigger }: TestResultsViewerProps) {
  const [savedSessions, setSavedSessions] = useState<TestSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<TestSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentSessionForModal, setCurrentSessionForModal] = useState<TestSession | null>(null);
  const [showGroupChart, setShowGroupChart] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedResultsString = localStorage.getItem(PHYSICAL_TEST_RESULTS_STORAGE_KEY);
      if (storedResultsString) {
        const parsedSessions: TestSession[] = JSON.parse(storedResultsString);
        const validSessions = parsedSessions.filter(session => Array.isArray(session.columnsDefinition));
        setSavedSessions(validSessions.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()));
      } else {
        setSavedSessions([]);
      }
    } catch (error) {
      console.error("Error loading test results from localStorage:", error);
      toast({ title: "Error", description: "No se pudieron cargar los resultados guardados.", variant: "destructive" });
      setSavedSessions([]);
    }
    setIsLoading(false);
  }, [refreshTrigger, toast]);

  const handleViewSessionDetailsInModal = (session: TestSession) => {
    setCurrentSessionForModal(session);
    setShowGroupChart(true); 
    setIsDetailModalOpen(true);
  };

  const handleDeleteConfirmation = (session: TestSession) => {
    setSessionToDelete(session);
  };

  const handleDeleteSession = () => {
    if (!sessionToDelete) return;
    try {
      const updatedSessions = savedSessions.filter(s => s.id !== sessionToDelete.id);
      localStorage.setItem(PHYSICAL_TEST_RESULTS_STORAGE_KEY, JSON.stringify(updatedSessions));
      setSavedSessions(updatedSessions);
      toast({ title: "Sesión Eliminada", description: `La sesión "${sessionToDelete.testName}" ha sido eliminada.` });
      if (currentSessionForModal && currentSessionForModal.id === sessionToDelete.id) {
        setIsDetailModalOpen(false);
        setCurrentSessionForModal(null);
      }
    } catch (error) {
      console.error("Error deleting session from localStorage:", error);
      toast({ title: "Error", description: "No se pudo eliminar la sesión.", variant: "destructive" });
    }
    setSessionToDelete(null);
  };

  const escapeCsvCell = (cellData: any): string => {
    if (cellData === undefined || cellData === null) return '';
    let escaped = String(cellData).replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
      escaped = `"${escaped}"`;
    }
    return escaped;
  };
  
  const handleExportCsv = () => {
    if (!currentSessionForModal) {
      toast({ title: "Error", description: "No hay sesión seleccionada para exportar.", variant: "destructive" });
      return;
    }
    
    const session = currentSessionForModal;
    const headers = ['Atleta', ...session.columnsDefinition.map(col => col.name)];
    
    const csvRows = [
      headers.join(','),
      ...session.athletesData.map(athlete => {
        const rowData = [escapeCsvCell(athlete.athleteName)];
        session.columnsDefinition.forEach(col => {
          rowData.push(escapeCsvCell(athlete.results[col.id]));
        });
        return rowData.join(',');
      })
    ];
    
    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const filename = `Resultados_${session.testName.replace(/\s+/g, '_')}_${session.testDate}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "CSV Generado", description: "El archivo de resultados ha sido descargado." });
    } else {
      toast({ title: "Error", description: "Tu navegador no soporta la descarga directa.", variant: "destructive" });
    }
  };


  const groupChartData = useMemo(() => {
    if (!currentSessionForModal || currentSessionForModal.mainTestType !== 'alpha_fitness' || currentSessionForModal.selectedVariant !== 'basica') {
      return null;
    }

    const metricsToAverage: { key: string, name: string, columnId: string }[] = [
      { key: 'navette', name: 'Navette (Nvl)', columnId: 'navette' },
      { key: 'prension', name: 'Prensión (kg)', columnId: 'prension' },
      { key: 'salto_long_1', name: 'Salto L1 (cm)', columnId: 'salto_long_1' },
      { key: 'cintura', name: 'Cintura (cm)', columnId: 'cintura' },
    ];

    const aggregatedResults: { [key: string]: number[] } = {};
    metricsToAverage.forEach(metric => aggregatedResults[metric.columnId] = []);

    currentSessionForModal.athletesData.forEach(athlete => {
      metricsToAverage.forEach(metric => {
        const resultValue = athlete.results[metric.columnId];
        if (typeof resultValue === 'number' && !isNaN(resultValue)) {
          aggregatedResults[metric.columnId].push(resultValue);
        } else if (typeof resultValue === 'string') {
          const parsed = parseFloat(resultValue);
          if (!isNaN(parsed)) {
            aggregatedResults[metric.columnId].push(parsed);
          }
        }
      });
    });

    const chartData = metricsToAverage.map(metric => {
      const values = aggregatedResults[metric.columnId];
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = values.length > 0 ? parseFloat((sum / values.length).toFixed(1)) : 0;
      return { name: metric.name, Promedio: average };
    });

    return chartData;

  }, [currentSessionForModal]);

  const groupChartConfig = {
    Promedio: {
      label: "Promedio Grupal",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando Resultados...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Por favor, espera mientras se cargan los resultados de las pruebas guardadas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="shadow-xl h-full flex flex-col">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            Pruebas Guardadas
            </CardTitle>
            <CardDescription>Consulta las sesiones de pruebas físicas registradas.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden">
            {savedSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay sesiones de pruebas físicas guardadas todavía.</p>
            ) : (
            <ScrollArea className="h-full max-h-[calc(100vh-200px)] w-full rounded-md">
                <ul className="space-y-3 pr-2">
                {savedSessions.map((session) => (
                    <li key={session.id} className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                        <div className="flex-grow mb-2 sm:mb-0">
                        <h3 className="font-semibold text-md text-primary">{session.testName}</h3>
                        <p className="text-xs text-muted-foreground">
                            Fecha: {format(new Date(session.testDate), 'dd MMMM yyyy', { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Atletas: {session.athletesData.length} | 
                            Cat: {(session.categoriesTested && session.categoriesTested.length > 0) ? session.categoriesTested.join(', ').substring(0,30) : 'Todas'}
                            {(session.categoriesTested && session.categoriesTested.join(', ').length > 30) ? '...' : ''}
                        </p>
                        </div>
                        <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
                            <Button variant="outline" size="sm" onClick={() => handleViewSessionDetailsInModal(session)}>
                                <Eye className="mr-1 h-4 w-4" /> Detalles
                            </Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteConfirmation(session)} title="Eliminar Sesión">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    </li>
                ))}
                </ul>
            </ScrollArea>
            )}
        </CardContent>
        {sessionToDelete && (
            <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar Sesión "{sessionToDelete.testName}"?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Los resultados de esta sesión de prueba serán eliminados permanentemente.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive hover:bg-destructive/90">
                    Eliminar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        )}
      </Card>

      {currentSessionForModal && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-4 border-b flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                      <Eye className="h-6 w-6 text-primary" />
                      {currentSessionForModal.testName}
                  </DialogTitle>
                  <DialogDescription>
                      Fecha: {format(new Date(currentSessionForModal.testDate), 'dd MMMM yyyy', { locale: es })} | 
                      Categorías: {currentSessionForModal.categoriesTested.join(', ') || 'Todas'} | 
                      Atletas: {currentSessionForModal.athletesData.length}
                  </DialogDescription>
                </div>
                <div className="flex gap-2 items-start">
                  <Button variant="outline" size="sm" onClick={handleExportCsv}>
                      <Download className="mr-2 h-4 w-4" /> Descargar CSV
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                      handleDeleteConfirmation(currentSessionForModal);
                  }}>
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar Sesión
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 space-y-6"> 
                  {showGroupChart && currentSessionForModal.mainTestType === 'alpha_fitness' && currentSessionForModal.selectedVariant === 'basica' && groupChartData && (
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart2 className="h-5 w-5 text-primary" />
                          Resumen Grupal: Alpha Fitness Básica (Promedios)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={groupChartConfig} className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={groupChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} interval={0} angle={-30} textAnchor="end" height={60}/>
                              <YAxis tickLine={false} axisLine={false} fontSize={10} />
                              <RechartsTooltip content={<ChartTooltipContent />} />
                              <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                              <Bar dataKey="Promedio" fill="var(--color-Promedio)" radius={4} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  )}

                  <h3 className="text-lg font-semibold text-foreground">Resultados por Atleta:</h3>
                  <div className="w-full overflow-x-auto"> 
                    <div className="flex flex-row gap-4 pb-2"> 
                        {currentSessionForModal.athletesData.map(athleteData => (
                            <Card key={athleteData.athleteId} className="flex-shrink-0 w-[300px] md:w-[320px] flex flex-col bg-background shadow">
                                <CardHeader className="p-3 border-b">
                                  <CardTitle className="text-md font-semibold text-primary">{athleteData.athleteName}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 space-y-1 flex-grow">
                                  <ScrollArea className="w-full whitespace-nowrap max-h-[150px] rounded-md border">
                                    <ul className="text-sm space-y-1 p-2">
                                        {currentSessionForModal.columnsDefinition?.map(colDef => (
                                            <li key={colDef.id} className="flex justify-between items-center min-w-max gap-2">
                                                <span className="text-muted-foreground text-xs mr-2 shrink-0">{colDef.name}:</span>
                                                <span className="font-medium text-foreground text-sm text-right">{String(athleteData.results[colDef.id] ?? 'N/A')}</span>
                                            </li>
                                        ))}
                                    </ul>
                                  </ScrollArea>
                                  
                                  {currentSessionForModal.mainTestType === 'pruebas_aerobicas' && (
                                     <div className="mt-3 pt-2 border-t border-dashed space-y-2">
                                        <h4 className="text-xs font-semibold text-muted-foreground">Gráficos de Rendimiento Aeróbico:</h4>
                                        <AerobicChartCard 
                                            title="Tiempo (min)"
                                            dataKey="value"
                                            data={[
                                                { name: 'Obtenido', value: Number(athleteData.results['tiempo_min'] || 0), fill: 'hsl(var(--primary))' },
                                                { name: 'Estándar', value: 22, fill: 'hsl(var(--secondary))' } 
                                            ]}
                                            chartConfig={{ value: { label: 'Tiempo' }}}
                                        />
                                        <AerobicChartCard 
                                            title="VO2 Max (est.)"
                                            dataKey="value"
                                            data={[
                                                { name: 'Obtenido', value: Number(athleteData.results['vo2_max'] || 0), fill: 'hsl(var(--primary))' },
                                                { name: 'Promedio', value: 45, fill: 'hsl(var(--secondary))' }
                                            ]}
                                            chartConfig={{ value: { label: 'VO2Max' }}}
                                        />
                                         <AerobicChartCard 
                                            title="METs (est.)"
                                            dataKey="value"
                                            data={[
                                                { name: 'Obtenido', value: Number(athleteData.results['mets'] || 0), fill: 'hsl(var(--primary))' },
                                                { name: 'Promedio', value: 12.9, fill: 'hsl(var(--secondary))' }
                                            ]}
                                            chartConfig={{ value: { label: 'METs' }}}
                                        />
                                     </div>
                                  )}

                                  {currentSessionForModal.mainTestType === 'alpha_fitness' && currentSessionForModal.selectedVariant === 'basica' && (
                                      <div className="mt-3 pt-2 border-t border-dashed">
                                        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                                          <LineChartIcon className="h-3 w-3"/> Evolución Navette:
                                        </h4>
                                        <AthleteHistoricalChart
                                          athleteId={athleteData.athleteId}
                                          currentSessionId={currentSessionForModal.id}
                                          testMetricId="navette"
                                          testMetricName="Navette (Nvl)"
                                          allSavedSessions={savedSessions}
                                        />
                                      </div>
                                  )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                  </div>
              </div>
            </div>
            <DialogFooter className="p-4 border-t flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowGroupChart(prev => !prev)}
                    disabled={!(currentSessionForModal?.mainTestType === 'alpha_fitness' && currentSessionForModal?.selectedVariant === 'basica')}
                  >
                    GRG
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mostrar/Ocultar Gráfica de Rendimiento Grupal</p>
                </TooltipContent>
              </Tooltip>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TooltipProvider>
  );
}
