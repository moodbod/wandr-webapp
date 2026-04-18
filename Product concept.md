AI Build Prompt — Travel Itinerary App for Namibia

Build a mobile-first travel itinerary web app focused primarily on individual travelers, with a light social/group travel layer. The product should help users discover places on a map, save landmarks, build a road-trip itinerary, and organize a trip visually and practically. Group travel exists, but it is secondary. The app should feel personal first.

We are building this in phases, page by page.

Core stack
Frontend: TypeScript
Framework: Next.js or React with TypeScript
Backend + database + auth: Convex
Map: Mapbox
Styling: clean, native-feeling, mobile-first UI
Target: mobile web first, responsive desktop second
Product concept

This is a Namibia-focused travel planning app.

Users can:

explore landmarks and destinations on a map
tap places to view photos, summaries, and travel details
save places they want to visit
build a driving itinerary/trip route
organize stops by day
view trip flow on a map
optionally share a trip or collaborate with others

The app is not a group travel app at its core. It is an individual trip planner with optional collaboration features.

Think:

Apple-native mobile feel
calm, elegant, flat UI
map-first discovery
visual trip planning
road-trip friendly
simple and focused
Product principles
Individual-first
The primary use case is one person planning their own Namibia trip.
Group features are optional and lightweight.
Map-first
The map is the main discovery surface.
Users should feel like they are building a trip spatially, not filling out forms.
Planning should feel visual
Users save places, arrange stops, and see their route.
The experience should feel like placing pieces onto a journey.
Keep the MVP clean
Avoid feature bloat.
Prioritize clarity, speed, and strong UX over complexity.
Mobile-first
Most users will use this on phones.
Design for thumb reach, bottom navigation, large tap targets, clean sheets, and native-feeling transitions.
Main user flow
User opens app
Sees map + featured places
Taps a landmark
Views place details
Saves it to a trip
Creates a trip or adds to existing trip
Builds itinerary day by day
Views trip route on map
Optionally shares or collaborates with friends
Build approach

Build this app in phases, page by page, with clean reusable architecture.

For every phase:

define pages
define components
define Convex schema updates
define queries/mutations/actions
define map interactions
define loading, empty, and error states
define mobile and desktop responsive behavior
keep code production-ready and modular

Do not rush to all features at once. Build only what is needed for the current phase while keeping future phases in mind.

Suggested app structure
Primary pages

no marketing page
Onboarding -Sign in / Sign up
Explore Map
Place Details
Saved Places
Trip List
Trip Details / Itinerary Builder
Day Planner
Route Overview
Profile
Shared Trip / Collaborators
Primary navigation

Mobile bottom nav:

Explore
Saved
Trips
Profile

Desktop:

left sidebar and top nav
map-focused layout for explore and trip pages



Phase plan
Phase 1 — Foundations + Auth + Core App Shell
Goal

Set up the app foundation, Convex backend, auth, shared layout, and navigation.

Build in this phase
Pages

App shell layout
Empty Explore page 
Empty Saved page 
Empty Trips page 


Requirements

Requirements
Convex auth setup
user profile creation on signup
protected routes for authenticated areas
mobile-first navigation
desktop responsive layout
reusable page shell
loading states during auth checks
Convex data model

Create initial schema for:

users
sessions if needed through Convex auth integration
user preferences

Example fields for users:

name
email
avatarUrl
createdAt
onboardingCompleted
homeCountry optional
travelStyle optional
UI requirements
flat clean design
native-feeling spacing
no heavy shadows
soft borders
large readable typography
bottom navigation on mobile
restrained color system
map-friendly visual design language
Deliverables
working auth
app shell
protected routes
clean reusable layout primitives
base design system tokens and components
Phase 2 — Explore Map Page
Goal

Build the core map discovery experience.

Main page
Explore Map page
Features
full-width map with Mapbox
fetch and display destination markers
marker clustering if needed
bottom sheet or side panel for selected location
filter chips
search input
featured place cards below or over map
current region awareness if useful
User interactions
tap marker → preview place card
tap place card → open Place Details page
zoom and pan map smoothly
select filters such as:
nature
wildlife
desert
coast
cultural
food
photography
road-trip stop
Convex data model

