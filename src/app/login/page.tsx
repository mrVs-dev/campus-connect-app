
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider, User, getAuth } from "firebase/auth";
import { auth, firebaseConfig, isFirebaseConfigured } from "@/lib/firebase/firebase";
import { getOrCreateUser } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/icons/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MissingFirebaseConfig() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Firebase Configuration Missing</CardTitle>
          <CardDescription>
            Your application is not connected to Firebase. Please configure your environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            To get started, you need to create a Firebase project and add its configuration to this application.
          </p>
          <p>
            Please follow the instructions in the <code className="bg-muted px-2 py-1 rounded-md text-sm">README.md</code> file
            to set up your <code className="bg-muted px-2 py-1 rounded-md text-sm">.env.local</code> file with the necessary Firebase keys.
          </p>
           <div className="mt-4 border-t pt-4">
            <p className="text-sm font-semibold">Debugging Information:</p>
            <p className="text-xs text-muted-foreground">
              This screen appears when the app cannot find its Firebase configuration. The `apphosting.yaml` file tells App Hosting which secrets to use. The backend then reads these as environment variables.
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Project ID read by the app:</span>
              <code className="ml-2 bg-muted px-2 py-1 rounded-md font-mono text-destructive">
                {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not Found"}
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = React.useState(true); // Start as true to handle redirect
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />;
  }

  React.useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);
  
  // This effect runs on page load to check for a redirect result.
  React.useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const authInstance = getAuth();
        const result = await getRedirectResult(authInstance);
        if (result && result.user) {
          // A user was successfully signed in on redirect.
          // The useAuth hook will now pick up the new user and redirect to the dashboard.
          // We can stop the loading indicator on this page.
        }
      } catch (error: any) {
        console.error("Authentication failed during redirect:", error);
        if (error.code === 'auth/unauthorized-domain') {
          setError(`Authentication Error: This domain is not authorized for sign-in. Please add it to your Firebase project's settings.`);
        } else if (error.code === 'auth/popup-closed-by-user') {
          setError('The sign-in window was closed before completing. Please try again.');
        } else {
          setError(`Failed to sign in after redirect. Error: ${error.message || error.code}`);
        }
      } finally {
        // Whether there was a redirect result or not, we are no longer in a "signing in" state.
        setIsSigningIn(false);
      }
    };

    handleRedirectResult();
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // After this call, the browser will redirect to Google's sign-in page.
    // The user will then be redirected back here, and the useEffect above will handle the result.
  };

  if (authLoading || isSigningIn) {
    return <div className="flex min-h-screen items-center justify-center">Authenticating...</div>;
  }
  
  // Don't render the login form if we already know there's a user.
  if (user) {
     return <div className="flex min-h-screen items-center justify-center">Redirecting to dashboard...</div>;
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Welcome to CampusConnect</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" onClick={handleSignIn}>
                <GoogleIcon />
                <span className="ml-2">Sign in with Google</span>
            </Button>
          </CardContent>
          <CardFooter className="flex-col items-start text-xs text-muted-foreground">
            <div className="border-t pt-2 mt-2 w-full text-center">
               <p><strong>App's Project ID:</strong></p>
               <p className="font-mono break-all">{firebaseConfig.projectId || "Not Found in .env.local"}</p>
               <p className="mt-2 text-balance">Please ensure this Project ID matches the one in your Firebase Console.</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
}
