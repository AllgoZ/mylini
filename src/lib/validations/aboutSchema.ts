import { z } from 'zod'

const statSchema = z.object({
  value: z.string().min(1).max(20),
  label: z.string().min(1).max(50),
})

const valueSchema = z.object({
  icon: z.string().min(1).max(30),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})

export const updateAboutContentSchema = z.object({
  eyebrow_text: z.string().max(200).optional(),
  heading_line1: z.string().max(200).optional(),
  heading_line2: z.string().max(200).optional(),
  intro_text: z.string().max(1000).optional(),

  narrative_image_url: z.string().max(1000).optional(),
  narrative_heading_line1: z.string().max(200).optional(),
  narrative_heading_line2: z.string().max(200).optional(),
  narrative_paragraph1: z.string().max(2000).optional(),
  narrative_paragraph2: z.string().max(2000).optional(),
  // Fixed at exactly 3 — the layout is a hardcoded 3-column grid, so the count isn't
  // admin-editable, only the content of each slot.
  stats: z.array(statSchema).length(3).optional(),

  values_heading: z.string().max(200).optional(),
  values_subtitle: z.string().max(500).optional(),
  // Variable length (add/remove in the admin UI) — the grid wraps naturally at any
  // count, capped to keep the page from growing unbounded.
  values: z.array(valueSchema).min(1).max(8).optional(),

  cta_heading: z.string().max(200).optional(),
  cta_text: z.string().max(1000).optional(),
  cta_button1_text: z.string().max(50).optional(),
  cta_button1_link: z.string().max(500).optional(),
  cta_button2_text: z.string().max(50).optional(),
  cta_button2_link: z.string().max(500).optional(),
})

export type UpdateAboutContentInput = z.infer<typeof updateAboutContentSchema>
