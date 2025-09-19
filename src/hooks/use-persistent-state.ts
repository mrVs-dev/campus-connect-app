
"use client";

import * as React from "react";

// A custom hook to manage state that persists in localStorage.
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  reviver?: (key: string, value: any) => any
): [T, React.Dispatch<React.SetStateAction<T>>] {
  
  const [state, setState] = React.useState<T>(() => {
    // This function only runs on the initial render.
    if (typeof window === "undefined") {
      // If on the server, return the initial value.
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        // If an item is found, parse it. The reviver handles date conversion.
        return JSON.parse(item, reviver);
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      // If parsing fails, we'll fall through and return the initial value.
    }
    // Return initial value if nothing is in localStorage or if an error occurred.
    return initialValue;
  });

  // This effect runs whenever the state changes, saving the new state to localStorage.
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}
