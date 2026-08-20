import Link from "next/link";
import VideoGrid, { type Video } from "@/components/sections/VideoGrid";
import { getVideos, TAG } from "@/lib/odoo-content";

/**
 * Homepage video block, driven entirely by the "Homepage" tag in Odoo.
 *
 * Tag a video Homepage in eLearning and it appears here; untag it and it
 * disappears. Nothing about which videos are featured lives in the code -
 * that is the whole point of the tag vocabulary.
 *
 * Renders nothing at all when no video is tagged, so the homepage never shows
 * an empty section.
 */
export default async function FeaturedVideos() {
  const tagged = await getVideos(2, TAG.home);
  if (tagged.length === 0) return null;

  const videos: Video[] = tagged.map((v) => ({
    youtubeId: v.youtubeId,
    title: v.title,
    category: v.category,
    duration: v.duration,
    tags: v.tags,
    isShort: v.isShort,
  }));

  return (
    <div className="bg-sand">
      <div className="mx-auto max-w-7xl px-6 pt-20 lg:pt-24">
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
      </div>

      {/* The grid brings its own section padding and click-to-play modal. */}
      <VideoGrid videos={videos} showFilter={false} columns={2} />
    </div>
  );
}
