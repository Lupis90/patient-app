# Patient Visit Tracker

Patient Visit Tracker is a Next.js application designed to help healthcare professionals manage patient visits and associated photos. It provides an intuitive interface for adding, viewing, and managing patient records and their visit history.

## Features

- Add new patients and record their visits
- Upload and manage photos for each visit
- Integration with Google Photos for easy photo selection
- Sort and filter patient records
- Edit and delete patient visits
- Responsive design for desktop and mobile use
- Offline-capable with IndexedDB storage

## Technologies Used

- Next.js 14.x.x (App Router)
- React
- TypeScript
- Tailwind CSS
- Lucide React (for icons)
- Dexie.js (for IndexedDB)
- @react-oauth/google (for Google Photos integration)

## Prerequisites

- Node.js (version 14 or later)
- npm or yarn

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/patient-visit-tracker.git
   cd patient-visit-tracker
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```
   Replace `your_google_client_id` with your actual Google Client ID.

4. Run the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/app`: Contains the main application pages and components
- `/components`: Reusable React components
- `/public`: Static assets
- `/styles`: Global styles and Tailwind CSS configuration

## Key Components

- `PatientVisitApp`: The main component that manages the state and renders the UI
- `GooglePhotosSelector`: Component for selecting photos from Google Photos
- `PatientVisitsDB`: Dexie.js database class for managing patient data

## Deployment

To deploy the application, you can use Vercel, which is optimized for Next.js projects:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Vercel will automatically deploy your application

For other deployment options, refer to the [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.