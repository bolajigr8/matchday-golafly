import { defineType, defineField } from "sanity";

/* Page-wide settings for /internship. Only the most recently updated document
   is read, so keep a single one. Without it the site falls back to the PDF in
   public/internship and contact@golafly.com. */
export const internshipSettings = defineType({
  name: "internshipSettings",
  title: "Internship Settings",
  type: "document",
  fields: [
    defineField({
      name: "brochure",
      title: "Programme brochure (PDF)",
      type: "file",
      options: { accept: "application/pdf" },
    }),
    defineField({
      name: "partnerEmail",
      title: "University partnership email",
      type: "string",
      validation: (rule) => rule.email(),
    }),
  ],
  preview: { prepare: () => ({ title: "Internship Settings" }) },
});
