import { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
    title: 'Chord Sheet Helper',
    description: 'Chord Sheet Helper',
    icons: {
        icon: '/favicon-32x32.png',
        apple: '/apple-touch-icon.png',
    },
    robots: '/robots.txt',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="nl">
            <body>{children}</body>
        </html>
    );
}
