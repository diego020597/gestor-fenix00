

'use client';

import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ListFilter, ClipboardEdit, Save } from 'lucide-react';
import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { AthleteStorageItem } from '../atletas/page'; 
import TestResultsViewer from '@/components/PhysicalTests/TestResultsViewer';
import { type TestSession, type TestColumn, type AthleteTestDataForSession, PHYSICAL_TEST_RESULTS_STORAGE_KEY } from '@/types/physical-tests';
import { useAuth } from '@/contexts/AuthContext';
import { volleyballCategories } from '@/app/atletas/page';


const ATHLETES_STORAGE_KEY = 'athletes';

const mainTestTypes = [
  { id: 'alpha_fitness', name: 'Alpha Fitness' },
  { id: 'complejos_k', name: 'Complejos K1 y K2' },
  { id: 'pruebas_aerobicas', name: 'Pruebas Aeróbicas' },
  { id: 'tecnico_voley', name: 'Test Técnico de Voleibol' },
  { id: 'potencia', name: 'Potencia Test' },
  { id: 'atletismo', name: 'Atletismo' },
];

const alphaFitnessVariants = [
  { id: 'basica', name: 'Alpha Fitness Básica' },
  { id: 'simplificada', name: 'Alpha Fitness Simplificada' },
  { id: 'extensa', name: 'Alpha Fitness Extensa' },
  { id: 'personalizada', name: 'Alpha Fitness Personalizada' },
];

const atletismoVariants = [
    { id: 'velocidad', name: 'Velocidad' },
    { id: 'velocidad_resistencia', name: 'Velocidad Resistencia' },
    { id: 'fondo_resistencia', name: 'Fondo Resistencia Aeróbica' },
    { id: 'recreativo', name: 'Recreativo' },
];


const complejosKVariants = [
  { id: 'k1', name: 'Complejo K1' },
  { id: 'k2', name: 'Complejo K2' },
];

const aerobicTestVariants = [
    { id: '1km', name: '1 Kilómetro', distance: 1000 },
    { id: '2km', name: '2 Kilómetros', distance: 2000 },
    { id: '2_4km', name: '2.4 Kilómetros (Test Cooper adaptado)', distance: 2400 },
    { id: '3km', name: '3 Kilómetros', distance: 3000 },
    { id: '4km', name: '4 Kilómetros', distance: 4000 },
    { id: '5km', name: '5 Kilómetros', distance: 5000 },
    { id: '7km', name: '7 Kilómetros', distance: 7000 },
    { id: '8km', name: '8 Kilómetros', distance: 8000 },
    { id: '10km', name: '10 Kilómetros', distance: 10000 },
    { id: '15km', name: '15 Kilómetros', distance: 15000 },
    { id: '20km', name: '20 Kilómetros', distance: 20000 },
    { id: '21km', name: '21 Kilómetros (Media Maratón)', distance: 21097 },
    { id: '25km', name: '25 Kilómetros', distance: 25000 },
    { id: '30km', name: '30 Kilómetros', distance: 30000 },
    { id: '35km', name: '35 Kilómetros', distance: 35000 },
    { id: '40km', name: '40 Kilómetros', distance: 40000 },
    { id: '42km', name: '42 Kilómetros (Maratón)', distance: 42195 },
];


const atletismoVelocidadSubTests: TestColumn[] = [
    { id: 'atletismo_vel_100m', name: '100m (s)', type: 'text' },
    { id: 'atletismo_vel_200m', name: '200m (s)', type: 'text' },
    { id: 'atletismo_vel_400m', name: '400m (s)', type: 'text' },
];

const atletismoVelocidadResistenciaSubTests: TestColumn[] = [
    { id: 'atletismo_velres_400m', name: '400m (s)', type: 'text' },
    { id: 'atletismo_velres_800m', name: '800m (s)', type: 'text' },
];

const atletismoFondoSubTests: TestColumn[] = [
    { id: 'atletismo_fondo_5k', name: '5k (min)', type: 'text' },
    { id: 'atletismo_fondo_10k', name: '10k (min)', type: 'text' },
    { id: 'atletismo_fondo_21k', name: '21k (min)', type: 'text' },
    { id: 'atletismo_fondo_42k', name: '42k (min)', type: 'text' },
];

