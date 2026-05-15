/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/hospitals` : 'https://apex-backend-theta.vercel.app/api/hospitals');
      const hospitals = await res.json();
      if (!Array.isArray(hospitals)) return [];
      return hospitals.map((h) => ({
        source: `/hospitals/${h._id}`,
        destination: `/hospitals/${h.slug || h._id}`,
        permanent: true,
      }));
    } catch (e) {
      console.warn('Could not load static hospital redirects', e);
      return [];
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'content.jdmagicbox.com'
      },
      {
        protocol: 'https',
        hostname: '**',  // ✅ allows any external https image URL
      }
    ],
    formats: ['image/avif', 'image/webp']
  }
};

export default nextConfig;