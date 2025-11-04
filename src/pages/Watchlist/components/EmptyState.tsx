import { Link } from "react-router-dom";
import { AiFillHeart } from "react-icons/ai";
import { watchBtn } from "@/styles";

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AiFillHeart className="text-8xl text-gray-400 dark:text-gray-600 mb-4" />
      <h2 className="text-2xl font-bold mb-2 dark:text-gray-300">
        Your watchlist is empty
      </h2>
      <p className="text-gray-400 dark:text-gray-500 mb-6 text-center">
        Start adding movies and TV shows to your watchlist
      </p>
      <Link to="/" className={watchBtn}>
        Browse Movies
      </Link>
    </div>
  );
};

export default EmptyState;
