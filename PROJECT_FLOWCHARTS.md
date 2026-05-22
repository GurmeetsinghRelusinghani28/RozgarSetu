# RozgarSetu Project Flowcharts & Architecture

This document summarizes the full RozgarSetu platform architecture, database schema, and major feature flows.

## 1. System Architecture

```mermaid
flowchart TB
  subgraph Clients
    Web[Frontend Web App<br/>React + Vite + Tailwind]
    WorkerApp[Worker Mobile App<br/>Expo React Native]
  end

  subgraph Backend[Node.js Backend]
    Express[Express Server]
    Auth[Auth Routes<br/>OTP / Login / JWT]
    Projects[Project Routes<br/>Jobs / Applications]
    Worker[Worker Routes<br/>Profile / Dashboard]
    AI[AI Routes<br/>Profile Parser / Project Parser / Rozgar Mitra]
    Chat[Chat Routes + Socket.IO]
    Ratings[Rating Routes]
  end

  subgraph Services
    Groq[Groq API<br/>LLM + Whisper Speech-to-Text]
    Twilio[Twilio Verify<br/>OTP]
  end

  subgraph DB[MongoDB Atlas]
    Users[(Users)]
    WorkerProfiles[(WorkerProfiles)]
    ProjectsDB[(Projects)]
    Applications[(JobApplications)]
    Messages[(Messages)]
    Reviews[(Ratings)]
  end

  Web --> Express
  WorkerApp --> Express
  WorkerApp --> Chat
  Web --> Chat

  Express --> Auth
  Express --> Projects
  Express --> Worker
  Express --> AI
  Express --> Chat
  Express --> Ratings

  Auth --> Twilio
  AI --> Groq

  Auth --> Users
  Projects --> ProjectsDB
  Projects --> Applications
  Worker --> WorkerProfiles
  Worker --> ProjectsDB
  Chat --> Messages
  Ratings --> Reviews
  Ratings --> WorkerProfiles
```

## 2. Database Schema Design

```mermaid
erDiagram
  USER {
    ObjectId _id
    string name
    string phone
    string role "worker | contractor"
    string email
    string company
    string location
    number established
    number projectsCompleted
    number rating
    number reviewCount
    boolean isVerified
    date createdAt
    date updatedAt
  }

  WORKER_PROFILE {
    ObjectId _id
    ObjectId userId
    string role
    string name
    string[] skills
    number experience
    string city
    ObjectId[] savedJobs
    ObjectId[] appliedJobs
    review[] reviews
    date createdAt
    date updatedAt
  }

  PROJECT {
    ObjectId _id
    ObjectId contractorId
    string projectTitle
    string location
    date startDate
    string skillType
    string subSkill
    number workerCount
    number wage
    boolean facilities_food
    boolean facilities_accommodation
    boolean facilities_insurance
    boolean facilities_pf
    string description
    string[] images
    string status "OPEN | FILLED | IN_PROGRESS | COMPLETED"
    date createdAt
    date updatedAt
  }

  JOB_APPLICATION {
    ObjectId _id
    ObjectId jobId
    ObjectId workerId
    string status "PENDING | ACCEPTED | REJECTED | APPROVED"
    date createdAt
    date updatedAt
  }

  MESSAGE {
    ObjectId _id
    ObjectId senderId
    ObjectId receiverId
    ObjectId jobId
    string message
    date createdAt
    date updatedAt
  }

  RATING {
    ObjectId _id
    ObjectId fromUserId
    ObjectId toUserId
    ObjectId jobId
    number rating
    string review
    date createdAt
    date updatedAt
  }

  USER ||--o| WORKER_PROFILE : "worker owns"
  USER ||--o{ PROJECT : "contractor posts"
  PROJECT ||--o{ JOB_APPLICATION : "receives"
  USER ||--o{ JOB_APPLICATION : "worker applies"
  PROJECT ||--o{ MESSAGE : "chat room"
  USER ||--o{ MESSAGE : "sends/receives"
  USER ||--o{ RATING : "gives/receives"
  PROJECT ||--o{ RATING : "rated after job"
  WORKER_PROFILE }o--o{ PROJECT : "saved/applied refs"
```

## 3. User Roles And Main Features

