// Shapes mirror the website's data (gmanddudeholidays-web/app/lib/booking.ts, contact.ts and the
// home page sections), so everything the site shows can be managed here.

export type BusType = 'AC Sleeper' | 'AC Seater' | 'Luxury Coach' | 'Mini Bus';
export const BUS_TYPES: BusType[] = ['AC Sleeper', 'AC Seater', 'Luxury Coach', 'Mini Bus'];

export type Amenity =
  | 'ac'
  | 'recliner'
  | 'pushback'
  | 'berth'
  | 'wifi'
  | 'tv'
  | 'charging'
  | 'music'
  | 'blanket'
  | 'reading-light'
  | 'gps'
  | 'first-aid'
  | 'luggage';

export const AMENITIES: { id: Amenity; label: string }[] = [
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'recliner', label: 'Recliner Seats' },
  { id: 'pushback', label: 'Push-back Seats' },
  { id: 'berth', label: 'Sleeper Berths' },
  { id: 'wifi', label: 'Wi-Fi On Board' },
  { id: 'tv', label: 'LED TV & Entertainment' },
  { id: 'charging', label: 'Charging Points' },
  { id: 'music', label: 'Music System' },
  { id: 'blanket', label: 'Blankets & Pillows' },
  { id: 'reading-light', label: 'Reading Lights' },
  { id: 'gps', label: 'GPS Live Tracking' },
  { id: 'first-aid', label: 'First Aid Kit' },
  { id: 'luggage', label: 'Luggage Space' },
];

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export const BOOKING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export type PaymentStatus = 'UNPAID' | 'ADVANCE' | 'PAID' | 'REFUNDED';
export const PAYMENT_STATUSES: PaymentStatus[] = ['UNPAID', 'ADVANCE', 'PAID', 'REFUNDED'];

export type ActivityKind = 'CREATED' | 'STATUS' | 'PAYMENT' | 'TRIP' | 'EDIT' | 'NOTE';

// One line in a booking's activity timeline.
export interface BookingActivity {
  id: string;
  at: string; // local date-time, YYYY-MM-DDTHH:MM
  kind: ActivityKind;
  text: string;
  by: string; // admin name
}

// Whole-bus hire booking. The bus is hired by the day: no time slots, a bus takes one booking per date.
export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  busId: string;
  from: string;
  to: string;
  passengers: number;
  date: string; // first day, YYYY-MM-DD
  endDate: string; // last day, YYYY-MM-DD (same as date for a one-day trip)
  status: BookingStatus;
  totalAmount?: number;
  advancePaid?: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  activity: BookingActivity[]; // oldest first
}

// A bus in the fleet (website: fleet list and /booking/[busId] page).
export interface Bus {
  id: string; // used in the website URL, e.g. /booking/dude
  name: string;
  type: BusType;
  pricePerKm: number;
  tag?: string;
  description: string;
  amenities: Amenity[];
  images: string[]; // first is the main photo
  imagePosition: string; // object-position used when the main photo is cropped
  status: 'ACTIVE' | 'MAINTENANCE';
  seats: number;
  registrationNumber: string;
  driverName?: string;
  driverPhone?: string;
}

// Home page "Our fleet" cards.
export interface BusTypeCard {
  id: string;
  name: BusType;
  tagline: string;
  capacity: string;
  pricePerKm: number;
  features: string[];
  popular: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface HeroText {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
}

export interface SiteSettings {
  businessName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  mapQuery: string; // what the Google Map on the contact page searches for
  footerAbout: string;
  socials: { facebook: string; instagram: string; youtube: string };
  homeHero: HeroText;
  contactHero: HeroText;
  cities: string[]; // pickup / drop city suggestions in the booking form
  tripTypes: string[]; // contact form "trip type" options
  bookingDays: number; // how many days ahead customers can book
  advancePercent: number; // advance needed to confirm a booking
  seo: { title: string; description: string };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface AdminData {
  admin: AdminUser;
  buses: Bus[];
  busTypes: BusTypeCard[];
  bookings: Booking[];
  faqs: Faq[];
  settings: SiteSettings;
}
