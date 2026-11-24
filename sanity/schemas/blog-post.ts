import { defineType, defineField, defineArrayMember } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "section",
      title: "Section",
      type: "string",
      description: "Which blog this post belongs to.",
      options: {
        list: [
          { title: "Matchday", value: "matchday" },
          { title: "Travel", value: "travel" },
        ],
        layout: "radio",
      },
      initialValue: "matchday",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "blogCategory" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Short Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      description:
        "Overrides the browser/tab title. Falls back to the post title when empty.",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      description:
        "Overrides the search/social description. Falls back to the featured caption, then the first intro paragraph.",
    }),
    defineField({
      name: "date",
      title: "Publish Date",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      initialValue: "Golafly Team",
    }),
    defineField({
      name: "readTime",
      title: "Read Time",
      type: "string",
      description: 'e.g. "6 min read"',
    }),
    defineField({
      name: "image",
      title: "Card Image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroImage",
      title: "Hero Background Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "featuredImage",
      title: "Featured Article Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "featuredCaption",
      title: "Featured Image Caption",
      type: "string",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "blogTag" }],
        }),
      ],
    }),
    defineField({
      name: "featured",
      title: "Featured Post",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "likes",
      title: "Likes",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "comments",
      title: "Comments Count",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "intro",
      title: "Introduction Paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "text" })],
    }),
    defineField({
      name: "sections",
      title: "Article Sections",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "articleSection",
          title: "Text Section",
          fields: [
            defineField({ name: "heading", title: "Heading", type: "string" }),
            defineField({
              name: "paragraphs",
              title: "Paragraphs",
              type: "array",
              of: [defineArrayMember({ type: "text" })],
            }),
            defineField({
              name: "image",
              title: "Section Image",
              type: "image",
              options: { hotspot: true },
            }),
          ],
        }),
        defineArrayMember({
          type: "object",
          name: "videoBlock",
          title: "Video",
          fields: [
            defineField({
              name: "videoFile",
              title: "Video File",
              type: "file",
              options: { accept: "video/*" },
            }),
            defineField({
              name: "videoUrl",
              title: "Video URL (YouTube / Vimeo)",
              type: "url",
              description: "Paste a YouTube or Vimeo URL. Used when no file is uploaded.",
            }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        }),
        defineArrayMember({
          type: "object",
          name: "quoteBlock",
          title: "Quote",
          fields: [
            defineField({
              name: "quote",
              title: "Quote Text",
              type: "text",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "author", title: "Author", type: "string" }),
            defineField({ name: "role", title: "Role / Title", type: "string" }),
          ],
        }),
        defineArrayMember({
          type: "object",
          name: "calloutBlock",
          title: "Callout",
          fields: [
            defineField({
              name: "calloutType",
              title: "Type",
              type: "string",
              options: {
                list: [
                  { title: "Info", value: "info" },
                  { title: "Warning", value: "warning" },
                  { title: "Tip", value: "tip" },
                  { title: "Note", value: "note" },
                ],
              },
              initialValue: "info",
            }),
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({
              name: "body",
              title: "Body",
              type: "text",
              validation: (rule) => rule.required(),
            }),
          ],
        }),
        defineArrayMember({
          type: "object",
          name: "testimonialBlock",
          title: "Testimonial",
          fields: [
            defineField({
              name: "quote",
              title: "Quote",
              type: "text",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "authorName",
              title: "Author Name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "role", title: "Role", type: "string" }),
            defineField({
              name: "avatar",
              title: "Avatar",
              type: "image",
              options: { hotspot: true },
            }),
          ],
        }),
        defineArrayMember({
          type: "object",
          name: "ctaBlock",
          title: "Call to Action",
          fields: [
            defineField({
              name: "heading",
              title: "Heading",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "description", title: "Description", type: "text" }),
            defineField({
              name: "buttonText",
              title: "Button Text",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "buttonLink",
              title: "Button Link",
              type: "url",
              validation: (rule) => rule.uri({ allowRelative: true, scheme: ["http", "https"] }),
            }),
            defineField({
              name: "backgroundImage",
              title: "Background Image",
              type: "image",
              options: { hotspot: true },
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "section", media: "image" },
  },
  orderings: [
    {
      title: "Publish Date (Newest)",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
  ],
});
