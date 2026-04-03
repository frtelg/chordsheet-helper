process.env.__NEXT_PRIVATE_PREBUNDLED_REACT = 'next';

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
    },
};

module.exports = {
    ...nextConfig,
};
