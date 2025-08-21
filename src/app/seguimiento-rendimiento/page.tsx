'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, LineChart, TrendingUp, Activity } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip, Line, ComposedChart } from "recharts"

const chartData = [
  { month: "Ene", "Ataques Exitosos": 65, "Bloqueos": 30, "Saques Directos": 10 },
  { month: "Feb", "Ataques Exitosos": 70, "Bloqueos": 35, "Saques Directos": 12 },
  { month: "Mar", "Ataques Exitosos": 75, "Bloqueos": 40, "Saques Directos": 15 },
  { month: "Abr", "Ataques Exitosos": 80, "Bloqueos": 38, "Saques Directos": 13 },
  { month: "May", "Ataques Exitosos": 78, "Bloqueos": 42, "Saques Directos": 16 },
];

const chartConfig = {
  "Ataques Exitosos": {
    label: "Ataques Exitosos",
    color: "hsl(var(--primary))",
  },
  "Bloqueos": {
    label: "Bloqueos",
    color: "hsl(var(--accent))",
  },
  "Saques Directos": {
    label: "Saques Directos",
    color: "hsl(var(--secondary-foreground))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export default function PerformanceTrackingPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold text-primary">Seguimiento de Rendimiento</h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <TrendingUp className="h-6 w-6 text-primary" />
              Rendimiento General del Equipo
            </CardTitle>
            <CardDescription>Visualiza la evolución de las métricas clave del equipo a lo largo del tiempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="Ataques Exitosos" fill="var(--color-Ataques Exitosos)" radius={4} />
                  <Line type="monotone" dataKey="Bloqueos" stroke="var(--color-Bloqueos)" />
                  <Line type="monotone" dataKey="Saques Directos" stroke="var(--color-Saques Directos)" strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <BarChart className="h-5 w-5 text-primary" />
                Estadísticas de Ataque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detalles sobre efectividad, errores, y tipos de ataque.</p>
              {/* Placeholder for more detailed attack stats */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline">
                <Activity className="h-5 w-5 text-accent" />
                Pruebas Físicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Resultados de pruebas de salto, velocidad, agilidad, etc.</p>
               {/* Placeholder for physical test results */}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
