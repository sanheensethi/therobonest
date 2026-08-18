import LegacyRedirect from "@/components/ui/LegacyRedirect";

export const metadata = { title: "Contact", robots: { index: false } };

export default function Page() {
  return <LegacyRedirect to="/contact" label="Contact" />;
}
