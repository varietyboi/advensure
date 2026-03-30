import { useEffect, useState } from "react";

import { AuthScreen } from "./components/AuthScreen";
import { AppShell } from "./components/AppShell";
import { useAuth } from "./context/AuthContext";
import { usePreferences } from "./context/PreferenceContext";
import { OnboardingPage } from "./pages/OnboardingPage";

const ONBOARDING_KEY_LEGACY = "advensure.onboarding.completed";
const ONBOARDING_KEY_PREFIX = "advensure.onboarding.completed";

function onboardingKeyForUser(userId: string) {
  return `${ONBOARDING_KEY_PREFIX}.${userId}`;
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const { loading: preferencesLoading } = usePreferences();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [initialRoute, setInitialRoute] = useState("/");

  useEffect(() => {
    if (!user) {
      setOnboardingDone(false);
      setInitialRoute("/");
      return;
    }

    const userKey = onboardingKeyForUser(user.id);
    const userOnboardingDone = window.localStorage.getItem(userKey) === "true";

    window.localStorage.removeItem(ONBOARDING_KEY_LEGACY);

    setOnboardingDone(userOnboardingDone);
  }, [user]);

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
          if (user) {
            window.localStorage.setItem(onboardingKeyForUser(user.id), "true");
          }

          window.localStorage.removeItem(ONBOARDING_KEY_LEGACY);
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
        if (user) {
          window.localStorage.removeItem(onboardingKeyForUser(user.id));
        }

        setOnboardingDone(false);
        setInitialRoute("/onboarding");
      }}
    />
  );
}
