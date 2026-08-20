import { createFileRoute, useParams } from "@tanstack/react-router";
import { PublicLayout, PagePlaceholder } from "@/components/layout/public-layout";
import { getBusiness } from "@/data/mock";

export const Route = createFileRoute("/business/$businessId")({
  head: () => ({
    meta: [
      { title: "Business profile — Surplus Rescue" },
      { name: "description", content: "See a local food business, its story, ratings and the surplus bags it has available today." },
      { property: "og:title", content: "Business profile — Surplus Rescue" },
      { property: "og:description", content: "See a local food business, its story, ratings and the surplus bags it has available today." },
    ],
  }),
  component: BusinessProfile,
});

function BusinessProfile() {
  const { businessId } = useParams({ from: "/business/$businessId" });
  const business = getBusiness(businessId);
  return (
    <PublicLayout>
      <PagePlaceholder
        title={business?.name ?? "Business profile"}
        description="Business profile: cover photo, story, opening hours, ratings and its live mystery bags."
      />
    </PublicLayout>
  );
}
