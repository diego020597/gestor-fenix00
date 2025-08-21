
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useState, type FormEvent, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useClubName } from '@/hooks/useClubName';
import { useRouter } from 'next/navigation';
import type { CoachStorageItem } from '../registro/entrenador/page';
import type { TeamStorageItem } from '../gestor-fenix/page';


const videoUrls = [
  // 'https://videos.pexels.com/video-files/853888/853888-hd_1920_1080_25fps.mp4', // Ejemplo: Voleibol playa (si funciona)
  // 'https://videos.pexels.com/video-files/7109101/7109101-hd_1920_1080_30fps.mp4', // Ejemplo: Gimnasio (si funciona)
  'https://videos.pexels.com/video-files/3125907/3125907-hd_1920_1080_25fps.mp4', 
  'https://videos.pexels.com/video-files/6077718/6077718-hd_1920_1080_25fps.mp4', 
  'https://videos.pexels.com/video-files/6179971/6179971-hd_1920_1080_25fps.mp4',
];


const GESTOR_FENIX_TEAMS_STORAGE_KEY = 'gestorFenix_teams_v1';
const COACHES_STORAGE_KEY = 'coaches';


export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, isLoading: authIsLoading } = useAuth();
  const { clubName: globalClubName, isLoadingClubName } = useClubName();
  const { toast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (videoUrls.length > 0) {
      const randomIndex = Math.floor(Math.random() * videoUrls.length);
      setCurrentVideoUrl(videoUrls[randomIndex]);
    } else {
      console.warn("No video URLs available for login background.");
      setCurrentVideoUrl(null);
    }
  }, []);

  useEffect(() => {
    if (currentVideoUrl) {
      setVideoLoaded(false);
    }
  }, [currentVideoUrl]);

  useEffect(() => {
    if (mounted && !authIsLoading && user) {
      if (user.type === 'fenix_master') router.push('/gestor-fenix');
      else router.push('/'); 
    }
  }, [user, authIsLoading, router, mounted]);


  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = usernameOrEmail.toLowerCase().trim();

    // 1. Check for Fenix Master Admin
    if (username === 'gestorfenix' && password === 'superadmin123') {
      login('fenix_master', { name: 'GestorFenix', id: 'gestorfenix' });
      toast({
        title: 'Inicio de Sesión Exitoso',
        description: 'Bienvenido, GestorFenix.',
      });
      return;
    }

    try {
        const teamsString = localStorage.getItem(GESTOR_FENIX_TEAMS_STORAGE_KEY);
        const allTeams: TeamStorageItem[] = teamsString ? JSON.parse(teamsString) : [];
        
        const coachesString = localStorage.getItem(COACHES_STORAGE_KEY);
        const allCoaches: CoachStorageItem[] = coachesString ? JSON.parse(coachesString) : [];

        // 2. Check for Team Admin login
        for (const team of allTeams) {
            if (team.adminUsername.toLowerCase() === username && team.adminPassword === password) {
                if (!team.isActive) {
                    toast({ title: "Acceso Denegado", description: "Este equipo se encuentra inactivo.", variant: "destructive" });
                    return;
                }
                login('team_admin', {
                    name: `Admin ${team.name}`,
                    id: team.adminUsername,
                    teamId: team.id,
                    currentTeamName: team.name,
                    avatar: team.logo,
                    passwordChangeRequired: team.passwordChangeRequired,
                });
                toast({
                    title: 'Inicio de Sesión Exitoso',
                    description: `Bienvenido al panel de ${team.name}.`,
                });
                return;
            }
        }


        // 3. Check for Coach login
        for (const coach of allCoaches) {
            let coachUsername = '';
            if (user?.type === 'team_admin' && user.currentTeamName) {
                const teamNamePrefix = user.currentTeamName.toLowerCase().replace(/\s+/g, '');
                const firstInitial = coach.firstName.charAt(0).toLowerCase();
                const firstLastName = (coach.lastName.split(' ')[0] || '').toLowerCase();
                coachUsername = `${teamNamePrefix}@${firstInitial}${firstLastName}`;
            } else { // Fallback for global admin or direct coach login
                const team = allTeams.find(t => t.id === coach.teamId);
                if (team) {
                    const teamNamePrefix = team.name.toLowerCase().replace(/\s+/g, '');
                    const firstInitial = coach.firstName.charAt(0).toLowerCase();
                    const firstLastName = (coach.lastName.split(' ')[0] || '').toLowerCase();
                    coachUsername = `${teamNamePrefix}@${firstInitial}${firstLastName}`;
                } else {
                    coachUsername = (coach.firstName.charAt(0) + (coach.lastName.split(' ')[0] || '')).toLowerCase();
                }
            }


            if (coachUsername && username === coachUsername && password === coach.documentId) {
                 const team = allTeams.find(t => t.id === coach.teamId);
                 if (team && !team.isActive) {
                    toast({ title: "Acceso Denegado", description: `El equipo "${team.name}" al que perteneces está inactivo.`, variant: "destructive" });
                    return;
                }
                login('coach', {
                    name: coach.name,
                    id: coach.id,
                    avatar: coach.avatar,
                    assignedCategories: coach.assignedCategories,
                });
                toast({
                    title: 'Inicio de Sesión Exitoso',
                    description: `Bienvenido de nuevo, Entrenador ${coach.name}.`,
                });
                return;
            }
        }

    } catch (error) {
        console.error("Error during login credential check:", error);
        toast({
            title: 'Error del Sistema',
            description: 'No se pudo procesar el inicio de sesión. Inténtelo de nuevo.',
            variant: 'destructive',
        });
        return;
    }


    toast({
      title: 'Error de Inicio de Sesión',
      description: 'Usuario o contraseña incorrectos.',
      variant: 'destructive',
    });
  };


  if (authIsLoading || isLoadingClubName || !mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <p className="text-white">Cargando...</p>
      </div>
    );
  }
  if (user && mounted) {
      return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <p className="text-white">Redirigiendo...</p>
        </div>
      );
  }

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black"
      data-ai-hint="sports action retro"
    >
      <div className="absolute top-0 left-0 w-full h-full bg-black/30 z-[1]"></div>

      {currentVideoUrl && (
        <video
          key={currentVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          poster="https://placehold.co/1920x1080/000000/333333.png?text=Cargando+Video..."
          className={`absolute top-0 left-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={() => {
            setVideoLoaded(true);
          }}
          onError={(e) => {
            console.error(`Error loading video: ${currentVideoUrl}`, e);
            // Podríamos intentar cargar el siguiente video o una imagen de fallback aquí si quisiéramos.
            // Forzamos la carga del poster si el video falla.
            const videoElement = e.target as HTMLVideoElement;
            if (videoElement.poster) {
                 videoElement.style.backgroundImage = `url(${videoElement.poster})`;
                 videoElement.style.backgroundSize = 'cover';
                 videoElement.style.backgroundPosition = 'center';
                 setVideoLoaded(true); // Para que el overlay del poster sea visible.
            }
          }}
          src={currentVideoUrl || undefined}
        >
          Tu navegador no soporta la etiqueta de video.
        </video>
      )}
       {!currentVideoUrl && ( // Fallback si la lista de videos está vacía desde el inicio
          <div 
            className="absolute top-0 left-0 w-full h-full object-cover z-0 bg-cover bg-center"
            style={{backgroundImage: "url('https://placehold.co/1920x1080/000000/333333.png?text=Video+No+Disponible')"}}
          ></div>
        )}


      <div className="relative z-10 flex flex-col items-center p-4 transition-opacity duration-500 ease-in-out animate-fadeIn">
        <div className="mb-8 text-center">
           <h1
            className="font-[orbitron] text-5xl sm:text-6xl font-bold text-white"
             style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}
          >
            {user?.type === 'fenix_master' ? 'GestorFenix' : (user?.type === 'team_admin' && user.currentTeamName ? user.currentTeamName : (isLoadingClubName ? 'Cargando...' : globalClubName))}
          </h1>
          <p
            className="text-white/80 mt-3 text-sm sm:text-base"
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}
          >
            Transformando el deporte desde la raíz.
          </p>
        </div>

        <Card className="w-full max-w-sm shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-white">
          <CardHeader className="text-center">
            <CardTitle className="font-[orbitron] text-3xl">LOGIN</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail" className="text-white/80 font-[orbitron] text-xs tracking-wider">USUARIO</Label>
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="gestorfenix / admin@equipo / usuario"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/30 placeholder:text-white/50 focus:ring-green-500 focus:border-green-500 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80 font-[orbitron] text-xs tracking-wider">CONTRASEÑA</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/10 border-white/30 placeholder:text-white/50 focus:ring-green-500 focus:border-green-500 text-white"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button
                type="submit"
                className="w-full font-[orbitron] tracking-wider bg-green-500/80 hover:bg-green-400/80 text-black font-bold border-2 border-green-300/50 hover:border-green-200 shadow-[0_0_10px_#34d399,0_0_5px_#34d399] transition-all duration-300 ease-in-out transform hover:scale-105"
              >
                INGRESAR
              </Button>
               <p className="text-xs text-center text-white/60">
                 Los entrenadores inician sesión con su usuario y documento.
               </p>
            </CardFooter>
          </form>
        </Card>
      </div>
      <style jsx global>{`
        .font-\\[orbitron\\] {
          font-family: 'Orbitron', sans-serif;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
