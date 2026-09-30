import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { safeImage } from "@/lib/image-upload";
import { businessTypeLabels } from "@/data/mock";
import restaurantBanner from "@/assets/restaurant-banner.jpg";
import bakeryBanner from "@/assets/bakery-banner.jpg";

type Partner = { id: string; name: string; type: string; tagline: string | null; image_url: string | null };
type Slide = { id: string; name: string; headline: string; description: string; image: string; badge: string; businessId?: string };
const editorialSlides: Slide[] = [
  { id: "meals", name: "Phoe La Min", headline: "Really good food. Really good prices.", description: "Discover surplus meals from local kitchens, ready for a second chance.", image: restaurantBanner, badge: "RESCUE GOOD FOOD" },
  { id: "bakery", name: "Phoe La Min", headline: "The best things are worth saving.", description: "Fresh bakes and little treats from neighborhood favorites.", image: bakeryBanner, badge: "FRESH FINDS" },
];

export function HomePromoCarousel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    let mounted = true;
    void supabase.from("advertised_vendors_public" as never)
      .select("id,name,type,tagline,image_url,ad_priority")
      .order("ad_priority", { ascending: false }).limit(8)
      .then(({ data }) => { if (mounted && data) setPartners(data as unknown as Partner[]); });
    return () => { mounted = false; };
  }, []);
  const slides: Slide[] = partners.length ? partners.map((partner, i) => ({
    id: partner.id,
    name: partner.name,
    headline: partner.tagline?.trim() || `Good food from ${partner.name}`,
    description: `Discover today's surplus food from this ${businessTypeLabels[partner.type as keyof typeof businessTypeLabels]?.toLowerCase() || "local food business"}.`,
    image: safeImage(partner.image_url, i % 2 === 0 ? restaurantBanner : bakeryBanner),
    badge: "FEATURED PARTNER",
    businessId: partner.id,
  })) : editorialSlides;
  const selected = slides[active % slides.length];
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((n) => (n + 1) % slides.length), 6000);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);
  const go = (direction: number) => setActive((n) => (n + direction + slides.length) % slides.length);
  return (
    <section aria-label="Featured restaurants and food" className="relative isolate min-h-[390px] overflow-hidden bg-primary sm:min-h-[470px] lg:min-h-[520px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}>
      {slides.map((slide, index) => <img key={slide.id} src={slide.image} alt={slide.businessId ? `${slide.name} restaurant` : "Fresh food from local businesses"} width={1600} height={900} loading={index === 0 ? "eager" : "lazy"} className={`absolute inset-0 -z-20 size-full object-cover transition-opacity duration-700 ${selected.id === slide.id ? "opacity-100" : "opacity-0"}`} />)}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--foreground)_90%,transparent),color-mix(in_oklab,var(--foreground)_45%,transparent)_45%,transparent_85%)]" />
      <div className="mx-auto flex min-h-[390px] max-w-6xl flex-col justify-center px-5 pb-20 pt-12 sm:min-h-[470px] sm:px-8 lg:min-h-[520px]">
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary-foreground/40 bg-primary-foreground/15 px-3 py-1.5 text-xs font-bold text-primary-foreground backdrop-blur-sm"><Sparkles className="size-3.5" />{selected.badge}</span>
        <p className="mb-2 text-sm font-semibold text-accent">{selected.name}</p>
        <h1 className="max-w-[570px] font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.1] text-primary-foreground sm:text-5xl lg:text-6xl">{selected.headline}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/90 sm:text-base">{selected.description}</p>
        <Button asChild size="lg" className="mt-7 w-fit rounded-full bg-accent px-7 text-accent-foreground hover:bg-accent/90"><Link to={selected.businessId ? "/business/$businessId" : "/search"} params={selected.businessId ? { businessId: selected.businessId } : undefined}>{selected.businessId ? "View menu" : "Explore food"}<ArrowRight className="size-4" /></Link></Button>
      </div>
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2" aria-label="Banner slides">{slides.map((slide, i) => <Button key={slide.id} variant="ghost" size="icon" aria-label={`Show banner ${i + 1}`} aria-current={i === active % slides.length ? "true" : undefined} onClick={() => setActive(i)} className="size-8 rounded-full p-0 hover:bg-primary-foreground/15"><span className={`block h-2 rounded-full transition-all ${i === active % slides.length ? "w-7 bg-accent" : "w-2 bg-primary-foreground/70"}`} /></Button>)}</div>
      {slides.length > 1 && <div className="absolute bottom-5 right-5 hidden gap-2 sm:flex"><Button variant="ghost" size="icon" aria-label="Previous banner" onClick={() => go(-1)} className="rounded-full border border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"><ArrowLeft /></Button><Button variant="ghost" size="icon" aria-label="Next banner" onClick={() => go(1)} className="rounded-full border border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"><ArrowRight /></Button></div>}
    </section>
  );
}
