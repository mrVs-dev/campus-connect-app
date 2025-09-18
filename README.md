# CampusConnect

This is a School Gradebook and Dashboard Application built with Next.js and Firebase.

## Getting Started

To get started with the development server, run:

```bash
npm run dev
```

## Setup

The application uses Firebase for authentication and the Gemini API for its AI features. To use these features, you'll need to provide API keys.

1.  Create a new file named `.env.local` in the root of the project.
2.  Add the following lines to the `.env.local` file.

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

# Gemini API Key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### Finding your Firebase Configuration

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new Firebase project or select an existing one.
3.  In your project's dashboard, click the **</>** icon to add a web app.
4.  Follow the on-screen instructions to register your app.
5.  After registering, you will see your Firebase configuration details (`apiKey`, `authDomain`, etc.). Copy and paste these values into your `.env.local` file.
6.  In the Firebase console, go to **Authentication** > **Sign-in method** and enable the **Google** provider.

### Finding your Gemini API Key

1.  Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Copy the key and paste it as the value for `GEMINI_API_KEY` in your `.env.local` file.

After adding the keys, you'll need to restart your development server for the changes to take effect.
