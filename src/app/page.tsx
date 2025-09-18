
"use client";

import * as React from "react";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";

import { getFirebaseAuth } from "@/lib/firebase/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/icons/logo";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [signInEmail, setSignInEmail] = React.useState("");
  const [signInPassword, setSignInPassword] = React.useState("");
  const [signUpEmail, setSignUpEmail] = React.useState("");
  const [signUpPassword, setSignUpPassword] = React.useState("");
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [isSigningUp, setIsSigningUp] = React.useState(false);
  
  const { toast } = useToast();

  React.useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
        // Firebase might not be initialized yet
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (user) {
    router.push("/dashboard");
    return null;
  }
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    const auth = getFirebaseAuth();
    if (!auth) return;

    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message,
      });
    } finally {
        setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
    } finally {
        setIsSigningUp(false);
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="flex items-center gap-2 text-2xl font-semibold text-primary mb-6">
        <Logo className="h-8 w-8" />
        <span className="font-headline">CampusConnect</span>
      </div>
      <Tabs defaultValue="sign-in" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign-in">Sign In</TabsTrigger>
          <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in">
          <Card>
            <form onSubmit={handleSignIn}>
                <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="sign-in-email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="sign-in-email" 
                            type="email" 
                            placeholder="m@example.com" 
                            required 
                            className="pl-8" 
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            disabled={isSigningIn}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sign-in-password">Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            id="sign-in-password" 
                            type="password" 
                            required 
                            className="pl-8"
                            value={signInPassword}
                            onChange={(e) => setSignInPassword(e.target.value)}
                            disabled={isSigningIn}
                        />
                    </div>
                </div>
                </CardContent>
                <CardFooter>
                <Button className="w-full" type="submit" disabled={isSigningIn}>
                    {isSigningIn ? 'Signing In...' : 'Sign in'}
                </Button>
                </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="sign-up">
          <Card>
             <form onSubmit={handleSignUp}>
                <CardHeader>
                    <CardTitle className="text-2xl">Sign Up</CardTitle>
                    <CardDescription>
                        Create an account to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="sign-up-email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="sign-up-email" 
                                type="email" 
                                placeholder="name@example.com" 
                                required 
                                className="pl-8"
                                value={signUpEmail}
                                onChange={(e) => setSignUpEmail(e.target.value)}
                                disabled={isSigningUp}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sign-up-password">Password</Label>
                         <div className="relative">
                            <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="sign-up-password" 
                                type="password" 
                                required 
                                className="pl-8"
                                value={signUpPassword}
                                onChange={(e) => setSignUpPassword(e.target.value)}
                                disabled={isSigningUp}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" type="submit" disabled={isSigningUp}>
                        {isSigningUp ? 'Signing Up...' : 'Sign up'}
                    </Button>
                </CardFooter>
             </form>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
