import { createFileRoute } from "@tanstack/react-router";
import { AddressBook } from "@/components/account/address-book";

export const Route = createFileRoute("/account/addresses")({
  component: AddressBook,
});
