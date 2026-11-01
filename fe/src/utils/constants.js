// Danh sách 5 trạng thái chuẩn của từng món theo đúng yêu cầu nghiệp vụ
export const DISH_STATUS = {
  PENDING: 'PENDING',     // 1. Đang chờ chế biến
  COOKING: 'COOKING',     // 2. Đang chế biến
  DONE: 'DONE',           // 3. Đã nấu xong
  SERVED: 'SERVED',       // 4. Đã phục vụ lên bàn
  CANCELLED: 'CANCELLED', // 5. Đã hủy
};

export const DISH_STATUS_META = {
  [DISH_STATUS.PENDING]: {
    code: DISH_STATUS.PENDING,
    label: 'Đang chờ chế biến',
    shortLabel: 'Chờ nấu',
    bgClass: 'bg-amber-100/80 text-amber-700',
    dotClass: 'bg-orange-500',
    badgeBg: '#FFF3E0',
    badgeText: '#D97706',
    canCancel: true,
    canServe: false,
  },
  [DISH_STATUS.COOKING]: {
    code: DISH_STATUS.COOKING,
    label: 'Đang chế biến',
    shortLabel: 'Đang nấu',
    bgClass: 'bg-sky-100/80 text-sky-700',
    dotClass: 'bg-sky-500',
    badgeBg: '#E0F2FE',
    badgeText: '#0284C7',
    canCancel: false,
    canServe: false,
  },
  [DISH_STATUS.DONE]: {
    code: DISH_STATUS.DONE,
    label: 'Đã nấu xong',
    shortLabel: 'Đã xong',
    bgClass: 'bg-emerald-100/80 text-emerald-700',
    dotClass: 'bg-emerald-500',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    canCancel: false,
    canServe: true,
  },
  [DISH_STATUS.SERVED]: {
    code: DISH_STATUS.SERVED,
    label: 'Đã phục vụ lên bàn',
    shortLabel: 'Đã phục vụ',
    bgClass: 'bg-slate-100 text-slate-600',
    dotClass: 'bg-slate-400',
    badgeBg: '#F1F5F9',
    badgeText: '#475569',
    canCancel: false,
    canServe: false,
  },
  [DISH_STATUS.CANCELLED]: {
    code: DISH_STATUS.CANCELLED,
    label: 'Đã hủy',
    shortLabel: 'Đã hủy',
    bgClass: 'bg-rose-100/80 text-rose-700',
    dotClass: 'bg-rose-500',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
    canCancel: false,
    canServe: false,
  },
};

export const TABLE_STATUS = {
  AVAILABLE: 'AVAILABLE',           // Bàn trống
  OCCUPIED: 'OCCUPIED',             // Đang có khách
  READY_TO_SERVE: 'READY_TO_SERVE', // Chờ mang món (có món Đã nấu xong cần mang ra)
};

export const CATEGORIES = [
  { id: 'ALL', name: 'Tất cả' },
];

