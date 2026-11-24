import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import profileService from "../services/profileService";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Met à jour le profil dans le contexte.
   *
   * Toutes les pages qui utilisent useProfile()
   * récupèrent immédiatement les nouvelles données.
   */
  const setProfile = useCallback((data) => {
    setProfileState(data);
    setError(null);
  }, []);

  /**
   * Charge le profil depuis :
   * GET /api/profile/
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await profileService.getProfile();

      const profileData = response.data;

      setProfileState(profileData);

      return profileData;
    } catch (err) {
      console.error(
        "Erreur lors du chargement du profil :",
        err
      );

      setError(err);

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Efface le profil du contexte.
   *
   * Utile lors de la déconnexion.
   */
  const clearProfile = useCallback(() => {
    setProfileState(null);
    setError(null);
  }, []);

  /**
   * Mise à jour partielle du profil dans le contexte.
   *
   * Cette fonction ne fait PAS de requête API.
   * Elle sert uniquement à synchroniser l'interface
   * après une sauvegarde réussie.
   */
  const updateProfile = useCallback((data) => {
    setProfileState((previous) => ({
      ...(previous || {}),
      ...(data || {}),
    }));

    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      profile,

      loading,
      error,

      setProfile,
      updateProfile,

      loadProfile,
      clearProfile,
    }),
    [
      profile,
      loading,
      error,
      setProfile,
      updateProfile,
      loadProfile,
      clearProfile,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      "useProfile doit être utilisé à l'intérieur de ProfileProvider."
    );
  }

  return context;
}

export default ProfileContext;