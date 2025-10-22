
"use client";

import type { UserRole } from "@/lib/types";
import { Logo } from "../icons/logo";
import { cn } from "@/lib/utils";

interface WelcomeHeaderProps {
    userRole: UserRole | null;
    userName?: string;
    className?: string;
}

const getWelcomeMessages = (role: UserRole | null, name?: string) => {
    const welcomeName = name ? `, ${name}` : '';
    switch (role) {
        case 'Student':
            return {
                title: `Welcome to Your Dashboard${welcomeName}!`,
                subtitle: 'Here is your academic overview.'
            };
        case 'Guardian':
            return {
                title: `Welcome to the Guardian Portal${welcomeName}!`,
                subtitle: 'This is the portal for your children\'s academic information.'
            };
        case 'Teacher':
             return {
                title: `Welcome to the Teacher Dashboard${welcomeName}!`,
                subtitle: 'This is the Teacher Portal.'
            };
        case 'Receptionist':
            return {
                title: 'Welcome to CampusConnect!',
                subtitle: 'This is the Front Office Portal.'
            };
        case 'Head of Department':
            return {
                title: 'Welcome to CampusConnect!',
                subtitle: 'This is the Admin Portal.'
            };
        case 'Admin':
             return {
                title: 'Welcome to CampusConnect!',
                subtitle: 'This is the Administrator Portal.'
            };
        default:
            return {
                title: 'Welcome to CampusConnect!',
                subtitle: 'Your in-house school management solution.'
            };
    }
};

export function WelcomeHeader({ userRole, userName, className }: WelcomeHeaderProps) {
    const { title, subtitle } = getWelcomeMessages(userRole, userName);

    return (
        <div className={cn("flex items-center gap-4", className)}>
            <Logo className="h-12 w-12" />
            <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-lg text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    )
}