const atletismoRecreativoSubTests: TestColumn[] = [
    { id: 'atletismo_rec_observaciones', name: 'Observaciones', type: 'text' },
];


const alphaFitnessBasicaSubTests: TestColumn[] = [
  { id: 'navette', name: 'Navette (Nvl)', type: 'number' },
  { id: 'prension', name: 'Prensión (kg)', type: 'number' },
  { id: 'salto_long_1', name: 'Salto L1 (cm)', type: 'number' },
  { id: 'salto_long_2', name: 'Salto L2 (cm)', type: 'number' },
  { id: 'altura_auto', name: 'Alt (m)', type: 'text', readOnly: true },
  { id: 'peso_auto', name: 'Peso (kg)', type: 'text', readOnly: true },
  { id: 'imc_auto', name: 'IMC', type: 'text', readOnly: true },
  { id: 'cintura', name: 'Cintura (cm)', type: 'number' },
  { id: 'pliegue_triceps', name: 'P.Tríceps(mm)', type: 'number' },
  { id: 'pliegue_subescapular', name: 'P.Subesc(mm)', type: 'number' },
];

const alphaFitnessSimplificadaSubTests: TestColumn[] = [
  { id: 'navette_simp', name: 'Navette (Nvl)', type: 'number' },
  { id: 'prension_simp', name: 'Prensión (kg)', type: 'number' },
  { id: 'salto_long_1_simp', name: 'Salto L1 (cm)', type: 'number' },
  { id: 'salto_long_2_simp', name: 'Salto L2 (cm)', type: 'number' },
  { id: 'altura_auto_simp', name: 'Alt (m)', type: 'text', readOnly: true },
  { id: 'peso_auto_simp', name: 'Peso (kg)', type: 'text', readOnly: true },
  { id: 'imc_auto_simp', name: 'IMC', type: 'text', readOnly: true },
  { id: 'cintura_simp', name: 'Cintura (cm)', type: 'number' },
];

const alphaFitnessExtensaSubTests: TestColumn[] = [
  { id: 'navette_ext', name: 'Navette (Nvl)', type: 'number' },
  { id: 'prension_ext', name: 'Prensión (kg)', type: 'number' },
  { id: 'salto_long_1_ext', name: 'Salto L1 (cm)', type: 'number' },
  { id: 'salto_long_2_ext', name: 'Salto L2 (cm)', type: 'number' },
  { id: 'altura_auto_ext', name: 'Alt (m)', type: 'text', readOnly: true },
  { id: 'peso_auto_ext', name: 'Peso (kg)', type: 'text', readOnly: true },
  { id: 'imc_auto_ext', name: 'IMC', type: 'text', readOnly: true },
  { id: 'cintura_ext', name: 'Cintura (cm)', type: 'number' },
  { id: 'pliegue_triceps_ext', name: 'P.Tríceps(mm)', type: 'number' },
  { id: 'pliegue_subescapular_ext', name: 'P.Subesc(mm)', type: 'number' },
  { id: 'agilidad_4x10_ext', name: 'Agil 4x10 (s)', type: 'text' },
];

