import Link from "next/link";
import VideoPlaylist from "@/components/sections/VideoPlaylist";
import type { Video } from "@/components/sections/VideoGrid";
import { getVideos, TAG } from "@/lib/odoo-content";

/**
 * Homepage video block: one player with a selectable playlist beside it.
 *
 * Which videos appear is driven entirely by the "Homepage" tag in eLearning.
 * If fewer than two are tagged the playlist looks thin, so it tops up from the
 * full library rather than showing a lone video next to an empty list.
 *
 * Renders nothing when there are no videos at all, so the homepage never shows
 * an empty section.
 */
export default async function FeaturedVideos() {
  const tagged = await getVideos(8, TAG.home);
  const pool = tagged.length >= 2 ? tagged : await getVideos(8);
  if (pool.length === 0) return null;

  const videos: Video[] = pool.map((v) => ({
    youtubeId: v.youtubeId,
    title: v.title,
    category: v.category,
    duration: v.duration,
    tags: v.tags,
    isShort: v.isShort,
  }));

  return (
    <section className="bg-sand">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.2em] text-brand">
              Watch
            </p>
            <h2 className="mt-2 text-balance font-display text-3xl leading-tight text-ink sm:text-4xl">
              Robonest in action
            </h2>
          </div>
          <Link
            href="/videos"
            className="text-sm font-semibold text-brand transition-colors hover:text-brand-600"
          >
            All videos →
          </Link>
        </div>

        <VideoPlaylist videos={videos} />
      </div>
    </section>
  );
}
