import type { Metadata } from "next";
import TransactionsClient from "./client";

export const metadata: Metadata = {
  title: "Transactions | Golafly Admin",
  description: "Payments across academies, programs and offers.",
};

export default function AdminTransactionsPage() {
  return <TransactionsClient />;
}
