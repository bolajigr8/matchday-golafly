/* Sanity connection config. Reads NEXT_PUBLIC_SANITY_* env vars, falling
   back to the shared Golafly blog project so the blog works out of the box.
   The dataset is public-read, so no API token is required. */
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "sngce5kj",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};