Create schema for places:

name
slug
descriptionShort
descriptionLong
coordinates
region
category
tags
heroImage
galleryImages
rating optional
estimatedVisitDuration
bestTimeToVisit
entryFeeInfo optional
openingHours optional
featured boolean
Backend requirements
query for all places
query for filtered places
query for featured places
search places by name/tags/region
UI expectations
map should feel premium and calm
place cards should be elegant and compact
bottom sheet on mobile
split map/content layout on desktop
Deliverables
complete Explore page
real place data structure
map marker interaction
filters and search
navigation into place details
Phase 3 — Place Details Page
Goal

Build a rich place detail page that helps users decide whether to add the place to a trip.

Main page
Place Details
Features
hero image
image gallery
place summary
map mini-view
key info section
tags
best time to visit
visit duration
notes like road accessibility or trip tips
save button
add to trip button
Sections
Overview
Photos
Travel info
Nearby places
Why visit
Suggested time allocation
User actions
save place
add place to trip
share place
open in map
Convex data model additions

Saved places table:

userId
placeId
createdAt

Nearby or related places can be computed from:

same region
nearby coordinates
shared tags/category
Deliverables
polished place details page
save functionality
add-to-trip CTA
related places module
Phase 4 — Saved Places Page
Goal

Let users collect and organize places they want to visit.

Main page
Saved Places
Features
saved places grid/list
sort and filter
remove from saved
quick add to trip
group by region optionally
map preview for saved places
States
empty saved state with CTA back to Explore
list populated state
edit mode optional
Convex requirements
query saved places for current user
mutation to unsave place
mutation to add saved place to trip
Deliverables
functional saved page
seamless add-to-trip flow
empty/loading/error states
Phase 5 — Trip Creation + Trip List Page
Goal

Allow users to create and manage trips.

Main pages
Trip List
Create Trip modal/page
Features
create a trip
trip title
start date optional
end date optional
trip description optional
cover image optional
destination region(s)
trip status:
draft
planned
active
completed
Trip list page
show all user trips
draft and upcoming sections
create new trip CTA
compact trip cards
recent edited trip surfaced first
Convex data model

Trips table:

userId
title
description
coverImage
startDate
endDate
status
createdAt
updatedAt
Deliverables
create trip flow
trip list page
trip card components
trip persistence in Convex
Phase 6 — Trip Details / Itinerary Builder
Goal

Build the core itinerary planning experience.

Main page
Trip Details
Features
trip overview header
map with trip stops
itinerary timeline
day-by-day structure
add place to trip
reorder stops
remove stop
assign stop to day
notes for each stop
travel duration between stops if possible later
UX
mobile: vertical itinerary with map preview
desktop: split layout with itinerary on one side and map on the other
Convex data model

Trip stops table:

tripId
placeId
dayNumber optional
orderIndex
note
plannedArrivalTime optional
plannedDepartureTime optional
createdAt

Trip day table optional:

tripId
dayNumber
title optional
date optional
notes optional
Backend requirements
query trip with all stops
mutation add stop
mutation reorder stops
mutation update day assignment
mutation delete stop
mutation update notes
Deliverables
itinerary builder page
drag/reorder logic or move up/down MVP
day grouping
route map preview
Phase 7 — Day Planner Page
Goal

Let users focus on one day at a time.

Main page
Day Planner
Features
show only one day’s stops
timeline layout
map of that day’s stops
quick notes
optional checklist
morning / afternoon / evening structure if helpful
reorder within day
UX

This should feel light and focused, almost like a daily agenda.

Deliverables
day-specific itinerary page
daily route view
day editing interactions
Phase 8 — Route Overview Page
Goal

Give users a visual overview of the full trip route.

Main page
Route Overview
Features
route drawn on map between stops
total stop count
total days
rough total distance if available
region breakdown
map-fit-to-route
day color grouping if useful
export/share preview later
Notes

If full route optimization is too complex for MVP, use ordered stops and draw route based on stop order. Keep architecture ready for future routing improvements.

Deliverables
route visualization page
ordered stop route rendering
route summary stats
Phase 9 — Lightweight Group / Collaboration Layer
Goal

