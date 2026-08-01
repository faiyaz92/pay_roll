/**
 * Holiday Calendar & Shift Management Use Cases
 * Implements GCC Public Holiday Calendar and Roster Shift Schedules
 * per BRD Section 4.5 & Checklist Tasks 13.2.19, 13.2.20
 */

export interface HolidayItem {
  id: string;
  name: string;
  nameArabic: string;
  country: string;
  date: string;
  daysCount: number;
  type: 'public_national' | 'religious_eid' | 'company_declared';
}

export const GCC_PUBLIC_HOLIDAYS_2026: HolidayItem[] = [
  {
    id: 'HOL-UAE-01',
    name: 'New Year Day',
    nameArabic: 'رأس السنة الميلادية',
    country: 'UAE',
    date: '2026-01-01',
    daysCount: 1,
    type: 'public_national',
  },
  {
    id: 'HOL-UAE-02',
    name: 'Eid Al-Fitr (Est.)',
    nameArabic: 'عيد الفطر المبارك',
    country: 'UAE',
    date: '2026-03-20',
    daysCount: 4,
    type: 'religious_eid',
  },
  {
    id: 'HOL-UAE-03',
    name: 'Arafat Day & Eid Al-Adha (Est.)',
    nameArabic: 'يوم عرفة وعيد الأضحى المبارك',
    country: 'UAE',
    date: '2026-05-27',
    daysCount: 4,
    type: 'religious_eid',
  },
  {
    id: 'HOL-UAE-04',
    name: 'Islamic New Year',
    nameArabic: 'رأس السنة الهجرية',
    country: 'UAE',
    date: '2026-06-16',
    daysCount: 1,
    type: 'religious_eid',
  },
  {
    id: 'HOL-UAE-05',
    name: 'Prophet Muhammad’s Birthday',
    nameArabic: 'المولد النبوي الشريف',
    country: 'UAE',
    date: '2026-08-25',
    daysCount: 1,
    type: 'religious_eid',
  },
  {
    id: 'HOL-UAE-06',
    name: 'UAE Commemoration & National Day',
    nameArabic: 'اليوم الوطني لليوم الوطني',
    country: 'UAE',
    date: '2026-12-02',
    daysCount: 3,
    type: 'public_national',
  },
];
