// Server-safe ZIP → USDA hardiness zone estimator.
// Originally lived in app/context/FieldStationContext.tsx (a "use client" file),
// which made it unimportable from server routes. Moved here so both the
// client context and server API routes can use the same function.

export function getGrowingZoneFromZip(zipCode: string): string | undefined {
  const zipNum = parseInt(zipCode.substring(0, 3), 10);

  if (zipNum >= 0 && zipNum <= 99) return '5b';
  if (zipNum >= 100 && zipNum <= 199) return '6b';
  if (zipNum >= 200 && zipNum <= 299) return '7b';
  if (zipNum >= 300 && zipNum <= 399) return '8b';
  if (zipNum >= 400 && zipNum <= 499) return '6a';
  if (zipNum >= 500 && zipNum <= 599) return '4b';
  if (zipNum >= 600 && zipNum <= 699) return '5b';
  if (zipNum >= 700 && zipNum <= 799) return '8a';
  if (zipNum >= 800 && zipNum <= 899) return '5b';
  if (zipNum >= 900 && zipNum <= 999) {
    if (zipNum >= 900 && zipNum <= 930) return '10a';
    return '8b';
  }

  return '6a';
}