Add optional shared planning without turning the app into a group-first product.

Main pages
Shared Trip settings
Collaborators sheet/modal
Features
invite collaborator by email or share link
owner role
editor role
viewer role
collaborative editing on trip
shared notes
visible collaborator avatars
Important

This should stay secondary. The product remains personal-first.

Convex data model

Trip collaborators table:

tripId
userId
role
invitedBy
createdAt

Optional trip invites table:

tripId
email
token
status
createdAt
Deliverables
add collaborators
permission-aware trip editing
shared trip view
Phase 10 — Profile + Preferences
Goal

Let users manage account and travel preferences.

Main page
Profile
Features
basic account info
travel style preferences
preferred activities
home location optional
preferred units
saved trip settings
sign out
Preferences examples
wildlife
adventure
scenic drives
photography
culture
food
luxury
budget
Deliverables
profile page
preferences stored in Convex
editable settings


Design direction

The design should feel:

like a polished native iPhone travel app - like the macbook maps app
calm, elegant, minimal
flat, not noisy
highly visual
premium but restrained

Visual rules
no excessive cards everywhere
minimal or no shadows
use spacing and typography for hierarchy
rounded corners, but not cartoonish
soft borders
clean iconography
map remains visually dominant on key pages
bottom sheets for mobile interactions
sticky bottom actions where appropriate
avoid clutter
Typography
large clean headings
readable body text
restrained font scale
emphasis through weight, not loud colors


Component system to build

Create reusable components for:

AppShell
BottomNav
TopBar
SearchBar
FilterChips
PlaceCard
PlaceMarker
MapSheet
SaveButton
AddToTripButton
TripCard
TripStopItem
DaySection
CollaboratorAvatarStack
EmptyState
LoadingSkeleton
ErrorState
SectionHeader
Modal / BottomSheet
RouteMap
Convex architecture expectations

Use Convex cleanly.

Collections / tables likely needed
users
places
savedPlaces
trips
tripStops
tripDays optional
tripCollaborators
tripInvites optional
userPreferences
Backend patterns
keep queries small and composable
use mutations for write flows
ensure auth-aware ownership checks
structure backend so trip ownership and collaboration are enforced
use indexed queries where needed
keep data model simple and extendable
Auth expectations
authenticated user required for saved places and trips
browsing Explore and Place Details may be public if desired
add clear access rules
Mapbox expectations

Use Mapbox as a first-class UX layer, not a decoration.

Required map interactions
render markers for places
focus map on selected place
open bottom sheet on marker selection
draw ordered trip route
fit bounds for route overview
support mobile gestures smoothly
maintain performance with larger datasets
Nice-to-have later
clustering
route optimization
offline-like caching strategy
nearby discovery based on viewport
Responsive behavior
Mobile
primary target
bottom navigation
bottom sheets
stacked layouts
large tap targets
map dominant on explore and route pages
Desktop
more spacious layouts
side panels for details
split-screen map/content patterns
keep the same information architecture, not a totally different app
Code quality expectations
TypeScript throughout
clean modular folder structure
reusable hooks
clear types for all domain entities
clean separation between UI, map logic, and backend calls
avoid overengineering
avoid giant files
handle loading, empty, and error states properly
use production-grade naming and structure
Output format for the AI while building

For each phase, do the following:

explain what will be built in that phase
list pages included
list components included
define Convex schema changes
define queries and mutations
build the page(s)
ensure responsive behavior
include loading/empty/error states
keep future phases in mind without overbuilding
Important product constraint

Do not drift into:

full social network behavior
hotel booking platform
heavy travel agency workflow
overly complex trip optimization in MVP
generic dashboard-heavy UI

This is a beautiful, map-first, itinerary-building app for Namibia, built for individual travelers first, with optional group collaboration.


Start with this execution order

Build in this exact order:

Phase 1 — Foundations + Auth + App Shell
Phase 2 — Explore Map
Phase 3 — Place Details
Phase 4 — Saved Places
Phase 5 — Trip Creation + Trip List
Phase 6 — Trip Details / Itinerary Builder
Phase 7 — Day Planner
Phase 8 — Route Overview
Phase 9 — Collaboration
Phase 10 — Profile + Preferences