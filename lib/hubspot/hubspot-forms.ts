const HUBSPOT_FORMS_BASE_URL = 'https://api.hsforms.com'

export type HubSpotFormFieldValue = string | number | boolean

export interface HubSpotFormField {
  objectTypeId?: '0-1'
  name: string
  value: HubSpotFormFieldValue
}

export interface HubSpotFormContext {
  hutk?: string
  ipAddress?: string
  pageUri?: string
  pageName?: string
}

/* The portal id and form ids are not secrets (they appear in any embedded
   HubSpot form), so they have defaults and the site works without them in
   the environment. */
function getHubSpotPortalId(): string {
  return process.env.HUBSPOT_PORTAL_ID || '148059871'
}

function getHubSpotFormsAccessToken(): string | undefined {
  return (
    process.env.HUBSPOT_FORMS_ACCESS_TOKEN ||
    process.env.HUBSPOT_ACCESS_TOKEN ||
    undefined
  )
}

async function hubspotFormsRequest(
  url: string,
  init: RequestInit,
  token?: string,
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
}

export function propertiesToFormFields(
  properties: Record<string, unknown>,
): HubSpotFormField[] {
  const fields: HubSpotFormField[] = []
  for (const [name, raw] of Object.entries(properties)) {
    if (raw === undefined || raw === null || raw === '') continue
    const value =
      typeof raw === 'string' ||
      typeof raw === 'number' ||
      typeof raw === 'boolean'
        ? raw
        : JSON.stringify(raw)
    fields.push({ objectTypeId: '0-1', name, value })
  }
  return fields
}

export async function submitHubSpotForm(params: {
  formGuid: string
  fields: HubSpotFormField[]
  context?: HubSpotFormContext
  portalId?: string
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const portalId = params.portalId ?? getHubSpotPortalId()
  /* With a token, the authenticated endpoint; without one, HubSpot's public
     form endpoint, which takes the same submission and needs no key. */
  const token = getHubSpotFormsAccessToken()
  const url = `${HUBSPOT_FORMS_BASE_URL}/submissions/v3/integration/${token ? 'secure/' : ''}submit/${portalId}/${params.formGuid}`

  const response = await hubspotFormsRequest(
    url,
    {
      method: 'POST',
      body: JSON.stringify({ fields: params.fields, context: params.context }),
    },
    token,
  )

  if (response.ok) return { ok: true }
  const text = await response.text().catch(() => '')
  return {
    ok: false,
    status: response.status,
    error: text || 'HubSpot forms submission failed',
  }
}
