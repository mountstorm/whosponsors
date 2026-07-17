/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    // Bundle the SQLite file into serverless functions on Vercel.
    outputFileTracingIncludes: {
      '/**': ['../data/processed/h1b.db']
    }
  }
};

export default nextConfig;