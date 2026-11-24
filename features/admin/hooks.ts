'use client'

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { QueryKeys } from '@/models/query'
import { Routes } from '@/routes'
import {
  AdminAuthService,
  type AdminLoginRequest,
  type UpdateAdminPasswordRequest,
  type UpdateAdminProfileRequest,
} from '@/services/admin-auth'
import {
  AdminResourcesService,
  type CreateTeamMemberPayload,
} from '@/services/admin-resources'
import { ApplicationsService } from '@/services/applications'
import {
  ProgramsService,
  type ProgramApplicantPayload,
  type UpdateProgramSpotsPayload,
} from '@/services/programs'
import { AcademyService } from '@/services/academy'
import { PlayersService } from '@/services/players'
import { InternshipsAdminService } from '@/services/internships-admin'
import type { AssignedPlayer } from '@/features/scout/evaluation'
import {
  EvaluationAdminService,
  ScoutsService,
  scoutPlayers,
  type ApiScout,
  type CreateScoutPayload,
} from '@/services/scouts'
import * as TravelAdmin from '@/services/travel-admin'
import type { UpdateFlightPromoPayload, UpdateMatchPromoPayload } from '@/features/promo/types'
import { FLIGHT_PROMO_QUERY_KEY } from '@/features/promo/use-flight-promo'
import { MATCH_PROMO_QUERY_KEY } from '@/features/promo/use-match-promo'
import {
  MerchantsAdminService,
  type CreateMerchantPayload,
  type MerchantResponse,
} from '@/services/merchants-admin'
import * as MatchdayAdmin from '@/services/matchday-admin'
import {
  clearAdminSession,
  getAdminToken,
  setAdminSession,
} from '@/features/admin/session'

/* The signed-in admin. Only runs once a token exists, so the login page never
   fires a doomed request. */
export function useAdminMe() {
  return useQuery({
    queryKey: [QueryKeys.Admin_Me],
    queryFn: () => AdminAuthService.me(),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdminLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AdminLoginRequest) => AdminAuthService.login(payload),
    onSuccess: (response, variables) => {
      const { admin, token } = response.data
      setAdminSession(token, {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      })
      queryClient.setQueryData([QueryKeys.Admin_Me], response)
      toast.success('Signed in', { description: variables.email })
      router.replace(Routes.adminDashboard)
    },
    onError: (error: unknown) => {
      /* Surface the backend's own message where there is one — "these
         credentials do not match our records" is far more useful than a
         generic failure, and this dashboard is used by the team that also
         runs the API. */
      const message = extractApiMessage(error)
      toast.error('Could not sign in', { description: message })
    },
  })
}

export function useAdminLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => AdminAuthService.logout(),
    /* The local session is cleared whether or not the API call succeeds — a
       failed logout must never leave someone stuck signed in. */
    onSettled: () => {
      clearAdminSession()
      queryClient.clear()
      router.replace(Routes.adminLogin)
    },
  })
}

/* ── Resource lists ─────────────────────────────────────────────────────────
   All seven share the same shape, so they share one factory. `enabled` is
   gated on the token so a signed-out render never fires a doomed request that
   the interceptor would then try to refresh. */
function useAdminList<T>(key: QueryKeys, queryFn: () => Promise<T>) {
  return useQuery({
    queryKey: [key],
    queryFn,
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
  })
}

export const useAdminPlayers = () =>
  useAdminList(QueryKeys.Admin_Players, PlayersService.getPlayers)

export const useAdminInternships = () =>
  useAdminList(QueryKeys.Admin_Internships, InternshipsAdminService.getInternships)

