import client from 'api/client';
import useSWR from 'swr';
import { Animal } from 'types/Animal';

/**
 * Fetcher function used by SWR.
 * Makes an HTTP GET request to the given URL using the shared API client.
 * Returns the data as an array of Animal objects.
 */
const fetcher = async (url: string) => {
  const { data } = await client.get<Animal[]>(url);
  return data;
};

/**
 * Custom hook for fetching animals based on a search term.
 * Uses the SWR library for caching, revalidation, and automatic updates.
 *
 * @param searchTerm - The name or partial name of the animal to search for.
 * @returns {
 *   animals: Animal[],       // Array of fetched animals
 *   loading: boolean,        // Whether the data is currently being fetched
 *   error: string | null     // Error message if fetch fails
 * }
 */
const useFetchAnimals = (searchTerm: string | null | undefined) => {
  const shouldFetch = Boolean(searchTerm && searchTerm.trim());

  // SWR handles caching, re-fetching, and error states.
  // If shouldFetch is false, we pass `null` to disable fetching.
  const { data, error } = useSWR<Animal[]>(
    shouldFetch
      ? `/v1/animals?name=${encodeURIComponent(searchTerm!)}`
      : null,
    fetcher
  );

  return {
    animals: data ?? [],                               
    loading: shouldFetch && !data && !error,          
    error: error ? 'Failed to fetch animals.' : null, 
  };
};

export default useFetchAnimals;
