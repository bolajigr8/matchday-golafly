/* Seeds the Golafly Internship content into Sanity.

   Creates the six internship positions and the Internship Settings document
   (with the programme brochure PDF uploaded). Documents use fixed IDs and
   createOrReplace, so running it again overwrites the same documents instead
   of duplicating them. Re-running also resets any edits made in the Studio.

   Needs a token with Editor rights: sanity.io/manage → project → API → Tokens.

     SANITY_API_WRITE_TOKEN=sk... npx tsx scripts/seed-internship.ts            */

import { createReadStream } from 'node:fs'
import path from 'node:path'
import { createClient } from '@sanity/client'
import { sanityConfig } from '../sanity/env'
import {
  DEFAULT_PARTNER_EMAIL,
  FALLBACK_POSITIONS,
  POSITION_DEFAULTS,
} from '../store/internship'

const token = process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error(
    'Set SANITY_API_WRITE_TOKEN to a Sanity token with Editor rights.',
  )
  process.exit(1)
}

const client = createClient({ ...sanityConfig, token, useCdn: false })

async function main() {
  const tx = client.transaction()

  for (const p of FALLBACK_POSITIONS) {
    /* IDs must not contain a dot: Sanity treats dotted IDs as private paths,
       invisible to the site's unauthenticated queries. The first seed used
       dotted IDs, so remove those copies if they are still there. */
    tx.delete(`internshipPosition.${p.slug}`)
    tx.createOrReplace({
      _id: `internshipPosition-${p.slug}`,
      _type: 'internshipPosition',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      order: p.order,
      isOpen: true,
      summary: p.summary,
      tags: p.tags,
      focus: p.focus,
      overview: p.overview,
      lists: p.lists.map((l, i) => ({
        _key: `list${i}`,
        _type: 'internshipList',
        ...l,
      })),
      deliverables: p.deliverables,
      challenge: p.challenge,
      workMode: POSITION_DEFAULTS.workMode,
    })
  }

  const pdf = path.join(
    process.cwd(),
    'public/internship/golafly-internship-programme.pdf',
  )
  const asset = await client.assets.upload('file', createReadStream(pdf), {
    filename: 'Golafly-Internship-Programme.pdf',
    contentType: 'application/pdf',
  })

  tx.createOrReplace({
    _id: 'internshipSettings',
    _type: 'internshipSettings',
    brochure: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
    partnerEmail: DEFAULT_PARTNER_EMAIL,
  })

  await tx.commit()
  console.log(
    `Seeded ${FALLBACK_POSITIONS.length} positions and Internship Settings into ${sanityConfig.projectId}/${sanityConfig.dataset}.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
