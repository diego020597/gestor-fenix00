'use client';

import { useState, type FormEvent } from 'react';
import { suggestTrainingAdjustments, type SuggestTrainingAdjustmentsInput, type SuggestTrainingAdjustmentsOutput } from '@/ai/flows/suggest-training-adjustments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AiRecommendationsClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestTrainingAdjustmentsOutput | null>(null);
  const [formData, setFormData] = useState<SuggestTrainingAdjustmentsInput>({
    athletePerformanceData: '',
    currentTrainingPlan: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    if (!formData.athletePerformanceData || !formData.currentTrainingPlan) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos para obtener recomendaciones.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const adjustments = await suggestTrainingAdjustments(formData);
      setResult(adjustments);
      toast({
        title: "Recomendaciones generadas",
        description: "Se han generado nuevas sugerencias de entrenamiento.",
      });
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar las recomendaciones. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
            <Wand2 className="h-6 w-6" />
            Generador de Recomendaciones de Entrenamiento
          </CardTitle>
          <CardDescription>
            Introduce los datos de rendimiento del atleta y su plan actual para recibir sugerencias personalizadas impulsadas por IA.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="athletePerformanceData" className="text-lg">Datos de Rendimiento del Atleta</Label>
              <Textarea
                id="athletePerformanceData"
                name="athletePerformanceData"
                placeholder="Ej: Velocidad: 7/10, Fuerza: 8/10, Resistencia: 6/10, Técnica de saque: Buena, Precisión de recepción: Mejorable..."
                rows={5}
                value={formData.athletePerformanceData}
                onChange={handleInputChange}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentTrainingPlan" className="text-lg">Plan de Entrenamiento Actual</Label>
              <Textarea
                id="currentTrainingPlan"
                name="currentTrainingPlan"
                placeholder="Ej: Lunes: Resistencia (correr 5km), Martes: Técnica (1hr saque y recepción), Miércoles: Descanso..."
                rows={5}
                value={formData.currentTrainingPlan}
                onChange={handleInputChange}
                className="bg-background"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Obtener Recomendaciones
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {result && (
        <Card className="mt-8 shadow-lg animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">Sugerencias de Ajuste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground">Ajustes Sugeridos:</h3>
              <p className="text-muted-foreground whitespace-pre-line">{result.suggestedAdjustments}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Justificación:</h3>
              <p className="text-muted-foreground whitespace-pre-line">{result.rationale}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
