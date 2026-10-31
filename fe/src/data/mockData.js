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
  AVAILABLE: 'AVAILABLE',         // Bàn trống
  OCCUPIED: 'OCCUPIED',           // Đang có khách
  READY_TO_SERVE: 'READY_TO_SERVE', // Chờ mang món (có món Đã nấu xong cần mang ra)
};

export const MOCK_USERS = [
  {
    id: 'usr-waiter-01',
    username: 'nguyenvana',
    password: '123456',
    fullName: 'Nguyễn Văn A',
    role: 'WAITER',
    roleDisplay: 'Phục vụ',
    title: 'Nhân viên Phục vụ',
    avatarInitial: 'P',
    employeeCode: 'NV-0142',
    shift: 'Ca hành chính (08:00 - 16:00)',
    phone: '0908 246 810',
  },
  {
    id: 'usr-waiter-02',
    username: 'tranbichngoc',
    password: '123456',
    fullName: 'Trần Bích Ngọc',
    role: 'WAITER',
    roleDisplay: 'Phục vụ',
    title: 'Nhân viên Phục vụ',
    avatarInitial: 'N',
    employeeCode: 'NV-0189',
    shift: 'Ca tối (15:00 - 23:00)',
    phone: '0912 345 678',
  },
];

export const CATEGORIES = [
  { id: 'ALL', name: 'Tất cả' },
  { id: 'APPETIZER', name: 'Khai vị' },
  { id: 'MAIN', name: 'Món chính' },
  { id: 'DRINK', name: 'Đồ uống' },
];

export const QUICK_NOTE_SUGGESTIONS = [
  'Ít nước chấm',
  'Thêm sốt',
  'Ít cay',
  'Không hành',
  'Ít nước sốt',
  'Không đá',
  'Ít đường',
  'Mang ra trước',
];

export const MENU_ITEMS = [
  {
    id: 'dish-1',
    name: 'Gỏi cuốn',
    categoryId: 'APPETIZER',
    categoryName: 'Khai vị',
    price: 60000,
    available: true,
    prepTimeMinutes: 8,
    description: 'Gỏi cuốn tôm thịt tươi dùng kèm sốt tương đậu phộng đậm đà.',
    image:
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-2',
    name: 'Tôm chiên xù',
    categoryId: 'APPETIZER',
    categoryName: 'Khai vị',
    price: 120000,
    available: true,
    prepTimeMinutes: 12,
    description: 'Tôm sú tẩm bột chiên xù vàng giòn rụm, chấm sốt mayonnaise trứng cá.',
    image:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-3',
    name: 'Súp hải sản',
    categoryId: 'APPETIZER',
    categoryName: 'Khai vị',
    price: 80000,
    available: true,
    prepTimeMinutes: 10,
    description: 'Súp tôm mực nấm tuyết nấu sánh mịn, thơm dầu mè và ngò rí.',
    image:
      'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-4',
    name: 'Salad rau củ',
    categoryId: 'APPETIZER',
    categoryName: 'Khai vị',
    price: 70000,
    available: true,
    prepTimeMinutes: 6,
    description: 'Rau củ hữu cơ tươi mát trộn sốt mè rang Nhật Bản thanh đạm.',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-5',
    name: 'Bò lúc lắc khoai tây',
    categoryId: 'MAIN',
    categoryName: 'Món chính',
    price: 165000,
    available: true,
    prepTimeMinutes: 15,
    description: 'Thăn bò Úc áp chảo lửa lớn cùng ớt chuông, hành tây và khoai tây chiên.',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-6',
    name: 'Cơm chiên hải sản hoàng kim',
    categoryId: 'MAIN',
    categoryName: 'Món chính',
    price: 115000,
    available: true,
    prepTimeMinutes: 12,
    description: 'Cơm chiên trứng muối tơi hạt cùng tôm, mực, cồi điệp và hành lá.',
    image:
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-7',
    name: 'Cá hồi áp chảo sốt chanh dây',
    categoryId: 'MAIN',
    categoryName: 'Món chính',
    price: 210000,
    available: true,
    prepTimeMinutes: 15,
    description: 'Phi lê cá hồi Na Uy áp chảo da giòn, rưới sốt chanh dây chua ngọt.',
    image:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-8',
    name: 'Mì Ý hải sản sốt cà',
    categoryId: 'MAIN',
    categoryName: 'Món chính',
    price: 135000,
    available: true,
    prepTimeMinutes: 14,
    description: 'Spaghetti nấu cùng tôm sú, vẹm xanh và sốt cà chua thảo mộc Ý.',
    image:
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-9',
    name: 'Lẩu Thái hải sản (Nồi nhỏ)',
    categoryId: 'MAIN',
    categoryName: 'Món chính',
    price: 280000,
    available: false, // Minh họa trạng thái Hết hàng
    prepTimeMinutes: 20,
    description: 'Nước dùng Tomyum chua cay chuẩn vị kèm tôm, mực, nghêu và nấm.',
    image:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-10',
    name: 'Trà đào cam sả',
    categoryId: 'DRINK',
    categoryName: 'Đồ uống',
    price: 45000,
    available: true,
    prepTimeMinutes: 4,
    description: 'Trà đen ủ lạnh kết hợp đào miếng giòn, cam vàng và hương sả tươi.',
    image:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-11',
    name: 'Nước ép dưa hấu tươi',
    categoryId: 'DRINK',
    categoryName: 'Đồ uống',
    price: 40000,
    available: true,
    prepTimeMinutes: 4,
    description: 'Nước ép nguyên chất 100% từ dưa hấu đỏ không đường hóa học.',
    image:
      'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'dish-12',
    name: 'Sinh tố bơ sáp Đà Lạt',
    categoryId: 'DRINK',
    categoryName: 'Đồ uống',
    price: 55000,
    available: false, // Minh họa trạng thái Hết hàng
    prepTimeMinutes: 5,
    description: 'Bơ sáp dẻo mịn xay cùng sữa đặc và dừa khô giòn.',
    image:
      'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=400&q=80',
  },
];

