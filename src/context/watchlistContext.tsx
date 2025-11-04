import React, { useContext, useState, useEffect, useMemo } from "react";
import { getWatchlist, saveWatchlist } from "@/utils/watchlist";
import { IWatchlistItem } from "@/types";

interface IWatchlistContext {
  watchlistItems: IWatchlistItem[];
  addToWatchlist: (movie: any) => void;
  removeFromWatchlist: (id: string | number) => void;
  isInWatchlist: (id: string | number) => boolean;
  clearWatchlist: () => void;
}

const context = React.createContext<IWatchlistContext>({
  watchlistItems: [],
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isInWatchlist: () => false,
  clearWatchlist: () => {},
});

interface Props {
  children: React.ReactNode;
}

const WatchlistProvider = ({ children }: Props) => {
  const [watchlistItems, setWatchlistItems] = useState<IWatchlistItem[]>([]);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    const saved = getWatchlist();
    setWatchlistItems(saved);
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    saveWatchlist(watchlistItems);
  }, [watchlistItems]);

  const addToWatchlist = (movie: any) => {
    const movieId = String(movie.id);

    // Prevent duplicates
    if (watchlistItems.some((item) => item.id === movieId)) {
      return;
    }

    const newItem: IWatchlistItem = {
      id: movieId,
      category: movie.category || "movie",
      poster_path: movie.poster_path,
      title: movie.original_title || movie.name || movie.title,
      original_title: movie.original_title || "",
      name: movie.name || "",
      overview: movie.overview,
      backdrop_path: movie.backdrop_path,
      addedAt: new Date().toISOString(),
    };

    setWatchlistItems((prev) => [newItem, ...prev]);
  };

  const removeFromWatchlist = (id: string | number) => {
    const idString = String(id);
    setWatchlistItems((prev) => prev.filter((item) => item.id !== idString));
  };

  const isInWatchlist = useMemo(
    () => (id: string | number) => {
      const idString = String(id);
      return watchlistItems.some((item) => item.id === idString);
    },
    [watchlistItems]
  );

  const clearWatchlist = () => {
    setWatchlistItems([]);
  };

  return (
    <context.Provider
      value={{
        watchlistItems,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        clearWatchlist,
      }}
    >
      {children}
    </context.Provider>
  );
};

export default WatchlistProvider;

export const useWatchlist = () => {
  return useContext(context);
};
