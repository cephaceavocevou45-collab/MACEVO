import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "katex/dist/katex.min.css";

import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { ProfileProvider } from "./context/ProfileContext";
import { SettingsProvider } from "./context/SettingsContext";
import './i18n';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ProfileProvider>
          <SettingsProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SettingsProvider>
        </ProfileProvider>
      </AuthProvider>
      </GoogleOAuthProvider>
    ) : (
      <AuthProvider>
        <ProfileProvider>
          <SettingsProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SettingsProvider>
        </ProfileProvider>
      </AuthProvider>
    )}
  </React.StrictMode>
);