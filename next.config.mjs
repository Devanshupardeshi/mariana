/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM in a few addons; let Next transpile them.
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
  eslint: {
    // The build must never be blocked by lint noise; correctness is enforced by `tsc`.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Allow importing raw .glsl/.vert/.frag should we ever co-locate shader files.
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
