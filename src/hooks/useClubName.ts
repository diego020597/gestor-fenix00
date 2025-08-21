
'use client';

import { useState, useEffect } from 'react';

const CLUB_PROFILE_STORAGE_KEY = 'club_profile_v1';
const DEFAULT_CLUB_NAME = 'Plataforma Fenix'; // Default if nothing is set

interface ClubProfile {
  name: string;
}

export function useClubName() {
  const [clubName, setClubName] = useState<string>(DEFAULT_CLUB_NAME);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wrapped in a check for window to ensure it runs only on client-side
    if (typeof window !== 'undefined') {
      const loadClubName = () => {
        try {
          const storedClubProfile = localStorage.getItem(CLUB_PROFILE_STORAGE_KEY);
          if (storedClubProfile) {
            const clubProfile: ClubProfile = JSON.parse(storedClubProfile);
            setClubName(clubProfile.name || DEFAULT_CLUB_NAME);
          } else {
            setClubName(DEFAULT_CLUB_NAME);
          }
        } catch (error) {
          console.error("Error loading club name from localStorage:", error);
          setClubName(DEFAULT_CLUB_NAME);
        }
        setIsLoading(false);
      };

      loadClubName();

      const handleClubNameChange = () => {
        loadClubName();
      };

      window.addEventListener('clubNameChanged', handleClubNameChange);

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === CLUB_PROFILE_STORAGE_KEY) {
          loadClubName();
        }
      };
      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('clubNameChanged', handleClubNameChange);
        window.removeEventListener('storage', handleStorageChange);
      };
    } else {
      // For server-side rendering or environments without window
      setClubName(DEFAULT_CLUB_NAME);
      setIsLoading(false);
    }
  }, []);

  return { clubName, isLoadingClubName: isLoading };
}
