# PrepWise - AI-Powered Voice Mock Interviewer
## Comprehensive Architecture, Workflow & Gap Analysis Document

---

## 1. Executive Summary

**PrepWise (Mock Interviewer)** is a full-stack web application designed to help job candidates practice technical and behavioral interviews using an interactive, real-time AI voice agent. 

### Core Concept & User Journey
1. **Account Creation & Authentication**: User registers or logs in via Firebase Authentication with secure server-side session cookies.
2. **Interview Generation**: The user initiates a voice conversation with a Vapi AI agent specifying their target role, experience level, tech stack, question focus (behavioral/technical), and number of questions. Vapi triggers a webhook to a Next.js API route, which uses Google Gemini 2.0 Flash to generate customized interview questions and store them in Firestore.
3. **Live Voice Interview**: The candidate takes the mock interview in real-time. The AI Interviewer uses Vapi AI (Deepgram STT + ElevenLabs TTS + LLM) to ask questions sequentially, adaptively listen, and ask relevant follow-up questions.
4. **Automated Feedback & Analytics**: At the end of the session, the complete conversation transcript is sent to Google Gemini 2.0 Flash via structured outputs (`zod`). Gemini evaluates performance across 5 key metrics (Communication, Technical Knowledge, Problem Solving, Cultural Fit, Confidence) and generates actionable feedback.

---

## 2. Technology Stack Overview

| Layer | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router, Turbopack) | Server & Client Components, Route Handlers |
| **UI & Styling** | React 19, Tailwind CSS v4, Radix UI, Lucide Icons, Sonner | Modern dark-themed responsive user interface |
| **Form & Validation** | React Hook Form, Zod, @hookform/resolvers | Form state and validation |
| **Authentication** | Firebase Auth (Client) & Firebase Admin SDK (Server) | Client-side auth forms & server-side session cookies |
| **Database** | Firebase Firestore (Admin SDK) | Storing users, interview templates, and feedback reports |
| **Voice Agent Infrastructure** | Vapi AI Web SDK (`@vapi-ai/web`) | Real-time WebRTC audio streaming, STT (Deepgram), TTS (ElevenLabs) |
| **AI LLM Orchestration** | Vercel AI SDK (`ai`), `@ai-sdk/google` (Gemini 2.0 Flash) | Question generation & structured feedback assessment |

---

## 3. End-to-End System Workflows & Diagrams

### 3.1 Authentication Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as Next.js Client Form
    participant FirebaseAuth as Firebase Auth SDK
    participant ServerAction as Server Action (signUp / signIn)
    participant AdminSDK as Firebase Admin SDK
    participant Firestore as Firestore DB

    User->>Client: Enter Email & Password
    Client->>FirebaseAuth: createUserWithEmailAndPassword() / signInWithEmailAndPassword()
    FirebaseAuth-->>Client: Returns Firebase User Credential / ID Token
    Client->>ServerAction: Call signIn({ email, idToken }) / signUp({ uid, name, email })
    alt Sign Up
        ServerAction->>Firestore: Create user doc in users/{uid}
    else Sign In
        ServerAction->>AdminSDK: auth.createSessionCookie(idToken)
        ServerAction-->>Client: Set HTTP-Only 'session' Cookie (7 Days)
    end
    Client->>User: Redirect to Dashboard (/)
```

---

### 3.2 Interview Generation Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Agent as Agent Component (type="generate")
    participant VapiSDK as Vapi Web SDK
    participant VapiCloud as Vapi AI Cloud Engine
    participant ApiRoute as POST /api/vapi/generate
    participant Gemini as Gemini 2.0 Flash API
    participant Firestore as Firestore DB

    User->>Agent: Click "Call" (Start Setup)
    Agent->>VapiSDK: vapi.start(VAPI_WORKFLOW_ID, { username, userid })
    VapiSDK->>VapiCloud: Connect WebRTC Audio Call
    VapiCloud->>User: "What role & tech stack are you preparing for?"
    User->>VapiCloud: Speaks setup preferences (Role, Level, Tech Stack, Questions)
    VapiCloud->>ApiRoute: Webhook Trigger (POST /api/vapi/generate) with JSON body
    ApiRoute->>Gemini: generateText() prompt with role, level, techstack, amount
    Gemini-->>ApiRoute: Returns formatted JSON string array of questions
    ApiRoute->>Firestore: Store doc in interviews collection { role, techstack, questions, userId, ... }
    ApiRoute-->>VapiCloud: HTTP 200 Success Response
    VapiCloud->>User: "Your interview has been created!" & ends call
    Agent->>User: Redirect to Dashboard (/)
```

