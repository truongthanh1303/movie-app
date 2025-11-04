import { useEffect } from 'react';
import { MovieCard } from '@/common';
import { useWatchlist } from '@/context/watchlistContext';
import { smallMaxWidth } from '@/styles';
import EmptyState from './components/EmptyState';

const Watchlist = () => {
  const { watchlistItems } = useWatchlist();

  useEffect(() => {
    document.title = 'My Watchlist - tMovies';
    return () => {
      document.title = 'tMovies';
    };
  }, []);

  return (
    <section
      className={`${smallMaxWidth} lg:pt-24 md:pt-[88px] sm:pt-20 pt-[72px] pb-8`}
    >
      <div className='mb-8 text-center'>
        <h1 className='sm:text-4xl xs:text-3xl text-[28.75px] font-extrabold dark:text-gray-200 text-gray-900 font-nunito'>
          My Watchlist
        </h1>
        <p className='text-gray-400 dark:text-gray-500 sm:text-base text-sm mt-2'>
          {watchlistItems.length}{' '}
          {watchlistItems.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {watchlistItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className='flex flex-wrap xs:gap-4 gap-[14px] justify-center'>
          {watchlistItems.map((movie) => (
            <div className='flex flex-col max-w-[170px]' key={movie.id}>
              <MovieCard movie={movie} category={movie.category} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Watchlist;
