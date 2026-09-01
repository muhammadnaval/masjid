<?php

namespace App\Services;

use DateTime;
use DateTimeZone;

class HijriDateService
{
    private static array $HIJRI_MONTHS = [
        1  => 'Muharram',
        2  => 'Shafar',
        3  => 'Rabi\'ul Awal',
        4  => 'Rabi\'ul Akhir',
        5  => 'Jumadil Awal',
        6  => 'Jumadil Akhir',
        7  => 'Rajab',
        8  => 'Sya\'ban',
        9  => 'Ramadhan',
        10 => 'Syawal',
        11 => 'Dzulqa\'dah',
        12 => 'Dzulhijjah',
    ];

    private static array $DAYS_ID = [
        0 => 'Minggu',
        1 => 'Senin',
        2 => 'Selasa',
        3 => 'Rabu',
        4 => 'Kamis',
        5 => 'Jum\'at',
        6 => 'Sabtu',
    ];

    private static array $MASEHI_MONTHS_ID = [
        1  => 'Januari',
        2  => 'Februari',
        3  => 'Maret',
        4  => 'April',
        5  => 'Mei',
        6  => 'Juni',
        7  => 'Juli',
        8  => 'Agustus',
        9  => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Convert Gregorian date to Hijri date with optional offset in days.
     *
     * @param string|DateTime|null $date
     * @param int $correctionDays (-5 to +5)
     * @param string $timezone Default 'Asia/Jakarta'
     * @return array
     */
    public function convertToHijri($date = null, int $correctionDays = 0, string $timezone = 'Asia/Jakarta'): array
    {
        $tz = new DateTimeZone($timezone);

        if ($date instanceof DateTime) {
            $dt = clone $date;
            $dt->setTimezone($tz);
        } elseif (is_string($date) && !empty($date)) {
            $dt = new DateTime($date, $tz);
        } else {
            $dt = new DateTime('now', $tz);
        }

        // Apply correction days offset
        if ($correctionDays !== 0) {
            $dt->modify("{$correctionDays} days");
        }

        $dayOfWeek = (int) $dt->format('w');
        $masehiDay = (int) $dt->format('j');
        $masehiMonth = (int) $dt->format('n');
        $masehiYear = (int) $dt->format('Y');

        $formattedMasehi = self::$DAYS_ID[$dayOfWeek] . ', ' . $masehiDay . ' ' . self::$MASEHI_MONTHS_ID[$masehiMonth] . ' ' . $masehiYear;

        // Julian Day Calculation from Gregorian
        $year = $dt->format('Y');
        $month = $dt->format('n');
        $day = $dt->format('j');

        if ($month < 3) {
            $year -= 1;
            $month += 12;
        }

        $a = floor($year / 100);
        $b = 2 - $a + floor($a / 4);
        $jd = floor(365.25 * ($year + 4716)) + floor(30.6001 * ($month + 1)) + $day + $b - 1524.5;

        // Convert Julian Day to Hijri
        $z = $jd - 1948439.5;
        $cyc = floor($z / 10631);
        $z -= $cyc * 10631;

        $iy = floor(($z - 0.5) / 354.366);
        $z -= floor($iy * 354.366 + 0.5);

        $im = floor(($z + 28.5) / 29.5);
        if ($im > 12) {
            $im = 12;
        }

        $id = floor($z - floor($im * 29.5 - 28.5));
        $hy = $cyc * 30 + $iy + 1;

        // Bound checks for month & day
        $hijriMonth = (int) max(1, min(12, $im));
        $hijriDay   = (int) max(1, min(30, $id));
        $hijriYear  = (int) $hy;

        $monthName = self::$HIJRI_MONTHS[$hijriMonth] ?? 'Muharram';
        $formattedHijri = "{$hijriDay} {$monthName} {$hijriYear} H";

        return [
            'hijri_day'          => $hijriDay,
            'hijri_month'        => $hijriMonth,
            'hijri_month_name'   => $monthName,
            'hijri_year'         => $hijriYear,
            'formatted_hijri'    => $formattedHijri,
            'formatted_masehi'   => $formattedMasehi,
            'day_name_id'        => self::$DAYS_ID[$dayOfWeek],
            'correction_days'    => $correctionDays,
        ];
    }
}
