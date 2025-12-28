import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { validateSession } from '../lib/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
        setPassword(''); // Clear password on error
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - IP Locator</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div
        className="min-h-screen p-10 font-mono text-gray-200"
        style={{
          background:
            'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, rgba(10, 10, 15, 0.8) 100%)',
        }}
      >
        <div className="max-w-md mx-auto mt-20">
          {/* Header */}
          <header className="mb-12 text-center">
            <div
              className="text-xs tracking-[4px] mb-4 uppercase"
              style={{ color: '#00ff88' }}
            >
              [ Authentication Required ]
            </div>

            <h1
              className="text-[clamp(32px,8vw,48px)] font-bold m-0 bg-clip-text text-transparent -tracking-tight mb-3"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                background: 'linear-gradient(135deg, #00ff88 0%, #00ccff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ADMIN ACCESS
            </h1>

            <p className="text-sm text-gray-600">
              Enter your credentials to continue
            </p>
          </header>

          {/* Login Form */}
          <div
            className="bg-white/[0.02] rounded-xl overflow-hidden"
            style={{
              border: '1px solid rgba(0, 255, 136, 0.2)',
              boxShadow: '0 4px 60px rgba(0, 255, 136, 0.1)',
            }}
          >
            {/* Terminal Header */}
            <div
              className="flex items-center gap-2 px-4 py-3 bg-black/30"
              style={{
                borderBottom: '1px solid rgba(0, 255, 136, 0.1)',
              }}
            >
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27ca40]" />
              <span className="ml-auto text-[11px] text-gray-600">
                login.session
              </span>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <form onSubmit={handleSubmit}>
                {/* Username Input */}
                <div className="mb-6">
                  <label
                    htmlFor="username"
                    className="block mb-2 text-xs tracking-wide text-gray-600 uppercase"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition-colors"
                    style={{
                      border: '1px solid rgba(0, 255, 136, 0.2)',
                    }}
                    required
                    disabled={loading}
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                {/* Password Input */}
                <div className="mb-6">
                  <label
                    htmlFor="password"
                    className="block mb-2 text-xs tracking-wide text-gray-600 uppercase"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-black/30 border rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition-colors"
                    style={{
                      border: '1px solid rgba(0, 255, 136, 0.2)',
                    }}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-3 bg-red-500/10 border border-[#ff0064] rounded-lg text-[#ff0064] text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all rounded-lg"
                  style={{
                    background: loading
                      ? 'rgba(0, 255, 136, 0.1)'
                      : 'rgba(0, 255, 136, 0.2)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    color: loading ? '#666' : '#00ff88',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Authenticating...' : 'Access Admin Panel'}
                </button>
              </form>

              {/* Back Link */}
              <div className="mt-6 text-center">
                <Link
                  href="/"
                  className="text-gray-600 text-xs hover:text-[#00ccff] transition-colors"
                >
                  ← Back to main
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const sessionToken = context.req.cookies.session;

  if (sessionToken) {
    const admin = await validateSession(sessionToken);

    if (admin) {
      // Already authenticated, redirect to admin
      return {
        redirect: {
          destination: '/admin',
          permanent: false,
        },
      };
    }
  }

  return {
    props: {},
  };
};