export function useDeleteInternship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => InternshipsAdminService.deleteInternship(id),
    onSuccess: response => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Internships] })
      toast.success('Application deleted', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export const useAdminTransactions = () =>
  useAdminList(
    QueryKeys.Admin_Transactions,
    AdminResourcesService.getTransactions,
  )

export const useAdminAcademies = () =>
  useAdminList(QueryKeys.Admin_Academies, AcademyService.getAcademies)

export const useAdminPrograms = () =>
  useAdminList(QueryKeys.Admin_Programs, AdminResourcesService.getPrograms)

export const useAdminOffers = () =>
  useAdminList(QueryKeys.Admin_Offers, AdminResourcesService.getOffers)

export const useAdminPartnerApplications = () =>
  useAdminList(
    QueryKeys.Admin_Partner_Applications,
    AdminResourcesService.getPartnerApplications,
  )

export const useAdminOfferCategories = () =>
  useAdminList(
    QueryKeys.Admin_Offer_Categories,
    AdminResourcesService.getOfferCategories,
  )

export const useAdminTeams = () =>
  useAdminList(QueryKeys.Admin_Teams, AdminResourcesService.getTeams)

export function useCreateTeamMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTeamMemberPayload) =>
      AdminResourcesService.createTeamMember(payload),
    onSuccess: (response) => {
      void qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Teams] })
      toast.success(`${response.data?.name ?? 'Member'} added`, {
        description: response.message,
      })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* ── The signed-in admin's own account ────────────────────────────────────
   Both endpoints are PATCH and both return the refreshed admin, so the `me`
   cache is seeded from the response rather than re-fetched — the header and
   the avatar initials update on the spot.

   Profile takes name and email ONLY. `role` is not in the request, which is
   why the form shows it read-only: an editable control there would be a
   promise the endpoint drops. */

export function useUpdateAdminProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAdminProfileRequest) =>
      AdminAuthService.updateProfile(payload),
    onSuccess: (response) => {
      qc.setQueryData([QueryKeys.Admin_Me], response)
      void qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Me] })
      toast.success('Profile saved')
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useUpdateAdminPassword() {
  return useMutation({
    mutationFn: (payload: UpdateAdminPasswordRequest) =>
      AdminAuthService.updatePassword(payload),
    onSuccess: () => toast.success('Password updated'),
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export const useAdminApplications = () =>
  useAdminList(QueryKeys.Admin_Applications, () =>
    ApplicationsService.getApplications(),
  )

/* Program categories are the one admin-adjacent list that is PUBLIC (200 with
   no token), so it does not need the session gate the others do — but keeping
   it on the same factory means the dashboard behaves consistently. */
export const useAdminProgramCategories = () =>
  useAdminList(
    QueryKeys.Admin_Program_Categories,
    ProgramsService.getProgramCategories,
  )

/* Subcategories for ONE category — the other half of the cascade. Keyed on the
   category id so switching category refetches rather than serving the previous
   category's children, and gated on a real id so it never fires with 0. */
export function useAdminProgramSubcategories(categoryId: number | undefined) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Program_Subcategories, categoryId],
    queryFn: () =>
      ProgramsService.getSubcategoriesByCategory(categoryId as number),
    enabled: !!categoryId && categoryId > 0,
  })
}

/* ── Program writes ────────────────────────────────────────────────────
   Multipart, the contract the golafly.com admin creates programs with in
   production (components/dashboard/programs/program-form-sheet.tsx there):
   highlights[] per line, status 1/0, badges and details as JSON strings,
   gallery[] files. Create is POST /v1/program; update is POST
   /v1/program/{id}. */

export function useSaveProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id?: number; formData: FormData }) =>
      id ? ProgramsService.updateProgram(id, formData) : ProgramsService.createProgram(formData),
    onSuccess: (response, { id }) => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Programs] })
      toast.success(id ? 'Program updated' : 'Program created', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useDeleteProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ProgramsService.deleteProgram(id),
    onSuccess: response => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Programs] })
      toast.success('Program deleted', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* ── A program's spots and registered players ─────────────────────────────
   Every write changes the spot counts, so each one refreshes availability
   and the player list of every program it touched — a move touches two —
   plus the programs list, whose Spots column reads the same numbers. */

export function useAdminProgramAvailability(programId: number | null) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Program_Availability, programId],
    queryFn: () => ProgramsService.getProgramAvailability(programId as number),
    enabled:
      programId !== null && typeof window !== 'undefined' && !!getAdminToken(),
    retry: false,
  })
}