const allAlphaFitnessPossibleSubTestsForPersonalized: Array<{ id: string; label: string; columns: TestColumn[] }> = [ 
    { id: 'navette', label: 'Test de Navette 20mts', columns: [{ id: 'navette_pers', name: 'Navette (Nvl)', type: 'number' }] },
    { id: 'prension', label: 'Fuerza de Prensión Manual', columns: [{ id: 'prension_pers', name: 'Prensión (kg)', type: 'number' }] },
    { id: 'salto_longitud', label: 'Salto de Longitud (2 int.)', columns: [
        { id: 'salto_long_1_pers', name: 'Salto L1 (cm)', type: 'number' },
        { id: 'salto_long_2_pers', name: 'Salto L2 (cm)', type: 'number' },
    ]},
    { id: 'altura_peso_imc', label: 'Altura, Peso, IMC (Auto)', columns: [
        { id: 'altura_auto_pers', name: 'Alt (m)', type: 'text', readOnly: true },
        { id: 'peso_auto_pers', name: 'Peso (kg)', type: 'text', readOnly: true },
        { id: 'imc_auto_pers', name: 'IMC', type: 'text', readOnly: true },
    ]},
    { id: 'cintura', label: 'Perímetro de Cintura', columns: [{ id: 'cintura_pers', name: 'Cintura (cm)', type: 'number' }] },
    { id: 'pliegue_triceps', label: 'Pliegue Tríceps', columns: [{ id: 'pliegue_triceps_pers', name: 'P.Tríceps(mm)', type: 'number' }] },
    { id: 'pliegue_subescapular', label: 'Pliegue Subescapular', columns: [{ id: 'pliegue_subescapular_pers', name: 'P.Subesc(mm)', type: 'number' }] },
    { id: 'agilidad_4x10', label: 'Agilidad 4x10', columns: [{ id: 'agilidad_4x10_pers', name: 'Agil 4x10 (s)', type: 'text' }] },
];

const complejosK1SubTests: TestColumn[] = [
    { id: 'k1_recepcion', name: 'K1 Recep (10r)', type: 'text', placeholder: 'Ej: 7/10' },
    { id: 'k1_armado', name: 'K1 Arm (10r)', type: 'text', placeholder: 'Ej: 8/10' },
    { id: 'k1_remate', name: 'K1 Rem (10r)', type: 'text', placeholder: 'Ej: 6 pts' },
];
const complejosK2SubTests: TestColumn[] = [
    { id: 'k2_bloqueo_defensa', name: 'K2 Bloq/Def(10r)', type: 'text', placeholder: 'Ej: 5 blk' },
    { id: 'k2_armado', name: 'K2 Arm (10r)', type: 'text', placeholder: 'Ej: 7/10' },
    { id: 'k2_remate', name: 'K2 Rem (10r)', type: 'text', placeholder: 'Ej: 8 pts' },
];
const tecnicoVoleySubTests: TestColumn[] = [
    { id: 'saques_tecnico', name: 'Saques (10r)', type: 'text', placeholder: 'Ej: 7 ok' },
    { id: 'recepcion_tecnico', name: 'Recep (10r)', type: 'text', placeholder: 'Ej: 8 +' },
    { id: 'armado_tecnico', name: 'Armado (10r)', type: 'text', placeholder: 'Ej: 9 ok' },
    { id: 'remate_tecnico', name: 'Remate (10r)', type: 'text', placeholder: 'Ej: 6 pts' },
];

const potenciaTestSubTests: TestColumn[] = [
  { id: 'salto_vertical_1', name: 'Salto V1 (cm)', type: 'number' },
  { id: 'salto_vertical_2', name: 'Salto V2 (cm)', type: 'number' },
  { id: 'carrera_50m_1', name: '50m I1 (s)', type: 'text' },
  { id: 'carrera_50m_2', name: '50m I2 (s)', type: 'text' },
  { id: 'carrera_100m_1', name: '100m I1 (s)', type: 'text' },
  { id: 'carrera_100m_2', name: '100m I2 (s)', type: 'text' },
  { id: 'carrera_400m_1', name: '400m I1 (s)', type: 'text' },
  { id: 'carrera_400m_2', name: '400m I2 (s)', type: 'text' },
  { id: 'burpees_1min', name: 'Burpees (1\')', type: 'number' },
];

const aerobicTestBaseColumns: TestColumn[] = [
    { id: 'tiempo_min', name: 'Tiempo (min)', type: 'number', placeholder: 'Ej: 25.5' },
    { id: 'fcm_alcanzada', name: 'FCM Alcanzada (ppm)', type: 'number', placeholder: 'Ej: 190' },
];
const aerobicTestCalculatedColumns: TestColumn[] = [
    { id: 'velocidad_kmh', name: 'Velocidad (km/h)', type: 'calculated' },
    { id: 'vo2_max', name: 'VO2 Max (est.)', type: 'calculated' },
    { id: 'mets', name: 'METs (est.)', type: 'calculated' },
    { id: 'zona_esfuerzo', name: 'Zona de Esfuerzo', type: 'calculated' },
];


