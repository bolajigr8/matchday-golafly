export enum QueryKeys {
  // Flights
  Flight_Search = 'Flight_Search',
  Flight_Offer_Request = 'Flight_Offer_Request',
  Flight_Offer = 'Flight_Offer',
  Flight_Seat_Map = 'Flight_Seat_Map',
  Flight_Places = 'Flight_Places',
  Flight_Classes = 'Flight_Classes',
  Flight_Order_Create = 'Flight_Order_Create',
  Flight_Order = 'Flight_Order',
  Flight_Cancel = 'Flight_Cancel',
  Flight_Cancellation = 'Flight_Cancellation',

  // VIP Hospitality (features/vip)

  // Golafly programs (pre-existing)
  Get_Program_Categories_Landing = 'Get_Program_Categories_Landing',

  // Admin dashboard
  Admin_Me = 'Admin_Me',
  Admin_Offers = 'Admin_Offers',
  Admin_Offer_Categories = 'Admin_Offer_Categories',
  Admin_Programs = 'Admin_Programs',
  Admin_Program_Categories = 'Admin_Program_Categories',
  Admin_Applications = 'Admin_Applications',
  Admin_Partner_Applications = 'Admin_Partner_Applications',
  Admin_Players = 'Admin_Players',
  Admin_Transactions = 'Admin_Transactions',
  Admin_Academies = 'Admin_Academies',
  Admin_Teams = 'Admin_Teams',
  Admin_Program_Subcategories = 'Admin_Program_Subcategories',
  /* A program's spots and its registered players, keyed [key, programId]. */
  Admin_Program_Availability = 'Admin_Program_Availability',
  Admin_Program_Applicants = 'Admin_Program_Applicants',

  /* Scouts and their player assignments — services/scouts.ts. Admin_Scout is
     keyed [Admin_Scout, id] so the detail sheet, the assignments tab and the
     per-row player counts all read one cache entry per scout. */
  Admin_Scouts = 'Admin_Scouts',
  /* Internship applications — services/internships-admin.ts. */
  Admin_Internships = 'Admin_Internships',
  Admin_Scout = 'Admin_Scout',

  /* Golafly API merchants — services/merchants-admin.ts. Admin_Merchant is
     keyed [Admin_Merchant, id]. */
  Admin_Merchants = 'Admin_Merchants',
  Admin_Merchant = 'Admin_Merchant',

  /* Travel products — orders, stays operations, markups, providers.
     Same backend as the rest of the admin; see services/travel-admin.ts. */
  Admin_Travel_Overview = 'Admin_Travel_Overview',
  Admin_Ledgers = 'Admin_Ledgers',
  Admin_Markups = 'Admin_Markups',
  Admin_Markup_Types = 'Admin_Markup_Types',
  Admin_Discounts = 'Admin_Discounts',
  Admin_Match_Promo = 'Admin_Match_Promo',
  Admin_Flight_Promo = 'Admin_Flight_Promo',
  Admin_Esim_Providers = 'Admin_Esim_Providers',
  Admin_Stays_Providers = 'Admin_Stays_Providers',
  Admin_Stays_Orders = 'Admin_Stays_Orders',
  Admin_Etg_Orders = 'Admin_Etg_Orders',
  Admin_Stays_Cancellations = 'Admin_Stays_Cancellations',
  Admin_Flight_Cancellations = 'Admin_Flight_Cancellations',
  Admin_Stays_Booking_Status = 'Admin_Stays_Booking_Status',
  /* Booking resolution: the CS "Action required" queue and a ledger's history. */
  Admin_Action_Required = 'Admin_Action_Required',
  Admin_Ledger_Actions = 'Admin_Ledger_Actions',

  /* Matchday ticket orders — GET /api/v1/matchday/admin/orders.
     Admin_Matchday_Order is keyed [key, orderId]. */
  Admin_Matchday_Orders = 'Admin_Matchday_Orders',
  Admin_Matchday_Order = 'Admin_Matchday_Order',
  /* Filtered, paged admin list [key, filters] and one order's ticket files
     [key, orderId] (Ticket dashboards contract §4). */
  Admin_Matchday_Orders_Search = 'Admin_Matchday_Orders_Search',
  Admin_Matchday_Order_Tickets = 'Admin_Matchday_Order_Tickets',

  // Fan dashboard
  Fan_Ledgers = 'Fan_Ledgers',
  Fan_Ledger = 'Fan_Ledger',
  /* Match ticket orders — features/fan/tickets.ts. */
  Fan_Matchday_Orders = 'Fan_Matchday_Orders',
  Fan_Matchday_Order = 'Fan_Matchday_Order',
  Fan_Matchday_Tickets = 'Fan_Matchday_Tickets',

  // Player dashboard
  Player_Self = 'Player_Self',
  /* The program the signed-in player registered on — features/player/program.ts. */
  Player_Registration = 'Player_Registration',
  /* Public /register/player — features/register-player. */
  Register_Programs = 'Register_Programs',
  Register_Program_Availability = 'Register_Program_Availability',
  Register_Program_Applicants = 'Register_Program_Applicants',

  /* Scouting dashboard — GOL-SCOUT-EPIC-01. None of these endpoints exist
     yet; see design/scout-endpoints.md for the contract they are written
     against. */
  Scout_Dashboard = 'Scout_Dashboard',
  Scout_Assigned_Players = 'Scout_Assigned_Players',
  Scout_Player = 'Scout_Player',
  Scout_Evaluations = 'Scout_Evaluations',
  Scout_Evaluation = 'Scout_Evaluation',
  Scout_Reports = 'Scout_Reports',
  Scout_Report = 'Scout_Report',
  Scout_Comparison = 'Scout_Comparison',
  Scout_Templates = 'Scout_Templates',
  Scout_Template = 'Scout_Template',
  Scout_Conversations = 'Scout_Conversations',
  Scout_Messages = 'Scout_Messages',
  Scout_Notifications = 'Scout_Notifications',
  Scout_Camps = 'Scout_Camps',

  // Stays
  Stays_Region_Autocomplete = 'Stays_Region_Autocomplete',
  Stays_Search_Region = 'Stays_Search_Region',
  Stays_Search_Hotel = 'Stays_Search_Hotel',
  Stays_Prebook = 'Stays_Prebook',
  Stays_Booking_Form = 'Stays_Booking_Form',
  Stays_Checkout = 'Stays_Checkout',
  Stays_Booking_Status = 'Stays_Booking_Status',
  Stays_Cancel = 'Stays_Cancel',

  // eSIM
  Esim_Providers = 'Esim_Providers',
  Esim_Local_Packages = 'Esim_Local_Packages',
  Esim_Global_Packages = 'Esim_Global_Packages',
  Esim_Order_Create = 'Esim_Order_Create',
  Esim_Order = 'Esim_Order',
  Esim_Sim_Packages = 'Esim_Sim_Packages',
  Esim_TopUp_Packages = 'Esim_TopUp_Packages',
  Esim_TopUp_Create = 'Esim_TopUp_Create',

  // Payment / ledger (shared across all real products)
  Payment_Transaction = 'Payment_Transaction',

  // MatchDay tickets (see features/matchday) — Golafly MatchDay API,
  // browsing + checkout. Real endpoints, but the provider has not yet
  // granted production access, so these currently error until they do.
  Matchday_Tournaments = 'Matchday_Tournaments',
  Matchday_Teams = 'Matchday_Teams',
  Matchday_Venues = 'Matchday_Venues',
  Matchday_Events = 'Matchday_Events',
  Matchday_Event = 'Matchday_Event',
  Matchday_Listings = 'Matchday_Listings',
  Matchday_Checkout_Prepare = 'Matchday_Checkout_Prepare',
  Matchday_Checkout_Pay = 'Matchday_Checkout_Pay',
  Matchday_Order_Status = 'Matchday_Order_Status',
  Matchday_Attendees_Submit = 'Matchday_Attendees_Submit',
}

export enum QueryErrCodes {
  ProgramCategoriesLanding = 'ProgramCategoriesLanding',
}
