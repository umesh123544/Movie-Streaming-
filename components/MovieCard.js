import Link from 'next/link';

export default function MovieCard({ movie }) {
  return (
    <Link href={`/movie/${movie._id}`} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <span className="font-display text-marquee text-sm tracking-wide">▶ PLAY</span>
        </div>
      </div>
      <h3 className="mt-2 font-body text-sm text-bone truncate">{movie.title}</h3>
      <p className="text-xs text-muted">{movie.genre}{movie.year ? ` · ${movie.year}` : ''}</p>
    </Link>
  );
}
