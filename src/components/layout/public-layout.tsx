import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail } from "lucide-react";
import { SiteHeader } from "./site-header";
import { VendorRedirect } from "@/components/auth/vendor-guard";

export function PublicLayout({ children, allowVendor = false }: { children: ReactNode; allowVendor?: boolean }) {
  return <div className="flex min-h-screen flex-col bg-background">
    {allowVendor ? null : <VendorRedirect />}
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <footer className="mt-16 border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div><p className="font-[family-name:var(--font-display)] text-2xl font-semibold">Phoe La Min</p><p className="mt-3 max-w-xs leading-relaxed text-background/75">Good food deserves a second chance. Discover delicious surplus food from places around you.</p><div className="mt-5 flex gap-3"><a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook" className="rounded-full border border-background/35 p-2 hover:bg-background/15"><Facebook className="size-4" /></a><a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" className="rounded-full border border-background/35 p-2 hover:bg-background/15"><Instagram className="size-4" /></a><a href="mailto:support@phoelamin.com" aria-label="Email Phoe La Min" title="Email Phoe La Min" className="rounded-full border border-background/35 p-2 hover:bg-background/15"><Mail className="size-4" /></a></div></div>
        <nav className="flex flex-col gap-3 text-background/80" aria-label="Explore"><p className="mb-1 font-semibold text-background">Explore</p><Link to="/about" className="hover:text-accent">About</Link><Link to="/search" className="hover:text-accent">Browse food</Link><Link to="/vendor/register" className="hover:text-accent">Restaurant Partner</Link></nav>
        <nav className="flex flex-col gap-3 text-background/80" aria-label="Support"><p className="mb-1 font-semibold text-background">Support</p><Link to="/help" className="hover:text-accent">Help Center</Link><a href="mailto:support@phoelamin.com" className="hover:text-accent">Contact</a><Link to="/terms" className="hover:text-accent">Terms &amp; Conditions</Link><Link to="/privacy" className="hover:text-accent">Privacy Policy</Link></nav>
        <div className="text-background/80"><p className="mb-4 font-semibold text-background">Made for good food</p><p className="leading-relaxed">Save on your next meal and help keep good food out of the bin.</p></div>
      </div><div className="border-t border-background/20 px-4 py-5 text-center text-xs text-background/60">© Phoe La Min</div>
    </footer>
  </div>;
}

export function PagePlaceholder({ title, description }: { title: string; description: string }) {
  return <section className="mx-auto max-w-6xl px-4 py-12"><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-3 max-w-xl text-muted-foreground">{description}</p><div className="surface-card mt-8 flex min-h-48 items-center justify-center p-8 text-sm text-muted-foreground">Coming next — this page is scaffolded and ready to build.</div></section>;
}
