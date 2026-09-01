const HIJRI_MONTHS = [
  'Muharram',
  'Shafar',
  'Rabi\'ul Awal',
  'Rabi\'ul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawal',
  'Dzulqa\'dah',
  'Dzulhijjah',
];

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu'];

const MASEHI_MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface FormattedDateInfo {
  formattedMasehi: string;
  formattedHijri: string;
  dayNameId: string;
  hijriDay: number;
  hijriMonthName: string;
  hijriYear: number;
}

export function formatDates(baseDate?: Date, correctionDays: number = 0): FormattedDateInfo {
  const dt = baseDate ? new Date(baseDate.getTime()) : new Date();

  // Apply correction days offset
  if (correctionDays !== 0) {
    dt.setDate(dt.getDate() + correctionDays);
  }

  const dayOfWeek = dt.getDay();
  const masehiDay = dt.getDate();
  const masehiMonth = dt.getMonth();
  const masehiYear = dt.getFullYear();

  const dayNameId = DAYS_ID[dayOfWeek];
  const formattedMasehi = `${dayNameId}, ${masehiDay} ${MASEHI_MONTHS_ID[masehiMonth]} ${masehiYear}`;

  let year = dt.getFullYear();
  let month = dt.getMonth() + 1;
  let day = dt.getDate();

  if (month < 3) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;

  const z = jd - 1948439.5;
  const cyc = Math.floor(z / 10631);
  const remZ = z - cyc * 10631;

  const iy = Math.floor((remZ - 0.5) / 354.366);
  const remIy = remZ - Math.floor(iy * 354.366 + 0.5);

  let im = Math.floor((remIy + 28.5) / 29.5);
  if (im > 12) im = 12;

  const id = Math.floor(remIy - Math.floor(im * 29.5 - 28.5));
  const hy = cyc * 30 + iy + 1;

  const hijriMonth = Math.max(1, Math.min(12, im));
  const hijriDay = Math.max(1, Math.min(30, id));
  const hijriYear = hy;

  const hijriMonthName = HIJRI_MONTHS[hijriMonth - 1] || 'Muharram';
  const formattedHijri = `${hijriDay} ${hijriMonthName} ${hijriYear} H`;

  return {
    formattedMasehi,
    formattedHijri,
    dayNameId,
    hijriDay,
    hijriMonthName,
    hijriYear,
  };
}
