import { pgTable, serial, varchar, decimal, timestamp, text, integer } from 'drizzle-orm/pg-core';

export const visits = pgTable('visits', {
  id: serial('id').primaryKey(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  city: varchar('city', { length: 100 }),
  region: varchar('region', { length: 100 }),
  regionCode: varchar('region_code', { length: 10 }),
  country: varchar('country', { length: 100 }),
  countryCode: varchar('country_code', { length: 5 }),
  zipCode: varchar('zip_code', { length: 20 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  // GPS Coordinates
  gpsLatitude: decimal('gps_latitude', { precision: 10, scale: 7 }),
  gpsLongitude: decimal('gps_longitude', { precision: 10, scale: 7 }),
  gpsAccuracy: decimal('gps_accuracy', { precision: 10, scale: 2 }),

  // GPS-derived Address (from reverse geocoding)
  gpsCity: varchar('gps_city', { length: 100 }),
  gpsRegion: varchar('gps_region', { length: 100 }),
  gpsRegionCode: varchar('gps_region_code', { length: 10 }),
  gpsCountry: varchar('gps_country', { length: 100 }),
  gpsCountryCode: varchar('gps_country_code', { length: 5 }),
  gpsZipCode: varchar('gps_zip_code', { length: 20 }),
  gpsStreetAddress: varchar('gps_street_address', { length: 255 }),

  // GPS Metadata
  gpsPermissionStatus: varchar('gps_permission_status', { length: 20 }),
  gpsErrorMessage: text('gps_error_message'),
  locationDistance: decimal('location_distance', { precision: 10, scale: 2 }),

  timezone: varchar('timezone', { length: 50 }),
  isp: varchar('isp', { length: 255 }),
  org: varchar('org', { length: 255 }),
  asNumber: varchar('as_number', { length: 255 }),
  userAgent: text('user_agent'),
  visitedAt: timestamp('visited_at', { withTimezone: true }).defaultNow().notNull(),
});

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  adminId: integer('admin_id').references(() => admins.id).notNull(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
