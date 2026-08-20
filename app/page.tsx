import Hero from "@/components/sections/Hero";
import LabIndex from "@/components/sections/LabIndex";
import Stats from "@/components/sections/Stats";
import AboutShowcase from "@/components/sections/AboutShowcase";
import LabsRail from "@/components/sections/LabsRail";
import Hardware from "@/components/sections/Hardware";
import Team from "@/components/sections/Team";
import { getTeam } from "@/lib/odoo-content";
import Gallery from "@/components/sections/Gallery";
import Journey from "@/components/sections/Journey";
import Schools from "@/components/sections/Schools";
import FeaturedVideos from "@/components/sections/FeaturedVideos";
import EnquiryForm from "@/components/sections/EnquiryForm";

export default async function HomePage() {
  const team = await getTeam();
  return (
    <>
      <Hero />
      <LabIndex />
      <Stats />
      <AboutShowcase />
      <LabsRail />
      <Hardware />
      <Team members={team} />
      <FeaturedVideos />
      <Gallery />
      <Journey />
      <Schools />
      <EnquiryForm />
    </>
  );
}
