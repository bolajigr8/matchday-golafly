"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { sanityConfig } from "./sanity/env";

export default defineConfig({
  name: "golafly-matchday-blog",
  title: "Golafly Blog",
  basePath: "/studio",
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
