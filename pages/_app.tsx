import React from 'react';

import { AppProps } from 'next/app';
import './styles.css';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface PageProps {}

export default function MyApp({ Component, pageProps }: AppProps<PageProps>) {
    return <Component {...pageProps} />;
}