export function useAdminProgramApplicants(programId: number | null) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Program_Applicants, programId],
    queryFn: () => ProgramsService.getProgramApplicants(programId as number),
    enabled:
      programId !== null && typeof window !== 'undefined' && !!getAdminToken(),
  })
}

function useRefreshProgramSpots() {
  const qc = useQueryClient()
  return (...programIds: number[]) => {
    for (const id of programIds) {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Program_Availability, id] })
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Program_Applicants, id] })
    }
    qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Programs] })
  }
}

export function useUpdateProgramSpots() {
  const refresh = useRefreshProgramSpots()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProgramSpotsPayload & { id: number }) =>
      ProgramsService.updateProgramSpots(id, payload),
    onSuccess: (response, { id }) => {
      refresh(id)
      toast.success('Spots updated', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useRegisterProgramApplicant() {
  const refresh = useRefreshProgramSpots()
  return useMutation({
    mutationFn: ({
      programId,
      position,
      payload,
    }: {
      programId: number
      position: string
      payload: ProgramApplicantPayload
    }) => ProgramsService.registerProgramApplicant(programId, { position, payload }),
    onSuccess: (response, { programId }) => {
      refresh(programId)
      toast.success('Player registered', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useUpdateProgramApplicant() {
  const refresh = useRefreshProgramSpots()
  return useMutation({
    mutationFn: ({
      applicantId,
      payload,
    }: {
      applicantId: number
      programId: number
      payload: ProgramApplicantPayload
    }) => ProgramsService.updateProgramApplicant(applicantId, payload),
    onSuccess: (response, { programId }) => {
      refresh(programId)
      toast.success('Player updated', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useMoveProgramApplicant() {
  const refresh = useRefreshProgramSpots()
  return useMutation({
    mutationFn: ({
      applicantId,
      toProgramId,
    }: {
      applicantId: number
      fromProgramId: number
      toProgramId: number
    }) => ProgramsService.moveProgramApplicant(applicantId, toProgramId),
    onSuccess: (response, { fromProgramId, toProgramId }) => {
      refresh(fromProgramId, toProgramId)
      toast.success('Player moved', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useDeleteProgramApplicant() {
  const refresh = useRefreshProgramSpots()
  return useMutation({
    mutationFn: ({
      programId,
      applicantId,
    }: {
      programId: number
      applicantId: number
    }) => ProgramsService.deleteProgramApplicant(programId, applicantId),
    onSuccess: (response, { programId }) => {
      refresh(programId)
      toast.success('Player removed', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* The testimonial video. Live writes — one video per program, so uploading
   replaces rather than appends. Both contracts verified end to end against
   production from the Golafly frontend before being wired here. */
export function useUploadProgramTestimonialVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      ProgramsService.uploadProgramTestimonialVideo(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Programs] })
      toast.success('Testimonial video uploaded')
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* The brochure is one PDF on its own endpoint (field `brochure`). Uploading
   again replaces it, so the same call serves "Upload" and "Replace". */
export function useUploadProgramBrochure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData()
      formData.append('brochure', file)
      return ProgramsService.uploadProgramBrochure(id, formData)
    },
    onSuccess: response => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Programs] })
      toast.success('Brochure uploaded', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useDeleteProgramTestimonialVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      ProgramsService.deleteProgramTestimonialVideo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Programs] })
      toast.success('Testimonial video removed')
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* ══════════════════════════════════════════════════════════
   Travel products — orders, stays operations, markups, providers.

   Same backend and same session as everything above; see
   services/travel-admin.ts for why the paths differ by one `/api`.

   These are the only WRITES enabled in the admin. Their payload contracts are
   proven — the travels dashboard has been running them against this exact API.
   Programs/offers/academy writes stay gated until theirs are checked.
   ══════════════════════════════════════════════════════════ */

export const useTravelOverview = () =>
  useAdminList(QueryKeys.Admin_Travel_Overview, TravelAdmin.getTravelOverview)

/* Keyed on type so switching the Orders tab refetches rather than serving the
   previous tab's rows. `undefined` is the "all" tab. */
export function useAdminLedgers(type?: TravelAdmin.LedgerType) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Ledgers, type ?? 'all'],
    queryFn: () => TravelAdmin.listLedgers(type),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
  })
}

/* Matchday ticket orders — GET /v1/matchday/admin/orders. Distinct from
   travel ledgers above: this is seats that sold, not flights/eSIMs/stays. */
export function useAdminMatchdayOrders(page = 1) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Matchday_Orders, page],
    queryFn: () => MatchdayAdmin.listAdminMatchdayOrders({ page, per_page: 100 }),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
  })
}

/* The MatchTickets table: server-side filters + pages. Kept apart from
   useAdminMatchdayOrders (latest 100, used for the summary cards and the
   dashboard) so filtering the table never changes those totals. */
export function useAdminMatchdayOrderSearch(
  params: MatchdayAdmin.ListAdminMatchdayOrdersParams,
) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Matchday_Orders_Search, params],
    queryFn: () => MatchdayAdmin.listAdminMatchdayOrders(params),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
    placeholderData: keepPreviousData,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 422 && status !== 401 && status !== 403 && count < 1
    },
  })
}

/** One order's ticket files + phone links. */
export function useAdminMatchdayOrderTickets(orderId: number | string | null) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Matchday_Order_Tickets, orderId],
    queryFn: () => MatchdayAdmin.getAdminOrderTickets(orderId as number | string),
    enabled:
      orderId !== null &&
      orderId !== '' &&
      typeof window !== 'undefined' &&
      !!getAdminToken(),
    retry: false,
  })
}

