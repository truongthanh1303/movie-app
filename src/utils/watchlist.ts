import { IWatchlistItem } from "@/types";

const STORAGE_KEY = "tmovies_watchlist";

/**
 * Save watchlist items to localStorage
 */
export const saveWatchlist = (items: IWatchlistItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.error("Watchlist storage full. Please remove some items.");
    } else {
      console.error("Failed to save watchlist:", error);
    }
  }
};

/**
 * Get watchlist items from localStorage
 */
export const getWatchlist = (): IWatchlistItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return validateWatchlistData(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load watchlist:", error);
    return [];
  }
};

/**
 * Validate watchlist data structure
 */
export const validateWatchlistData = (data: any): boolean => {
  if (!Array.isArray(data)) return false;

  return data.every(
    (item) =>
      typeof item.id === "string" &&
      typeof item.category === "string" &&
      (item.category === "movie" || item.category === "tv") &&
      typeof item.title === "string"
  );
};
