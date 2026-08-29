# ClaimSaathi (क्लेम साथी) — Proof of Chaos

ClaimSaathi is a deterministic, audit-traceable Employees' Provident Fund Organisation (EPFO) claim navigation companion. It maps a citizen's intent to the appropriate official process, evaluates eligibility prerequisites through source-backed policy rules, explains blockers in plain language, and guides remediation workflows without guessing or using generative AI inside the decision path.

| Resource / Detail | Link / Information |
| --- | --- |
| **Team Name** | **Proof of Chaos** |
| **Developed By** | Yash Mishra & [Mohit Kushwaha](https://www.youtube.com/@Mohit.Kushwaha0601) |
| **Built For** | [buildwhatmovesindia.com](https://buildwhatmovesindia.com/) |
| **Live Application** | [claim-saathi-six.vercel.app](https://claim-saathi-six.vercel.app/) |
| **GitHub Repository** | [github.com/mohitkushwaha0601/claim-saathi](https://github.com/mohitkushwaha0601/claim-saathi) |
| **Frontend Deployment** | Powered by **Vercel** |
| **Backend Deployment** | Powered by **Railway** |
| **Video Controls & Stats** | [Analytics 📊](https://www.youtube.com/analytics#;fi=v-8MOuD0Vxnuc) • [Edit Video ✏️](https://studio.youtube.com/video/8MOuD0Vxnuc/edit) • [Promote Video 🚀](https://studio.youtube.com/channel/UC80Psb4Hn5JHNd882mG7Heg/content/promotions?d=pcd&videoId=8MOuD0Vxnuc&promotionEntryPoint=PROMOTION_ENTRY_POINT_VIDEO_WATCH_PAGE) |

> **Powered by Codex** • **[Watch the Demo Video 📺](https://youtu.be/8MOuD0Vxnuc)**

---

## 🗂️ Table of Contents
1. [📖 The Core Problem & Solution](#problem-solution)
2. [🏗️ Architecture & Technical Design](#architecture)
3. [🔒 Government Safety & AI Boundaries](#safety)
4. [🛠️ Technology Stack](#tech-stack)
5. [📁 Repository Layout](#repo-layout)
6. [👥 Core Personas (Demo Scenarios)](#personas)
7. [🔍 System Explorer](#explorer)
8. [♿ Accessibility & Remote-Area Resilience](#accessibility)
9. [🚀 Setup & Execution](#setup)
10. [🧪 Testing](#testing)

---

## <a id="problem-solution"></a>📖 The Core Problem & Solution

### Problem
EPFO citizen journeys are complex and difficult to navigate. A citizen's goal (e.g., withdrawing money, transferring accounts, or final settlement) maps to specific government processes with numerous prerequisites, rules, and blockers. When a claim fails, citizens are often left with vague rejection reasons, leading to repeated submissions, administrative overhead, and extreme frustration.

### Solution
ClaimSaathi acts as an intelligent, evidence-first navigation layer. It:
1. **Maps Intent**: Translates the citizen's goals into official EPFO processes (e.g., Form 31, Form 13, Form 19).
2. **Evaluates Deterministically**: Checks rules using versioned, source-backed policy data.
3. **Explains Blockers**: Detects missing information or policy conflicts and shows actionable resolution steps.
4. **Resiliency over Guesswork**: Gracefully handles missing information (`UNABLE_TO_VERIFY`) and ambiguous policies (`POLICY_REVIEW_REQUIRED`) rather than guessing, assuming values, or using generative models to make decisions.
5. **Provides Downstream Explanations**: Uses a **Safe AI Gateway** only *after* a deterministic decision is recorded, strictly for simplifying or translating explanations into English and Hindi with an automatic deterministic fallback.

---

## <a id="architecture"></a>🏗️ Architecture & Technical Design

ClaimSaathi is designed around **Domain-Driven Design (DDD)** and **Hexagonal (Ports and Adapters) Architecture** principles. The business domain and government logic are isolated from frameworks, databases, and AI models.

### System Data Flow & Orchestration

```text
               [ Citizen State / Persona Facts ]
                              │
                              ▼
                     [ Journey Catalog ]
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    JOURNEY ORCHESTRATOR                     │
│                                                             │
│   1. Retrieve Journey Definition                            │
│      (Determines required prerequisite graph and rule sets) │
│                                                             │
│   2. Evaluate Pinned Policy Rules (Policy Engine)           │
│      (Evaluates declarative JSON rules using citizen facts) │
│                                                             │
│   3. Evaluate Prerequisite Graph (ALL_OF Precedence)        │
│      (Logical tree resolving rule outcomes to final state)  │
│                                                             │
│   4. Emit Immutable Decision Record                         │
│      (Versions, facts, RuleResult[], audit metadata)        │
└─────────────────────────────┬───────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       [ Outcome: PASS ]            [ Outcome: ACTION_REQUIRED ]
               │                             │
               ▼                             ▼
       [ Proceed to Form ]         [ Resolution Navigator ]
               │                             │
               ▼                             ▼
        (Claim ready)                [ Approved Steps ]
                                             │
                                             ▼
                                     [ Recheck Facts ]
                                             │
                                             ▼
                                   [ Re-run Evaluation ]
```

### Downstream Safe AI Explanation Flow

```text
 [ Stored Decision Record ]
             │
             ▼
[ Canonical Explanation ] ─────────► [ Sanitizer ]
                                         │
                                         ▼ (No PII / Facts Only)
                             [ Sanitized Input ]
                                         │
                                         ▼
                              [ OpenAI Provider ]
                                         │
                                         ▼
                            [ Structured JSON Output ]
                                         │
                                         ▼
                            [ Semantic Validator ]
                                         │
                                         ├── (Valid) ───► [ Simple English / Hindi UI ]
                                         │
                                         └── (Failed) ──► [ Deterministic Fallback UI ]
```

---

## <a id="safety"></a>🔒 Government Safety & AI Boundaries

ClaimSaathi is built for government services where correctness, auditability, and trust are non-negotiable.

*   **Zero AI in Decision Making**: AI never decides eligibility, identity/KYC status, monetary limits, or claim outcomes. Removing the AI gateway leaves all decisions completely unchanged.
*   **Fail-Closed to Uncertainty**:
    *   `UNABLE_TO_VERIFY`: Returned when required facts (like a bank link or identity status) are missing or unverifiable.
    *   `POLICY_REVIEW_REQUIRED`: Returned when government policies are conflicting, ambiguous, or require manual policy interpretation.
*   **Immutable Decision Records**: All outputs capture the precise version of the policy rules, prerequisite graphs, and inputs.
*   **Strict AI Sanitization**: The OpenAI gateway receives only a sanitized, PII-free metadata structure. It cannot see UANs, Aadhaar numbers, bank accounts, or names.
*   **Semantic Validation**: The output from the AI model is parsed into structured JSON and validated against the original deterministic decision. If the model introduces unapproved terms, URLs, or facts, the system immediately rejects the output and falls back to a locally-defined deterministic explanation.
*   **Unambiguous Mocks**: External integrations (EPFO systems) are clearly represented as mocks in the configuration, code, logs, and user interface.

---

## <a id="tech-stack"></a>🛠️ Technology Stack

### Backend
*   **Language**: Python 3.12+
*   **API Framework**: FastAPI (high-performance async router)
*   **Validation**: Pydantic v2 (strict type-safety and serialization)
*   **Dependency Management**: `uv` (ultra-fast package installer)
*   **Test Runner**: `pytest`

### Frontend
*   **Framework**: Next.js 15 (App Router, Server-Side Rendering & Client Shell)
*   **Language**: TypeScript (strongly typed UI components)
*   **Styling**: Tailwind CSS & Vanilla CSS (mobile-first, responsive grid layout)
*   **Internationalization**: `next-intl` (structured locales for English and Hindi)
*   **PWA Shell**: `@serwist/next` (precaches static assets, offline resilience)
*   **Testing**: Playwright (E2E browser regressions), Vitest (Unit & Component testing)

---

## <a id="repo-layout"></a>📁 Repository Layout

The codebase separates declarative metadata, shared business policies, the Python services backend, and the Next.js frontend:

```text
claim-saathi/
├── policies/epfo/              # Declarative versioned policies and source metadata
│   ├── sources.json            # Official government policy citations
│   ├── partial_withdrawal.json # Policy rule conditions for Form 31
│   ├── transfer.v1.json        # Policy rule conditions for Form 13
│   └── final_settlement.json   # Conflicting EPFO policy definitions (Form 19)
├── journeys/epfo/              # Mapping citizen goals to prerequisite graphs
├── resolutions/epfo/           # Actionable step-by-step resolution scripts
├── backend/                    # Python FastAPI service
│   ├── app/
│   │   ├── api/                # FastAPI routes and adapters
│   │   ├── application/        # Application services (Orchestrator, Explain, Trace)
│   │   ├── domain/             # Framework-independent domain core (Entities, Enums)
│   │   └── infrastructure/     # Integrations (OpenAI Provider, mock registries)
│   └── tests/                  # Backend unit, integration, and contract tests
├── frontend/                   # Next.js web application
│   ├── messages/               # Structured locale JSON catalogues (en/hi)
│   ├── src/
│   │   ├── app/                # App Router page layouts and paths
│   │   ├── components/         # Premium, accessible UI components
│   │   ├── lib/                # Typed API client, Serwist config
│   │   └── test/               # Vitest component test suites
│   ├── e2e/                    # Playwright end-to-end browser regression tests
│   └── public/                 # Static public assets and PWA icons
└── docs/                       # Architectural Decision Records and system details
```

---

## <a id="personas"></a>👥 Core Personas (Demo Scenarios)

The project includes three synthetic personas mapping to distinct domain outcomes:

1.  **Ravi (Partial Withdrawal - Form 31)**:
    *   *Intent*: Access PF funds for house construction.
    *   *Facts*: Valid UAN, linked Aadhaar, verified bank account, 72 months of service.
    *   *Outcome*: `PASS` (Ready to proceed to Form 31).
2.  **Priya (Transfer - Form 13)**:
    *   *Intent*: Transfer PF balance from previous employer to current.
    *   *Facts*: Date of Exit is missing on her previous employment record.
    *   *Outcome*: `ACTION_REQUIRED` (Blocks on `EXIT_DATE_MISSING`).
    *   *Resolution*: Guides Priya through the `RES_EXIT` workflow, allowing her to update her Date of Exit, re-verify the records against the mock backend, and finally unlock `PASS`.
3.  **Arjun (Final Settlement - Form 19)**:
    *   *Intent*: Withdraw full PF balance after retirement.
    *   *Facts*: EPFO policies on retirement wait-period limits are conflicting in historical manuals.
    *   *Outcome*: `POLICY_REVIEW_REQUIRED` (Safe stop. No guessing is done, and no AI is used to resolve the conflict. Prompts for manual officer review).

---

## <a id="explorer"></a>🔍 System Explorer

ClaimSaathi includes a dedicated, reviewer-facing **System Explorer** at `/how-it-works`. It visualizes the technical execution trace of a decision:
*   **Intent Stage**: Displays the raw citizen facts mapped to their goal.
*   **Planner Stage**: Shows the selected journey instance and catalog mappings.
*   **Policy Stage**: Traces each rule execution with its stable ID, source date, operator, and raw facts observed.
*   **Graph Stage**: Renders the prerequisite graph, indicating which branches passed or blocked.
*   **Decision Stage**: Evaluates the immutable audit record and highlights the mock-status and `ai_used_for_decision: false` safety flags.

---

## <a id="accessibility"></a>♿ Accessibility & Remote-Area Resilience

*   **Keyboard & Scale Preferences**:
    *   Compact access menu in the header.
    *   Dynamic text resizing scale (`100%`, `125%`, `150%`, `175%`, `200%`) using rem-based scaling.
    *   Dedicated high-contrast mode modifying CSS variables for visual comfort.
*   **Static Local catalogues**:
    *   Locale switching (English/Hindi) is handled locally through static JSON catalogues. No translation API is called.
    *   Government identifiers (e.g., "Form 19", "UAN") and technical enums remain stable and untranslated to avoid confusion.
*   **PWA Cache Boundary**:
    *   Precaches static build pages (`/`, `/how-it-works`, `/offline`) and styling scripts.
    *   Dynamic API calls (`/api/*`) and journey pages (`/journey/*`) use a strict `NetworkOnly` boundary.
    *   Stale caches never misrepresent dynamic claim outcomes as current truth. An offline notification is shown if the connection is lost.

---

## <a id="setup"></a>🚀 Setup & Execution

### Prerequisites
*   Python 3.12+ (managed with `uv` or `venv`)
*   Node.js 20+

### Running the Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    uv pip install -r pyproject.toml
    # Or create a venv and install
    python -m venv .venv
    .\.venv\Scripts\activate
    pip install -e .
    ```
3.  Start the FastAPI server:
    ```bash
    python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
    ```
    *   API Docs: `http://localhost:8000/docs`
    *   Health Check: `http://localhost:8000/health`

### Running the Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variable (create `.env.local` if not present):
    ```bash
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
    ```
4.  Run the Next.js development server:
    ```bash
    npm run dev
    ```
    *   App URL: `http://localhost:3000`

---

## <a id="testing"></a>🧪 Testing

### Backend Unit & Integration Tests
Run backend tests using `pytest` from the `backend/` directory:
```bash
# Using virtualenv python
.\.venv\Scripts\pytest -v
```

### Frontend Unit & Component Tests
Run frontend component tests using `Vitest` from the `frontend/` directory:
```bash
npm run test
```

### End-to-End Playwright Regression Tests
Run browser regression tests and offline PWA checks from the `frontend/` directory:
```bash
# Install browsers
npx playwright install chromium

# Run E2E suites
npm run test:e2e
npm run build
npm run test:e2e:pwa
```
