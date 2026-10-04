import { notFound } from "next/navigation";

// Sends every unknown address to the memorial's own "not found" page.
export default function CatchAll() {
  notFound();
}
