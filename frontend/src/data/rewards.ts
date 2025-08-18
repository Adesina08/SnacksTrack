import { Reward } from "@/types/api";
import { Smartphone, ShoppingBag, Gift, Zap } from "lucide-react";

// Extended reward type adding local-only fields
export interface StaticReward extends Reward {
  price: number; // equivalent to cost in UI
  icon: any;
  isFeatured: boolean; // whether to highlight as popular
}

export const fallbackRewards: StaticReward[] = [
  {
    id: "1",
    name: "₦500 MTN Airtime",
    description: "MTN mobile top-up worth ₦500",
    pointsRequired: 500,
    price: 500,
    icon: Smartphone,
    category: "airtime",
    isFeatured: false,
    isActive: true,
  },
  {
    id: "2",
    name: "₦1000 Airtel Data",
    description: "1GB bundle for Airtel subscribers",
    pointsRequired: 800,
    price: 800,
    icon: Smartphone,
    category: "data",
    isFeatured: true,
    isActive: true,
  },
  {
    id: "3",
    name: "₦2000 9mobile Airtime",
    description: "Recharge 9mobile lines with ₦2000 credit",
    pointsRequired: 1000,
    price: 1000,
    icon: Smartphone,
    category: "airtime",
    isFeatured: false,
    isActive: true,
  },
  {
    id: "4",
    name: "Jumia Voucher",
    description: "₦5000 shopping voucher for Jumia",
    pointsRequired: 2000,
    price: 2000,
    icon: ShoppingBag,
    category: "voucher",
    isFeatured: true,
    isActive: true,
  },
  {
    id: "5",
    name: "Dominos Pizza",
    description: "Medium pizza from Dominos Nigeria",
    pointsRequired: 1500,
    price: 1500,
    icon: Gift,
    category: "food",
    isFeatured: false,
    isActive: true,
  },
  {
    id: "6",
    name: "Netflix Naija",
    description: "One month Netflix subscription for Nigeria",
    pointsRequired: 1200,
    price: 1200,
    icon: Zap,
    category: "entertainment",
    isFeatured: true,
    isActive: true,
  },
  {
    id: "7",
    name: "Konga Voucher",
    description: "₦3000 voucher usable on Konga",
    pointsRequired: 1300,
    price: 1300,
    icon: ShoppingBag,
    category: "voucher",
    isFeatured: false,
    isActive: true,
  },
  {
    id: "8",
    name: "Glo Data Bundle",
    description: "2GB internet bundle for Glo network",
    pointsRequired: 900,
    price: 900,
    icon: Smartphone,
    category: "data",
    isFeatured: true,
    isActive: true,
  },
];