export function useAdminMatchdayOrder(orderId: number | string | null) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Matchday_Order, orderId],
    queryFn: () => MatchdayAdmin.getAdminMatchdayOrder(orderId as number | string),
    enabled:
      orderId !== null &&
      orderId !== '' &&
      typeof window !== 'undefined' &&
      !!getAdminToken(),
    retry: false,
  })
}

export const useAdminMarkups = () =>
  useAdminList(QueryKeys.Admin_Markups, TravelAdmin.listMarkups)

export const useAdminDiscounts = () =>
  useAdminList(QueryKeys.Admin_Discounts, TravelAdmin.listDiscounts)

export function useCreateDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TravelAdmin.CreateDiscountPayload) =>
      TravelAdmin.createDiscount(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Discounts] }),
  })
}

export function useUpdateDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: TravelAdmin.UpdateDiscountPayload
    }) => TravelAdmin.updateDiscount(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Discounts] }),
  })
}

export function useDeleteDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TravelAdmin.deleteDiscount(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Discounts] }),
  })
}

export const useAdminMatchPromo = () =>
  useAdminList(QueryKeys.Admin_Match_Promo, TravelAdmin.getMatchPromo)

export function useUpdateMatchPromo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateMatchPromoPayload) => TravelAdmin.updateMatchPromo(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Match_Promo] })
      qc.invalidateQueries({ queryKey: MATCH_PROMO_QUERY_KEY })
    },
  })
}

export const useAdminFlightPromo = () =>
  useAdminList(QueryKeys.Admin_Flight_Promo, TravelAdmin.getFlightPromo)

export function useUpdateFlightPromo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateFlightPromoPayload) => TravelAdmin.updateFlightPromo(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Flight_Promo] })
      qc.invalidateQueries({ queryKey: FLIGHT_PROMO_QUERY_KEY })
    },
  })
}