---

### 3.3 Live Voice Interview & Feedback Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant DetailPage as /interview/[id] Page
    participant Agent as Agent Component (type="interview")
    participant VapiSDK as Vapi Web SDK
    participant VapiCloud as Vapi AI Cloud Engine
    participant FeedbackAction as createFeedback Server Action
    participant Gemini as Gemini 2.0 Flash API
    participant Firestore as Firestore DB

    DetailPage->>Firestore: Fetch interview data by ID
    DetailPage->>Agent: Pass questions array & interview details
    User->>Agent: Click "Call"
    Agent->>VapiSDK: vapi.start(interviewerDTO, { variableValues: { questions } })
    VapiSDK->>VapiCloud: Initialize Interviewer Assistant (Deepgram + ElevenLabs + GPT-4/Gemini)
    loop Voice Q&A Interaction
        VapiCloud->>User: Reads question / asks follow-up
        User->>VapiCloud: Voice response
        VapiCloud->>VapiSDK: Stream transcript messages
        VapiSDK->>Agent: On "message" event -> Save to messages state
    end
    User->>Agent: Click "End Call" or Call Finished
    Agent->>FeedbackAction: createFeedback({ interviewId, userId, transcript })
    FeedbackAction->>Gemini: generateObject() with Zod feedbackSchema & transcript
    Gemini-->>FeedbackAction: Structured Feedback (Total score, 5 Categories, Strengths, Improvements)
    FeedbackAction->>Firestore: Write document into feedback collection
    FeedbackAction-->>Agent: Returns feedbackId
    Agent->>User: Redirect to /interview/[id]/feedback
