# CareGuide

## AWS Amplify deployment

See [DEPLOYMENT_AMPLIFY.md](DEPLOYMENT_AMPLIFY.md) for deployment instructions and current account blockers. Run `npm run build:amplify` to package the React frontend and Express API for Amplify Hosting compute. Production API requests use the same origin. After `npm run build`, `npm start` serves the full app at http://localhost:3001. In Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Overview
CareGuide is an AI-powered patient preparation assistant designed to help patients understand how to prepare for upcoming medical appointments, procedures, tests, or consultations. The application converts clinic instructions into organized, plain-language preparation guides with reminders, checklists, suggested questions, and safety messaging.

## Business Problem
Patients often receive preparation instructions across multiple channels, such as printed notes, portal messages, phone calls, or provider emails. Those instructions may use medical jargon, be difficult to interpret, or be easy to forget. The result can be confusion, anxiety, missed details, and repeated administrative follow-up. CareGuide seeks to reduce this friction by turning official instructions into a clear, patient-friendly preparation guide.

## Solution
CareGuide collects appointment details and any official instructions supplied by the patient. It then structures the information into a safer, easier-to-follow guide that includes:

- appointment summary
- plain-language summary
- preparation reminders
- what to bring
- general questions to ask the provider
- what to expect overview
- interactive checklist
- safety and source-priority notice

The app is educational and supportive in nature. It does not replace provider instructions or clinical decision-making.

## Target Users
- Patients preparing for office visits, imaging, blood tests, or follow-ups
- Caregivers or family members helping someone prepare
- Healthcare administrative staff who want fewer repeat preparation calls
- Providers who benefit when patients arrive with relevant documents and questions

## Key Features Implemented
- React + Vite frontend with a polished patient-facing interface
- Express + TypeScript backend API
- appointment-based form with validation
- provider instruction prioritization
- AI-assisted fallback generation of plain-language summaries
- preparation checklist with local persisted completion state
- saved guide history and delete actions
- responsible-AI safety handling for diagnosis, medication change, and emergency scenarios
- responsive design for desktop and mobile layouts

## Technology Stack
Frontend
- React
- Vite
- TypeScript
- React Router

Backend
- Node.js
- Express
- TypeScript
- Zod validation

Persistence
- localStorage for the academic prototype
- backend in-memory guide store for demonstration and local API workflow

AI Integration
- backend-only AI abstraction
- deterministic local fallback generation when no API key is configured
- ready for future live model integration via environment variables

## Architecture
The application flow is:

1. User enters appointment details and official instructions
2. Backend validates the request
3. Safety checks assess emergency, diagnosis, medication, and treatment-related language
4. The safe prompt is assembled and simplified
5. A fallback or live-model summary is produced
6. A structured patient preparation guide is returned
7. The frontend stores the guide locally and lets the patient review, reopen, and complete the checklist

## Project Structure
- client/: Vite React frontend
- server/: Express TypeScript API and safety logic
- .env.example: environment variable template
- .gitignore: excludes environment and build artifacts
- README.md: project overview and run instructions
- ASSIGNMENT_EVIDENCE.md: academic evidence and development documentation

## Local Setup
From the project root:

1. Install dependencies
   npm install

2. Start the full application locally
   npm run dev

3. Open the app in a browser
   http://localhost:5173

4. API is available at
   http://localhost:3001/api/health

## Environment Variables
Use the root .env file with values similar to:

PORT=3001
CLIENT_URL=http://localhost:5173
AI_API_KEY=
AI_PROVIDER=local
VITE_API_URL=http://localhost:3001

The app keeps credentials server-side and never exposes them to the frontend.

## AI Integration
The backend includes a structured AI simplification layer and a safe fallback generator. When no real AI key is configured, the app produces a deterministic, plain-language summary based on the appointment type, appointment details, and official instructions supplied by the user.

This keeps the architecture ready for a future live model integration while maintaining a safe, educational prototype.

## Safety Design
CareGuide implements several safeguards:

- No diagnosis: diagnostic questions are redirected to a healthcare professional
- No medication changes: medication-change questions trigger a protective safety response
- Provider instructions take priority: official clinic instructions remain the primary source
- Emergency limitation: emergency symptoms trigger an urgent-help message and stop normal preparation guidance
- Human oversight: the app explains that it does not replace medical advice from a provider
- Data minimization: only the information needed for preparation is collected

## Privacy
CareGuide is an academic prototype and does not store sensitive patient identifiers or medical records. The prototype uses local browser storage for demonstration and avoids collecting unnecessary personal health information.

## Academic Prototype Disclaimer
CareGuide is an academic prototype and is not intended for clinical use. It has not been evaluated for HIPAA compliance or medical-device regulatory requirements. Production deployment would require formal privacy, security, clinical, and legal review.

## Testing
Actual verification performed during this project included:

- dependency installation via npm install
- backend safety tests with Vitest
- production build checks for the client and server
- backend health endpoint validation
- API-based generation of a valid MRI guide
- safety verification for diagnosis, medication-change, and emergency requests
- local app startup through npm run dev
- browser load validation on the CareGuide home page and saved-guide route

## Known Limitations
- This is a prototype, not a production clinical system
- LocalStorage is used for easier academic persistence rather than secure patient storage
- No real AI provider key is configured in this environment
- No authentication, authorization, or audit logging is implemented
- No formal HIPAA review or compliance controls are included

## Future Improvements
- secure authentication
- EHR or provider-portal integration
- advanced appointment reminders
- multilingual support
- accessibility testing and enhancements
- secure cloud deployment
- formal HIPAA review and governance practices

---

This project is intended to demonstrate a safe, patient-friendly preparation workflow for an academic assignment and local prototype demonstration.