export const useAdminMarkupTypes = () =>
  useAdminList(QueryKeys.Admin_Markup_Types, TravelAdmin.listMarkupTypes)

export const useAdminMarkupProducts = () =>
  useQuery({
    queryKey: ['Admin_Markup_Products'],
    queryFn: TravelAdmin.listMarkupProducts,
  })

export function useCreateMarkup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: TravelAdmin.CreateMarkupPayload) => TravelAdmin.createMarkup(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Markups] })
      toast.success('Markup created')
    },
  })
}

export function useUpdateMarkup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: TravelAdmin.UpdateMarkupPayload
    }) => TravelAdmin.updateMarkup(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Markups] })
      toast.success('Markup updated')
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export const useAdminEsimProviders = () =>
  useAdminList(QueryKeys.Admin_Esim_Providers, TravelAdmin.listEsimProviders)

export function useToggleEsimProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TravelAdmin.toggleEsimProvider(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: [QueryKeys.Admin_Esim_Providers] })
      const previous = qc.getQueryData([QueryKeys.Admin_Esim_Providers])
      qc.setQueryData(
        [QueryKeys.Admin_Esim_Providers],
        (old: { data?: TravelAdmin.EsimProvider[] } | undefined) =>
          old
            ? {
                ...old,
                data: (old.data ?? []).map((provider) => ({
                  ...provider,
                  enabled: provider.id === id,
                })),
              }
            : old,
      )
      return { previous }
    },
    onError: (error: unknown, _id, context) => {
      if (context?.previous) {
        qc.setQueryData([QueryKeys.Admin_Esim_Providers], context.previous)
      }
      toast.error(extractApiMessage(error))
    },
    onSuccess: (res) => {
      toast.success(`${res.data.name} is now the active eSIM provider`)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Esim_Providers] })
    },
  })
}

export const useAdminStaysProviders = () =>
  useAdminList(QueryKeys.Admin_Stays_Providers, TravelAdmin.listStaysProviders)

/**
 * Contract 5.4 (5): switching one provider on switches the other off; after
 * the switch the list is reloaded from GET /stays-providers. Not optimistic:
 * the radio only moves once the backend has confirmed.
 */
export function useSwitchStaysProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => TravelAdmin.switchStaysProvider(id),
    onError: (error: unknown) => {
      toast.error(extractApiMessage(error))
    },
    onSuccess: (res) => {
      toast.success(`${res.data.name} is now the hotel provider`)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Stays_Providers] })
      // The customer-side read, in case the admin also has the builder open.
      qc.invalidateQueries({ queryKey: ['stays-provider'] })
    },
  })
}

export function useAdminStaysOrders(page = 1) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Stays_Orders, page],
    queryFn: () => TravelAdmin.listStaysOrders(page),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
  })
}

export function useAdminEtgOrders(page = 1) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Etg_Orders, page],
    queryFn: () => TravelAdmin.listEtgOrders(page),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
  })
}

export function useAdminStaysCancellations(page = 1) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Stays_Cancellations, page],
    queryFn: () => TravelAdmin.listStaysCancellations(page),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
  })
}

/* Irreversible and moves real money — the caller must confirm with the refund
   amount named before this fires. */
export function useConfirmStaysCancellation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cancellationId: number) =>
      TravelAdmin.confirmStaysCancellation(cancellationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Stays_Cancellations] })
      toast.success('Cancellation confirmed with the supplier')
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useAdminFlightCancellations() {
  return useQuery({
    queryKey: [QueryKeys.Admin_Flight_Cancellations],
    queryFn: () => TravelAdmin.listFlightCancellations(),
    enabled: typeof window !== 'undefined' && !!getAdminToken(),
  })
}

