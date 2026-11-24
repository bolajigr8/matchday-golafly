import type { Metadata } from "next";
import PartnerApplicationsClient from "./client";

export const metadata: Metadata = {
  title: "Partner applications | Golafly Admin",
  description: "Review and decide on scouting partner, academy and agency applications.",
};

export default function AdminPartnerApplicationsPage() {
  return <PartnerApplicationsClient />;
}
