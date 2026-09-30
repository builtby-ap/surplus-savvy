import { Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
export function InformationPage({ title, intro, sections }: { title: string; intro: string; sections: { heading: string; body: string }[] }) {
  return <PublicLayout><div className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-4xl font-semibold">{title}</h1><p className="mt-4 text-lg text-muted-foreground">{intro}</p><div className="mt-10 space-y-9">{sections.map((section) => <section key={section.heading}><h2 className="text-xl font-semibold">{section.heading}</h2><p className="mt-2 leading-relaxed text-muted-foreground">{section.body}</p></section>)}</div><Button asChild className="mt-10 rounded-full"><Link to="/search">Browse food</Link></Button></div></PublicLayout>;
}