/* Irreversible and moves real money — the caller must confirm first. */
export function useConfirmFlightCancellation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cancellationId: number) =>
      TravelAdmin.confirmFlightCancellation(cancellationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Flight_Cancellations] })
      toast.success('Flight cancellation confirmed with the airline')
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* Manual lookup, so it only runs once an id has actually been submitted. */
export function useStaysBookingStatus(partnerOrderId: string | null) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Stays_Booking_Status, partnerOrderId],
    queryFn: () => TravelAdmin.getStaysBookingStatus(partnerOrderId as string),
    enabled: !!partnerOrderId,
    retry: false,
  })
}

/* ══════════════════════════════════════════════════════════
   Scouts and their player assignments — services/scouts.ts.

   Six live endpoints, four of them writes. The screen that uses them
   (app/admin/scouts) used to keep all of this in localStorage; these hooks are
   what replaced that.

   Every mutation invalidates BOTH keys. A scout's player list lives on the
   detail record, but the count is rendered from the list screen, so a write
   that refreshed only one of them would leave a stale number on screen next to
   a correct one — which is worse than both being stale.
   ══════════════════════════════════════════════════════════ */

export const useAdminScouts = () =>
  useAdminList(QueryKeys.Admin_Scouts, ScoutsService.getScouts)

/** One scout, with the players they hold. The index does not carry `players`,
 *  so this is the only authoritative source for an assignment list. */
export function useAdminScout(id: string | null | undefined) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Scout, id],
    queryFn: () => ScoutsService.getScoutById(id as string),
    enabled: !!id,
  })
}

/** Player counts for a whole list of scouts, as `Map<scoutId, AssignedPlayer[]>`.
 *
 *  One request per scout, which is an N+1 and is deliberate: the index omits
 *  `players`, admin scouts number in the handful, and a Players column that
 *  reads "—" is a column nobody can act on. The queries share the key shape
 *  useAdminScout uses, so the detail sheet and the assignments tab read these
 *  same cache entries rather than refetching, and one invalidation refreshes
 *  every one of them.
 *
 *  A scout whose row already carries `players` is not fetched — so the day the
 *  backend adds it to the index, these requests stop happening on their own. */
export function useAdminScoutDetails(
  scouts: ApiScout[] | undefined,
): Map<string, AssignedPlayer[]> {
  const list = scouts ?? []

  const results = useQueries({
    queries: list.map((s) => ({
      queryKey: [QueryKeys.Admin_Scout, s.id],
      queryFn: () => ScoutsService.getScoutById(s.id),
      enabled: !s.players,
    })),
    combine: (queries: { data?: { data: ApiScout } }[]) =>
      queries.map((q) => q.data?.data),
  })

  const held = new Map<string, AssignedPlayer[]>()
  list.forEach((s, i) => {
    held.set(s.id, s.players ?? scoutPlayers(results[i]))
  })
  return held
}

/** Invalidates the list and every scout detail. */
function useRefreshScouts() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Scouts] })
    qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Scout] })
  }
}

