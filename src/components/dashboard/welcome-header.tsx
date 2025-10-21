"use client";

import type { UserRole } from "@/lib/types";
import { Logo } from "../icons/logo";

interface WelcomeHeaderProps {
    userRole: UserRole | null;
    userName?: string;
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
                subtitle: 'Here is a summary of your classes and student performance.'
            };
        case 'Admin':
        default:
            return {
                title: 'Welcome to CampusConnect!',
                subtitle: 'Your in-house school management solution.'
            };
    }
};

export function WelcomeHeader({ userRole, userName }: WelcomeHeaderProps) {
    const { title, subtitle } = getWelcomeMessages(userRole, userName);

    return (
        <div className="flex items-center gap-4">
            <Logo userRole={userRole} className="h-[18rem] w-[18rem] text-primary" />
            <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    )
}
