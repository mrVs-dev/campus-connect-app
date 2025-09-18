# CampusConnect

This is a School Gradebook and Dashboard Application built with Next.js and Firebase.

## Getting Started

To get started, take a look at `src/app/page.tsx`.

## Setup

The application uses the Gemini API for its AI features. To use these features, you'll need to provide an API key.

1.  Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Create a new file named `.env.local` in the root of the project.
3.  Add the following line to the `.env.local` file, replacing `YOUR_API_KEY` with your actual key:

```
GEMINI_API_KEY=YOUR_API_KEY
```

After adding the key, you'll need to restart your development server for the changes to take effect.

## Deployment (Coming Soon)

Currently, this application is running in a local development environment. The data is stored in your browser's `localStorage`, which means it is only accessible on your machine.

To make the application "live" and accessible to other users, the following steps are typically required:

1.  **Database Setup**: Replace the current `localStorage` solution with a cloud database (like Firebase Firestore) to store and manage data centrally.
2.  **Authentication**: Implement a user authentication system (like Firebase Authentication) to manage user accounts and secure access.
3.  **Hosting**: Deploy the application to a hosting provider (like Firebase Hosting) to make it accessible on the internet.

These features are planned for a future update.
