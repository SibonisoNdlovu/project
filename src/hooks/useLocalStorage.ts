import { useState } from 'react';

/**
 * Custom React hook to store and retrieve a value from localStorage.
 * Automatically synchronizes state with localStorage.
 *
 * @template T - Type of the stored value.
 * @param key - The localStorage key to store the value under.
 * @param initialValue - Default value to use if nothing is in localStorage.
 * @returns [value, saveValue] - The current value and a function to update it.
 */
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue; 
    }
  });

  /**
   * Save a new value to both state and localStorage.
   * Supports passing a value directly or a function updater (like useState).
   */
  const saveValue = (newValue: T | ((val: T) => T)) => {
    const valueToStore =
      newValue instanceof Function ? newValue(value) : newValue; 
    setValue(valueToStore);
    localStorage.setItem(key, JSON.stringify(valueToStore)); 
  };

  // Return tuple (readonly as const so types are preserved like useState)
  return [value, saveValue] as const;
}

export default useLocalStorage;