interface AthleteTestEntryData extends AthleteStorageItem {
  results: { [key: string]: string | number };
}

export default function PhysicalTestsPage() {
  const [mounted, setMounted] = useState(false);
  const [allAthletes, setAllAthletes] = useState<AthleteStorageItem[]>([]);
  const [selectedMainTest, setSelectedMainTest] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [athletesForTest, setAthletesForTest] = useState<AthleteTestEntryData[]>([]);
  const [currentTestColumns, setCurrentTestColumns] = useState<TestColumn[]>([]);
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPersonalizedAlphaSubtests, setSelectedPersonalizedAlphaSubtests] = useState<string[]>([]);
  const [resultsUpdateTrigger, setResultsUpdateTrigger] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    try {
      const storedAthletesString = localStorage.getItem(ATHLETES_STORAGE_KEY);
      if (storedAthletesString) {
        let fetchedAthletes: AthleteStorageItem[] = JSON.parse(storedAthletesString);
        if (user?.type === 'team_admin' && user.teamId) {
          fetchedAthletes = fetchedAthletes.filter(athlete => athlete.teamId === user.teamId);
        } else if (user?.type === 'admin') { // Admin global
          fetchedAthletes = fetchedAthletes.filter(athlete => !athlete.teamId); // Solo atletas sin teamId
        } else if (user?.type === 'coach' && user.assignedCategories && user.assignedCategories.length > 0) {
          fetchedAthletes = fetchedAthletes.filter(athlete =>
            !athlete.teamId && user.assignedCategories!.includes(athlete.category)
          );
        } else { 
          fetchedAthletes = [];
        }
        setAllAthletes(fetchedAthletes);
      }
    } catch (error) {
      console.error("Error loading athletes from localStorage:", error);
      toast({ title: "Error", description: "No se pudieron cargar los atletas.", variant: "destructive" });
    }
  }, [toast, user]);

  useEffect(() => {
    const filtered = (selectedCategories.length === 0 ? allAthletes : allAthletes
      .filter(athlete => selectedCategories.includes(athlete.category)))
      .map(athlete => ({ 
        ...athlete, 
        name: athlete.name || `${athlete.firstName} ${athlete.lastName}`,
        results: {} 
      }));
    setAthletesForTest(filtered);
  }, [selectedCategories, allAthletes]);

  useEffect(() => {
    let cols: TestColumn[] = [];
    if (selectedMainTest === 'alpha_fitness') {
      if (selectedVariant === 'basica') cols = alphaFitnessBasicaSubTests;
      else if (selectedVariant === 'simplificada') cols = alphaFitnessSimplificadaSubTests;
      else if (selectedVariant === 'extensa') cols = alphaFitnessExtensaSubTests;
      else if (selectedVariant === 'personalizada') {
        selectedPersonalizedAlphaSubtests.forEach(subTestId => {
          const testDef = allAlphaFitnessPossibleSubTestsForPersonalized.find(t => t.id === subTestId);
          if (testDef) {
            cols.push(...testDef.columns);
          }
        });
      }
    } else if (selectedMainTest === 'complejos_k') {
      if (selectedVariant === 'k1') cols = complejosK1SubTests;
      else if (selectedVariant === 'k2') cols = complejosK2SubTests;
    } else if (selectedMainTest === 'pruebas_aerobicas') {
        if(selectedVariant) {
            cols = [...aerobicTestBaseColumns, ...aerobicTestCalculatedColumns];
        }
    } else if (selectedMainTest === 'atletismo') {
        if (selectedVariant === 'velocidad') cols = atletismoVelocidadSubTests;
        else if (selectedVariant === 'velocidad_resistencia') cols = atletismoVelocidadResistenciaSubTests;
        else if (selectedVariant === 'fondo_resistencia') cols = atletismoFondoSubTests;
        else if (selectedVariant === 'recreativo') cols = atletismoRecreativoSubTests;
    } else if (selectedMainTest === 'tecnico_voley') {
      cols = tecnicoVoleySubTests;
    } else if (selectedMainTest === 'potencia') {
      cols = potenciaTestSubTests;
    } else {
        cols = [];
    }
    setCurrentTestColumns(cols);
  }, [selectedMainTest, selectedVariant, selectedPersonalizedAlphaSubtests]);

  const handleCategoryChange = (category: string, checked: boolean) => {
    setSelectedCategories(prev =>
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };

  const removeAthleteFromTest = (athleteId: string) => {
    setAthletesForTest(prev => prev.filter(a => a.id !== athleteId));
  };
  
  const handleSubtestSelectionChange = (subtestId: string, checked: boolean) => {
    setSelectedPersonalizedAlphaSubtests(prev =>
      checked ? [...prev, subtestId] : prev.filter(id => id !== subtestId)
    );
  };

  const handleResultChange = (athleteId: string, columnId: string, value: string) => {
    setAthletesForTest(prev => 
      prev.map(athlete => 
        athlete.id === athleteId 
          ? { ...athlete, results: { ...athlete.results, [columnId]: value } }
          : athlete
      )
    );
  };
  
  const calculateIMC = (weightStr: string, heightStr: string): string => {
    const weight = parseFloat(weightStr);
    const height = parseFloat(heightStr);
    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) return 'N/A';
    const imcValue = weight / (height * height);
    return imcValue.toFixed(1);
  };

  useEffect(() => {
    if (selectedMainTest === 'alpha_fitness') {
        let idSuffix = '';
        let applyAutoFill = false;
        let heightColId = 'altura_auto';
        let weightColId = 'peso_auto';
        let imcColId = 'imc_auto';

        if (selectedVariant === 'basica') { applyAutoFill = true; idSuffix = ''; }
        else if (selectedVariant === 'simplificada') { applyAutoFill = true; idSuffix = '_simp'; }
        else if (selectedVariant === 'extensa') { applyAutoFill = true; idSuffix = '_ext'; }
        else if (selectedVariant === 'personalizada' && selectedPersonalizedAlphaSubtests.includes('altura_peso_imc')) {
            applyAutoFill = true; idSuffix = '_pers';
        }
        
        if (applyAutoFill) {
            heightColId = `altura_auto${idSuffix}`;
            weightColId = `peso_auto${idSuffix}`;
            imcColId = `imc_auto${idSuffix}`;

            setAthletesForTest(prevAthletes => 
                prevAthletes.map(athlete => {
                    const height = athlete.height || '';
                    const weight = athlete.weight || '';
                    const imc = calculateIMC(weight, height);
                    
                    let updatedResults = {...athlete.results};
                    if (currentTestColumns.find(col => col.id === heightColId)) updatedResults[heightColId] = height;
                    if (currentTestColumns.find(col => col.id === weightColId)) updatedResults[weightColId] = weight;
                    if (currentTestColumns.find(col => col.id === imcColId)) updatedResults[imcColId] = imc;
                    
                    return { ...athlete, results: updatedResults };
                })
            );
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMainTest, selectedVariant, selectedPersonalizedAlphaSubtests, athletesForTest.length, currentTestColumns]);

  // Aerobic Calculations Effect
    useEffect(() => {
        if (selectedMainTest !== 'pruebas_aerobicas' || !selectedVariant) return;

        const distanceMeters = aerobicTestVariants.find(v => v.id === selectedVariant)?.distance;
        if (!distanceMeters) return;

        setAthletesForTest(prevAthletes =>
            prevAthletes.map(athlete => {
                const timeMin = parseFloat(String(athlete.results['tiempo_min'] || '0'));
                const fcm = parseFloat(String(athlete.results['fcm_alcanzada'] || '0'));
                const age = athlete.age || 0;
                const fcmTeorica = 220 - age;

                let results = { ...athlete.results };

                if (timeMin > 0) {
                    const speedKmh = (distanceMeters / 1000) / (timeMin / 60);
                    const speedMmin = distanceMeters / timeMin;
                    const vo2Max = (0.2 * speedMmin) + 3.5;
                    const mets = vo2Max / 3.5;

                    results['velocidad_kmh'] = speedKmh.toFixed(2);
                    results['vo2_max'] = vo2Max.toFixed(2);
                    results['mets'] = mets.toFixed(1);
                } else {
                    results['velocidad_kmh'] = 'N/A';
                    results['vo2_max'] = 'N/A';
                    results['mets'] = 'N/A';
                }

                if (fcm > 0 && age > 0) {
                    const percentageOfMax = (fcm / fcmTeorica) * 100;
                    if (percentageOfMax >= 90) results['zona_esfuerzo'] = 'Z5 (90-100%)';
                    else if (percentageOfMax >= 80) results['zona_esfuerzo'] = 'Z4 (80-90%)';
                    else if (percentageOfMax >= 70) results['zona_esfuerzo'] = 'Z3 (70-80%)';
                    else if (percentageOfMax >= 60) results['zona_esfuerzo'] = 'Z2 (60-70%)';
                    else if (percentageOfMax >= 50) results['zona_esfuerzo'] = 'Z1 (50-60%)';
                    else results['zona_esfuerzo'] = 'Bajo Z1 (<50%)';
                } else {
                     results['zona_esfuerzo'] = 'N/A';
                }

                return { ...athlete, results };
            })
        );
    }, [athletesForTest.map(a => a.results['tiempo_min']).join(), athletesForTest.map(a => a.results['fcm_alcanzada']).join(), selectedMainTest, selectedVariant]);


  const handleSaveTests = () => {
    if (!selectedMainTest || currentTestColumns.length === 0) {
      toast({ title: "Configuración Incompleta", description: "Por favor, selecciona un tipo de prueba y asegúrate de que tenga pruebas definidas.", variant: "destructive" });
      return;
    }
    if (athletesForTest.length === 0) {
      toast({ title: "Sin Atletas", description: "No hay atletas seleccionados para esta prueba.", variant: "destructive" });
      return;
    }

    const mainTestObject = mainTestTypes.find(t => t.id === selectedMainTest);
    let variantName = '';
    if (selectedMainTest === 'alpha_fitness') {
      variantName = alphaFitnessVariants.find(v => v.id === selectedVariant)?.name || (selectedVariant === 'personalizada' ? 'Personalizada' : '');
    } else if (selectedMainTest === 'complejos_k') {
      variantName = complejosKVariants.find(v => v.id === selectedVariant)?.name || '';
    } else if (selectedMainTest === 'pruebas_aerobicas') {
      variantName = aerobicTestVariants.find(v => v.id === selectedVariant)?.name || '';
    } else if (selectedMainTest === 'atletismo') {
        variantName = atletismoVariants.find(v => v.id === selectedVariant)?.name || '';
    }
    const fullTestName = `${mainTestObject?.name || 'Prueba Desconocida'}${variantName ? ` - ${variantName}` : ''}`;


    const sessionAthletesData: AthleteTestDataForSession[] = athletesForTest.map(athlete => ({
      athleteId: athlete.id,
      athleteName: athlete.name,
      results: athlete.results,
    }));

    const testSessionData: TestSession = {
      id: crypto.randomUUID(),
      teamId: user?.type === 'team_admin' ? user.teamId : undefined,
      testDate,
      mainTestType: selectedMainTest,
      selectedVariant: selectedVariant || undefined,
      testName: fullTestName,
      categoriesTested: [...selectedCategories],
      athletesData: sessionAthletesData,
      columnsDefinition: [...currentTestColumns],
    };

    try {
      const existingResultsString = localStorage.getItem(PHYSICAL_TEST_RESULTS_STORAGE_KEY);
      let existingResults: TestSession[] = existingResultsString ? JSON.parse(existingResultsString) : [];
      existingResults.push(testSessionData);
      localStorage.setItem(PHYSICAL_TEST_RESULTS_STORAGE_KEY, JSON.stringify(existingResults));
      toast({ title: "Resultados Guardados", description: `La sesión de prueba "${fullTestName}" ha sido guardada.` });
      setResultsUpdateTrigger(prev => prev + 1); 
    } catch (error) {
      console.error("Error saving test results to localStorage:", error);
      toast({ title: "Error al Guardar", description: "No se pudieron guardar los resultados de la prueba.", variant: "destructive" });
    }
  };


  if (!mounted) {
    return <AppLayout><div className="text-center p-10">Cargando...</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListFilter className="h-5 w-5 text-primary" /> Configuración de la Prueba</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="mainTestType">Tipo de Prueba Principal</Label>
                    <Select 
                    value={selectedMainTest} 
                    onValueChange={(value) => {
                        setSelectedMainTest(value); 
                        setSelectedVariant(''); 
                        setSelectedPersonalizedAlphaSubtests([]);
                    }}
                    >
                    <SelectTrigger id="mainTestType"><SelectValue placeholder="Seleccionar prueba" /></SelectTrigger>
                    <SelectContent>
                        {mainTestTypes.map(test => <SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="testVariant">Variante (si aplica)</Label>
                    <Select 
                    value={selectedVariant} 
                    onValueChange={setSelectedVariant} 
                    disabled={!selectedMainTest || !['alpha_fitness', 'complejos_k', 'pruebas_aerobicas', 'atletismo'].includes(selectedMainTest)}
                    >
                    <SelectTrigger id="testVariant"><SelectValue placeholder="Seleccionar variante" /></SelectTrigger>
                    <SelectContent>
                        {selectedMainTest === 'alpha_fitness' && alphaFitnessVariants.map(variant => <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>)}
                        {selectedMainTest === 'complejos_k' && complejosKVariants.map(variant => <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>)}
                        {selectedMainTest === 'pruebas_aerobicas' && aerobicTestVariants.map(variant => <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>)}
                        {selectedMainTest === 'atletismo' && atletismoVariants.map(variant => <SelectItem key={variant.id} value={variant.id}>{variant.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="testDate">Fecha de la Prueba</Label>
                    <Input id="testDate" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
                </div>
                </div>
                
                {selectedMainTest === 'alpha_fitness' && selectedVariant === 'personalizada' && (
                <Card className="bg-background/50">
                    <CardHeader><CardTitle className="text-md">Seleccionar Pruebas para Alpha Fitness Personalizada</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                    {allAlphaFitnessPossibleSubTestsForPersonalized.map(subtest => (
                        <div key={subtest.id} className="flex items-center space-x-2">
                        <Checkbox 
                            id={`subtest-${subtest.id}`} 
                            checked={selectedPersonalizedAlphaSubtests.includes(subtest.id)}
                            onCheckedChange={(checked) => handleSubtestSelectionChange(subtest.id, !!checked)}
                        />
                        <Label htmlFor={`subtest-${subtest.id}`} className="font-normal text-sm">{subtest.label}</Label>
                        </div>
                    ))}
                    </CardContent>
                </Card>
                )}

                <div>
                <Label>Seleccionar Categorías (si no selecciona ninguna, se mostrarán todos los atletas visibles para usted)</Label>
                <ScrollArea className="h-32 w-full rounded-md border p-2 mt-1">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(user?.type === 'admin' || user?.type === 'team_admin' ? volleyballCategories : user?.assignedCategories || []).map(cat => (
                        <div key={cat} className="flex items-center space-x-2 p-1 hover:bg-muted rounded-sm">
                        <Checkbox id={`cat-${cat}`} checked={selectedCategories.includes(cat)} onCheckedChange={(checked) => handleCategoryChange(cat, !!checked)} />
                        <Label htmlFor={`cat-${cat}`} className="font-normal text-sm cursor-pointer">{cat}</Label>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                </div>
            </CardContent>
          </Card>

          {selectedMainTest && athletesForTest.length > 0 && currentTestColumns.length > 0 && (
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardEdit className="h-6 w-6 text-primary" /> Ingreso de Resultados</CardTitle>
                    <CardDescription>
                        Atletas para prueba: {athletesForTest.length}. 
                        Prueba: {mainTestTypes.find(t=>t.id === selectedMainTest)?.name || ''} 
                        {selectedVariant && ` - ${ (alphaFitnessVariants.find(v=>v.id === selectedVariant) || complejosKVariants.find(v=>v.id === selectedVariant) || aerobicTestVariants.find(v=>v.id === selectedVariant) || atletismoVariants.find(v => v.id === selectedVariant))?.name || (selectedVariant === 'personalizada' ? 'Personalizada' : '') }`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto relative">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                              <TableHead className="w-[180px] min-w-[180px] sticky left-0 bg-card z-20">Atleta</TableHead>
                              <TableHead className="w-[60px] min-w-[60px] sticky left-[180px] bg-card z-20 text-center">Quitar</TableHead>
                              {currentTestColumns.map(col => (
                                <TableHead key={col.id} className="min-w-[150px] whitespace-nowrap">{col.name}</TableHead>
                              ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {athletesForTest.map(athlete => (
                            <TableRow key={athlete.id}>
                              <TableCell className="font-medium w-[180px] min-w-[180px] sticky left-0 bg-card z-10">{athlete.name}</TableCell>
                              <TableCell className="w-[60px] min-w-[60px] sticky left-[180px] bg-card z-10 text-center">
                                  <Button variant="ghost" size="icon" onClick={() => removeAthleteFromTest(athlete.id)} className="h-7 w-7 text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </TableCell>
                              {currentTestColumns.map(col => (
                                <TableCell key={`${athlete.id}-${col.id}`} className="min-w-[150px]">
                                  <Input
                                    id={`${athlete.id}-${col.id}`}
                                    type={col.type === 'calculated' ? 'text' : (col.type || 'text')}
                                    placeholder={col.placeholder || ''}
                                    value={athlete.results[col.id] || ''}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleResultChange(athlete.id, col.id, e.target.value)}
                                    readOnly={col.readOnly || col.type === 'calculated'}
                                    className={`h-8 text-sm w-full ${(col.readOnly || col.type === 'calculated') ? 'bg-muted/30 border-none' : ''}`}
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  </div>
                </CardContent>
                <CardFooter>
                    <Button size="lg" className="w-full md:w-auto" onClick={handleSaveTests}>
                        <Save className="mr-2 h-4 w-4" /> Guardar Pruebas
                    </Button>
                </CardFooter>
            </Card>
          )}
          
          {selectedMainTest && athletesForTest.length > 0 && currentTestColumns.length === 0 &&
            (
                (selectedMainTest === 'alpha_fitness' && !selectedVariant) || 
                (selectedMainTest === 'alpha_fitness' && selectedVariant === 'personalizada' && selectedPersonalizedAlphaSubtests.length === 0) ||
                (selectedMainTest === 'complejos_k' && !selectedVariant) ||
                (selectedMainTest === 'pruebas_aerobicas' && !selectedVariant) ||
                (selectedMainTest === 'atletismo' && !selectedVariant)
            ) && (
                <Card><CardContent className="p-6 text-center text-muted-foreground">
                    { (selectedMainTest === 'alpha_fitness' && !selectedVariant) && "Por favor, selecciona una variante para Alpha Fitness."}
                    { (selectedMainTest === 'alpha_fitness' && selectedVariant === 'personalizada' && selectedPersonalizedAlphaSubtests.length === 0) && "Selecciona al menos una sub-prueba para Alpha Fitness Personalizada."}
                    { (selectedMainTest === 'complejos_k' && !selectedVariant) && "Por favor, selecciona una variante para Complejos K (K1 o K2)."}
                    { (selectedMainTest === 'pruebas_aerobicas' && !selectedVariant) && "Por favor, selecciona una distancia para las Pruebas Aeróbicas."}
                    { (selectedMainTest === 'atletismo' && !selectedVariant) && "Por favor, selecciona una variante para Atletismo."}
                </CardContent></Card>
            )}
            {selectedMainTest && athletesForTest.length === 0 && (
            <Card><CardContent className="p-6 text-center text-muted-foreground">
                {allAthletes.length === 0 ? (user?.type === 'coach' ? "No tienes atletas asignados a tus categorías para mostrar aquí." : (user?.type === 'team_admin' ? "No hay atletas en este equipo." : "No hay atletas registrados en el sistema.")) : (selectedCategories.length > 0 ? "No hay atletas en las categorías seleccionadas." : "No hay atletas cargados. Considera seleccionar categorías o registrar atletas.")}
            </CardContent></Card>
            )}
        </div>
        <div className="lg:col-span-1">
          <TestResultsViewer refreshTrigger={resultsUpdateTrigger} />
        </div>
      </div>
    </AppLayout>
  );
}

