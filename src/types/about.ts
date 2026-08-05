// Manually typed — about_page_content postdates the last database.types.ts generation
// (migration 039), same situation as otps/store_settings. Regenerate types and drop
// these once convenient.

export type AboutStat = {
  value: string
  label: string
}

// icon is a key into the fixed lookup map in AboutPageClient.tsx (ICON_MAP) — a plain
// string here rather than a component reference, since it has to round-trip through
// JSON (DB storage, the admin form, the API).
export type AboutValue = {
  icon: string
  title: string
  description: string
}

export type AboutPageContent = {
  id: string

  eyebrow_text: string
  heading_line1: string
  heading_line2: string
  intro_text: string

  narrative_image_url: string
  narrative_heading_line1: string
  narrative_heading_line2: string
  narrative_paragraph1: string
  narrative_paragraph2: string
  stats: AboutStat[]

  values_heading: string
  values_subtitle: string
  values: AboutValue[]

  cta_heading: string
  cta_text: string
  cta_button1_text: string
  cta_button1_link: string
  cta_button2_text: string
  cta_button2_link: string

  updated_at: string
}
