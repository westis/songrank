"use client";

interface RankingFiltersProps {
  albums: string[];
  selectedAlbum: string;
  onAlbumChange: (album: string) => void;
  minBattles: number;
  onMinBattlesChange: (min: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export default function RankingFilters({
  albums,
  selectedAlbum,
  onAlbumChange,
  minBattles,
  onMinBattlesChange,
  search,
  onSearchChange,
}: RankingFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search songs..."
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />

      <select
        value={selectedAlbum}
        onChange={(e) => onAlbumChange(e.target.value)}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">All Albums</option>
        {albums.map((album) => (
          <option key={album} value={album}>
            {album}
          </option>
        ))}
      </select>

      <select
        value={minBattles}
        onChange={(e) => onMinBattlesChange(Number(e.target.value))}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value={0}>Min battles: any</option>
        <option value={1}>Min 1 battle</option>
        <option value={3}>Min 3 battles</option>
        <option value={5}>Min 5 battles</option>
        <option value={10}>Min 10 battles</option>
      </select>
    </div>
  );
}
