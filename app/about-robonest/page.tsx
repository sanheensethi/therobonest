import LegacyRedirect from "@/components/ui/LegacyRedirect";

export const metadata = { title: "About Robonest", robots: { index: false } };

export default function Page() {
  return <LegacyRedirect to="/about" label="About Robonest" />;
}
