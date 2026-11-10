/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // every page is built ahead of time as a plain file (fast, works offline, no server)
  reactStrictMode: true,
};
export default nextConfig;
