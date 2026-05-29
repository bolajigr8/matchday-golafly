import { z } from "zod";

export const flightSearchSchema = z.object({
  origin:         z.string().min(3, "Enter at least 3 characters"),
  destination:    z.string().min(3, "Enter at least 3 characters"),
  departure_date: z.string().min(1, "Select a departure date"),
  return_date:    z.string().optional(),
  adults:         z.coerce.number().min(1).max(9),
  cabin_class:    z.enum(["economy", "premium_economy", "business", "first"]),
});

export type FlightSearchValues = z.infer<typeof flightSearchSchema>;