export const INITIAL_TABLES = [
  { id: 'T1', code: 'T1', name: 'Bàn T1', capacity: 4, zone: 'Tầng 1', guests: 0, activeOrderId: null },
  { id: 'T2', code: 'T2', name: 'Bàn T2', capacity: 4, zone: 'Tầng 1', guests: 3, activeOrderId: 'ORD-1039' },
  { id: 'T3', code: 'T3', name: 'Bàn T3', capacity: 2, zone: 'Tầng 1', guests: 0, activeOrderId: null },
  { id: 'T4', code: 'T4', name: 'Bàn T4', capacity: 4, zone: 'Tầng 1', guests: 2, activeOrderId: 'ORD-1042' },
  { id: 'T5', code: 'T5', name: 'Bàn T5', capacity: 6, zone: 'Tầng 1', guests: 0, activeOrderId: null },
  { id: 'T6', code: 'T6', name: 'Bàn T6', capacity: 4, zone: 'Tầng 1', guests: 0, activeOrderId: null },
  { id: 'T7', code: 'T7', name: 'Bàn T7', capacity: 2, zone: 'Sân vườn', guests: 0, activeOrderId: null },
  { id: 'T8', code: 'T8', name: 'Bàn T8', capacity: 6, zone: 'Sân vườn', guests: 4, activeOrderId: 'ORD-1045' },
  { id: 'T9', code: 'T9', name: 'Bàn T9', capacity: 8, zone: 'Sân vườn', guests: 0, activeOrderId: null },
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-1042',
    code: '#1042',
    tableId: 'T4',
    tableName: 'Bàn T4',
    guests: 2,
    createdAt: '14:35',
    cookingStartedAt: '14:36',
    cookedAt: '14:38',
    servedAt: null,
    paymentRequested: false,
    paymentRequestedAt: null,
    roundCount: 1,
    items: [
      {
        id: 'item-401',
        dishId: 'dish-1',
        name: 'Gỏi cuốn',
        price: 60000,
        quantity: 1,
        note: 'ít nước chấm',
        status: DISH_STATUS.PENDING,
        orderedAt: '14:35',
        updatedAt: '14:35',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-402',
        dishId: 'dish-2',
        name: 'Tôm chiên xù',
        price: 120000,
        quantity: 1,
        note: 'thêm sốt',
        status: DISH_STATUS.COOKING,
        orderedAt: '14:35',
        updatedAt: '14:36',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-403',
        dishId: 'dish-3',
        name: 'Súp hải sản',
        price: 80000,
        quantity: 1,
        note: '',
        status: DISH_STATUS.DONE,
        orderedAt: '14:35',
        updatedAt: '14:38',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-404',
        dishId: 'dish-4',
        name: 'Salad rau củ',
        price: 70000,
        quantity: 1,
        note: '',
        status: DISH_STATUS.SERVED,
        orderedAt: '14:35',
        updatedAt: '14:37',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'ORD-1039',
    code: '#1039',
    tableId: 'T2',
    tableName: 'Bàn T2',
    guests: 3,
    createdAt: '14:15',
    cookingStartedAt: '14:17',
    cookedAt: null,
    servedAt: null,
    paymentRequested: false,
    paymentRequestedAt: null,
    roundCount: 1,
    items: [
      {
        id: 'item-201',
        dishId: 'dish-5',
        name: 'Bò lúc lắc khoai tây',
        price: 165000,
        quantity: 1,
        note: 'bò chín vừa, ít hành tây',
        status: DISH_STATUS.COOKING,
        orderedAt: '14:15',
        updatedAt: '14:17',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-202',
        dishId: 'dish-6',
        name: 'Cơm chiên hải sản hoàng kim',
        price: 115000,
        quantity: 1,
        note: 'không hành lá',
        status: DISH_STATUS.PENDING,
        orderedAt: '14:15',
        updatedAt: '14:15',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-203',
        dishId: 'dish-10',
        name: 'Trà đào cam sả',
        price: 45000,
        quantity: 2,
        note: 'ít đá',
        status: DISH_STATUS.SERVED,
        orderedAt: '14:15',
        updatedAt: '14:19',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-204',
        dishId: 'dish-11',
        name: 'Nước ép dưa hấu tươi',
        price: 40000,
        quantity: 1,
        note: 'khách đổi ý hủy món',
        status: DISH_STATUS.CANCELLED,
        orderedAt: '14:15',
        updatedAt: '14:16',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
  {
    id: 'ORD-1045',
    code: '#1045',
    tableId: 'T8',
    tableName: 'Bàn T8',
    guests: 4,
    createdAt: '13:50',
    cookingStartedAt: '13:52',
    cookedAt: '14:05',
    servedAt: '14:08',
    paymentRequested: false,
    paymentRequestedAt: null,
    roundCount: 1,
    items: [
      {
        id: 'item-801',
        dishId: 'dish-7',
        name: 'Cá hồi áp chảo sốt chanh dây',
        price: 210000,
        quantity: 2,
        note: 'sốt để riêng',
        status: DISH_STATUS.SERVED,
        orderedAt: '13:50',
        updatedAt: '14:06',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-802',
        dishId: 'dish-8',
        name: 'Mì Ý hải sản sốt cà',
        price: 135000,
        quantity: 1,
        note: 'ít cay',
        status: DISH_STATUS.SERVED,
        orderedAt: '13:50',
        updatedAt: '14:08',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'item-803',
        dishId: 'dish-10',
        name: 'Trà đào cam sả',
        price: 45000,
        quantity: 2,
        note: 'ít đường',
        status: DISH_STATUS.SERVED,
        orderedAt: '13:50',
        updatedAt: '13:56',
        round: 1,
        image:
          'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
      },
    ],
  },
];