```mermaid
flowchart LR
  Start([User opens app]) --> Language[Select language]
  Language --> Login[Phone login / OTP]
  Login --> Role{Role}

  Role --> Worker[Worker]
  Role --> Contractor[Contractor]

  Worker --> WorkerProfile[Create worker profile]
  WorkerProfile --> VoiceProfile[AI voice/text profile autofill]
  Worker --> JobSearch[Browse/search jobs]
  Worker --> RozgarMitra[Rozgar Mitra chatbot]
  Worker --> Apply[Apply / Save / Reject jobs]
  Worker --> WorkerChat[Chat after accepted]
  Worker --> Earnings[Earnings tracker]
  Worker --> SkillTips[Skill tips]
  Worker --> Help[Help center]

  Contractor --> ContractorProfile[Contractor profile]
  Contractor --> CreateProject[Create project/job]
  CreateProject --> ProjectVoice[AI voice/text job autofill]
  Contractor --> ManageProjects[Manage projects]
  Contractor --> Applicants[View applicants]
  Applicants --> Ranker[AI Candidate Ranker & Fit Analyzer]
  Contractor --> WorkerSearch[Browse workers]
  Contractor --> ContractorChat[Chat with workers]
  Contractor --> Rating[Rate worker]
```

## 4. Worker Job Discovery Flow

```mermaid
flowchart TD
  Worker[Worker] --> Dashboard[Worker Dashboard]
  Dashboard --> Jobs[Jobs Screen]
  Jobs --> Search[Search by text / skill / location]
  Search --> API[GET /api/projects]
  API --> Mongo[(Projects Collection)]
  Mongo --> Results[Open matching jobs]
  Results --> Cards[Job cards with wage, location, facilities]
  Cards --> Decision{Worker action}
  Decision --> Apply[Apply]
  Decision --> Save[Save job]
  Decision --> Reject[Reject job]
  Apply --> Application[JobApplication: PENDING]
  Save --> WorkerProfile[WorkerProfile.savedJobs]
  Reject --> Rejected[JobApplication: REJECTED]
```

## 5. Contractor Project Creation Flow

```mermaid
flowchart TD
  Contractor[Contractor] --> Create[Create Project]
  Create --> InputMode{Input mode}
  InputMode --> Manual[Manual form]
  InputMode --> Voice[Voice/text AI assistant]
  Voice --> GroqSTT[Groq Whisper transcription]
  Voice --> GroqLLM[Groq LLM extracts project fields]
  GroqLLM --> Autofill[Autofill title, location, skill, wage, facilities]
  Manual --> Review[Review details]
  Autofill --> Review
  Review --> Submit[POST /api/projects/create]
  Submit --> Project[(Project saved)]
  Project --> Open[Status: OPEN]
```

## 6. Worker AI Profile Autofill Flow

```mermaid
sequenceDiagram
  participant Worker
  participant App as WorkerApp/Profile UI
  participant API as /api/ai/parse-profile
  participant Groq as Groq AI
  participant Form as Profile Form

  Worker->>App: Speaks/types profile details
  App->>API: Submit text or audio
  API->>Groq: Transcribe audio if needed
  API->>Groq: Extract name/city/skills/experience
  Groq-->>API: Structured JSON
  API-->>App: profile JSON
  App->>Form: Autofill profile fields
```

## 7. Rozgar Mitra RAG Chatbot Flow

```mermaid
flowchart TD
  User[Worker or contractor query] --> QueryType{Text or voice}
  QueryType --> Text[Text query]
  QueryType --> Audio[Voice recording]
  Audio --> STT[Groq Whisper speech-to-text]
  STT --> Extract
  Text --> Extract[Groq/Llama filter extraction]

  Extract --> Filters[Structured filters<br/>location, skills, facilities, minWage]
  Filters --> Retrieve[Retrieve matching projects from MongoDB]
  Retrieve --> Jobs[(Matching jobs)]
  Jobs --> RAG[Pass user query + jobs to LLM]
  RAG --> Reply[Short multilingual response]
  Reply --> ChatUI[Chat bubbles + job cards + Apply buttons]
```

Example query:

```text
मुझे गाजियाबाद में पेंटर का काम चाहिए जिसमें भोजन भी मिले
```

Extracted filters:

```json
{
  "location": "Ghaziabad",
  "skills": ["painter"],
  "facilities": {
    "food": true
  }
}
```

## 8. Candidate Ranker & Fit Analyzer Flow

```mermaid
flowchart TD
  Contractor[Contractor opens applicants] --> API[GET /api/projects/:id/applicants]
  API --> Project[(Project requirement)]
  API --> Applications[(JobApplications)]
  Applications --> Profiles[(WorkerProfiles + Users)]
  Profiles --> Scoring[Suitability scoring]

  Scoring --> Skill[Skill match: 40%]
  Scoring --> Rating[Rating/reviews: 25%]
  Scoring --> Experience[Experience: 20%]
  Scoring --> Proximity[Location proximity: 15%]

  Skill --> Score[Score out of 100]
  Rating --> Score
  Experience --> Score
  Proximity --> Score

  Score --> Summary[AI-style fit summary bullets]
  Summary --> Sort[Sort highest to lowest]
  Sort --> UI[Applicant cards with score badge + Top Match highlight]
```

