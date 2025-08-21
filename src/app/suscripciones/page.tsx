import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star } from 'lucide-react';

const plans = [
  { 
    name: 'Básico', 
    price: 'Gratis', 
    features: ['Gestión de 1 equipo', 'Hasta 10 atletas', 'Funciones básicas de calendario', 'Soporte comunitario'],
    popular: false,
  },
  { 
    name: 'Pro', 
    price: '$19/mes', 
    features: ['Gestión de hasta 5 equipos', 'Hasta 50 atletas', 'Planes de entrenamiento avanzados', 'Seguimiento de rendimiento detallado', 'Recomendaciones IA', 'Soporte prioritario'],
    popular: true,
  },
  { 
    name: 'Élite', 
    price: '$49/mes', 
    features: ['Equipos ilimitados', 'Atletas ilimitados', 'Todas las funciones Pro', 'Herramientas de comunicación avanzadas', 'Analíticas personalizadas', 'Soporte dedicado 24/7'],
    popular: false,
  },
];

export default function SubscriptionPage() {
  return (
    <AppLayout>
      <div className="space-y-12">
        <section className="text-center py-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
            Elige el Plan Perfecto para Ti
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Accede a las herramientas que necesitas para llevar tu gestión deportiva al siguiente nivel.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card key={plan.name} className={`flex flex-col shadow-lg hover:shadow-2xl transition-shadow duration-300 ${plan.popular ? 'border-2 border-primary relative' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="h-4 w-4" /> Popular
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-2xl text-primary/90">{plan.name}</CardTitle>
                <CardDescription className="text-3xl font-bold text-foreground">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <ul className="space-y-2">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-accent mr-2 shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className={`w-full ${plan.popular ? '' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}>
                  {plan.price === 'Gratis' ? 'Empezar Gratis' : 'Seleccionar Plan'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
        
        <section className="text-center py-8">
          <p className="text-muted-foreground">
            La integración de pagos y la gestión de suscripciones está pendiente.
            <br />
            Esta página es una demostración de cómo se podrían presentar los planes.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
