import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

import { validateSession } from '../lib/auth';

interface Visit {
  id: number;
  ipAddress: string;
  city: string;
  region: string;
  countryCode: string;
  isp: string;
  visitedAt: string;
  gpsLatitude?: string;
  gpsLongitude?: string;
  gpsCity?: string;
  gpsRegion?: string;
  gpsZipCode?: string;
  gpsStreetAddress?: string;
  gpsPermissionStatus?: string;
  locationDistance?: string;
}

interface VisitsResponse {
  visits?: Visit[];
  total?: number;
  error?: string;
}

function VisitCard({ visit, formatDate }: { visit: Visit; formatDate: (date: string) => string }) {
  const getStatusBadge = () => {
    if (visit.gpsPermissionStatus === 'granted') {
      return <span className="text-xs text-[#00ff88]">✓ Granted</span>;
    }
    if (visit.gpsPermissionStatus === 'denied') {
      return <span className="text-xs text-[#ff0064]">✗ Denied</span>;
    }
    return <span className="text-xs text-gray-600">— No data</span>;
  };

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-white/[0.03] transition-colors hover:bg-white/[0.03] sm:gap-4 sm:p-5 xl:hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
        <span className="text-sm text-gray-600">#{visit.id}</span>
        {getStatusBadge()}
      </div>

      {/* Card Fields - 2 column grid (label + value) */}
      <div className="flex flex-col gap-3">
        {/* IP Address */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">IP Address</span>
          <span className="text-sm font-medium break-words" style={{ color: '#00ff88' }}>
            {visit.ipAddress}
          </span>
        </div>

        {/* Location (IP) */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">Location (IP)</span>
          <span className="text-sm break-words">
            {visit.city}{visit.region ? `, ${visit.region}` : ''}
          </span>
        </div>

        {/* Country */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">Country</span>
          <span className="text-sm">{visit.countryCode || '—'}</span>
        </div>

        {/* GPS Location */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">Location (GPS)</span>
          <span className="text-sm" style={{ color: visit.gpsCity ? '#00ccff' : 'inherit' }}>
            {visit.gpsCity ? `${visit.gpsCity}${visit.gpsRegion ? `, ${visit.gpsRegion}` : ''}` : '—'}
          </span>
        </div>

        {/* GPS ZIP */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">GPS ZIP</span>
          <span className="text-sm" style={{ color: visit.gpsZipCode ? '#00ccff' : 'inherit' }}>
            {visit.gpsZipCode || '—'}
          </span>
        </div>

        {/* GPS Street Address */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">Street</span>
          <span className="text-sm" style={{ color: visit.gpsStreetAddress ? '#00ccff' : 'inherit' }}>
            {visit.gpsStreetAddress || '—'}
          </span>
        </div>

        {/* Distance */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">Distance</span>
          <span className="text-sm" style={{ color: visit.locationDistance ? '#00ccff' : 'inherit' }}>
            {visit.locationDistance ? `${parseFloat(visit.locationDistance).toFixed(2)} km` : '—'}
          </span>
        </div>

        {/* Visited At */}
        <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
          <span className="text-xs text-gray-600 uppercase">Visited</span>
          <span className="text-xs text-gray-600">{formatDate(visit.visitedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function VisitTableRow({ visit, formatDate }: { visit: Visit; formatDate: (date: string) => string }) {
  return (
    <div className="hidden xl:grid xl:grid-cols-[60px_120px_150px_100px_150px_150px_100px_100px_100px_180px] gap-3 py-3 px-5 border-b border-white/[0.03] text-sm transition-colors hover:bg-white/[0.03]">
      <span className="text-gray-600">#{visit.id}</span>
      <span className="font-medium" style={{ color: '#00ff88' }}>
        {visit.ipAddress}
      </span>
      <span>
        {visit.city}
        {visit.region ? `, ${visit.region}` : ''}
      </span>
      <span>{visit.countryCode || '—'}</span>
      <span className="text-xs" style={{ color: visit.gpsCity ? '#00ccff' : 'inherit' }}>
        {visit.gpsCity ? `${visit.gpsCity}${visit.gpsRegion ? `, ${visit.gpsRegion}` : ''}` : '—'}
      </span>
      <span className="text-xs" style={{ color: visit.gpsStreetAddress ? '#00ccff' : 'inherit' }}>
        {visit.gpsStreetAddress || '—'}
      </span>
      <span className="text-xs" style={{ color: visit.gpsZipCode ? '#00ccff' : 'inherit' }}>
        {visit.gpsZipCode || '—'}
      </span>
      <span
        className={`text-xs ${
          visit.gpsPermissionStatus === 'granted'
            ? 'text-[#00ff88]'
            : visit.gpsPermissionStatus === 'denied'
              ? 'text-[#ff0064]'
              : 'text-gray-600'
        }`}
      >
        {visit.gpsPermissionStatus
          ? visit.gpsPermissionStatus === 'granted'
            ? '✓ Granted'
            : visit.gpsPermissionStatus === 'denied'
              ? '✗ Denied'
              : visit.gpsPermissionStatus
          : '— No data'}
      </span>
      <span className="text-xs" style={{ color: visit.locationDistance ? '#00ccff' : 'inherit' }}>
        {visit.locationDistance ? `${parseFloat(visit.locationDistance).toFixed(2)} km` : '—'}
      </span>
      <span className="text-xs text-gray-600">{formatDate(visit.visitedAt)}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/visits?limit=${limit}&offset=${page * limit}`
      );
      const data: VisitsResponse = await response.json();

      if (data.error) throw new Error(data.error);

      setVisits(data.visits || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchVisits();
  }, [page]);

  return (
    <>
      <Head>
        <title>Visit Logs - IP Locator Admin</title>
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
        className="min-h-screen p-4 sm:p-6 lg:p-10 font-mono text-gray-200"
        style={{
          background:
            'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, rgba(10, 10, 15, 0.8) 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/"
                className="text-gray-600 text-xs no-underline transition-colors hover:text-[#00ff88]"
              >
                ← Back to main
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 text-xs transition-colors hover:text-[#ff0064] cursor-pointer"
              >
                Logout →
              </button>
            </div>
            <h1
              className="mb-2 text-2xl sm:text-3xl text-transparent bg-clip-text"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                background: 'linear-gradient(135deg, #00ff88, #00ccff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Visit Logs
            </h1>
            <p className="text-sm text-gray-600">
              {total} total visits recorded
            </p>
          </header>

          {/* GPS Statistics */}
          {!loading && visits.length > 0 && (
            <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 md:grid-cols-4">
              <div className="bg-white/[0.02] rounded-lg p-4 border border-[rgba(0,255,136,0.2)]">
                <div className="mb-1 text-xs text-gray-600 uppercase">
                  GPS Granted
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: '#00ff88' }}
                >
                  {
                    visits.filter(v => v.gpsPermissionStatus === 'granted')
                      .length
                  }
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-4 border border-[rgba(255,100,100,0.2)]">
                <div className="mb-1 text-xs text-gray-600 uppercase">
                  GPS Denied
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: '#ff0064' }}
                >
                  {
                    visits.filter(v => v.gpsPermissionStatus === 'denied')
                      .length
                  }
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-4 border border-[rgba(0,204,255,0.2)]">
                <div className="mb-1 text-xs text-gray-600 uppercase">
                  Avg Distance
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: '#00ccff' }}
                >
                  {(() => {
                    const withDistance = visits.filter(v => v.locationDistance);
                    if (withDistance.length === 0) return '—';
                    const avg =
                      withDistance.reduce(
                        (sum, v) => sum + parseFloat(v.locationDistance!),
                        0
                      ) / withDistance.length;
                    return `${avg.toFixed(1)} km`;
                  })()}
                </div>
              </div>

              <div className="bg-white/[0.02] rounded-lg p-4 border border-[rgba(0,204,255,0.2)]">
                <div className="mb-1 text-xs text-gray-600 uppercase">
                  Completion Rate
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: '#00ccff' }}
                >
                  {(() => {
                    const withGPS = visits.filter(
                      v => v.gpsPermissionStatus === 'granted'
                    ).length;
                    return `${((withGPS / visits.length) * 100).toFixed(0)}%`;
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-[#ff0064] rounded-lg p-4 mb-6 text-[#ff0064]">
              Error: {error}
            </div>
          )}

          {/* Table */}
          <div
            className="bg-white/[0.02] rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(0, 255, 136, 0.2)' }}
            role="region"
            aria-label="Visit logs table"
          >
            {/* Table Header */}
            <div
              className="hidden xl:grid xl:grid-cols-[60px_120px_150px_100px_150px_150px_100px_100px_100px_180px] gap-3 py-3.5 px-5 bg-black/30 text-[11px] text-gray-600 uppercase tracking-wide"
              style={{
                borderBottom: '1px solid rgba(0, 255, 136, 0.1)',
              }}
            >
              <span>ID</span>
              <span>IP Address</span>
              <span>Location (IP)</span>
              <span>Country</span>
              <span>Location (GPS)</span>
              <span>Street Address</span>
              <span>GPS ZIP</span>
              <span>GPS Status</span>
              <span>Distance</span>
              <span>Visited At</span>
            </div>

            {/* Loading */}
            {loading && (
              <div className="p-10 text-center" style={{ color: '#00ff88' }}>
                Loading...
              </div>
            )}

            {/* Rows */}
            {!loading &&
              visits.map(visit => (
                <React.Fragment key={visit.id}>
                  {/* Mobile/Tablet Card View */}
                  <VisitCard visit={visit} formatDate={formatDate} />

                  {/* Desktop Table Row */}
                  <VisitTableRow visit={visit} formatDate={formatDate} />
                </React.Fragment>
              ))}

            {/* Empty State */}
            {!loading && visits.length === 0 && (
              <div className="p-10 text-center text-gray-600">
                No visits recorded yet.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6">
              <button
                className="btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}

          {/* Refresh */}
          <div className="mt-6 text-center">
            <button className="btn" onClick={fetchVisits}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const sessionToken = context.req.cookies.session;

  if (!sessionToken) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const admin = await validateSession(sessionToken);

  if (!admin) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      admin: { id: admin.id, username: admin.username },
    },
  };
};
