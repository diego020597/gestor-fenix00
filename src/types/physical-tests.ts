

// src/types/physical-tests.ts
export interface TestColumn {
  id: string;
  name: string;
  type: 'number' | 'text' | 'calculated';
  placeholder?: string;
  readOnly?: boolean;
}

export interface AthleteTestDataForSession {
  athleteId: string;
  athleteName: string;
  results: { [key: string]: string | number };
}

export interface TestSession {
  id: string;
  teamId?: string; // Nuevo campo
  testDate: string;
  mainTestType: string; 
  selectedVariant?: string; 
  testName: string; 
  categoriesTested: string[];
  athletesData: AthleteTestDataForSession[];
  columnsDefinition: TestColumn[]; 
}

export const PHYSICAL_TEST_RESULTS_STORAGE_KEY = 'physicalTestResults_v2'; // Incremented version