```

---

## 4. Firestore Database Schemas

### 4.1 `users` Collection
* **Document ID**: `uid` (Firebase Auth UID)
```ts
{
  name: string;
  email: string;
  // Optional future fields:
  // profileURL?: string;
  // resumeURL?: string;
}
```

### 4.2 `interviews` Collection
* **Document ID**: Auto-generated Firestore ID
```ts
{
  role: string;          // e.g. "Frontend Developer"
  type: string;          // "Technical", "Behavioral", or "Mixed"
  level: string;         // e.g. "Senior", "Junior", "Mid-Level"
  techstack: string[];   // e.g. ["React", "TypeScript", "Next.js"]
  questions: string[];   // Array of generated question strings
  userId: string;        // ID of the creator
  finalized: boolean;    // true once generated
  coverImage: string;    // Random company logo path (e.g. "/adobe.png")
  createdAt: string;     // ISO timestamp string
}
```

### 4.3 `feedback` Collection
* **Document ID**: Auto-generated Firestore ID
```ts
{
  interviewId: string;
  userId: string;
  totalScore: number;    // Overall score 0-100
  categoryScores: [      // 5 Fixed Categories
    { name: "Communication Skills", score: number, comment: string },
    { name: "Technical Knowledge", score: number, comment: string },
    { name: "Problem Solving", score: number, comment: string },
    { name: "Cultural Fit", score: number, comment: string },
    { name: "Confidence and Clarity", score: number, comment: string }
  ];
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string;     // ISO timestamp string
}
```

---

## 5. Critical Issues, Bugs & Missing Implementation Items

During full codebase inspection, the following critical bugs and missing features were identified:

### ⚠️ Critical Bugs & Code Vulnerabilities

1. **`JSON.parse()` Syntax Error Risk in `/api/vapi/generate/route.ts`**:
   - **Issue**: Gemini output is parsed directly using `JSON.parse(questions)`. Gemini models often output markdown code fences (e.g., ` ```json ... ``` `) or extra conversational text.
   - **Fix**: Sanitize the returned text by removing markdown backticks or use Vercel AI SDK `generateObject` with a Zod schema `z.array(z.string())`.

2. **Missing Document ID in `getInterviewById` (`lib/actions/general.action.ts`)**:
   - **Issue**: `getInterviewById` returns `interview.data() as Interview | null`, omitting `interview.id`. As a result, `interview.id` returns `undefined` when used in components.
   - **Fix**: Return `{ id: interview.id, ...interview.data() } as Interview`.

3. **Firestore Compound Query Errors (Missing Composite Indexes)**:
   - **Issue**: `getInterviewsByUserId` performs `.where("userId", "==", userId).orderBy("createdAt", "desc")`. `getLatestInterviews` performs `.orderBy("createdAt", "desc").where("finalized", "==", true).where("userId", "!=", userId)`.
   - **Fix**: Firestore requires explicit composite indexes for inequality (`!=`) and multiple field filters combined with `orderBy`. Create these composite indexes in the Firebase Console or `firestore.indexes.json`.

4. **Missing Check for `user` Nullability in `app/(root)/page.tsx`**:
   - **Issue**: Lines 17-18 pass `user?.id!` with non-null assertion (`!`). If a user manages to reach the page while unauthenticated or if session verification fails, this will throw a runtime error.
   - **Fix**: Safely handle `user?.id` or redirect to `/sign-in` if `!user`.

5. **`process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN` Initialization Guard**:
   - **Issue**: In `lib/vapi.sdk.ts`, `new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!)` runs at module load time. If the env variable is undefined, it passes an empty string or throws silently, breaking calls later.

---

### 🎨 Missing Features & Design Gaps

1. **No Sign Out / Logout Button**:
   - The user navigation/layout lacks a Logout button calling the existing `signOut()` server action.

2. **No Web UI Form for Manual Interview Creation**:
   - Interview generation currently relies strictly on talking to the Vapi Voice Workflow. Adding a fallback Web Form (where users can type role, level, tech stack, and amount directly) improves accessibility if audio generation fails or if users prefer typing.

3. **No Live Audio Visualizer / Complete Transcript View**:
   - `Agent.tsx` only shows `lastMessage`. Showing a scrollable history of the full transcript in real-time gives users better visual feedback during interviews.

4. **Webhook Security Guard**:
   - `/api/vapi/generate` is publicly accessible without Vapi header signature authentication.

---

## 6. Required Environment Variables Reference

Create a `.env.local` file in `ai-interview/` with the following key-value pairs:

```env
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=prepwise-933c3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=prepwise-933c3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=prepwise-933c3.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=251292335061
NEXT_PUBLIC_FIREBASE_APP_ID=1:251292335061:web:616b84207e1bfa06db1b5c

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=prepwise-933c3
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@prepwise-933c3.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Vapi AI Credentials
NEXT_PUBLIC_VAPI_WEB_TOKEN=your_vapi_public_web_token
NEXT_PUBLIC_VAPI_WORKFLOW_ID=your_vapi_workflow_id

# Google Gemini AI SDK API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

---

## 7. Recommended Action Plan & Next Steps

1. **Apply Critical Bug Fixes**:
   - Update `getInterviewById` to include `id`.
   - Update `/api/vapi/generate/route.ts` to use `generateObject` or clean output before `JSON.parse`.
   - Add safe fallback checks for `user` in `app/(root)/page.tsx`.
2. **Add Sign-Out & User Navigation**:
   - Add a User Profile menu / Sign Out button in `app/(root)/layout.tsx` or navigation header.
3. **Enhance Vapi Voice Agent Error Handling**:
   - Catch Vapi connection errors in `Agent.tsx` and show toast notifications (via `sonner`).
4. **Deploy & Index Firestore**:
   - Ensure Firestore Composite Indexes are created for `interviews` and `feedback` collections.
