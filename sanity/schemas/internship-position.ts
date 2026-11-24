import { defineType, defineField, defineArrayMember } from "sanity";

/* One Golafly Internship track. Rendered as a card on /internship and as its
   own page at /internship/[slug]. Field shapes mirror InternshipPosition in
   store/internship.ts. */
export const internshipPosition = defineType({
  name: "internshipPosition",
  title: "Internship Position",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "e.g. Product Management Intern",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The page address: /internship/<slug>",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Position in the list. Shown as 01, 02, 03…",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "isOpen",
      title: "Accepting applications",
      type: "boolean",
      description: "Turn off to hide this position from the site and the apply form.",
      initialValue: true,
    }),
    defineField({
      name: "summary",
      title: "Card summary",
      type: "text",
      rows: 3,
      description: "One or two sentences shown on the position card.",
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      options: { layout: "tags" },
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: "focus",
      title: "Primary focus",
      type: "string",
      description: "Shown under the title on the position page.",
    }),
    defineField({
      name: "overview",
      title: "About the role",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "lists",
      title: "Detail lists",
      description: "Extra sections such as products covered, research questions or duties.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "internshipList",
          fields: [
            defineField({ name: "title", title: "Heading", type: "string", validation: (rule) => rule.required() }),
            defineField({
              name: "style",
              title: "Display as",
              type: "string",
              initialValue: "ticks",
              options: {
                list: [
                  { title: "Checklist", value: "ticks" },
                  { title: "Chips", value: "pills" },
                  { title: "Question cards", value: "questions" },
                ],
                layout: "radio",
              },
            }),
            defineField({
              name: "items",
              title: "Items",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
              validation: (rule) => rule.min(1),
            }),
          ],
          preview: { select: { title: "title", subtitle: "style" } },
        }),
      ],
    }),
    defineField({
      name: "deliverables",
      title: "Typical deliverables",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "challenge",
      title: "Example challenge",
      type: "object",
      fields: [
        defineField({ name: "question", title: "Question", type: "string" }),
        defineField({ name: "output", title: "Expected output", type: "string" }),
      ],
    }),
    defineField({ name: "workMode", title: "Format", type: "string", description: "Default: Project-based" }),
    defineField({ name: "location", title: "Location", type: "string", description: "Default: Remote / hybrid" }),
    defineField({ name: "duration", title: "Duration", type: "string", description: "Default: Set with your university" }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", order: "order", isOpen: "isOpen" },
    prepare: ({ title, order, isOpen }) => ({
      title: `${String(order ?? 0).padStart(2, "0")} · ${title ?? "Untitled"}`,
      subtitle: isOpen === false ? "Closed" : "Open",
    }),
  },
});
