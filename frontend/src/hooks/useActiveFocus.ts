import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";

// Returns true only while the screen is focused AND the app is foregrounded.
// Used to gate polling (10s market refresh) per the Phase 1 lifecycle rules.
export function useActiveFocus(): boolean {
  const [active, setActive] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setActive(AppState.currentState === "active");
      const sub = AppState.addEventListener("change", (s) => setActive(s === "active"));
      return () => {
        setActive(false);
        sub.remove();
      };
    }, []),
  );
  return active;
}