## 9. Real-Time Chat Flow

```mermaid
sequenceDiagram
  participant Worker
  participant WorkerUI
  participant Socket as Socket.IO
  participant Backend
  participant Mongo as Messages
  participant ContractorUI
  participant Contractor

  Worker->>WorkerUI: Opens accepted job chat
  WorkerUI->>Socket: join_room(jobId)
  ContractorUI->>Socket: join_room(jobId)
  Worker->>WorkerUI: Sends message
  WorkerUI->>Socket: send_message
  Socket->>Backend: Persist message
  Backend->>Mongo: Save Message
  Socket-->>ContractorUI: receive_message
  ContractorUI-->>Contractor: Shows message
```

## 10. Rating And Review Flow

```mermaid
flowchart TD
  Completed[Job completed or worker accepted] --> ContractorReview[Contractor submits rating]
  ContractorReview --> API[POST /api/ratings]
  API --> Rating[(Rating collection)]
  API --> WorkerProfile[WorkerProfile.reviews]
  API --> UserRating[Update User rating/reviewCount]
  UserRating --> Ranker[Improves future candidate ranking]
```

## 11. API Surface Summary

```mermaid
flowchart LR
  API[Express API] --> Auth[/api/auth]
  API --> Projects[/api/projects]
  API --> Worker[/api/worker]
  API --> Chat[/api/chat]
  API --> Ratings[/api/ratings]
  API --> AI[/api/ai]

  AI --> ProfileAI[parse-profile-text/audio]
  AI --> ProjectAI[parse-project-text/audio]
  AI --> Mitra[rozgar-mitra]

  Projects --> Create[create]
  Projects --> Search[list/search]
  Projects --> Apply[apply/reject]
  Projects --> Applicants[applicants + ranker]
  Projects --> Status[status updates]
```

## 12. Feature Summary

| Area | Feature | Main Files |
| --- | --- | --- |
| Auth | Phone OTP login, JWT auth, role selection | `authRoutes`, `authController`, `authMiddleware` |
| Worker Profile | Manual profile + AI voice/text autofill | `ProfileSetupScreen`, `WorkerProfile.tsx`, `aiController` |
| Job Search | Search by skill/location/text, save/apply/reject jobs | `JobsScreen`, `JobListing`, `projectController` |
| Contractor Projects | Create/manage jobs with images, facilities, wage | `CreateProject`, `ContractorProjects`, `Project` model |
| AI Job Autofill | Contractor speaks job requirement and form auto-fills | `CreateProject`, `parse-project-audio/text` |
| Rozgar Mitra | Multilingual RAG chatbot for job discovery | `aiChatController`, `RozgarMitraScreen`, `RozgarMitra.tsx` |
| Candidate Ranker | Suitability score, top match, AI fit bullets | `projectController`, `ContractorProjectApplicants` |
| Chat | Real-time worker/contractor messaging | `ChatScreen`, `chatRoutes`, `Message`, Socket.IO |
| Ratings | Contractor reviews worker, improves ranking | `ratingRoutes`, `Rating`, `WorkerProfile.reviews` |
| Worker Support | Earnings, skill tips, help center | `EarningsScreen`, `SkillTipsScreen`, `HelpScreen` |

## 13. Deployment-Level View

```mermaid
flowchart TB
  subgraph Devices
    Browser[Web Browser]
    Mobile[Android/iOS Worker App]
  end

  Browser --> Vite[Static React Web Build]
  Mobile --> Expo[Expo React Native App]

  Vite --> API[Node/Express API Server]
  Expo --> API
  API --> MongoDB[(MongoDB Atlas)]
  API --> Groq[Groq API]
  API --> Twilio[Twilio API]
  API --> Socket[Socket.IO Rooms]
```

## Notes For Future Improvements

- Add latitude/longitude to `Project` and `WorkerProfile` for real distance calculation.
- Persist Rozgar Mitra chat history if long-term assistant memory is needed.
- Move AI helper logic into `/services/aiService.js` as the AI surface grows.
- Add indexes on `Project.location`, `Project.skillType`, `Project.status`, `JobApplication.jobId`, and `WorkerProfile.skills`.
- Add audit logs for AI-generated autofill and candidate ranking decisions.
