import {
  normalizeAmenitiesForStorage,
  parseStoredAmenity,
  type AmenityPayload,
} from './amenities';

/**
 * Parses a money-like string after stripping common currency symbols and thousands separators.
 * Accepts only digits and a single optional decimal point (e.g. 5000, 5000.50, 5,000).
 */
export function parseMoneyAmount(raw: string): number | null {
  const s = raw
    .trim()
    .replace(/^[\s$€£₹]+/u, '')
    .replace(/^(rs\.?|inr)\s*/i, '')
    .replace(/,/g, '')
    .trim();
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

/** Stricter than a single loose regex: no spaces, no .., valid-looking local@host.tld. */
function isValidEmailFormat(s: string): boolean {
  if (/\s/.test(s) || s.length > 254 || s.includes('..')) return false;
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(s)) return false;
  const [local, domain] = s.split('@');
  if (!local || !domain || local.length > 64 || domain.length > 253) return false;
  if (local.startsWith('.') || local.endsWith('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }
  return true;
}

export const FARM_LIMITS = {
  name: 200,
  location: 500,
  description: 10000,
  price: 80,
  capacity: 120,
  discount: 120,
  phone: 40,
  amenityName: 80,
  featureItem: 200,
  lineItem: 500,
} as const;

export type FarmFormStrings = {
  name: string;
  location: string;
  description: string;
  price: string;
  originalPrice: string;
  rating: string;
  reviews: string;
  capacity: string;
  featuresText: string;
  amenities: { name: string }[];
  facilitiesText: string;
  rulesText: string;
  weekdayPrice: string;
  weekendPrice: string;
  contactPhone: string;
  contactEmail: string;
  discount: string;
};

export function validateRequiredMonetaryField(value: string, label: string): string | undefined {
  const s = value.trim();
  if (!s) return `${label} is required.`;
  if (s.length > FARM_LIMITS.price) return `${label} is too long.`;
  const n = parseMoneyAmount(s);
  if (n === null) {
    return `${label} must be a valid amount (numbers only; optional one decimal point, e.g. 5000 or 4999.99).`;
  }
  if (n === 0) return `${label} must be greater than zero.`;
  return undefined;
}

export function validateCapacityField(value: string, fieldLabel = 'Capacity'): string | undefined {
  const s = value.trim();
  if (!s) return `${fieldLabel} is required.`;
  if (s.length > FARM_LIMITS.capacity) return `${fieldLabel} must be ${FARM_LIMITS.capacity} characters or less.`;
  if (!/^\d+$/.test(s)) return `${fieldLabel} must be a whole number (digits only, e.g. 12).`;
  const n = parseInt(s, 10);
  if (n < 1 || n > 99999) return `${fieldLabel} must be between 1 and 99999.`;
  return undefined;
}

/** Optional rating: empty ok; otherwise digits and at most one decimal, range 0–5. */
export function validateOptionalRating(value: string): string | undefined {
  const t = value.trim();
  if (!t) return undefined;
  if (!/^\d+(\.\d+)?$/.test(t)) return 'Rating must contain numbers only (optional one decimal point).';
  const n = Number(t);
  if (Number.isNaN(n)) return 'Rating must be a valid number.';
  if (n < 0 || n > 5) return 'Rating must be between 0 and 5.';
  return undefined;
}

/** Optional reviews: empty ok; otherwise digits only, whole number ≥ 0. */
export function validateOptionalReviews(value: string): string | undefined {
  const t = value.trim();
  if (!t) return undefined;
  if (!/^\d+$/.test(t)) return 'Reviews count must be a whole number (digits only).';
  const n = parseInt(t, 10);
  if (n < 0) return 'Reviews count cannot be negative.';
  return undefined;
}

export function validateDiscountOptional(value: string): string | undefined {
  const s = value.trim();
  if (!s) return undefined;
  if (s.length > FARM_LIMITS.discount) return `Discount label must be ${FARM_LIMITS.discount} characters or less.`;
  return undefined;
}

export function validateContactEmail(value: string): string | undefined {
  const s = value.trim();
  if (!s) return 'Contact email is required.';
  if (!isValidEmailFormat(s)) return 'Enter a valid email address.';
  return undefined;
}

/** Indian mobile: 10 digits, first digit 6–9. Optional +91 / 91 prefix is stripped. */
export function normalizeIndianMobileDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

export function validateContactPhone(value: string): string | undefined {
  const s = value.trim();
  if (!s) return 'Contact phone is required.';
  if (s.length > FARM_LIMITS.phone) return 'Phone number is too long.';
  if (!/^[\d+\s().-]+$/.test(s)) {
    return 'Phone may only contain digits, spaces, +, (, ), and hyphens.';
  }
  const digits = normalizeIndianMobileDigits(s);
  if (!/^[6789]\d{9}$/.test(digits)) {
    return 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
  }
  return undefined;
}

export function validateRequiredText(
  value: string,
  fieldLabel: string,
  maxLen: number,
  minLen = 1,
): string | undefined {
  const s = value.trim();
  if (!s) return `${fieldLabel} is required.`;
  if (s.length < minLen) return `${fieldLabel} must be at least ${minLen} character${minLen === 1 ? '' : 's'}.`;
  if (s.length > maxLen) return `${fieldLabel} must be ${maxLen} characters or less.`;
  return undefined;
}

export function validateFeaturesFromText(featuresText: string): string | undefined {
  const features = featuresText
    .split(/[,\n]/g)
    .map((x) => x.trim())
    .filter(Boolean);
  if (features.length === 0) return 'At least one feature is required.';
  const tooLong = features.find((f) => f.length > FARM_LIMITS.featureItem);
  if (tooLong) return `Each feature must be ${FARM_LIMITS.featureItem} characters or less.`;
  const tooShort = features.find((f) => f.length < 2);
  if (tooShort) return 'Each feature must be at least 2 characters.';
  return undefined;
}

export function validateAmenityNames(amenities: { name: string }[]): string | undefined {
  const named = amenities.map((a) => a.name.trim()).filter(Boolean);
  if (named.length === 0) return 'At least one amenity with a name is required.';
  const tooLong = named.find((n) => n.length > FARM_LIMITS.amenityName);
  if (tooLong) return `Each amenity name must be ${FARM_LIMITS.amenityName} characters or less.`;
  const tooShort = named.find((n) => n.length < 2);
  if (tooShort) return 'Each amenity name must be at least 2 characters.';
  return undefined;
}

export function validateMultilineRequired(text: string, fieldLabel: string): string | undefined {
  const lines = text
    .split(/\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return `${fieldLabel} are required.`;
  const tooLong = lines.find((l) => l.length > FARM_LIMITS.lineItem);
  if (tooLong) {
    return `Each line under ${fieldLabel} must be ${FARM_LIMITS.lineItem} characters or less.`;
  }
  const tooShort = lines.find((l) => l.length < 2);
  if (tooShort) {
    return `Each line under ${fieldLabel} must be at least 2 characters.`;
  }
  return undefined;
}

export type FarmCreateClientExtras = {
  photoCount: number;
  hasThumbnail: boolean;
};

export function collectCreateFarmFieldErrors(
  s: FarmFormStrings,
  extras: FarmCreateClientExtras,
): Record<string, string> {
  const errs: Record<string, string> = {};

  const nameErr = validateRequiredText(s.name, 'Name', FARM_LIMITS.name, 2);
  if (nameErr) errs.name = nameErr;

  const locErr = validateRequiredText(s.location, 'Location', FARM_LIMITS.location, 2);
  if (locErr) errs.location = locErr;

  const descErr = validateRequiredText(s.description, 'Description', FARM_LIMITS.description, 10);
  if (descErr) errs.description = descErr;

  const priceErr = validateRequiredMonetaryField(s.price, 'Display price');
  if (priceErr) errs.price = priceErr;

  const origErr = validateRequiredMonetaryField(s.originalPrice, 'Original price');
  if (origErr) errs.originalPrice = origErr;

  const capErr = validateCapacityField(s.capacity);
  if (capErr) errs.capacity = capErr;

  const featErr = validateFeaturesFromText(s.featuresText);
  if (featErr) errs.featuresText = featErr;

  const amErr = validateAmenityNames(s.amenities);
  if (amErr) errs.amenities = amErr;

  const facErr = validateMultilineRequired(s.facilitiesText, 'Facilities');
  if (facErr) errs.facilitiesText = facErr;

  const rulesErr = validateMultilineRequired(s.rulesText, 'Rules');
  if (rulesErr) errs.rulesText = rulesErr;

  const wdErr = validateRequiredMonetaryField(s.weekdayPrice, 'Weekday 24h price');
  if (wdErr) errs.weekdayPrice = wdErr;

  const weErr = validateRequiredMonetaryField(s.weekendPrice, 'Weekend 24h price');
  if (weErr) errs.weekendPrice = weErr;

  const phoneErr = validateContactPhone(s.contactPhone);
  if (phoneErr) errs.contactPhone = phoneErr;

  const emailErr = validateContactEmail(s.contactEmail);
  if (emailErr) errs.contactEmail = emailErr;

  const rErr = validateOptionalRating(s.rating);
  if (rErr) errs.rating = rErr;

  const revErr = validateOptionalReviews(s.reviews);
  if (revErr) errs.reviews = revErr;

  const discErr = validateDiscountOptional(s.discount);
  if (discErr) errs.discount = discErr;

  if (!extras.hasThumbnail) {
    errs.thumbnail = 'A thumbnail image is required (one image only).';
  }

  if (extras.photoCount < 10) {
    errs.photos = 'At least 10 gallery images are required.';
  }

  return errs;
}

export function collectEditFarmFieldErrors(s: FarmFormStrings): Record<string, string> {
  const errs: Record<string, string> = {};

  const nameErr = validateRequiredText(s.name, 'Name', FARM_LIMITS.name, 2);
  if (nameErr) errs.name = nameErr;

  const locErr = validateRequiredText(s.location, 'Location', FARM_LIMITS.location, 2);
  if (locErr) errs.location = locErr;

  const descErr = validateRequiredText(s.description, 'Description', FARM_LIMITS.description, 10);
  if (descErr) errs.description = descErr;

  const priceErr = validateRequiredMonetaryField(s.price, 'Display price');
  if (priceErr) errs.price = priceErr;

  const origErr = validateRequiredMonetaryField(s.originalPrice, 'Original price');
  if (origErr) errs.originalPrice = origErr;

  const capErr = validateCapacityField(s.capacity);
  if (capErr) errs.capacity = capErr;

  const featErr = validateFeaturesFromText(s.featuresText);
  if (featErr) errs.featuresText = featErr;

  const amErr = validateAmenityNames(s.amenities);
  if (amErr) errs.amenities = amErr;

  const facErr = validateMultilineRequired(s.facilitiesText, 'Facilities');
  if (facErr) errs.facilitiesText = facErr;

  const rulesErr = validateMultilineRequired(s.rulesText, 'Rules');
  if (rulesErr) errs.rulesText = rulesErr;

  const wdErr = validateRequiredMonetaryField(s.weekdayPrice, 'Weekday 24h price');
  if (wdErr) errs.weekdayPrice = wdErr;

  const weErr = validateRequiredMonetaryField(s.weekendPrice, 'Weekend 24h price');
  if (weErr) errs.weekendPrice = weErr;

  const phoneErr = validateContactPhone(s.contactPhone);
  if (phoneErr) errs.contactPhone = phoneErr;

  const emailErr = validateContactEmail(s.contactEmail);
  if (emailErr) errs.contactEmail = emailErr;

  const rErr = validateOptionalRating(s.rating);
  if (rErr) errs.rating = rErr;

  const revErr = validateOptionalReviews(s.reviews);
  if (revErr) errs.reviews = revErr;

  const discErr = validateDiscountOptional(s.discount);
  if (discErr) errs.discount = discErr;

  return errs;
}

type FarmCorePayload = {
  name?: string;
  location?: string | null;
  description?: string | null;
  price?: string | null;
  originalPrice?: string | null;
  rating?: number | null;
  reviews?: number | null;
  capacity?: string | null;
  features?: string[];
  amenities?: AmenityPayload[];
  facilities?: string[];
  rules?: string[];
  contactPhone?: string | null;
  contactEmail?: string | null;
  discount?: string | null;
  weekdayPrice?: string | null;
  weekendPrice?: string | null;
};

function validateFarmCorePayload(input: FarmCorePayload): string | null {
  const name = (input.name ?? '').trim();
  if (!name) return 'Name is required.';
  if (name.length < 2) return 'Name must be at least 2 characters.';
  if (name.length > FARM_LIMITS.name) return `Name must be ${FARM_LIMITS.name} characters or less.`;

  const locErr = validateRequiredText(input.location ?? '', 'Location', FARM_LIMITS.location, 2);
  if (locErr) return locErr;

  const descErr = validateRequiredText(input.description ?? '', 'Description', FARM_LIMITS.description, 10);
  if (descErr) return descErr;

  const p1 = validateRequiredMonetaryField(input.price ?? '', 'Display price');
  if (p1) return p1;
  const p2 = validateRequiredMonetaryField(input.originalPrice ?? '', 'Original price');
  if (p2) return p2;

  const capErr = validateCapacityField(input.capacity ?? '');
  if (capErr) return capErr;

  const features = Array.isArray(input.features) ? input.features : [];
  const featureStrings = features.map((x) => String(x).trim()).filter(Boolean);
  if (featureStrings.length === 0) return 'At least one feature is required.';
  const featErr = validateFeaturesFromText(featureStrings.join('\n'));
  if (featErr) return featErr;

  const amenitiesRaw = Array.isArray(input.amenities) ? input.amenities : [];
  const amenitiesStored = normalizeAmenitiesForStorage(amenitiesRaw);
  if (amenitiesStored.length === 0) {
    return 'At least one amenity with a name is required.';
  }
  const amenityItems = amenitiesStored.map((raw) => parseStoredAmenity(raw));
  const amErr = validateAmenityNames(amenityItems);
  if (amErr) return amErr;

  const facilities = Array.isArray(input.facilities) ? input.facilities : [];
  if (!facilities.some((x) => String(x).trim())) {
    return 'At least one facility is required.';
  }
  const facErr = validateMultilineRequired(facilities.map((x) => String(x).trim()).join('\n'), 'Facilities');
  if (facErr) return facErr;

  const rules = Array.isArray(input.rules) ? input.rules : [];
  if (!rules.some((x) => String(x).trim())) {
    return 'At least one rule is required.';
  }
  const rulesErr = validateMultilineRequired(rules.map((x) => String(x).trim()).join('\n'), 'Rules');
  if (rulesErr) return rulesErr;

  const wdErr = validateRequiredMonetaryField(input.weekdayPrice ?? '', 'Weekday 24h price');
  if (wdErr) return wdErr;
  const weErr = validateRequiredMonetaryField(input.weekendPrice ?? '', 'Weekend 24h price');
  if (weErr) return weErr;

  const phErr = validateContactPhone(input.contactPhone ?? '');
  if (phErr) return phErr;
  const emErr = validateContactEmail(input.contactEmail ?? '');
  if (emErr) return emErr;

  if (input.rating != null && input.rating !== undefined) {
    if (typeof input.rating !== 'number' || Number.isNaN(input.rating)) return 'Rating must be a number.';
    if (input.rating < 0 || input.rating > 5) return 'Rating must be between 0 and 5.';
    const str = String(input.rating);
    if (!/^\d+(\.\d+)?$/.test(str)) return 'Rating must be a valid number.';
  }

  if (input.reviews != null && input.reviews !== undefined) {
    if (typeof input.reviews !== 'number' || !Number.isInteger(input.reviews)) {
      return 'Reviews count must be a whole number.';
    }
    if (input.reviews < 0) return 'Reviews count cannot be negative.';
  }

  const dErr = validateDiscountOptional(input.discount ?? '');
  if (dErr) return dErr;

  return null;
}

/** Server-side validation for POST /farms (single farm entry). */
export function validateFarmCreatePayload(
  input: FarmCorePayload & {
    thumbnailImageUrl?: string | null;
    photoImageUrls?: string[];
  },
): string | null {
  const core = validateFarmCorePayload(input);
  if (core) return core;

  const thumb = typeof input.thumbnailImageUrl === 'string' ? input.thumbnailImageUrl.trim() : '';
  if (!thumb) return 'A thumbnail image URL is required.';

  const photos = Array.isArray(input.photoImageUrls) ? input.photoImageUrls : [];
  const urls = photos.map((u) => (typeof u === 'string' ? u.trim() : '')).filter(Boolean);
  if (urls.length < 10) return 'At least 10 gallery photos are required.';

  return null;
}

/** Server-side validation for PATCH /farms/:id (core listing fields only). */
export function validateFarmUpdatePayload(input: FarmCorePayload): string | null {
  return validateFarmCorePayload(input);
}
