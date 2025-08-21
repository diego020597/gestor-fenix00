
'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ColorPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  // Sidebar specific colors
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  // Chart colors
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
}

interface AppTheme {
  id: string;
  name: string;
  lightColors: ColorPalette;
  darkColors: ColorPalette; // For .dark class
}

const THEME_STORAGE_KEY = 'selectedAppThemeId_v1';

// Define default destructive and chart colors to be reused
const defaultDestructive = "0 84.2% 60.2%";
const defaultDestructiveForeground = "0 0% 98%";
const defaultDarkDestructive = "0 62.8% 30.6%";
const defaultDarkDestructiveForeground = "0 0% 98%";

const defaultChartColors = {
  chart1: "12 76% 61%",
  chart2: "173 58% 39%",
  chart3: "197 37% 24%",
  chart4: "43 74% 66%",
  chart5: "27 87% 67%",
};
const defaultDarkChartColors = {
  chart1: "220 70% 50%",
  chart2: "160 60% 45%",
  chart3: "30 80% 55%",
  chart4: "280 65% 60%",
  chart5: "340 75% 55%",
};

// Define the default theme's colors separately
const defaultThemeLightColors: ColorPalette = {
  background: "207 88% 94%",
  foreground: "207 30% 25%",
  card: "207 88% 90%",
  cardForeground: "207 30% 25%",
  popover: "207 88% 90%",
  popoverForeground: "207 30% 25%",
  primary: "207 88% 68%",
  primaryForeground: "0 0% 100%",
  secondary: "207 50% 85%",
  secondaryForeground: "207 30% 25%",
  muted: "207 50% 90%",
  mutedForeground: "207 30% 45%",
  accent: "123 39% 64%",
  accentForeground: "0 0% 100%",
  destructive: defaultDestructive,
  destructiveForeground: defaultDestructiveForeground,
  border: "207 30% 75%",
  input: "207 30% 88%",
  ring: "207 88% 68%",
  sidebarBackground: "207 88% 92%",
  sidebarForeground: "207 30% 25%",
  sidebarPrimary: "207 88% 68%",
  sidebarPrimaryForeground: "0 0% 100%",
  sidebarAccent: "123 39% 64%",
  sidebarAccentForeground: "0 0% 100%",
  sidebarBorder: "207 30% 70%",
  sidebarRing: "207 88% 68%",
  ...defaultChartColors,
};

const defaultThemeDarkColors: ColorPalette = {
  background: "207 30% 10%",
  foreground: "207 80% 90%",
  card: "207 30% 15%",
  cardForeground: "207 80% 90%",
  popover: "207 30% 15%",
  popoverForeground: "207 80% 90%",
  primary: "207 88% 68%",
  primaryForeground: "207 10% 10%",
  secondary: "207 30% 25%",
  secondaryForeground: "207 80% 90%",
  muted: "207 30% 25%",
  mutedForeground: "207 80% 70%",
  accent: "123 39% 64%",
  accentForeground: "123 10% 10%",
  destructive: defaultDarkDestructive,
  destructiveForeground: defaultDarkDestructiveForeground,
  border: "207 30% 30%",
  input: "207 30% 25%",
  ring: "207 88% 68%",
  sidebarBackground: "207 30% 12%",
  sidebarForeground: "207 80% 90%",
  sidebarPrimary: "207 88% 68%",
  sidebarPrimaryForeground: "207 10% 10%",
  sidebarAccent: "123 39% 64%",
  sidebarAccentForeground: "123 10% 10%",
  sidebarBorder: "207 30% 25%",
  sidebarRing: "207 88% 68%",
  ...defaultDarkChartColors,
};


