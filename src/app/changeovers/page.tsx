import { redirect } from "next/navigation";

import { getDefaultChangeoverSlug } from "@/lib/changeovers";

export default function ChangeoversLandingPage() {
  redirect(`/changeovers/${getDefaultChangeoverSlug()}`);
}
