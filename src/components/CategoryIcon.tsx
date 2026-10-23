import React from 'react';
import {
  Award,
  Bike,
  Briefcase,
  Car,
  CircleDot,
  CreditCard,
  Dumbbell,
  Fuel,
  Gamepad2,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';

export const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  Bike,
  Briefcase,
  Car,
  CircleDot,
  CreditCard,
  Dumbbell,
  Fuel,
  Gamepad2,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
};

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
}

export function CategoryIcon({ name, color = '#10B981', size = 20 }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] ?? CircleDot;
  return <IconComponent color={color} size={size} />;
}
