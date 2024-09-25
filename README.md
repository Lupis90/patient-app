# Patient Visit Tracker - Application Architecture

## 1. Frontend Components

### Main Components
- `PatientVisitApp`: Core component managing state and UI rendering
- `GooglePhotosSelector`: Handles photo selection from Google Photos
- `LoginPage`: Manages user authentication

### UI Components
- `Card`, `Button`, `Input`, `Dialog`: Reusable UI components
- `LoadingSpinner`, `LoadingSpinnerW`: Loading indicators

## 2. Backend Services

### Supabase Integration
- Authentication
- Database for storing patient and visit data
- Real-time data synchronization

### API Routes
- `/api/register-push`: Registers push subscriptions
- `/api/send-notification`: Sends push notifications
- `/api/servePhotos`: Serves stored photos
- `/api/download-google-photos`: Handles Google Photos download

## 3. External Integrations

- Google OAuth: For Google Photos access
- Web Push API: For sending notifications

## 4. Data Models

### Patient
- `id`: unique identifier
- `first_name`: string
- `last_name`: string
- `user_id`: reference to authenticated user

### Visit
- `id`: unique identifier
- `patient_id`: reference to Patient
- `date`: date string
- `photos`: array of Photo objects

### Photo
- `name`: string
- `type`: string
- `data`: base64 encoded string

## 5. Key Features

- User authentication and authorization
- CRUD operations for patients and visits
- Photo management (upload, view, delete)
- Google Photos integration
- Push notifications for visit reminders
- Responsive design for mobile and desktop

## 6. File Structure

```
/app
  /api
    /download-google-photos
    /register-push
    /send-notification
    /servePhotos
  /login
  page.tsx
  layout.tsx
  middleware.ts
/components
  GooglePhotosSelector.tsx
  LoadingSpinner.tsx
  LoadingSpinnerW.tsx
  ServiceWorkerRegistration.tsx
/lib
  supabaseClient.ts
/public
  service-worker.js
/styles
  globals.css
```

## 7. State Management

- React's useState and useEffect for local state
- Supabase for server-side state and real-time updates

## 8. Security Measures

- Supabase authentication
- Server-side validation of user permissions
- Secure handling of sensitive patient data
- HTTPS for all communications