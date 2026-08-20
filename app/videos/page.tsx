import type { Metadata } from "next";
import PageHero from "@/components/sections/PageHero";
import VideoGrid, { type Video } from "@/components/sections/VideoGrid";
import { videosPage } from "@/content/site";
import { getVideos } from "@/lib/odoo-content";

/** Pick up newly published Odoo content within 5 minutes. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Videos",
  description: videosPage.body,
};

export default async function VideosPage() {
  // Prefer Odoo (eLearning videos). Falls back to the curated list in
  // content/site.ts so the page is never empty while Odoo has no videos yet.
  const fromOdoo = await getVideos();
  const videos: Video[] =
    fromOdoo.length > 0
      ? fromOdoo.map((v) => ({
          youtubeId: v.youtubeId,
          title: v.title,
          category: v.category,
          duration: v.duration,
          tags: v.tags,
          isShort: v.isShort,
        }))
      : videosPage.items.map((v) => ({
          youtubeId: v.youtubeId,
          title: v.title,
          category: v.category,
          duration: v.duration,
        }));

  return (
    <>
      <PageHero
        eyebrow={videosPage.eyebrow}
        title={videosPage.title}
        body={videosPage.body}
        image="/images/gallery/g6.jpeg"
      />
      <VideoGrid videos={videos} />
      {fromOdoo.length === 0 && (
        <p className="bg-sand pb-16 text-center text-xs text-ink-400">
          Showing placeholder videos - add real ones in Odoo eLearning and they
          replace these automatically.
        </p>
      )}
    </>
  );
}
