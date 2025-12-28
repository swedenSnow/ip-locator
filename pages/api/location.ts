import { eq } from 'drizzle-orm';
import type { NextApiRequest, NextApiResponse } from 'next';

import { db } from '../../db';
import { visits } from '../../db/schema';
import { LogLevel, serverLog } from '../../utils/console';

interface GeoData {
  status: string;
  message?: string;
  query: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}

export interface GPSData {
  visitId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unavailable';
  errorMessage?: string;
}

interface NominatimResponse {
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    'ISO3166-2-lvl4'?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  display_name?: string;
}

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<NominatimResponse> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'IP-Locator-App/1.0',
      },
    }
  );
  return await response.json();
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseStateCode(iso3166: string | undefined): string | null {
  return iso3166 ? iso3166.split('-').pop() || null : null;
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the visitor's IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0].trim()
      : req.socket.remoteAddress;

    // For local development, use a test IP
    const queryIp = ip === '::1' || ip === '127.0.0.1' ? '' : ip;

    // Fetch geolocation data
    const geoResponse = await fetch(
      `http://ip-api.com/json/${queryIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
    );
    const geoData: GeoData = await geoResponse.json();

    if (geoData.status === 'fail') {
      throw new Error(geoData.message || 'Failed to fetch location');
    }

    // Save to database using Drizzle
    const savedRecord = await db
      .insert(visits)
      .values({
        ipAddress: geoData.query,
        city: geoData.city || null,
        region: geoData.regionName || null,
        regionCode: geoData.region || null,
        country: geoData.country || null,
        countryCode: geoData.countryCode || null,
        zipCode: geoData.zip || null,
        latitude: geoData.lat ? geoData.lat.toString() : null,
        longitude: geoData.lon ? geoData.lon.toString() : null,
        timezone: geoData.timezone || null,
        isp: geoData.isp || null,
        org: geoData.org || null,
        asNumber: geoData.as || null,
        userAgent: req.headers['user-agent'] || null,
      })
      .returning();

    res.status(200).json({
      ...geoData,
      visitId: savedRecord[0]?.id,
      savedAt: savedRecord[0]?.visitedAt,
    });
  } catch (error) {
    serverLog(LogLevel.ERROR, 'api/location', error);

    // If DB fails, still return geo data if we have it
    const errorMessage = error instanceof Error ? error.message : '';
    if (
      errorMessage?.includes('relation') ||
      errorMessage?.includes('connect')
    ) {
      // Database not set up yet, return geo data without saving
      try {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded
          ? Array.isArray(forwarded)
            ? forwarded[0]
            : forwarded.split(',')[0].trim()
          : req.socket.remoteAddress;
        const queryIp = ip === '::1' || ip === '127.0.0.1' ? '' : ip;

        const geoResponse = await fetch(
          `http://ip-api.com/json/${queryIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
        );
        const geoData: GeoData = await geoResponse.json();

        return res.status(200).json({
          ...geoData,
          dbWarning: 'Database not configured. Data not saved.',
        });
      } catch (geoError) {
        return res.status(500).json({ error: 'Failed to fetch location data' });
      }
    }

    res.status(500).json({ error: errorMessage || 'Unknown error' });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const gpsData: GPSData = req.body;

    // Validate required fields (allow 0 as valid coordinate)
    if (
      gpsData.visitId === null ||
      gpsData.visitId === undefined ||
      gpsData.latitude === null ||
      gpsData.latitude === undefined ||
      gpsData.longitude === null ||
      gpsData.longitude === undefined
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the visit record to calculate distance
    const visitRecords = await db
      .select()
      .from(visits)
      .where(eq(visits.id, gpsData.visitId))
      .limit(1);

    if (visitRecords.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    const visit = visitRecords[0];
    const ipLat = parseFloat(visit.latitude || '0');
    const ipLon = parseFloat(visit.longitude || '0');

    // Handle permission denial or unavailability
    if (gpsData.permissionStatus !== 'granted') {
      await db
        .update(visits)
        .set({
          gpsPermissionStatus: gpsData.permissionStatus,
          gpsErrorMessage: gpsData.errorMessage || null,
        })
        .where(eq(visits.id, gpsData.visitId));

      return res.status(200).json({
        success: true,
        permissionStatus: gpsData.permissionStatus,
      });
    }

    // Do reverse geocoding to get address from GPS coordinates
    const geocodeResult = await reverseGeocode(
      gpsData.latitude,
      gpsData.longitude
    );

    // Parse address from Nominatim response
    const address = geocodeResult.address;
    const city = address?.city || address?.town || address?.village || null;
    const region = address?.state || null;
    const regionCode = parseStateCode(address?.['ISO3166-2-lvl4']);
    const country = address?.country || null;
    const countryCode = address?.country_code?.toUpperCase() || null;
    const zipCode = address?.postcode || null;
    const streetAddress =
      address?.road && address?.house_number
        ? `${address.house_number} ${address.road}`
        : address?.road || null;

    // Calculate distance between IP coordinates and GPS coordinates
    const distance = calculateDistance(
      ipLat,
      ipLon,
      gpsData.latitude,
      gpsData.longitude
    );

    // Update visit record with GPS data
    await db
      .update(visits)
      .set({
        gpsLatitude: gpsData.latitude.toString(),
        gpsLongitude: gpsData.longitude.toString(),
        gpsAccuracy: gpsData.accuracy.toString(),
        gpsCity: city,
        gpsRegion: region,
        gpsRegionCode: regionCode,
        gpsCountry: country,
        gpsCountryCode: countryCode,
        gpsZipCode: zipCode,
        gpsStreetAddress: streetAddress,
        gpsPermissionStatus: gpsData.permissionStatus,
        gpsErrorMessage: gpsData.errorMessage || null,
        locationDistance: distance.toString(),
      })
      .where(eq(visits.id, gpsData.visitId));

    // Return GPS address data to frontend
    res.status(200).json({
      success: true,
      gpsCity: city,
      gpsRegion: region,
      gpsCountry: country,
      gpsCountryCode: countryCode,
      gpsZipCode: zipCode,
      gpsStreetAddress: streetAddress,
      gpsLat: gpsData.latitude,
      gpsLon: gpsData.longitude,
      gpsAccuracy: gpsData.accuracy,
      locationDistance: distance,
    });
  } catch (error) {
    serverLog(LogLevel.ERROR, 'api/location/gps', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Existing GET logic for IP geolocation
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    // New POST logic for GPS data
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
