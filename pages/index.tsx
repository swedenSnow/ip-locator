import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

import type { GPSData } from './api/location';

import { LogLevel, clientLog } from '../utils/console';

interface LocationData {
  query: string;
  city: string;
  regionName: string;
  country: string;
  countryCode: string;
  zip: string;
  lat?: number;
  lon?: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  visitId?: number;
  dbWarning?: string;
  status?: string;
  message?: string;
  // GPS coordinates
  gpsLat?: number;
  gpsLon?: number;
  gpsAccuracy?: number;
  // GPS-derived address
  gpsCity?: string;
  gpsRegion?: string;
  gpsCountry?: string;
  gpsCountryCode?: string;
  gpsZipCode?: string;
  gpsStreetAddress?: string;
  // GPS metadata
  gpsPermissionStatus?: string;
  locationDistance?: number;
}

export default function IPLocator() {
  const [data, setData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Call our API which fetches location AND saves to DB
        const response = await fetch('/api/location');
        const result = await response.json();

        if (result.status === 'fail') {
          throw new Error(result.message || 'Failed to fetch location');
        }

        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const updateGPSData = async (gpsData: GPSData) => {
    try {
      await fetch('/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gpsData),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      clientLog(LogLevel.ERROR, `Failed to update GPS data: ${errorMessage}`);
    }
  };

  const requestGPSLocation = async () => {
    if (!data?.visitId) {
      setGpsError('No visit ID available');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by browser');
      await updateGPSData({
        visitId: data.visitId as number,
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        permissionStatus: 'unavailable',
        errorMessage: 'Geolocation API not available',
      });
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const response = await fetch('/api/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              visitId: data.visitId as number,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              permissionStatus: 'granted',
            }),
          });

          const result = await response.json();

          if (result.success) {
            // Update local state with GPS data
            setData({
              ...data,
              gpsLat: result.gpsLat,
              gpsLon: result.gpsLon,
              gpsAccuracy: result.gpsAccuracy,
              gpsCity: result.gpsCity,
              gpsRegion: result.gpsRegion,
              gpsCountry: result.gpsCountry,
              gpsCountryCode: result.gpsCountryCode,
              gpsZipCode: result.gpsZipCode,
              gpsStreetAddress: result.gpsStreetAddress,
              gpsPermissionStatus: 'granted',
              locationDistance: result.locationDistance,
            });

            setGpsEnabled(true);
          } else {
            setGpsError('Failed to save GPS data');
          }

          setGpsLoading(false);
        } catch (err) {
          setGpsError('Failed to save GPS data');
          setGpsLoading(false);
        }
      },
      async error => {
        const permissionStatus =
          error.code === error.PERMISSION_DENIED ? 'denied' : 'prompt';
        setGpsError(error.message);

        await updateGPSData({
          visitId: data.visitId as number,
          latitude: 0,
          longitude: 0,
          accuracy: 0,
          permissionStatus,
          errorMessage: error.message,
        });

        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const formatValue = (value: string | number | undefined): string =>
    value?.toString() || 'N/A';

  const dataFields = data
    ? [
        // IP-based fields
        { label: 'IP Address', value: data.query, icon: '◉' },
        { label: 'City (IP)', value: data.city, icon: '⌂' },
        { label: 'Region (IP)', value: data.regionName, icon: '◈' },
        {
          label: 'Country (IP)',
          value: `${data.country} (${data.countryCode})`,
          icon: '⚑',
        },
        { label: 'ZIP Code (IP)', value: data.zip, icon: '▤' },
        {
          label: 'Coordinates (IP)',
          value: `${data.lat?.toFixed(4)}, ${data.lon?.toFixed(4)}`,
          icon: '✦',
        },

        // GPS-based fields (only show if GPS data available)
        ...(data.gpsCity
          ? [
              {
                label: 'Street Address (GPS)',
                value: data.gpsStreetAddress,
                icon: '◉',
                color: '#ff00aa',
              },
              {
                label: 'City (GPS)',
                value: data.gpsCity,
                icon: '⌂',
                color: '#ff00aa',
              },
              {
                label: 'Region (GPS)',
                value: data.gpsRegion,
                icon: '◈',
                color: '#ff00aa',
              },
              {
                label: 'ZIP Code (GPS)',
                value: data.gpsZipCode,
                icon: '▤',
                color: '#ff00aa',
              },
              {
                label: 'Coordinates (GPS)',
                value: `${data.gpsLat?.toFixed(7)}, ${data.gpsLon?.toFixed(7)}`,
                icon: '✦',
                color: '#ff00aa',
              },
              {
                label: 'GPS Accuracy',
                value: `±${data.gpsAccuracy?.toFixed(0)}m`,
                icon: '◎',
                color: '#ff00aa',
              },
              {
                label: 'Location Difference',
                value: `${data.locationDistance?.toFixed(2)} km`,
                icon: '⟷',
                color: '#ff00aa',
              },
            ]
          : []),

        // Other existing fields
        {
          label: 'Timezone',
          value: data.timezone,
          icon: '◔',
          color: '#00e1ff',
        },
        { label: 'ISP', value: data.isp, icon: '⧫', color: '#00e1ff' },
        {
          label: 'Organization',
          value: data.org,
          icon: '◇',
          color: '#00e1ff',
        },
        {
          label: 'AS Number',
          value: data.as,
          icon: '⬡',
          color: '#00e1ff',
        },
        ...(data.visitId
          ? [
              {
                label: 'Visit ID',
                value: `#${data.visitId}`,
                icon: '⬢',
                color: '#00e1ff',
              },
            ]
          : []),
      ]
    : [];

  const isSaved = data?.visitId !== null && data?.visitId !== undefined;

  // Calculate preferred coordinates (GPS if available, fallback to IP)
  const mapCoords = useMemo(() => {
    const lat = data?.gpsLat ?? data?.lat;
    const lon = data?.gpsLon ?? data?.lon;
    return lat && lon ? { lat, lon } : null;
  }, [data?.gpsLat, data?.gpsLon, data?.lat, data?.lon]);

  return (
    <>
      <Head>
        <title>IP Locator</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div
        className="min-h-screen p-10 font-mono text-gray-200"
        style={{
          background:
            'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, rgba(10, 10, 15, 0.8) 100%)',
        }}
      >
        <div className="scanline" />

        <div className="max-w-[700px] mx-auto">
          {/* Header */}
          <header className="mb-12 text-center">
            <div
              className="text-xs tracking-[4px] mb-4 uppercase"
              style={{ color: '#00ff88' }}
            >
              [ System Active ]
            </div>

            <h1
              className="glitch-text text-[clamp(32px,8vw,56px)] font-bold m-0 bg-clip-text text-transparent -tracking-tight"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                background:
                  'linear-gradient(135deg, #00ff88 0%, #00ccff 50%, #ff00aa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              IP LOCATOR FOR FASCISTS AND ZIONISTS
            </h1>

            {loading ? (
              <p className="mt-3 text-sm text-gray-600">
                <span style={{ color: '#00ff88' }}>▶</span>
                Detecting your network signature...
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-600">Got you 🔻</p>
            )}
          </header>

          {/* Main Content */}
          <main>
            {loading && (
              <div className="px-5 py-16 text-center">
                <div className="mb-6 text-5xl">
                  <span className="animate-pulse-slow">◉</span>
                </div>
                <div
                  className="text-sm tracking-wider"
                  style={{ color: '#00ff88' }}
                >
                  SCANNING NETWORK...
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-[#ff0064] rounded-lg p-6 text-center">
                <div className="text-[#ff0064] text-2xl mb-3">⚠</div>
                <div className="text-[#ff0064]">Error: {error}</div>
              </div>
            )}

            {data && (
              <>
                {/* Saved indicator with GPS button */}
                <div className="flex justify-center gap-3 mb-4">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-full"
                    style={{
                      background: isSaved
                        ? 'rgba(0, 255, 136, 0.1)'
                        : 'rgba(250, 204, 21, 0.1)',
                      border: isSaved
                        ? '1px solid rgba(0, 255, 136, 0.3)'
                        : '1px solid rgba(250, 204, 21, 0.3)',
                      color: isSaved ? '#00ff88' : '#facc15',
                    }}
                  >
                    <span>{isSaved ? '✓' : '⚠'}</span>
                    <span>
                      {isSaved
                        ? 'Saved to database'
                        : data.dbWarning || 'Not saved'}
                    </span>
                  </div>

                  {/* GPS button */}
                  {isSaved && !gpsEnabled && !gpsLoading && (
                    <button
                      onClick={requestGPSLocation}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all hover:bg-[rgba(0,204,255,0.2)]"
                      style={{
                        background: 'rgba(0, 204, 255, 0.1)',
                        border: '1px solid rgba(0, 204, 255, 0.3)',
                        color: '#00ccff',
                        cursor: 'pointer',
                      }}
                    >
                      <span>Undo X</span>
                    </button>
                  )}

                  {/* GPS Enabled indicator */}
                  {gpsEnabled && (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-full"
                      style={{
                        background: 'rgba(0, 204, 255, 0.1)',
                        border: '1px solid rgba(0, 204, 255, 0.3)',
                        color: '#00ccff',
                      }}
                    >
                      <span>✓</span>
                      <span>GPS Enabled</span>
                    </div>
                  )}

                  {/* GPS Loading state */}
                  {gpsLoading && (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs rounded-full"
                      style={{
                        background: 'rgba(0, 204, 255, 0.1)',
                        border: '1px solid rgba(0, 204, 255, 0.3)',
                        color: '#00ccff',
                      }}
                    >
                      <span className="animate-pulse-slow">📡</span>
                      <span>Getting GPS location...</span>
                    </div>
                  )}
                </div>

                {/* GPS Error Display */}
                {gpsError && (
                  <div className="flex justify-center mb-4">
                    <div className="text-xs text-[#ff0064]">
                      GPS Error: {gpsError}
                    </div>
                  </div>
                )}

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
                      location_data.json
                    </span>
                  </div>

                  {/* Data Grid */}
                  <div className="py-2">
                    {dataFields.map((field, index) => (
                      <div
                        key={field.label}
                        className="data-row sm:grid sm:grid-cols-[24px_140px_1fr] gap-4 px-5 py-3.5 border-b border-white/[0.03] last:border-0 transition-all duration-200 flex flex-col"
                        style={{
                          animationDelay: `${index * 0.05}s`,
                        }}
                      >
                        <span
                          className="text-sm"
                          style={{
                            color:
                              'color' in field
                                ? (field.color as string)
                                : '#00ff88',
                          }}
                        >
                          {field.icon}
                        </span>
                        <span className="text-xs tracking-wide text-gray-600 uppercase">
                          {field.label}
                        </span>
                        <span className="text-sm font-medium text-white break-words">
                          {formatValue(field.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map Preview (if we have coordinates) */}
                {mapCoords && (
                  <div
                    className="mt-6 bg-white/[0.02] rounded-xl overflow-hidden"
                    style={{
                      border: '1px solid rgba(0, 255, 136, 0.2)',
                    }}
                  >
                    <div
                      className="px-4 py-3 text-xs tracking-wider text-gray-600 uppercase"
                      style={{
                        borderBottom: '1px solid rgba(0, 255, 136, 0.1)',
                      }}
                    >
                      <span style={{ color: '#00ff88' }}>◉</span> Location
                      Preview
                    </div>
                    <Link
                      href={`https://www.openstreetmap.org/?mlat=${mapCoords.lat}&mlon=${mapCoords.lon}#map=12/${mapCoords.lat}/${mapCoords.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-6 text-center no-underline transition-all hover:bg-[rgba(0,204,255,0.05)]"
                      style={{ color: '#00ccff' }}
                    >
                      <div className="mb-3 text-3xl">🗺️</div>
                      <div className="text-xs">View on OpenStreetMap →</div>
                    </Link>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="mt-12 text-center text-gray-700 text-[11px]">
            <div className="mb-2">
              Powered by{' '}
              <Link
                href="http://ip-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600"
              >
                ip-api.com
              </Link>
            </div>
            <div>⚡ Data refreshes on each visit</div>
          </footer>
        </div>
      </div>
    </>
  );
}
