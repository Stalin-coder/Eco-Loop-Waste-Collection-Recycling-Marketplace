export const WASTE_TYPES = ['plastic', 'paper', 'cardboard', 'metal', 'electronics', 'glass'] as const;

export const WASTE_PRICES: Record<string, number> = {
  plastic: 15,
  paper: 12,
  cardboard: 10,
  metal: 80,
  electronics: 50,
  glass: 8,
};

// Eco points per kg
export const ECO_POINTS: Record<string, number> = {
  plastic: 10,
  paper: 8,
  cardboard: 6,
  metal: 40,
  electronics: 25,
  glass: 5,
};

export const WASTE_LABELS: Record<string, string> = {
  plastic: 'Plastic',
  paper: 'Paper',
  cardboard: 'Cardboard',
  metal: 'Metal / Aluminium',
  electronics: 'Electronics',
  glass: 'Glass',
};

export const STATUS_LABELS: Record<string, string> = {
  requested: 'Open',
  accepted: 'Assigned',
  collector_en_route: 'In Progress',
  collected: 'Collected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  collector_en_route: 'bg-purple-100 text-purple-800',
  collected: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Surat', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam',
];

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Environmental impact factors per kg of waste recycled
export const ENV_IMPACT = {
  // CO2 prevented in kg per kg of waste recycled
  co2_per_kg: { plastic: 1.5, paper: 0.9, cardboard: 0.8, metal: 4.0, electronics: 2.5, glass: 0.3 },
  // Trees saved per kg of paper/cardboard recycled (1 tree ≈ 80kg paper)
  trees_per_kg: { paper: 1 / 80, cardboard: 1 / 120 },
  // Water saved in litres per kg
  water_per_kg: { plastic: 16, paper: 26, cardboard: 20, metal: 40, electronics: 30, glass: 2.5 },
  // Energy saved in kWh per kg
  energy_per_kg: { plastic: 5.8, paper: 4.1, cardboard: 3.5, metal: 14, electronics: 8, glass: 0.3 },
} as const;

export const REDEEM_OPTIONS = [
  { id: 'mobile_50', label: '₹50 Mobile Recharge', points: 100, icon: '📱', category: 'Mobile Recharge' },
  { id: 'mobile_100', label: '₹100 Mobile Recharge', points: 180, icon: '📱', category: 'Mobile Recharge' },
  { id: 'grocery_100', label: '₹100 Grocery Discount', points: 200, icon: '🛒', category: 'Grocery' },
  { id: 'grocery_250', label: '₹250 Grocery Voucher', points: 450, icon: '🛒', category: 'Grocery' },
  { id: 'coupon_50', label: '₹50 Shopping Coupon', points: 100, icon: '🎟️', category: 'Coupons' },
  { id: 'coupon_200', label: '₹200 Shopping Coupon', points: 350, icon: '🎟️', category: 'Coupons' },
  { id: 'coupon_500', label: '₹500 Premium Coupon', points: 800, icon: '🎟️', category: 'Coupons' },
];
