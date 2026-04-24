import tzlookup from "tz-lookup";
import { DateTime } from "luxon";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  timezoneId: string;
  utcDate: Date;
  utcTimeTimestamp: number;
  localDateTimestamp: number;
}

/**
 * Calculates GeoCoordinates, Timezone, and exact UTC time for astrology calculations.
 * 
 * @param location String describing birthplace, e.g. "Ho Chi Minh City", "Hanoi, Vietnam"
 * @param dateOfBirthTimestamp The user's birthdate (typically standard timestamp from DatePicker, normalized to 00:00 of that day)
 * @param birthTime Local birth time, e.g. "14:30"
 */
export async function processLocationAndTime(
  location: string,
  dateOfBirthTimestamp: number,
  birthTime: string
): Promise<GeocodingResult> {
  // 1. Geocoding
  let latitude = 10.8231; // Default: HCMC
  let longitude = 106.6297;
  
  if (location && location.trim() !== "") {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`, {
        headers: {
          "User-Agent": "SoulSyncApp/1.0"
        }
      });
      const res = await response.json();
      if (res && res.length > 0 && res[0].lat && res[0].lon) {
        latitude = parseFloat(res[0].lat);
        longitude = parseFloat(res[0].lon);
      }
    } catch (e) {
      console.warn(`Geocoding failed for '${location}', falling back to default coordinates. Error:`, e);
    }
  }

  // 2. Timezone Lookup
  const timezoneId = tzlookup(latitude, longitude); // Returns standard IANA Timezone, e.g. "Asia/Ho_Chi_Minh"

  // 3. Parse Local Time
  const dateObj = new Date(dateOfBirthTimestamp);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();

  const [hoursStr, minutesStr] = birthTime.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  // 4. Convert Local Time to precise UTC Time using Luxon
  const localDateTime = DateTime.fromObject(
    {
      year,
      month,
      day,
      hour: isNaN(hours) ? 12 : hours,
      minute: isNaN(minutes) ? 0 : minutes,
    },
    { zone: timezoneId }
  );

  const utcDateTime = localDateTime.toUTC();

  return {
    latitude,
    longitude,
    timezoneId,
    utcDate: utcDateTime.toJSDate(),
    utcTimeTimestamp: utcDateTime.toMillis(),
    localDateTimestamp: localDateTime.toMillis(), // Used to verify original local time
  };
}
