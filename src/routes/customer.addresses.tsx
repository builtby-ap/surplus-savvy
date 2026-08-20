import { createFileRoute } from "@tanstack/react-router";
import { NavShell } from "@/components/layout/nav-shell";
import { VendorRedirect } from "@/components/auth/vendor-guard";
import { AddressBook } from "@/components/account/address-book";


export const Route = createFileRoute("/customer/addresses")({
  head: () => ({
    meta: [
      { title: "Delivery addresses — Phoe La Min" },
      {
        name: "description",
        content: "Add, edit and set a default delivery address for your Phoe La Min orders.",
      },
      { property: "og:title", content: "Delivery addresses — Phoe La Min" },
      {
        property: "og:description",
        content: "Manage the saved delivery addresses used at Phoe La Min checkout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <NavShell
      title="My account"
      subtitle="Your rescues, addresses and delivery details."
      items={[
        { to: "/account", label: "Overview" },
        { to: "/account/orders", label: "Orders" },
        { to: "/account/addresses", label: "Addresses" },
        { to: "/account/settings", label: "Settings" },
      ]}
    >
      <VendorRedirect />
      <AddressBook />
    </NavShell>


  ),
});
