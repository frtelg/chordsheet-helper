import React from 'react';

import Head from 'next/head';

export default function IndexPage() {
    return (
        <React.StrictMode>
            <Head>
                <title>Page not found</title>
            </Head>
            <div className="NotFound">Oops! The requested URL could not be found</div>
        </React.StrictMode>
    );
}
