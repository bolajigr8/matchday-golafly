function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set — add it to .env.local`)
  return value
}

export const HubSpotFormGuids = {
  applyFootballTourism: () =>
    getEnv('HUBSPOT_FORM_GUID_APPLY_FOOTBALL_TOURISM'),
  applySportsMarketing: () =>
    getEnv('HUBSPOT_FORM_GUID_APPLY_SPORTS_MARKETING'),
  applyPlayerManagement: () =>
    getEnv('HUBSPOT_FORM_GUID_APPLY_PLAYER_MANAGEMENT'),
  /** Same HubSpot form golafly-main's exit popup submits to. */
  exitIntent: () =>
    process.env.HUBSPOT_FORM_GUID_EXIT_INTENT ||
    '8a16b0a5-5c07-4ae6-93c4-d4fc44d60bb4',
  /* Scouting Camp landing page — the "Scouting Camp - Landing Page" form. */
  scoutingCamp: () =>
    process.env.HUBSPOT_FORM_GUID_SCOUTING_CAMP || '6dd55fa7-d82f-4858-ba6b-3b2e4f69f246',
}