export function useCreateScout() {
  const refresh = useRefreshScouts()
  return useMutation({
    mutationFn: (payload: CreateScoutPayload) =>
      ScoutsService.createScout(payload),
    onSuccess: (response) => {
      refresh()
      /* The API's own message is worth surfacing: it reports whether the
         welcome email actually went out, which is the difference between a
         scout who can sign in and one who is waiting on support. */
      toast.success(`${response.data.name} added`, {
        description: response.message,
      })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useDeleteScout() {
  const refresh = useRefreshScouts()
  return useMutation({
    mutationFn: (id: string) => ScoutsService.deleteScout(id),
    onSuccess: () => {
      refresh()
      toast.success('Scout removed')
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* Assign and unassign both return the whole scout with a refreshed `players[]`,
   so the detail cache is seeded from the response before the invalidation —
   the sheet you are looking at updates on the spot rather than after a
   round trip. */

export function useAssignPlayer() {
  const qc = useQueryClient()
  const refresh = useRefreshScouts()
  return useMutation({
    mutationFn: ({
      scoutId,
      playerId,
    }: {
      scoutId: string
      playerId: number
    }) => ScoutsService.assignPlayer(scoutId, playerId),
    onSuccess: (response, variables) => {
      qc.setQueryData([QueryKeys.Admin_Scout, variables.scoutId], response)
      refresh()
      toast.success('Player assigned', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export function useUnassignPlayer() {
  const qc = useQueryClient()
  const refresh = useRefreshScouts()
  return useMutation({
    mutationFn: ({
      scoutId,
      playerId,
    }: {
      scoutId: string
      playerId: number
    }) => ScoutsService.unassignPlayer(scoutId, playerId),
    onSuccess: (response, variables) => {
      qc.setQueryData([QueryKeys.Admin_Scout, variables.scoutId], response)
      refresh()
      toast.success('Player unassigned', { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

/* ── The admin's ruling on an evaluation ──────────────────────────────────
   A scout writes the scores (PUT /v1/players/{id}/evaluation, always as
   "pending"); the admin rules on them: Approve, Needs revision, or Reject.

   NO REFRESH NEEDED. Every ruling patches the cached player register the
   moment it is clicked (rolled back if the request fails), then invalidates
   both the register and the scout caches so the server's version replaces
   the optimistic one. The Players screen reads its open sheet from that same
   cache, so the table, the sheet and its buttons all change together. */

type PlayersCache = import('@/services/players').PlayersResponse
type EvaluationPatch = Partial<NonNullable<AssignedPlayer['evaluation']>>

function usePatchCachedEvaluation() {
  const qc = useQueryClient()
  return (playerId: number, patch: EvaluationPatch) => {
    const previous = qc.getQueriesData<PlayersCache>({
      queryKey: [QueryKeys.Admin_Players],
    })
    qc.setQueriesData<PlayersCache>(
      { queryKey: [QueryKeys.Admin_Players] },
      (old) =>
        old
          ? {
              ...old,
              data: old.data.map((p) =>
                p.id === playerId && p.evaluation
                  ? { ...p, evaluation: { ...p.evaluation, ...patch } }
                  : p,
              ),
            }
          : old,
    )
    return () => previous.forEach(([key, data]) => qc.setQueryData(key, data))
  }
}

function useRefreshEvaluations() {
  const qc = useQueryClient()
  const refreshScouts = useRefreshScouts()
  return () => {
    refreshScouts()
    qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Players] })
  }
}

const RULING_TOAST: Record<string, string> = {
  approved: 'Evaluation approved',
  rejected: 'Evaluation rejected',
  pending: 'Evaluation moved back to pending',
}

export function useUpdateEvaluationStatus() {
  const patch = usePatchCachedEvaluation()
  const refresh = useRefreshEvaluations()
  return useMutation({
    mutationFn: ({ playerId, status }: { playerId: number; status: string }) =>
      EvaluationAdminService.updateStatus(playerId, status),
    onMutate: ({ playerId, status }) => ({
      rollback: patch(playerId, { status }),
    }),
    onSuccess: (response, { status }) =>
      toast.success(RULING_TOAST[status] ?? 'Evaluation updated', {
        description: response.message,
      }),
    onError: (error: unknown, _vars, context) => {
      context?.rollback()
      toast.error(extractApiMessage(error))
    },
    onSettled: () => refresh(),
  })
}

/** Needs revision: send the evaluation back to the scout with a note saying
 *  what to change.
 *
 *  Tries status "needs_revision" first. If the API refuses the value (400 or
 *  422), it falls back to "pending" — the scout can still edit, and the note
 *  still shows at the top of their evaluation — and the toast says so, so the
 *  gap is visible rather than silently papered over. */
export function useRequestEvaluationChanges() {
  const patch = usePatchCachedEvaluation()
  const refresh = useRefreshEvaluations()
  return useMutation({
    mutationFn: async ({
      playerId,
      note,
    }: {
      playerId: number
      note: string
    }) => {
      let status = 'needs_revision'
      try {
        await EvaluationAdminService.updateStatus(playerId, status)
      } catch (error) {
        const code = (error as { response?: { status?: number } })?.response
          ?.status
        if (code !== 422 && code !== 400) throw error
        status = 'pending'
        await EvaluationAdminService.updateStatus(playerId, status)
      }
      await EvaluationAdminService.updateNote(playerId, note)
      return { status }
    },
    onMutate: ({ playerId, note }) => ({
      rollback: patch(playerId, { status: 'needs_revision', note }),
    }),
    onSuccess: ({ status }, { playerId, note }) => {
      if (status === 'needs_revision') {
        toast.success('Sent back for revision', {
          description: 'The scout sees your note at the top of the evaluation.',
        })
        return
      }
      patch(playerId, { status, note })
      toast.success('Sent back to the scout', {
        description:
          'The API does not accept a "needs_revision" status yet, so it is Pending with your note attached. The scout can edit it and sees your note.',
      })
    },
    onError: (error: unknown, _vars, context) => {
      context?.rollback()
      toast.error(extractApiMessage(error))
    },
    onSettled: () => refresh(),
  })
}

export function useUpdateEvaluationNote() {
  const patch = usePatchCachedEvaluation()
  const refresh = useRefreshEvaluations()
  return useMutation({
    mutationFn: ({ playerId, note }: { playerId: number; note: string }) =>
      EvaluationAdminService.updateNote(playerId, note),
    onMutate: ({ playerId, note }) => ({ rollback: patch(playerId, { note }) }),
    onSuccess: () => toast.success('Note saved'),
    onError: (error: unknown, _vars, context) => {
      context?.rollback()
      toast.error(extractApiMessage(error))
    },
    onSettled: () => refresh(),
  })
}

/* ══════════════════════════════════════════════════════════
   Golafly API merchants — services/merchants-admin.ts.

   Approve, disable and create all answer with the whole merchant, so the
   detail cache is seeded from the response and the list is invalidated: the
   open sheet flips its status on the spot, the table catches up after.
   ══════════════════════════════════════════════════════════ */

export const useAdminMerchants = () =>
  useAdminList(QueryKeys.Admin_Merchants, MerchantsAdminService.getMerchants)

export function useAdminMerchant(id: number | null | undefined) {
  return useQuery({
    queryKey: [QueryKeys.Admin_Merchant, id],
    queryFn: () => MerchantsAdminService.getMerchantById(id as number),
    enabled: id != null,
  })
}

function useMerchantWrite<T>(
  fn: (input: T) => Promise<MerchantResponse>,
  success: (response: MerchantResponse) => string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: response => {
      qc.setQueryData([QueryKeys.Admin_Merchant, response.data.id], response)
      qc.invalidateQueries({ queryKey: [QueryKeys.Admin_Merchants] })
      toast.success(success(response), { description: response.message })
    },
    onError: (error: unknown) => toast.error(extractApiMessage(error)),
  })
}

export const useCreateMerchant = () =>
  useMerchantWrite(
    (payload: CreateMerchantPayload) => MerchantsAdminService.createMerchant(payload),
    r => `${r.data.business_name} added`,
  )

export const useApproveMerchant = () =>
  useMerchantWrite(
    (id: number) => MerchantsAdminService.approveMerchant(id),
    r => `${r.data.business_name} approved`,
  )

export const useDisableMerchant = () =>
  useMerchantWrite(
    (id: number) => MerchantsAdminService.disableMerchant(id),
    r => `${r.data.business_name} disabled`,
  )

export function extractApiMessage(error: unknown): string {
  const response = (error as { response?: { data?: { message?: string } } })
    ?.response
  return (
    response?.data?.message ??
    (error as { message?: string })?.message ??
    'Something went wrong.'
  )
}
