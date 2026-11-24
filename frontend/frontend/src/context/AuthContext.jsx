import { createContext, useContext, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );

  const login = (data) => {
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("email", data.email);
    localStorage.setItem("fullname", data.fullname || "");

    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  // Récupération des infos de l'utilisateur
  const rawUser = authService.getCurrentUser() || {};
  const storedFullName = localStorage.getItem("fullname") || rawUser.fullname || "";
  
  // Séparation du prénom et du nom
  const nameParts = storedFullName.trim().split(" ");
  const firstName = rawUser.firstName || rawUser.first_name || nameParts[0] || "";
  const lastName = rawUser.lastName || rawUser.last_name || nameParts.slice(1).join(" ") || "";

  const user = {
    ...rawUser,
    email: localStorage.getItem("email") || rawUser.email,
    fullName: storedFullName || "Utilisateur",
    firstName: firstName || "Utilisateur",
    lastName: lastName,
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}