import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { useWatchlist } from "@/context/watchlistContext";
import { motion } from "framer-motion";

interface WatchlistButtonProps {
  movie: {
    id: string;
    category?: "movie" | "tv";
    poster_path: string;
    original_title?: string;
    name?: string;
    overview: string;
    backdrop_path?: string;
  };
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const WatchlistButton = ({
  movie,
  size = "md",
  showLabel = false,
  className = "",
}: WatchlistButtonProps) => {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } =
    useWatchlist();

  const inWatchlist = isInWatchlist(movie.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-lg",
    md: "w-10 h-10 text-xl",
    lg: "w-12 h-12 text-2xl",
  };

  return (
    <motion.button
      onClick={handleClick}
      aria-label={
        inWatchlist ? "Remove from watchlist" : "Add to watchlist"
      }
      aria-pressed={inWatchlist}
      className={`${sizeClasses[size]} flex items-center justify-center gap-2 rounded-full bg-black/40 backdrop-blur-sm hover:-translate-y-[2px] active:translate-y-[1px] transition-transform duration-300 ${className}`}
      whileTap={{ scale: 0.9 }}
    >
      {inWatchlist ? (
        <AiFillHeart className="text-[#ff0000]" />
      ) : (
        <AiOutlineHeart className="text-white" />
      )}
      {showLabel && (
        <span className="text-sm font-medium text-white pr-3">
          {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
        </span>
      )}
    </motion.button>
  );
};

export default WatchlistButton;
