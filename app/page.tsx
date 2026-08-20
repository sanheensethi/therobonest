import Hero from "@/components/sections/Hero";
import LabIndex from "@/components/sections/LabIndex";
import Stats from "@/components/sections/Stats";
import AboutShowcase from "@/components/sections/AboutShowcase";
import LabsRail from "@/components/sections/LabsRail";
import Hardware from "@/components/sections/Hardware";
import Team from "@/components/sections/Team";
import { getTeam, getSchools } from "@/lib/odoo-content";
import { homeTeam } from "@/content/site";
import Gallery from "@/components/sections/Gallery";
import Journey from "@/components/sections/Journey";
import Schools from "@/components/sections/Schools";
import FeaturedVideos from "@/components/sections/FeaturedVideos";
import EnquiryForm from "@/components/sections/EnquiryForm";

export default async function HomePage() {
  // Homepage shows only the people tagged for it, capped. If nobody is
  // tagged yet, fall back to the capped full list rather than an empty
  // section - a missing tag should degrade, not delete the team.
  const tagged = homeTeam.tag ? await getTeam(homeTeam.max, homeTeam.tag) : [];
  const team = tagged.length > 0 ? tagged : await getTeam(homeTeam.max);

  // Partner schools from Odoo Contacts (tagged "School", published).
  const schoolLogos = await getSchools();

  return (
    <>
      <Hero />
      <LabIndex />
      <Stats />
      <AboutShowcase />
      <LabsRail />
      <Hardware />
      <Team members={team} singleTier />
      <FeaturedVideos />
      <Gallery />
      <Journey />
      <Schools odooLogos={schoolLogos} />
      <EnquiryForm />
    </>
  );
}
