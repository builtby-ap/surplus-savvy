import { createFileRoute, useParams } from "@tanstack/react-router";
import { PublicLayout, PagePlaceholder } from "@/components/layout/public-layout";
import { getBag } from "@/data/mock";

export const Route = createFileRoute("/bag/$bagId")({
  head: () => ({
    meta: [
      { title: "Mystery bag details — Surplus Rescue" },
      { name: "description", content: "See what's inside this surplus mystery bag, its pickup window and how many are left." },
      { property: "og:title", content: "Mystery bag details — Surplus Rescue" },
      { property: "og:description", content: "See what's inside this surplus mystery bag, its pickup window and how many are left." },
    ],
  }),
  component: BagDetail,
});

function BagDetail() {
  const { bagId } = useParams({ from: "/bag/$bagId" });
  const bag = getBag(bagId);
  return (
    <PublicLayout>
      <PagePlaceholder
        title={bag?.title ?? "Mystery bag"}
        description="Bag detail page: gallery, what's inside, pickup window, quantity left and reserve flow."
      />
    </PublicLayout>
  );
}
