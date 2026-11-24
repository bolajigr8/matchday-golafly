import { PROGRAM_POSITIONS, type ProgramAvailability } from '@/services/programs'

/* The /register/player form's state and fixed option lists. Mirrors the
   golafly.com form (components/register/types.ts there) so both sites send
   the backend the same values. */

export type Errors = Record<string, string>

export type Personal = {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string // YYYY-MM-DD from <input type="date">
  gender: string
  nationality: string
  nationalityCode: string // alpha3, for the dropdown's defaultValue
  countryOfResidence: string
  countryOfResidenceCode: string
  countryOfResidenceAlpha2: string // drives the phone fields' dial code
  passportNumber: string
  city: string
  address: string
  languages: string[]
}

export type Football = {
  programId: string
  primaryPosition: string // position code
  secondaryPosition: string // position code
  preferredFoot: string
  jerseyNumber: string
  height: string
  weight: string
  currentClub: string
  level: string
  playerStatus: string
  goals: string[]
}

export type Achievement = { title: string; year: string }

export type Performance = {
  topSpeed: string
  strength: string
  stamina: string
  agility: string
  attributes: Record<string, string>
  season: string
  appearances: string
  goals: string
  assists: string
  cleanSheets: string
  minutesPlayed: string
  yellowCards: string
  redCards: string
  achievements: Achievement[]
}

export type Documents = {
  profilePhoto: File | null
  passportDocument: File | null
  medicalCertificate: File | null
}

export type Contact = {
  ecName: string
  ecRelationship: string
  ecPhone: string
  ecEmail: string
  guardianName: string
  guardianPhone: string
  agentName: string
  agentPhone: string
  agentEmail: string
  notes: string
}

export const STEPS = ['Personal', 'Football', 'Performance', 'Documents', 'Contact']
export const TOTAL_STEPS = STEPS.length

export const POSITIONS = PROGRAM_POSITIONS
export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
export const FEET = ['Right', 'Left', 'Both']
export const LEVELS = ['Grassroots', 'Youth Academy', 'Semi-Professional', 'Professional', 'International']
export const PLAYER_STATUSES = [
  'Available for Trials', 'Open to Opportunities', 'Under Contract', 'Free Agent', 'Not Available',
]
export const GOALS = [
  'Join a club abroad', 'Scout trials', 'Football tourism', 'Professional contract', 'Academy programme',
]
export const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Italian', 'German', 'Arabic', 'Dutch']
export const ATTRIBUTES = [
  'Pace', 'Defending', 'Passing', 'Crossing', 'Dribbling',
  'Vision', 'Positioning', 'Tackling', 'Shooting', 'Stamina',
]
export const RELATIONSHIPS = ['Parent / Guardian', 'Sibling', 'Spouse / Partner', 'Agent / Manager', 'Other']

/* Spots left for a position, or null when the program sets no per-position
   limit. Once the admin gives any position spots, a code that isn't listed
   has none. */
export function positionSpotsLeft(
  availability: ProgramAvailability | undefined,
  code: string,
): number | null {
  if (!availability?.positions?.length) return null
  return availability.positions.find(p => p.code === code)?.spot_left ?? 0
}
