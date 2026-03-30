import { useState } from "react";

import { AuthScreen } from "./components/AuthScreen";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./context/AuthContext";
import { usePreferences } from "./context/PreferenceContext";
import { OnboardingPage } from "./pages/OnboardingPage";

const ONBOARDING_KEY = "advensure.onboarding.completed";

export default function App() {
  const { user, loading, logout } = useAuth();
  const { loading: preferencesLoading } = usePreferences();
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    return window.localStorage.getItem(ONBOARDING_KEY) === "true";
  });
  const [initialRoute, setInitialRoute] = useState("/");

  if (loading || preferencesLoading) {
    return (
      <div className="center-screen">
        <div className="card splash-card fade-up">
          <h2>Preparing your travel desk...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!onboardingDone) {
    return (
      <OnboardingPage
        onComplete={(nextPath) => {
          window.localStorage.setItem(ONBOARDING_KEY, "true");
          setInitialRoute(nextPath);
          setOnboardingDone(true);
        }}
      />
    );
  }

  return (
    <AppShell
      userEmail={user.email}
      initialRoute={initialRoute}
      onLogout={logout}
      onResetOnboarding={() => {
        window.localStorage.removeItem(ONBOARDING_KEY);
        setOnboardingDone(false);
        setInitialRoute("/onboarding");
      }}
    />
  );
}
