import {
  BookOpen,
  Bus,
  GraduationCap,
  HeartPulse,
  Languages,
  School,
  Trophy,
  Utensils,
} from 'lucide-react';

// Traduce el nombre de icono guardado en la base (string) a su componente de lucide-react.
// El fallback a `School` evita romper el render si llega un nombre desconocido.
const icons = {
  school: School,
  book: BookOpen,
  graduation: GraduationCap,
  utensils: Utensils,
  'heart-pulse': HeartPulse,
  languages: Languages,
  trophy: Trophy,
  bus: Bus,
};

export type IconName = keyof typeof icons;

export function IconMap({ name, size = 28 }: { name: string; size?: number }) {
  const Icon = icons[name as IconName] ?? School;
  return <Icon size={size} aria-hidden="true" />;
}