const themes: AppTheme[] = [
  {
    id: 'default-light',
    name: 'Claro Predeterminado (Azul Suave)',
    lightColors: defaultThemeLightColors,
    darkColors: defaultThemeDarkColors,
  },
  {
    id: 'dark-rojo',
    name: 'Dark Rojo',
    lightColors: { // Inherently dark theme, so lightColors mirror darkColors
      background: "0 0% 4%", // Near black
      foreground: "0 0% 96%", // Light gray/white
      card: "0 0% 8%",
      cardForeground: "0 0% 96%",
      popover: "0 0% 8%",
      popoverForeground: "0 0% 96%",
      primary: "0 75% 55%", // Strong red
      primaryForeground: "0 0% 100%",
      secondary: "0 60% 30%", // Darker, desaturated red
      secondaryForeground: "0 0% 85%",
      muted: "0 0% 12%",
      mutedForeground: "0 0% 65%",
      accent: "0 85% 65%", // Brighter red for accent
      accentForeground: "0 0% 100%",
      destructive: "0 70% 40%", // Theme-specific destructive red
      destructiveForeground: "0 0% 98%",
      border: "0 0% 15%",
      input: "0 0% 10%",
      ring: "0 75% 55%", // Primary red
      sidebarBackground: "0 0% 5%",
      sidebarForeground: "0 0% 96%",
      sidebarPrimary: "0 75% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "0 85% 65%",
      sidebarAccentForeground: "0 0% 100%",
      sidebarBorder: "0 0% 15%",
      sidebarRing: "0 75% 55%",
      chart1: "0 70% 50%", // Red for chart1
      chart2: defaultDarkChartColors.chart2,
      chart3: defaultDarkChartColors.chart3,
      chart4: defaultDarkChartColors.chart4,
      chart5: defaultDarkChartColors.chart5,
    },
    darkColors: { // Actual dark mode palette
      background: "0 0% 4%",
      foreground: "0 0% 96%",
      card: "0 0% 8%",
      cardForeground: "0 0% 96%",
      popover: "0 0% 8%",
      popoverForeground: "0 0% 96%",
      primary: "0 75% 55%",
      primaryForeground: "0 0% 100%",
      secondary: "0 60% 30%",
      secondaryForeground: "0 0% 85%",
      muted: "0 0% 12%",
      mutedForeground: "0 0% 65%",
      accent: "0 85% 65%",
      accentForeground: "0 0% 100%",
      destructive: "0 70% 40%",
      destructiveForeground: "0 0% 98%",
      border: "0 0% 15%",
      input: "0 0% 10%",
      ring: "0 75% 55%",
      sidebarBackground: "0 0% 5%",
      sidebarForeground: "0 0% 96%",
      sidebarPrimary: "0 75% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "0 85% 65%",
      sidebarAccentForeground: "0 0% 100%",
      sidebarBorder: "0 0% 15%",
      sidebarRing: "0 75% 55%",
      chart1: "0 70% 50%",
      chart2: defaultDarkChartColors.chart2,
      chart3: defaultDarkChartColors.chart3,
      chart4: defaultDarkChartColors.chart4,
      chart5: defaultDarkChartColors.chart5,
    }
  },
    {
    id: 'lila-dark',
    name: 'Lila Oscuro',
    lightColors: { // Inherently dark theme
      background: "250 20% 8%",
      foreground: "250 30% 90%",
      card: "250 20% 12%",
      cardForeground: "250 30% 90%",
      popover: "250 20% 12%",
      popoverForeground: "250 30% 90%",
      primary: "260 80% 65%",
      primaryForeground: "260 80% 10%",
      secondary: "260 30% 25%",
      secondaryForeground: "250 30% 80%",
      muted: "260 20% 20%",
      mutedForeground: "250 20% 60%",
      accent: "270 90% 70%",
      accentForeground: "270 90% 15%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "260 20% 28%",
      input: "260 20% 20%",
      ring: "260 80% 65%",
      sidebarBackground: "250 20% 10%",
      sidebarForeground: "250 30% 90%",
      sidebarPrimary: "260 80% 65%",
      sidebarPrimaryForeground: "260 80% 10%",
      sidebarAccent: "270 90% 70%",
      sidebarAccentForeground: "270 90% 15%",
      sidebarBorder: "250 20% 22%",
      sidebarRing: "260 80% 65%",
      ...defaultDarkChartColors,
    },
    darkColors: { // Identical to lightColors
      background: "250 20% 8%",
      foreground: "250 30% 90%",
      card: "250 20% 12%",
      cardForeground: "250 30% 90%",
      popover: "250 20% 12%",
      popoverForeground: "250 30% 90%",
      primary: "260 80% 65%",
      primaryForeground: "260 80% 10%",
      secondary: "260 30% 25%",
      secondaryForeground: "250 30% 80%",
      muted: "260 20% 20%",
      mutedForeground: "250 20% 60%",
      accent: "270 90% 70%",
      accentForeground: "270 90% 15%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "260 20% 28%",
      input: "260 20% 20%",
      ring: "260 80% 65%",
      sidebarBackground: "250 20% 10%",
      sidebarForeground: "250 30% 90%",
      sidebarPrimary: "260 80% 65%",
      sidebarPrimaryForeground: "260 80% 10%",
      sidebarAccent: "270 90% 70%",
      sidebarAccentForeground: "270 90% 15%",
      sidebarBorder: "250 20% 22%",
      sidebarRing: "260 80% 65%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'dorado-elegante',
    name: 'Dorado Elegante',
    lightColors: {
      background: "45 50% 96%",
      foreground: "35 40% 20%",
      card: "45 50% 92%",
      cardForeground: "35 40% 20%",
      popover: "45 50% 92%",
      popoverForeground: "35 40% 20%",
      primary: "40 80% 55%",
      primaryForeground: "40 80% 10%",
      secondary: "40 60% 80%",
      secondaryForeground: "35 40% 25%",
      muted: "40 50% 90%",
      mutedForeground: "35 30% 50%",
      accent: "30 35% 45%",
      accentForeground: "30 35% 95%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "40 40% 75%",
      input: "40 50% 88%",
      ring: "40 80% 55%",
      sidebarBackground: "45 50% 94%",
      sidebarForeground: "35 40% 20%",
      sidebarPrimary: "40 80% 55%",
      sidebarPrimaryForeground: "40 80% 10%",
      sidebarAccent: "30 35% 45%",
      sidebarAccentForeground: "30 35% 95%",
      sidebarBorder: "40 40% 70%",
      sidebarRing: "40 80% 55%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "35 40% 10%",
      foreground: "45 50% 90%",
      card: "35 40% 15%",
      cardForeground: "45 50% 90%",
      popover: "35 40% 15%",
      popoverForeground: "45 50% 90%",
      primary: "40 80% 60%",
      primaryForeground: "40 80% 15%",
      secondary: "35 40% 25%",
      secondaryForeground: "45 50% 85%",
      muted: "35 30% 20%",
      mutedForeground: "45 40% 65%",
      accent: "45 70% 70%",
      accentForeground: "45 70% 10%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "35 40% 30%",
      input: "35 40% 25%",
      ring: "40 80% 60%",
      sidebarBackground: "35 40% 12%",
      sidebarForeground: "45 50% 90%",
      sidebarPrimary: "40 80% 60%",
      sidebarPrimaryForeground: "40 80% 15%",
      sidebarAccent: "45 70% 70%",
      sidebarAccentForeground: "45 70% 10%",
      sidebarBorder: "35 40% 25%",
      sidebarRing: "40 80% 60%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'verde-vital',
    name: 'Verde Vital',
    lightColors: {
      background: "100 60% 95%",
      foreground: "120 40% 15%",
      card: "100 60% 90%",
      cardForeground: "120 40% 15%",
      popover: "100 60% 90%",
      popoverForeground: "120 40% 15%",
      primary: "130 55% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "130 40% 75%",
      secondaryForeground: "120 40% 20%",
      muted: "100 40% 88%",
      mutedForeground: "120 30% 40%",
      accent: "80 60% 60%",
      accentForeground: "80 60% 10%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "100 40% 70%",
      input: "100 50% 85%",
      ring: "130 55% 50%",
      sidebarBackground: "100 60% 93%",
      sidebarForeground: "120 40% 15%",
      sidebarPrimary: "130 55% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "80 60% 60%",
      sidebarAccentForeground: "80 60% 10%",
      sidebarBorder: "100 40% 65%",
      sidebarRing: "130 55% 50%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "120 30% 10%",
      foreground: "100 50% 90%",
      card: "120 30% 15%",
      cardForeground: "100 50% 90%",
      popover: "120 30% 15%",
      popoverForeground: "100 50% 90%",
      primary: "130 60% 55%",
      primaryForeground: "130 60% 10%",
      secondary: "120 30% 25%",
      secondaryForeground: "100 50% 85%",
      muted: "120 25% 20%",
      mutedForeground: "100 40% 65%",
      accent: "80 65% 65%",
      accentForeground: "80 65% 10%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "120 30% 30%",
      input: "120 30% 25%",
      ring: "130 60% 55%",
      sidebarBackground: "120 30% 12%",
      sidebarForeground: "100 50% 90%",
      sidebarPrimary: "130 60% 55%",
      sidebarPrimaryForeground: "130 60% 10%",
      sidebarAccent: "80 65% 65%",
      sidebarAccentForeground: "80 65% 10%",
      sidebarBorder: "120 30% 25%",
      sidebarRing: "130 60% 55%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'noche-digital',
    name: 'Noche Digital (Modo Oscuro)',
    lightColors: { // For this dark theme, lightColors will be same as darkColors
      background: "220 40% 8%", 
      foreground: "210 30% 88%",
      card: "220 40% 12%",
      cardForeground: "210 30% 88%",
      popover: "220 40% 12%",
      popoverForeground: "210 30% 88%",
      primary: "200 90% 60%", 
      primaryForeground: "200 90% 10%", 
      secondary: "220 30% 25%",
      secondaryForeground: "210 30% 80%",
      muted: "220 20% 20%",
      mutedForeground: "210 20% 60%",
      accent: "180 80% 55%", 
      accentForeground: "180 80% 10%", 
      destructive: defaultDarkDestructive, // Use dark destructive for dark theme
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "220 30% 28%",
      input: "220 30% 20%",
      ring: "200 90% 60%",
      sidebarBackground: "220 40% 10%",
      sidebarForeground: "210 30% 88%",
      sidebarPrimary: "200 90% 60%",
      sidebarPrimaryForeground: "200 90% 10%",
      sidebarAccent: "180 80% 55%",
      sidebarAccentForeground: "180 80% 10%",
      sidebarBorder: "220 30% 22%",
      sidebarRing: "200 90% 60%",
      ...defaultDarkChartColors, // Use dark chart colors
    },
    darkColors: { // Identical to lightColors for an inherently dark theme
      background: "220 40% 8%",
      foreground: "210 30% 88%",
      card: "220 40% 12%",
      cardForeground: "210 30% 88%",
      popover: "220 40% 12%",
      popoverForeground: "210 30% 88%",
      primary: "200 90% 60%",
      primaryForeground: "200 90% 10%",
      secondary: "220 30% 25%",
      secondaryForeground: "210 30% 80%",
      muted: "220 20% 20%",
      mutedForeground: "210 20% 60%",
      accent: "180 80% 55%",
      accentForeground: "180 80% 10%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "220 30% 28%",
      input: "220 30% 20%",
      ring: "200 90% 60%",
      sidebarBackground: "220 40% 10%",
      sidebarForeground: "210 30% 88%",
      sidebarPrimary: "200 90% 60%",
      sidebarPrimaryForeground: "200 90% 10%",
      sidebarAccent: "180 80% 55%",
      sidebarAccentForeground: "180 80% 10%",
      sidebarBorder: "220 30% 22%",
      sidebarRing: "200 90% 60%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'rojo-intenso',
    name: 'Rojo Intenso',
    lightColors: {
      background: "0 0% 96%",
      foreground: "0 0% 10%",
      card: "0 0% 100%",
      cardForeground: "0 0% 10%",
      popover: "0 0% 100%",
      popoverForeground: "0 0% 10%",
      primary: "0 70% 50%", // Deep red
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 85%", // Light gray
      secondaryForeground: "0 0% 15%",
      muted: "0 0% 90%",
      mutedForeground: "0 0% 40%",
      accent: "0 60% 65%", // Lighter red
      accentForeground: "0 0% 100%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "0 0% 80%",
      input: "0 0% 92%",
      ring: "0 70% 50%",
      sidebarBackground: "0 0% 94%",
      sidebarForeground: "0 0% 10%",
      sidebarPrimary: "0 70% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "0 60% 65%",
      sidebarAccentForeground: "0 0% 100%",
      sidebarBorder: "0 0% 75%",
      sidebarRing: "0 70% 50%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "0 0% 8%",
      foreground: "0 0% 95%",
      card: "0 0% 12%",
      cardForeground: "0 0% 95%",
      popover: "0 0% 12%",
      popoverForeground: "0 0% 95%",
      primary: "0 70% 60%", // Brighter deep red
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 20%",
      secondaryForeground: "0 0% 85%",
      muted: "0 0% 15%",
      mutedForeground: "0 0% 60%",
      accent: "0 60% 70%",
      accentForeground: "0 0% 10%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "0 0% 25%",
      input: "0 0% 18%",
      ring: "0 70% 60%",
      sidebarBackground: "0 0% 10%",
      sidebarForeground: "0 0% 95%",
      sidebarPrimary: "0 70% 60%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "0 60% 70%",
      sidebarAccentForeground: "0 0% 10%",
      sidebarBorder: "0 0% 20%",
      sidebarRing: "0 70% 60%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'gris-neutro',
    name: 'Gris Neutro',
    lightColors: {
      background: "0 0% 95%",
      foreground: "0 0% 5%",
      card: "0 0% 100%",
      cardForeground: "0 0% 5%",
      popover: "0 0% 100%",
      popoverForeground: "0 0% 5%",
      primary: "0 0% 50%", // Medium gray
      primaryForeground: "0 0% 100%",
      secondary: "0 0% 88%",
      secondaryForeground: "0 0% 10%",
      muted: "0 0% 92%",
      mutedForeground: "0 0% 45%",
      accent: "0 0% 30%", // Darker gray
      accentForeground: "0 0% 90%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "0 0% 80%",
      input: "0 0% 90%",
      ring: "0 0% 50%",
      sidebarBackground: "0 0% 92%",
      sidebarForeground: "0 0% 5%",
      sidebarPrimary: "0 0% 50%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "0 0% 30%",
      sidebarAccentForeground: "0 0% 90%",
      sidebarBorder: "0 0% 75%",
      sidebarRing: "0 0% 50%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "0 0% 10%",
      foreground: "0 0% 90%",
      card: "0 0% 15%",
      cardForeground: "0 0% 90%",
      popover: "0 0% 15%",
      popoverForeground: "0 0% 90%",
      primary: "0 0% 60%", // Lighter medium gray
      primaryForeground: "0 0% 10%",
      secondary: "0 0% 25%",
      secondaryForeground: "0 0% 85%",
      muted: "0 0% 20%",
      mutedForeground: "0 0% 65%",
      accent: "0 0% 80%", // Light gray accent
      accentForeground: "0 0% 15%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "0 0% 30%",
      input: "0 0% 22%",
      ring: "0 0% 60%",
      sidebarBackground: "0 0% 12%",
      sidebarForeground: "0 0% 90%",
      sidebarPrimary: "0 0% 60%",
      sidebarPrimaryForeground: "0 0% 10%",
      sidebarAccent: "0 0% 80%",
      sidebarAccentForeground: "0 0% 15%",
      sidebarBorder: "0 0% 25%",
      sidebarRing: "0 0% 60%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'azul-corporativo',
    name: 'Azul Corporativo',
    lightColors: {
      background: "210 60% 98%",
      foreground: "210 40% 20%",
      card: "0 0% 100%",
      cardForeground: "210 40% 20%",
      popover: "0 0% 100%",
      popoverForeground: "210 40% 20%",
      primary: "210 80% 55%", // Corporate blue
      primaryForeground: "0 0% 100%",
      secondary: "210 50% 90%",
      secondaryForeground: "210 40% 25%",
      muted: "210 50% 95%",
      mutedForeground: "210 30% 50%",
      accent: "200 70% 65%", // Lighter blue
      accentForeground: "200 70% 10%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "210 40% 80%",
      input: "210 50% 92%",
      ring: "210 80% 55%",
      sidebarBackground: "210 60% 95%",
      sidebarForeground: "210 40% 20%",
      sidebarPrimary: "210 80% 55%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "200 70% 65%",
      sidebarAccentForeground: "200 70% 10%",
      sidebarBorder: "210 40% 75%",
      sidebarRing: "210 80% 55%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "210 40% 10%",
      foreground: "210 60% 90%",
      card: "210 40% 15%",
      cardForeground: "210 60% 90%",
      popover: "210 40% 15%",
      popoverForeground: "210 60% 90%",
      primary: "210 80% 65%", // Brighter corporate blue
      primaryForeground: "210 80% 15%",
      secondary: "210 40% 25%",
      secondaryForeground: "210 60% 85%",
      muted: "210 30% 20%",
      mutedForeground: "210 50% 65%",
      accent: "200 70% 70%",
      accentForeground: "200 70% 15%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "210 40% 30%",
      input: "210 40% 22%",
      ring: "210 80% 65%",
      sidebarBackground: "210 40% 12%",
      sidebarForeground: "210 60% 90%",
      sidebarPrimary: "210 80% 65%",
      sidebarPrimaryForeground: "210 80% 15%",
      sidebarAccent: "200 70% 70%",
      sidebarAccentForeground: "200 70% 15%",
      sidebarBorder: "210 40% 25%",
      sidebarRing: "210 80% 65%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'tierra-calida',
    name: 'Tierra Cálida',
    lightColors: {
      background: "30 40% 95%", // Light beige
      foreground: "30 50% 20%", // Dark brown
      card: "30 40% 90%",
      cardForeground: "30 50% 20%",
      popover: "30 40% 90%",
      popoverForeground: "30 50% 20%",
      primary: "30 70% 50%", // Warm brown
      primaryForeground: "30 70% 95%",
      secondary: "35 50% 80%",
      secondaryForeground: "30 50% 25%",
      muted: "35 40% 88%",
      mutedForeground: "30 40% 50%",
      accent: "40 60% 60%", // Ochre/light orange
      accentForeground: "40 60% 10%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "30 40% 75%",
      input: "30 40% 85%",
      ring: "30 70% 50%",
      sidebarBackground: "30 40% 92%",
      sidebarForeground: "30 50% 20%",
      sidebarPrimary: "30 70% 50%",
      sidebarPrimaryForeground: "30 70% 95%",
      sidebarAccent: "40 60% 60%",
      sidebarAccentForeground: "40 60% 10%",
      sidebarBorder: "30 40% 70%",
      sidebarRing: "30 70% 50%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "30 50% 10%",
      foreground: "30 40% 90%",
      card: "30 50% 15%",
      cardForeground: "30 40% 90%",
      popover: "30 50% 15%",
      popoverForeground: "30 40% 90%",
      primary: "30 70% 60%", // Brighter warm brown
      primaryForeground: "30 70% 10%",
      secondary: "30 40% 25%",
      secondaryForeground: "30 40% 85%",
      muted: "30 35% 20%",
      mutedForeground: "30 30% 65%",
      accent: "40 60% 70%",
      accentForeground: "40 60% 15%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "30 40% 30%",
      input: "30 40% 22%",
      ring: "30 70% 60%",
      sidebarBackground: "30 50% 12%",
      sidebarForeground: "30 40% 90%",
      sidebarPrimary: "30 70% 60%",
      sidebarPrimaryForeground: "30 70% 10%",
      sidebarAccent: "40 60% 70%",
      sidebarAccentForeground: "40 60% 15%",
      sidebarBorder: "30 40% 25%",
      sidebarRing: "30 70% 60%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'cielo-claro',
    name: 'Cielo Claro',
    lightColors: {
      background: "200 100% 97%", // Very light sky blue
      foreground: "210 50% 30%", // Medium-dark blue
      card: "0 0% 100%",
      cardForeground: "210 50% 30%",
      popover: "0 0% 100%",
      popoverForeground: "210 50% 30%",
      primary: "195 90% 60%", // Sky blue
      primaryForeground: "195 90% 10%",
      secondary: "200 80% 92%",
      secondaryForeground: "210 50% 35%",
      muted: "200 70% 95%",
      mutedForeground: "210 40% 55%",
      accent: "210 30% 75%", // Silver/light gray-blue
      accentForeground: "210 30% 20%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "200 50% 85%",
      input: "200 60% 90%",
      ring: "195 90% 60%",
      sidebarBackground: "200 100% 95%",
      sidebarForeground: "210 50% 30%",
      sidebarPrimary: "195 90% 60%",
      sidebarPrimaryForeground: "195 90% 10%",
      sidebarAccent: "210 30% 75%",
      sidebarAccentForeground: "210 30% 20%",
      sidebarBorder: "200 50% 80%",
      sidebarRing: "195 90% 60%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "220 60% 10%", // Deep dark blue
      foreground: "200 80% 90%",
      card: "220 60% 15%",
      cardForeground: "200 80% 90%",
      popover: "220 60% 15%",
      popoverForeground: "200 80% 90%",
      primary: "195 90% 70%", // Brighter sky blue
      primaryForeground: "195 90% 15%",
      secondary: "220 50% 25%",
      secondaryForeground: "200 70% 85%",
      muted: "220 40% 20%",
      mutedForeground: "200 60% 65%",
      accent: "210 30% 80%", // Brighter silver
      accentForeground: "210 30% 25%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "220 50% 30%",
      input: "220 50% 22%",
      ring: "195 90% 70%",
      sidebarBackground: "220 60% 12%",
      sidebarForeground: "200 80% 90%",
      sidebarPrimary: "195 90% 70%",
      sidebarPrimaryForeground: "195 90% 15%",
      sidebarAccent: "210 30% 80%",
      sidebarAccentForeground: "210 30% 25%",
      sidebarBorder: "220 50% 25%",
      sidebarRing: "195 90% 70%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'selva-tropical',
    name: 'Selva Tropical',
    lightColors: {
      background: "90 30% 95%", // Very light green/beige
      foreground: "120 60% 15%", // Dark forest green
      card: "80 40% 90%",
      cardForeground: "120 60% 15%",
      popover: "80 40% 90%",
      popoverForeground: "120 60% 15%",
      primary: "140 70% 40%", // Intense jungle green
      primaryForeground: "0 0% 100%",
      secondary: "100 50% 85%",
      secondaryForeground: "120 50% 20%",
      muted: "90 40% 92%",
      mutedForeground: "120 50% 40%",
      accent: "40 50% 50%", // Earthy brown
      accentForeground: "40 50% 95%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "90 30% 78%",
      input: "90 35% 88%",
      ring: "140 70% 40%",
      sidebarBackground: "90 30% 92%",
      sidebarForeground: "120 60% 15%",
      sidebarPrimary: "140 70% 40%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "40 50% 50%",
      sidebarAccentForeground: "40 50% 95%",
      sidebarBorder: "90 30% 72%",
      sidebarRing: "140 70% 40%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "120 50% 10%",
      foreground: "90 40% 90%",
      card: "120 50% 15%",
      cardForeground: "90 40% 90%",
      popover: "120 50% 15%",
      popoverForeground: "90 40% 90%",
      primary: "140 70% 50%", // Brighter jungle green
      primaryForeground: "140 70% 10%",
      secondary: "110 40% 25%",
      secondaryForeground: "90 40% 85%",
      muted: "110 30% 20%",
      mutedForeground: "90 30% 65%",
      accent: "80 60% 65%", // Brighter leafy green accent
      accentForeground: "80 60% 10%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "110 30% 30%",
      input: "110 30% 22%",
      ring: "140 70% 50%",
      sidebarBackground: "120 50% 12%",
      sidebarForeground: "90 40% 90%",
      sidebarPrimary: "140 70% 50%",
      sidebarPrimaryForeground: "140 70% 10%",
      sidebarAccent: "80 60% 65%",
      sidebarAccentForeground: "80 60% 10%",
      sidebarBorder: "110 30% 25%",
      sidebarRing: "140 70% 50%",
      ...defaultDarkChartColors,
    }
  },
  {
    id: 'rojo-moderno',
    name: 'Rojo Moderno',
    lightColors: {
      background: "10 80% 97%", // Very light pink/off-white
      foreground: "0 50% 25%", // Dark desaturated red/brown
      card: "0 0% 100%",
      cardForeground: "0 50% 25%",
      popover: "0 0% 100%",
      popoverForeground: "0 50% 25%",
      primary: "0 80% 65%", // Modern red/coral
      primaryForeground: "0 0% 100%",
      secondary: "5 70% 90%",
      secondaryForeground: "0 50% 30%",
      muted: "5 60% 94%",
      mutedForeground: "0 40% 50%",
      accent: "20 90% 70%", // Soft orange/peach
      accentForeground: "20 90% 15%",
      destructive: defaultDestructive,
      destructiveForeground: defaultDestructiveForeground,
      border: "10 50% 85%",
      input: "10 60% 92%",
      ring: "0 80% 65%",
      sidebarBackground: "10 80% 95%",
      sidebarForeground: "0 50% 25%",
      sidebarPrimary: "0 80% 65%",
      sidebarPrimaryForeground: "0 0% 100%",
      sidebarAccent: "20 90% 70%",
      sidebarAccentForeground: "20 90% 15%",
      sidebarBorder: "10 50% 80%",
      sidebarRing: "0 80% 65%",
      ...defaultChartColors,
    },
    darkColors: {
      background: "0 30% 10%",
      foreground: "10 70% 90%",
      card: "0 30% 15%",
      cardForeground: "10 70% 90%",
      popover: "0 30% 15%",
      popoverForeground: "10 70% 90%",
      primary: "0 80% 70%", // Brighter modern red/coral
      primaryForeground: "0 80% 10%",
      secondary: "0 20% 25%",
      secondaryForeground: "10 60% 85%",
      muted: "0 15% 20%",
      mutedForeground: "10 50% 65%",
      accent: "20 90% 75%", // Brighter soft orange/peach
      accentForeground: "20 90% 20%",
      destructive: defaultDarkDestructive,
      destructiveForeground: defaultDarkDestructiveForeground,
      border: "0 15% 30%",
      input: "0 15% 22%",
      ring: "0 80% 70%",
      sidebarBackground: "0 30% 12%",
      sidebarForeground: "10 70% 90%",
      sidebarPrimary: "0 80% 70%",
      sidebarPrimaryForeground: "0 80% 10%",
      sidebarAccent: "20 90% 75%",
      sidebarAccentForeground: "20 90% 20%",
      sidebarBorder: "0 15% 25%",
      sidebarRing: "0 80% 70%",
      ...defaultDarkChartColors,
    }
  },
];

// This function generates the full CSS content for globals.css
function generateGlobalsCssContent(theme: AppTheme): string {
  const lc = theme.lightColors;
  const dc = theme.darkColors;

  const finalLc = { ...defaultChartColors, ...lc };
  const finalDc = { ...defaultDarkChartColors, ...dc };

  return `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'PT Sans', sans-serif;
}

@layer base {
  :root {
    --background: ${finalLc.background};
    --foreground: ${finalLc.foreground};
    --card: ${finalLc.card};
    --card-foreground: ${finalLc.cardForeground};
    --popover: ${finalLc.popover};
    --popover-foreground: ${finalLc.popoverForeground};
    --primary: ${finalLc.primary};
    --primary-foreground: ${finalLc.primaryForeground};
    --secondary: ${finalLc.secondary};
    --secondary-foreground: ${finalLc.secondaryForeground};
    --muted: ${finalLc.muted};
    --muted-foreground: ${finalLc.mutedForeground};
    --accent: ${finalLc.accent};
    --accent-foreground: ${finalLc.accentForeground};
    --destructive: ${finalLc.destructive};
    --destructive-foreground: ${finalLc.destructiveForeground};
    --border: ${finalLc.border};
    --input: ${finalLc.input};
    --ring: ${finalLc.ring};
    --chart-1: ${finalLc.chart1};
    --chart-2: ${finalLc.chart2};
    --chart-3: ${finalLc.chart3};
    --chart-4: ${finalLc.chart4};
    --chart-5: ${finalLc.chart5};
    --radius: 0.5rem;
    --sidebar-background: ${finalLc.sidebarBackground};
    --sidebar-foreground: ${finalLc.sidebarForeground};
    --sidebar-primary: ${finalLc.sidebarPrimary};
    --sidebar-primary-foreground: ${finalLc.sidebarPrimaryForeground};
    --sidebar-accent: ${finalLc.sidebarAccent};
    --sidebar-accent-foreground: ${finalLc.sidebarAccentForeground};
    --sidebar-border: ${finalLc.sidebarBorder};
    --sidebar-ring: ${finalLc.sidebarRing};
  }
  .dark {
    --background: ${finalDc.background};
    --foreground: ${finalDc.foreground};
    --card: ${finalDc.card};
    --card-foreground: ${finalDc.cardForeground};
    --popover: ${finalDc.popover};
    --popover-foreground: ${finalDc.popoverForeground};
    --primary: ${finalDc.primary};
    --primary-foreground: ${finalDc.primaryForeground};
    --secondary: ${finalDc.secondary};
    --secondary-foreground: ${finalDc.secondaryForeground};
    --muted: ${finalDc.muted};
    --muted-foreground: ${finalDc.mutedForeground};
    --accent: ${finalDc.accent};
    --accent-foreground: ${finalDc.accentForeground};
    --destructive: ${finalDc.destructive};
    --destructive-foreground: ${finalDc.destructiveForeground};
    --border: ${finalDc.border};
    --input: ${finalDc.input};
    --ring: ${finalDc.ring};
    --chart-1: ${finalDc.chart1};
    --chart-2: ${finalDc.chart2};
    --chart-3: ${finalDc.chart3};
    --chart-4: ${finalDc.chart4};
    --chart-5: ${finalDc.chart5};
    --sidebar-background: ${finalDc.sidebarBackground};
    --sidebar-foreground: ${finalDc.sidebarForeground};
    --sidebar-primary: ${finalDc.sidebarPrimary};
    --sidebar-primary-foreground: ${finalDc.sidebarPrimaryForeground};
    --sidebar-accent: ${finalDc.sidebarAccent};
    --sidebar-accent-foreground: ${finalDc.sidebarAccentForeground};
    --sidebar-border: ${finalDc.sidebarBorder};
    --sidebar-ring: ${finalDc.sidebarRing};
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
  `;
}


export default function ThemeCustomizationPage() {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [globalsCssContent, setGlobalsCssContent] = useState<string>('');
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
    const initialThemeId = storedThemeId && themes.find(t => t.id === storedThemeId) ? storedThemeId : themes[0].id;
    setSelectedThemeId(initialThemeId);
    
    // Apply initial theme to DOM if not already matching globals.css (for persistence)
    const initialTheme = themes.find(t => t.id === initialThemeId);
    if (initialTheme) {
      applyThemeToDOM(initialTheme);
    }
  }, []);

  const applyThemeToDOM = (theme: AppTheme) => {
    const root = document.documentElement;
    // For inherently dark themes like 'Noche Digital' or 'Dark Rojo', always use their darkColors.
    // For other themes, respect the system's dark mode preference.
    const isInherentlyDark = theme.id === 'noche-digital' || theme.id === 'dark-rojo' || theme.id === 'lila-dark';
    const colorsToApply = isInherentlyDark 
      ? theme.darkColors 
      : (document.documentElement.classList.contains('dark') ? theme.darkColors : theme.lightColors);
    
    Object.entries(colorsToApply).forEach(([key, value]) => {
      // Convert camelCase to kebab-case for CSS variables
      const cssVarName = `--${key.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`).replace(/^-/, '')}`;
      root.style.setProperty(cssVarName, value as string);
    });
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      applyThemeToDOM(theme); // Apply for immediate visual feedback
      
      const newCssContent = generateGlobalsCssContent(theme);
      setGlobalsCssContent(newCssContent); 
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      setSelectedThemeId(themeId);
      
      toast({
        title: "Tema Aplicado",
        description: `El tema "${theme.name}" ha sido previsualizado. El sistema actualizará los estilos globales.`,
      });
    }
  };
  
  const ThemePreviewSwatch = ({ colors }: { colors: ColorPalette }) => (
    <div className="flex space-x-1 h-8 w-full rounded overflow-hidden border border-muted">
      <div style={{ backgroundColor: `hsl(${colors.background})` }} className="flex-1" title={`Background: ${colors.background}`}></div>
      <div style={{ backgroundColor: `hsl(${colors.foreground})` }} className="flex-1" title={`Foreground: ${colors.foreground}`}></div>
      <div style={{ backgroundColor: `hsl(${colors.primary})` }} className="flex-1" title={`Primary: ${colors.primary}`}></div>
      <div style={{ backgroundColor: `hsl(${colors.accent})` }} className="flex-1" title={`Accent: ${colors.accent}`}></div>
      <div style={{ backgroundColor: `hsl(${colors.card})` }} className="flex-1" title={`Card: ${colors.card}`}></div>
    </div>
  );

  if (!isMounted) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <Card><CardHeader><CardTitle>Cargando temas...</CardTitle></CardHeader></Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-primary">Personalización de Tema</CardTitle>
            <CardDescription>Selecciona un tema visual para la plataforma. Los cambios se aplicarán globalmente tras la actualización del sistema.</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <Card 
              key={theme.id} 
              className={cn(
                "cursor-pointer hover:shadow-xl transition-shadow",
                selectedThemeId === theme.id && "ring-2 ring-primary shadow-xl border-primary"
              )}
              onClick={() => handleThemeSelect(theme.id)}
            >
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  {theme.name}
                  {selectedThemeId === theme.id && <CheckCircle className="h-5 w-5 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Vista Previa (Claro):</p>
                <ThemePreviewSwatch colors={theme.lightColors} /> 
                {theme.id !== 'noche-digital' && theme.id !== 'dark-rojo' && theme.id !== 'lila-dark' && ( 
                  <>
                    <p className="text-sm text-muted-foreground mt-2">Vista Previa (Oscuro):</p>
                    <ThemePreviewSwatch colors={theme.darkColors} />
                  </>
                )}
                 {(theme.id === 'noche-digital' || theme.id === 'dark-rojo' || theme.id === 'lila-dark') && (
                    <p className="text-sm text-muted-foreground mt-2">(Este tema es inherentemente oscuro)</p>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
        {globalsCssContent && (
           <div style={{ display: 'none' }} id="globals-css-payload">
             {globalsCssContent}
           </div>
        )}
      </div>
    </AppLayout>
  );
}


