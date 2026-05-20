
# RozgarSetu – Social Impact Platform for Workers & Contractors

A mobile-first, accessible web app connecting daily wage workers with contractors. Built with real Indian language translations, large touch-friendly UI, and minimal complexity for rural India users.

## Design System
- **Colors**: White background, Blue (#2563EB) primary, Orange (#F97316) accent
- **Typography**: Large readable fonts (18px+ body), bold headings
- **Components**: Rounded large buttons, card-based layouts, icons paired with every label
- **Spacing**: Generous padding/margins for easy touch targets

---

## Pages

### 1. Splash Screen
- App logo and name "RozgarSetu" with tagline
- Auto-navigates to Language Selection after 2 seconds
- Simple, clean branding screen

### 2. Language Selection Screen
- Grid of 9 language buttons (Hindi, Marathi, Haryanvi, Bhojpuri, Bengali, Punjabi, Tamil, Telugu, English)
- Each shown in its native script (e.g., हिन्दी, मराठी, বাংলা)
- Large, tappable cards with flag/regional icons

### 3. User Type Selection
- Two large illustrated cards: **Worker** (मज़दूर) and **Contractor** (ठेकेदार)
- Icons depicting each role
- All text shown in selected language

### 4. Worker Login (Phone OTP)
- Phone number input with +91 prefix
- Large "Send OTP" button
- 4-digit OTP entry screen
- Minimal fields, large input boxes

### 5. Worker Profile Creation
- Step-by-step simple form (one field per screen):
  - Name
  - Skills (select from icons: Mason, Carpenter, Electrician, Painter, Helper, etc.)
  - Experience (1-5 years range)
  - City/Location
- Progress indicator at top
- Large icon-based skill selection grid

### 6. Worker Dashboard
- Greeting with worker name
- Quick stats cards (Jobs Applied, Active Jobs)
- "Find Jobs" large CTA button
- Recent job listings as cards
- Bottom navigation: Home, Jobs, Profile, Help

### 7. Job Listing Page
- Search/filter by location and skill type
- Card layout for each job showing:
  - Job title, location, daily wage, duration
  - Contractor name
  - "Apply" button
- Simple filter chips at top

### 8. Contractor Login
- Same phone OTP flow as worker login
- Branded for contractor role

### 9. Contractor Dashboard
- Stats: Active Projects, Workers Hired, Pending Requests
- "Create New Project" large CTA
- List of active projects as cards
- Bottom navigation: Home, Projects, Workers, Profile

### 10. Create Project (Step-by-step)
- Multi-step form (one step per screen):
  - Project Name & Type
  - Location
  - Workers Needed (by skill type & count)
  - Daily Wage & Duration
  - Review & Post
- Progress bar, back/next navigation

### 11. Subscription Page
- Two plan cards: Free & Premium
- Feature comparison with checkmark icons
- Large "Subscribe" button
- Simple, clear pricing display

## Internationalization
- Full translation system supporting all 9 languages
- All UI labels, buttons, and messages translated with real text in Hindi, Marathi, Bengali, Tamil, Telugu, Punjabi, Bhojpuri, Haryanvi, and English
- Language persisted and changeable from settings

## Navigation
- Bottom tab bar for main sections (mobile-friendly)
- Back buttons on all inner pages
- Minimal depth – most features 1-2 taps away

## Accessibility
- Minimum 18px font sizes
- High contrast text on white backgrounds
- Every feature has an icon + text label
- Touch targets minimum 48px
