import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Utensils,
  LayoutGrid,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit,
  Printer,
  Receipt,
  User,
  ShieldCheck,
  ChefHat,
  Coffee,
  Sparkles,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  QrCode,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
} from 'lucide-react';
import { useRoms } from '../context/RomsContext';
import { formatCurrency } from '../utils/formatters';

// ============================================================================
// DỮ LIỆU KHỞI TẠO MẪU (CHUẨN HÓA KHỚP 100% CẤU TRÚC BACKEND API)
// ============================================================================

const INITIAL_TABLES = [
  { id: 't-1', name: 'T1', capacity: 4, status: 'AVAILABLE', active: true, order: null },
  { id: 't-2', name: 'T2', capacity: 4, status: 'AVAILABLE', active: true, order: null },
  {
    id: 't-3',
    name: 'T3',
    capacity: 4,
    status: 'PAYMENT_REQUESTED', // Đang yêu cầu thanh toán (R-C01)
    active: true,
    hasNotification: true,
    order: {
      id: 'ord-101',
      orderCode: '#2601',
      status: 'PAYMENT_REQUESTED',
      createdAt: '2026-11-02T10:15:00Z',
      items: [
        {
          id: 'item-1',
          menuItemId: 'm1',
          name: 'Phở bò',
          unitPriceVnd: 120000,
          quantity: 1,
          status: 'SERVED', // Đã phục vụ
          note: 'Nhiều hành',
          round: 1,
          image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: 'item-2',
          menuItemId: 'm2',
          name: 'Trà tắc',
          unitPriceVnd: 25000,
          quantity: 1,
          status: 'SERVED', // Đã phục vụ
          note: 'Ít đường',
          round: 1,
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: 'item-3',
          menuItemId: 'm3',
          name: 'Gà rán',
          unitPriceVnd: 70000,
          quantity: 1,
          status: 'SERVED', // Đã phục vụ
          note: 'Cay vừa',
          round: 1,
          image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80',
        },
      ],
    },
  },
  { id: 't-4', name: 'T4', capacity: 4, status: 'AVAILABLE', active: true, order: null },
  { id: 't-5', name: 'T5', capacity: 2, status: 'AVAILABLE', active: true, order: null },
  { id: 't-6', name: 'T6', capacity: 2, status: 'AVAILABLE', active: true, order: null },
  { id: 't-7', name: 'T7', capacity: 4, status: 'AVAILABLE', active: true, order: null },
  {
    id: 't-8',
    name: 'T8',
    capacity: 6,
    status: 'SERVING', // Đang phục vụ bình thường
    active: true,
    hasNotification: false,
    order: {
      id: 'ord-102',
      orderCode: '#2602',
      status: 'SUBMITTED',
      createdAt: '2026-11-02T11:00:00Z',
      items: [
        {
          id: 'item-4',
          menuItemId: 'm5',
          name: 'Cơm sườn',
          unitPriceVnd: 75000,
          quantity: 2,
          status: 'SERVED',
          note: '',
          round: 1,
          image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: 'item-5',
          menuItemId: 'm8',
          name: 'Trà đào',
          unitPriceVnd: 35000,
          quantity: 2,
          status: 'PREPARING', // Đang nấu/chuẩn bị (chưa phục vụ)
          note: 'Nhiều đá',
          round: 1,
          image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80',
        },
      ],
    },
  },
  { id: 't-9', name: 'T9', capacity: 4, status: 'AVAILABLE', active: true, order: null },
  { id: 't-10', name: 'T10', capacity: 4, status: 'AVAILABLE', active: true, order: null },
  { id: 't-11', name: 'T11', capacity: 8, status: 'AVAILABLE', active: true, order: null },
  { id: 't-12', name: 'T12', capacity: 8, status: 'AVAILABLE', active: true, order: null },
];

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Món ăn chính', icon: Utensils, active: true },
  { id: 'cat-2', name: 'Món khai vị', icon: ChefHat, active: true },
  { id: 'cat-3', name: 'Thức uống', icon: Coffee, active: true },
  { id: 'cat-4', name: 'Tráng miệng', icon: Sparkles, active: true },
];

const INITIAL_MENU_ITEMS = [
  {
    id: 'm1',
    categoryId: 'cat-1',
    categoryName: 'Món ăn chính',
    name: 'Phở bò',
    description: 'Phở bò tái nạm thơm ngon gia truyền với nước hầm xương 24h',
    priceVnd: 120000,
    imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm2',
    categoryId: 'cat-3',
    categoryName: 'Thức uống',
    name: 'Trà tắc',
    description: 'Trà lài tắc thanh mát giải nhiệt mùa hè',
    priceVnd: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm3',
    categoryId: 'cat-2',
    categoryName: 'Món khai vị',
    name: 'Gà rán',
    description: 'Gà rán giòn rụm tẩm ướp sốt cay ngọt Hàn Quốc',
    priceVnd: 70000,
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm4',
    categoryId: 'cat-1',
    categoryName: 'Món ăn chính',
    name: 'Bún bò Huế',
    description: 'Bún bò Huế cay nồng chuẩn vị cố đô, chả cua thịt bắp bò',
    priceVnd: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm5',
    categoryId: 'cat-1',
    categoryName: 'Món ăn chính',
    name: 'Cơm sườn',
    description: 'Cơm sườn nướng mật ong mềm thơm ăn kèm mỡ hành',
    priceVnd: 75000,
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm6',
    categoryId: 'cat-1',
    categoryName: 'Món ăn chính',
    name: 'Pizza Hải Sản',
    description: 'Pizza tôm mực phô mai mozzarella kéo sợi hảo hạng',
    priceVnd: 150000,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm7',
    categoryId: 'cat-1',
    categoryName: 'Món ăn chính',
    name: 'Mì Ý sốt bò bằm',
    description: 'Mì Ý sợi dai sốt bolognese đậm đà rắc phô mai parmesan',
    priceVnd: 95000,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm8',
    categoryId: 'cat-3',
    categoryName: 'Thức uống',
    name: 'Trà đào',
    description: 'Trà đào cam sả thanh ngọt thơm nức mũi miếng đào giòn',
    priceVnd: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm9',
    categoryId: 'cat-2',
    categoryName: 'Món khai vị',
    name: 'Chả giò hải sản',
    description: 'Chả giò chiên vàng giòn sốt mayonnaise',
    priceVnd: 55000,
    imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm10',
    categoryId: 'cat-2',
    categoryName: 'Món khai vị',
    name: 'Gỏi cuốn tôm thịt',
    description: 'Gỏi cuốn tôm thịt thanh đạm chấm tương đậu phộng',
    priceVnd: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm11',
    categoryId: 'cat-3',
    categoryName: 'Thức uống',
    name: 'Cà phê sữa đá',
    description: 'Cà phê phin truyền thống đậm vị sánh đặc sữa thơm',
    priceVnd: 29000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
  {
    id: 'm12',
    categoryId: 'cat-4',
    categoryName: 'Tráng miệng',
    name: 'Bánh flan caramel',
    description: 'Bánh flan mềm mịn thơm ngậy cà phê đá caramen',
    priceVnd: 30000,
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80',
    available: true,
    active: true,
  },
];

// Dữ liệu báo cáo mẫu cho ngày hiện tại (chuẩn BE ReportService)
const INITIAL_DAILY_REPORT = {
  date: '2026-11-02',
  totalOrdersCompleted: 42,
  subtotalVnd: 6850000,
  discountVnd: 250000,
  vatVnd: 528000, // 8% của (6,850,000 - 250,000 = 6,600,000) => 528,000
  totalRevenueVnd: 7128000, // 6,600,000 + 528,000 = 7,128,000
};

const INITIAL_TOP_ITEMS = [
  { menuItemId: 'm1', itemName: 'Phở bò', quantitySold: 28, totalRevenueVnd: 3360000 },
  { menuItemId: 'm5', itemName: 'Cơm sườn', quantitySold: 24, totalRevenueVnd: 1800000 },
  { menuItemId: 'm3', itemName: 'Gà rán', quantitySold: 21, totalRevenueVnd: 1470000 },
  { menuItemId: 'm4', itemName: 'Bún bò Huế', quantitySold: 18, totalRevenueVnd: 1530000 },
  { menuItemId: 'm2', itemName: 'Trà tắc', quantitySold: 35, totalRevenueVnd: 875000 },
  { menuItemId: 'm8', itemName: 'Trà đào', quantitySold: 22, totalRevenueVnd: 770000 },
  { menuItemId: 'm6', itemName: 'Pizza Hải Sản', quantitySold: 8, totalRevenueVnd: 1200000 },
  { menuItemId: 'm7', itemName: 'Mì Ý sốt bò bằm', quantitySold: 12, totalRevenueVnd: 1140000 },
  { menuItemId: 'm11', itemName: 'Cà phê sữa đá', quantitySold: 19, totalRevenueVnd: 551000 },
  { menuItemId: 'm12', itemName: 'Bánh flan caramel', quantitySold: 15, totalRevenueVnd: 450000 },
];

export default function CashierPage() {
  const navigate = useNavigate();
  const { logout, showToast, currentUser, apiFetch } = useRoms();

  // Tab đang hoạt động: 'checkout' | 'menu' | 'tables' | 'reports' | 'profile'
  const [activeTab, setActiveTab] = useState('checkout');

  // Lấy dữ liệu hồ sơ người dùng thực tế từ Backend API (GET /api/v1/auth/me)
  const [profileData, setProfileData] = useState(() => currentUser || null);

  useEffect(() => {
    if (apiFetch) {
      apiFetch('/auth/me')
        .then((res) => {
          if (res) {
            setProfileData({
              id: res.id,
              username: res.username,
              role: res.role,
              active: res.active !== false,
            });
          }
        })
        .catch(() => null);
    }
  }, [apiFetch]);

  const profileUser = useMemo(() => {
    const u = profileData || currentUser || {};
    const username = u.username || 'cashier';
    const role = u.role || 'CASHIER';
    let roleTitle = 'Thu ngân';
    if (role === 'ADMIN') roleTitle = 'Quản trị viên';
    else if (role === 'WAITER') roleTitle = 'Nhân viên phục vụ';
    else if (role === 'KITCHEN') roleTitle = 'Nhân viên nhà bếp';

    return {
      id: u.id || 'N/A',
      username,
      role,
      roleTitle,
      avatarInitial: (username[0] || 'U').toUpperCase(),
      active: u.active !== false,
    };
  }, [profileData, currentUser]);

  // ==========================================================================
  // TAB 1: TIẾP NHẬN THANH TOÁN & TÍNH TIỀN (R-C01, FR-C02)
  // ==========================================================================
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState('t-3');
  const [tableFilter, setTableFilter] = useState('ALL'); // 'ALL' | 'PAYMENT_REQUESTED' | 'SERVING' | 'AVAILABLE'

  // Giảm giá (VNĐ) nhập từ quầy thu ngân (FR-C02)
  const [discountVnd, setDiscountVnd] = useState(0);

  // Modals Thanh toán & In ấn
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const payMethod = 'CASH';
  const [customerPaidAmount, setCustomerPaidAmount] = useState('');
  const [lastPaidInvoice, setLastPaidInvoice] = useState(null);
  const [isOfficialInvoiceOpen, setIsOfficialInvoiceOpen] = useState(false);
  const [billPreviewData, setBillPreviewData] = useState(null);

  // ==========================================================================
  // TAB 2: QUẢN LÝ THỰC ĐƠN (FR-C03)
  // ==========================================================================
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [menuItems, setMenuItems] = useState(INITIAL_MENU_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState('m1');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals Thực đơn & Danh mục
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [isEditDishOpen, setIsEditDishOpen] = useState(false);
  const [isDeleteDishOpen, setIsDeleteDishOpen] = useState(false);
  const [dishForm, setDishForm] = useState({
    name: '',
    categoryId: 'cat-1',
    priceVnd: '',
    imageUrl: '',
    description: '',
  });

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '' });

  // ==========================================================================
  // TAB 3: QUẢN LÝ SƠ ĐỒ BÀN (FR-C04)
  // ==========================================================================
  const [editingTableId, setEditingTableId] = useState('t-3');
  const [editingTableName, setEditingTableName] = useState('T3');
  const [editingTableCapacity, setEditingTableCapacity] = useState(4);
  const [tableCapacityFilter, setTableCapacityFilter] = useState('ALL');
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isDeleteTableOpen, setIsDeleteTableOpen] = useState(false);
  const [newTableForm, setNewTableForm] = useState({ name: '', capacity: 4 });

  // ==========================================================================
  // TAB 4: BÁO CÁO DOANH THU CUỐI NGÀY (FR-C05)
  // ==========================================================================
  const [reportDate, setReportDate] = useState('2026-11-02');
  const [revenueReport, setRevenueReport] = useState(INITIAL_DAILY_REPORT);
  const [topItemsReport, setTopItemsReport] = useState(INITIAL_TOP_ITEMS);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ==========================================================================
  // ĐỒNG HỒ THỜI GIAN THỰC
  // ==========================================================================
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hh}:${mm} ${day}/${month}/${year}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      setCurrentTime(`${hh}:${mm} ${day}/${month}/${year}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================================================
  // GỌI API BACKEND NẾU ĐÃ KẾT NỐI (VỚI TỰ ĐỘNG FALLBACK LOCAL STATE)
  // ==========================================================================
  const fetchBackendData = useCallback(async () => {
    if (!apiFetch) return;
    try {
      // 1. Lấy danh sách bàn
      const tablesData = await apiFetch('/tables').catch(() => null);
      if (tablesData && Array.isArray(tablesData) && tablesData.length > 0) {
        setTables((prev) => {
          return tablesData.map((t) => {
            const existing = prev.find((p) => p.name === t.name || p.id === t.id);
            return {
              id: String(t.id),
              name: t.name,
              capacity: Number(t.capacity) || 4,
              status: t.status || 'AVAILABLE',
              active: t.active !== false,
              hasNotification: t.status === 'PAYMENT_REQUESTED',
              order: existing?.order || null,
            };
          });
        });
      }

      // 2. Lấy danh mục
      const catsData = await apiFetch('/categories').catch(() => null);
      if (catsData && Array.isArray(catsData) && catsData.length > 0) {
        setCategories(
          catsData.map((c) => ({
            id: String(c.id),
            name: c.name,
            icon: Utensils,
            active: c.active !== false,
          }))
        );
      }

      // 3. Lấy thực đơn
      const menuData = await apiFetch('/menu-items').catch(() => null);
      if (menuData && Array.isArray(menuData) && menuData.length > 0) {
        setMenuItems(
          menuData.map((m) => ({
            id: String(m.id),
            categoryId: String(m.categoryId),
            categoryName: m.categoryName || 'Món ăn chính',
            name: m.name,
            description: m.description || '',
            priceVnd: Number(m.priceVnd) || 0,
            imageUrl: m.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
            available: m.available !== false,
            active: m.active !== false,
          }))
        );
      }

      // 4. Lấy danh sách yêu cầu thanh toán (R-C01)
      const payRequests = await apiFetch('/cashier/payment-requests').catch(() => null);
      if (payRequests && Array.isArray(payRequests)) {
        // Cập nhật thông tin order vào bàn tương ứng
        setTables((prev) =>
          prev.map((tbl) => {
            const req = payRequests.find((r) => String(r.tableId) === tbl.id || r.tableName === tbl.name);
            if (req) {
              return {
                ...tbl,
                status: 'PAYMENT_REQUESTED',
                hasNotification: true,
                order: {
                  id: String(req.id),
                  orderCode: `#${String(req.id).slice(0, 4).toUpperCase()}`,
                  status: req.status,
                  createdAt: req.createdAt,
                  items: (req.items || []).map((it) => ({
                    id: String(it.id),
                    menuItemId: String(it.menuItemId),
                    name: it.name,
                    unitPriceVnd: Number(it.unitPriceVnd) || 0,
                    quantity: Number(it.quantity) || 1,
                    status: it.status || 'SERVED',
                    note: it.note || '',
                    round: Number(it.round) || 1,
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
                  })),
                },
              };
            }
            return tbl;
          })
        );
      }
    } catch {
      // Offline fallback: tiếp tục dùng mock state
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  // ==========================================================================
  // TÍNH TOÁN HÓA ĐƠN VÀ SỐ LƯỢNG MÓN ĐÃ PHỤC VỤ (R-C01 & FR-C02)
  // ==========================================================================
  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0];
  }, [tables, selectedTableId]);

  const orderItems = useMemo(() => {
    return selectedTable?.order?.items || [];
  }, [selectedTable]);

  // Đếm số lượng món đã phục vụ (SERVED) so với tổng số món (R-C01)
  const servedItemsCount = useMemo(() => {
    return orderItems.filter((it) => it.status === 'SERVED').length;
  }, [orderItems]);

  const totalItemsCount = orderItems.length;
  const isAllServed = totalItemsCount > 0 && servedItemsCount === totalItemsCount;

  // Giảm giá hợp lệ (0 <= discountVnd <= subtotal)
  const safeDiscount = useMemo(() => {
    const rawSubtotal = orderItems
      .filter((item) => item.status === 'SERVED')
      .reduce((acc, item) => acc + item.unitPriceVnd * item.quantity, 0);
    return Math.min(Math.max(0, Number(discountVnd) || 0), rawSubtotal);
  }, [discountVnd, orderItems]);

  // Lấy dữ liệu tạm tính / hóa đơn preview từ Backend (FR-C02: GET /api/v1/orders/{id}/invoice/preview?discountVnd=0)
  useEffect(() => {
    const orderId = selectedTable?.order?.id;
    if (!apiFetch || !orderId || servedItemsCount === 0) {
      setBillPreviewData(null);
      return;
    }
    let isCurrent = true;
    const timer = setTimeout(() => {
      apiFetch(`/orders/${orderId}/invoice/preview?discountVnd=${safeDiscount}`)
        .then((data) => {
          if (isCurrent && data) {
            setBillPreviewData(data);
          }
        })
        .catch(() => {
          if (isCurrent) setBillPreviewData(null);
        });
    }, 150);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [apiFetch, selectedTable?.order?.id, safeDiscount, servedItemsCount]);

  // Tính tiền dựa trên các món ĐÃ PHỤC VỤ (theo đúng logic calculateBill trong PaymentService & preview BE)
  const subtotal = useMemo(() => {
    if (billPreviewData?.subtotalVnd != null) return billPreviewData.subtotalVnd;
    return orderItems
      .filter((item) => item.status === 'SERVED')
      .reduce((acc, item) => acc + item.unitPriceVnd * item.quantity, 0);
  }, [billPreviewData, orderItems]);

  const taxableAmount = useMemo(() => {
    return Math.max(0, subtotal - safeDiscount);
  }, [subtotal, safeDiscount]);

  const vatAmount = useMemo(() => {
    if (billPreviewData?.vatVnd != null) return billPreviewData.vatVnd;
    return Math.round(taxableAmount * 0.08); // VAT 8% chuẩn BE
  }, [billPreviewData, taxableAmount]);

  const grandTotal = useMemo(() => {
    if (billPreviewData?.totalVnd != null) return billPreviewData.totalVnd;
    return taxableAmount + vatAmount;
  }, [billPreviewData, taxableAmount, vatAmount]);

  // Lọc bàn ở Tab 1 theo trạng thái
  const filteredTables = useMemo(() => {
    if (tableFilter === 'ALL') return tables;
    if (tableFilter === 'PAYMENT_REQUESTED') return tables.filter((t) => t.status === 'PAYMENT_REQUESTED');
    if (tableFilter === 'SERVING') return tables.filter((t) => t.status === 'SERVING');
    if (tableFilter === 'AVAILABLE') return tables.filter((t) => t.status === 'AVAILABLE');
    return tables;
  }, [tables, tableFilter]);

  // Thống kê số lượng bàn theo từng mức sức chứa ghế (chỗ ngồi) cho Tab 3
  const capacityStats = useMemo(() => {
    const map = new Map();
    tables.forEach((t) => {
      const cap = Number(t.capacity) || 4;
      map.set(cap, (map.get(cap) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([capacity, count]) => ({ capacity, count }))
      .sort((a, b) => a.capacity - b.capacity);
  }, [tables]);

  // Lọc danh sách bàn ở Tab 3 theo số chỗ và từ khóa tìm kiếm
  const filteredManagementTables = useMemo(() => {
    return tables.filter((t) => {
      const matchCap =
        tableCapacityFilter === 'ALL' || (Number(t.capacity) || 4) === Number(tableCapacityFilter);
      const matchSearch =
        !tableSearchQuery.trim() ||
        t.name.toLowerCase().includes(tableSearchQuery.trim().toLowerCase());
      return matchCap && matchSearch;
    });
  }, [tables, tableCapacityFilter, tableSearchQuery]);

  // ==========================================================================
  // HÀM XỬ LÝ THANH TOÁN (FR-C02: POST /api/v1/orders/{id}/pay)
  // ==========================================================================
  // Chọn bàn và nạp chi tiết đơn hàng mới nhất từ BE (R-C01: GET /api/v1/orders/{id})
  const handleSelectTable = async (tbl) => {
    setSelectedTableId(tbl.id);
    setDiscountVnd(0);
    setBillPreviewData(null);
    if (!apiFetch) return;
    try {
      const currentOrder = await apiFetch(`/tables/${tbl.id}/current-order`).catch(() => null);
      if (currentOrder && currentOrder.id) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === tbl.id
              ? {
                ...t,
                status: currentOrder.status === 'PAYMENT_REQUESTED' ? 'PAYMENT_REQUESTED' : (currentOrder.status === 'PAID' ? 'AVAILABLE' : 'SERVING'),
                hasNotification: currentOrder.status === 'PAYMENT_REQUESTED',
                order: {
                  id: String(currentOrder.id),
                  orderCode: `#${String(currentOrder.id).slice(0, 4).toUpperCase()}`,
                  status: currentOrder.status,
                  createdAt: currentOrder.createdAt,
                  items: (currentOrder.items || []).map((it) => ({
                    id: String(it.id),
                    menuItemId: String(it.menuItemId),
                    name: it.name,
                    unitPriceVnd: Number(it.unitPriceVnd) || 0,
                    quantity: Number(it.quantity) || 1,
                    status: it.status || 'SERVED',
                    note: it.note || '',
                    round: Number(it.round) || 1,
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
                  })),
                },
              }
              : t
          )
        );
      } else if (tbl.order?.id) {
        const orderDetail = await apiFetch(`/orders/${tbl.order.id}`).catch(() => null);
        if (orderDetail && orderDetail.id) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === tbl.id
                ? {
                  ...t,
                  status: orderDetail.status === 'PAYMENT_REQUESTED' ? 'PAYMENT_REQUESTED' : (orderDetail.status === 'PAID' ? 'AVAILABLE' : 'SERVING'),
                  hasNotification: orderDetail.status === 'PAYMENT_REQUESTED',
                  order: {
                    id: String(orderDetail.id),
                    orderCode: `#${String(orderDetail.id).slice(0, 4).toUpperCase()}`,
                    status: orderDetail.status,
                    createdAt: orderDetail.createdAt,
                    items: (orderDetail.items || []).map((it) => ({
                      id: String(it.id),
                      menuItemId: String(it.menuItemId),
                      name: it.name,
                      unitPriceVnd: Number(it.unitPriceVnd) || 0,
                      quantity: Number(it.quantity) || 1,
                      status: it.status || 'SERVED',
                      note: it.note || '',
                      round: Number(it.round) || 1,
                      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
                    })),
                  },
                }
                : t
            )
          );
        }
      }
    } catch {
      // offline fallback
    }
  };

  const handleOpenPaymentModal = () => {
    if (!selectedTable?.order || orderItems.length === 0) {
      showToast('Bàn này chưa có đơn hàng để thanh toán.', 'error');
      return;
    }
    if (servedItemsCount === 0) {
      showToast('Chưa có món ăn nào được đánh dấu "Đã phục vụ" để tính tiền!', 'error');
      return;
    }
    setCustomerPaidAmount(String(grandTotal));
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    const orderId = selectedTable?.order?.id;
    let payResult = null;
    try {
      if (apiFetch && orderId) {
        payResult = await apiFetch(`/orders/${orderId}/pay`, {
          method: 'POST',
          body: JSON.stringify({
            discountVnd: safeDiscount,
            method: 'CASH', // PaymentMethod trong BE chỉ có CASH
          }),
        }).catch(() => null);
      }
    } catch {
      // Ignored for offline
    }

    // Tạo đối tượng hóa đơn chính thức từ dữ liệu thanh toán BE (FR-C02)
    const invoice = {
      invoiceCode: payResult?.invoiceId
        ? `HD-${String(payResult.invoiceId).slice(0, 8).toUpperCase()}`
        : `HD-${Date.now().toString().slice(-6)}`,
      paymentId: payResult?.paymentId ? String(payResult.paymentId).slice(0, 8).toUpperCase() : null,
      orderCode: selectedTable.order?.orderCode || '#0000',
      tableName: selectedTable.name,
      cashierName: currentUser?.username || 'Thu Ngân',
      paidAt: payResult?.paidAt
        ? new Date(payResult.paidAt).toLocaleString('vi-VN')
        : new Date().toLocaleString('vi-VN'),
      method: payMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản (VietQR)',
      items: (billPreviewData?.items || orderItems.filter((it) => it.status === 'SERVED')),
      subtotal,
      discountVnd: safeDiscount,
      vatAmount,
      grandTotal: payResult?.amountVnd || grandTotal,
      customerPaid: Number(customerPaidAmount) || grandTotal,
      changeAmount: Math.max(0, (Number(customerPaidAmount) || grandTotal) - (payResult?.amountVnd || grandTotal)),
    };

    setLastPaidInvoice(invoice);

    // Cập nhật trạng thái bàn về TRỐNG (AVAILABLE)
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === selectedTable.id) {
          return {
            ...t,
            status: 'AVAILABLE',
            hasNotification: false,
            order: null,
          };
        }
        return t;
      })
    );

    setIsPayModalOpen(false);
    setIsOfficialInvoiceOpen(true);
    setDiscountVnd(0);
    showToast(`Đã thanh toán thành công hóa đơn cho ${selectedTable.name}!`, 'success');
  };

  // ==========================================================================
  // HÀM XỬ LÝ QUẢN LÝ THỰC ĐƠN & DANH MỤC (FR-C03)
  // ==========================================================================
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === 'Tất cả' ||
        item.categoryName === selectedCategory ||
        item.categoryId === selectedCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredMenuItems.length / itemsPerPage));
  const paginatedMenuItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(start, start + itemsPerPage);
  }, [filteredMenuItems, currentPage, itemsPerPage]);

  // Thêm món ăn mới (POST /api/v1/menu-items)
  const handleCreateMenuItem = async () => {
    if (!dishForm.name.trim()) {
      showToast('Vui lòng nhập tên món ăn.', 'error');
      return;
    }
    const priceNum = Number(dishForm.priceVnd);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Giá món ăn không hợp lệ.', 'error');
      return;
    }

    const targetCat = categories.find((c) => c.id === dishForm.categoryId) || categories[0];
    const newDish = {
      id: `m-${Date.now()}`,
      categoryId: targetCat.id,
      categoryName: targetCat.name,
      name: dishForm.name.trim(),
      description: dishForm.description.trim(),
      priceVnd: priceNum,
      imageUrl: dishForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      available: true,
      active: true,
    };

    if (apiFetch) {
      await apiFetch('/menu-items', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: targetCat.id,
          name: newDish.name,
          description: newDish.description,
          priceVnd: newDish.priceVnd,
          imageUrl: newDish.imageUrl,
        }),
      }).catch(() => null);
    }

    setMenuItems((prev) => [newDish, ...prev]);
    setIsAddDishOpen(false);
    setDishForm({ name: '', categoryId: categories[0]?.id || 'cat-1', priceVnd: '', imageUrl: '', description: '' });
    showToast(`Đã thêm món "${newDish.name}" vào thực đơn!`, 'success');
  };

  // Sửa món ăn (PATCH /api/v1/menu-items/{id})
  const handleUpdateMenuItem = async () => {
    if (!dishForm.name.trim()) {
      showToast('Vui lòng nhập tên món ăn.', 'error');
      return;
    }
    const priceNum = Number(dishForm.priceVnd);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Giá món ăn không hợp lệ.', 'error');
      return;
    }

    const targetCat = categories.find((c) => c.id === dishForm.categoryId) || categories[0];

    if (apiFetch && selectedMenuId) {
      await apiFetch(`/menu-items/${selectedMenuId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          categoryId: targetCat.id,
          name: dishForm.name.trim(),
          description: dishForm.description.trim(),
          priceVnd: priceNum,
          imageUrl: dishForm.imageUrl.trim(),
        }),
      }).catch(() => null);
    }

    setMenuItems((prev) =>
      prev.map((m) =>
        m.id === selectedMenuId
          ? {
            ...m,
            name: dishForm.name.trim(),
            categoryId: targetCat.id,
            categoryName: targetCat.name,
            priceVnd: priceNum,
            imageUrl: dishForm.imageUrl.trim() || m.imageUrl,
            description: dishForm.description.trim(),
          }
          : m
      )
    );

    setIsEditDishOpen(false);
    showToast('Đã cập nhật thông tin món ăn!', 'success');
  };

  // Bật / Tắt trạng thái Còn món - Hết hàng (FR-C03: PATCH /api/v1/menu-items/{id}/availability)
  const handleToggleAvailability = async (targetId) => {
    const idToToggle = targetId || selectedMenuId;
    if (!idToToggle) return;
    const item = menuItems.find((m) => m.id === idToToggle);
    if (!item) return;

    const newAvailable = !item.available;

    if (apiFetch) {
      await apiFetch(`/menu-items/${idToToggle}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ available: newAvailable }),
      }).catch(() => null);
    }

    setMenuItems((prev) =>
      prev.map((m) => (m.id === idToToggle ? { ...m, available: newAvailable } : m))
    );

    showToast(
      `Đã chuyển món "${item.name}" sang: ${newAvailable ? 'Còn hàng (Đang phục vụ)' : 'Hết hàng (Tạm ngưng)'}`,
      newAvailable ? 'success' : 'info'
    );
  };

  // Xóa món ăn (DELETE /api/v1/menu-items/{id})
  const handleDeleteMenuItem = async () => {
    if (!selectedMenuId) return;
    if (apiFetch) {
      await apiFetch(`/menu-items/${selectedMenuId}`, { method: 'DELETE' }).catch(() => null);
    }
    setMenuItems((prev) => prev.filter((m) => m.id !== selectedMenuId));
    setIsDeleteDishOpen(false);
    showToast('Đã xóa món ăn khỏi thực đơn!', 'info');
  };

  // Quản lý Danh mục (POST/PATCH/DELETE /api/v1/categories)
  const handleCreateCategory = async () => {
    const trimmed = categoryForm.name.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập tên danh mục.', 'error');
      return;
    }
    const newCat = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      icon: Utensils,
      active: true,
    };

    if (apiFetch) {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      }).catch(() => null);
    }

    setCategories((prev) => [...prev, newCat]);
    setIsAddCategoryOpen(false);
    setCategoryForm({ id: '', name: '' });
    showToast(`Đã thêm danh mục "${trimmed}"!`, 'success');
  };

  const handleUpdateCategory = async () => {
    const trimmed = categoryForm.name.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập tên danh mục.', 'error');
      return;
    }

    if (apiFetch && categoryForm.id) {
      await apiFetch(`/categories/${categoryForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: trimmed }),
      }).catch(() => null);
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryForm.id ? { ...c, name: trimmed } : c))
    );
    setIsEditCategoryOpen(false);
    showToast(`Đã đổi tên danh mục thành "${trimmed}"!`, 'success');
  };

  const handleDeleteCategory = async () => {
    if (!categoryForm.id) return;
    if (apiFetch) {
      await apiFetch(`/categories/${categoryForm.id}`, { method: 'DELETE' }).catch(() => null);
    }
    setCategories((prev) => prev.filter((c) => c.id !== categoryForm.id));
    setIsDeleteCategoryOpen(false);
    showToast('Đã xóa danh mục!', 'info');
  };

  // ==========================================================================
  // HÀM XỬ LÝ SƠ ĐỒ BÀN (FR-C04: POST/PATCH/DELETE /api/v1/tables)
  // ==========================================================================
  const handleSelectTableForEdit = (tbl) => {
    setEditingTableId(tbl.id);
    setEditingTableName(tbl.name);
    setEditingTableCapacity(tbl.capacity || 4);
  };

  const handleCreateTable = async () => {
    if (!newTableForm.name.trim()) {
      showToast('Vui lòng nhập tên bàn.', 'error');
      return;
    }
    const cap = Math.max(1, Number(newTableForm.capacity) || 4);
    const newTbl = {
      id: `t-${Date.now()}`,
      name: newTableForm.name.trim(),
      capacity: cap,
      status: 'AVAILABLE',
      active: true,
      hasNotification: false,
      order: null,
    };

    if (apiFetch) {
      await apiFetch('/tables', {
        method: 'POST',
        body: JSON.stringify({ name: newTbl.name, capacity: cap }),
      }).catch(() => null);
    }

    setTables((prev) => [...prev, newTbl]);
    setIsAddTableOpen(false);
    setNewTableForm({ name: '', capacity: 4 });
    showToast(`Đã thêm bàn "${newTbl.name}" (${cap} chỗ)!`, 'success');
  };

  const handleSaveTableInfo = async () => {
    const trimmed = editingTableName.trim();
    if (!trimmed) {
      showToast('Tên bàn không được để trống.', 'error');
      return;
    }
    const cap = Math.max(1, Number(editingTableCapacity) || 4);

    if (apiFetch && editingTableId) {
      await apiFetch(`/tables/${editingTableId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: trimmed, capacity: cap }),
      }).catch(() => null);
    }

    setTables((prev) =>
      prev.map((t) => (t.id === editingTableId ? { ...t, name: trimmed, capacity: cap } : t))
    );
    showToast(`Đã lưu thông tin bàn ${trimmed}!`, 'success');
  };

  const handleDeleteTable = async () => {
    if (!editingTableId) return;
    if (apiFetch) {
      await apiFetch(`/tables/${editingTableId}`, { method: 'DELETE' }).catch(() => null);
    }
    setTables((prev) => prev.filter((t) => t.id !== editingTableId));
    setIsDeleteTableOpen(false);
    if (tables.length > 1) {
      handleSelectTableForEdit(tables.find((t) => t.id !== editingTableId) || tables[0]);
    }
    showToast('Đã xóa bàn khỏi sơ đồ!', 'info');
  };

  // ==========================================================================
  // HÀM XỬ LÝ BÁO CÁO DOANH THU (FR-C05: GET /api/v1/reports/...)
  // ==========================================================================
  const handleFetchReportByDate = useCallback(
    async (targetDate) => {
      setReportDate(targetDate);
      if (!apiFetch) return;
      try {
        // FR-C05: GET /api/v1/reports/summary?date=YYYY-MM-DD
        const summary = await apiFetch(`/reports/summary?date=${targetDate}&limit=10`).catch(() => null);
        if (summary && summary.revenue) {
          setRevenueReport({
            date: summary.revenue.date || targetDate,
            totalOrdersCompleted: summary.revenue.totalOrdersCompleted || 0,
            subtotalVnd: summary.revenue.subtotalVnd || 0,
            discountVnd: summary.revenue.discountVnd || 0,
            vatVnd: summary.revenue.vatVnd || 0,
            totalRevenueVnd: summary.revenue.totalRevenueVnd || 0,
          });
          if (Array.isArray(summary.topItems)) {
            setTopItemsReport(summary.topItems);
          }
          return;
        }

        // Fallback FR-C05: GET /api/v1/reports/revenue & top-items
        const rev = await apiFetch(`/reports/revenue?date=${targetDate}`).catch(() => null);
        if (rev) {
          setRevenueReport({
            date: rev.date || targetDate,
            totalOrdersCompleted: rev.totalOrdersCompleted || 0,
            subtotalVnd: rev.subtotalVnd || 0,
            discountVnd: rev.discountVnd || 0,
            vatVnd: rev.vatVnd || 0,
            totalRevenueVnd: rev.totalRevenueVnd || 0,
          });
        }
        const top = await apiFetch(`/reports/top-items?date=${targetDate}&limit=10`).catch(() => null);
        if (top && Array.isArray(top)) {
          setTopItemsReport(top);
        }
      } catch {
        // Ignored
      }
    },
    [apiFetch]
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FAF7F2] text-slate-800 font-sans select-none">
      {/* ========================================================= */}
      {/* 1. THANH ĐIỀU HƯỚNG BÊN TRÁI (LEFT SIDEBAR)              */}
      {/* ========================================================= */}
      <aside className="w-56 lg:w-64 bg-white border-r border-orange-100/80 flex flex-col justify-between shrink-0 shadow-xs z-20">
        <div>
          {/* Logo & Tên nhà hàng */}
          <div className="p-5 flex flex-col items-center justify-center border-b border-orange-50">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-2 mb-2 shadow-xs border border-orange-200/60">
              <img
                src="/favicon.jpg"
                alt="ROMS Logo"
                className="w-full h-full object-contain rounded-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-xl font-extrabold text-orange-600 tracking-tight flex items-center gap-1">
              ROMS
            </h1>

          </div>

          {/* Danh sách 4 Tab chức năng */}
          <nav className="p-3 space-y-1.5 mt-2">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${activeTab === 'checkout'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/70'
                }`}
            >
              <CreditCard className="w-5 h-5 shrink-0" />
              <span>Thanh toán</span>
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${activeTab === 'menu'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/70'
                }`}
            >
              <Utensils className="w-5 h-5 shrink-0" />
              <span>Quản lý Thực đơn</span>
            </button>

            <button
              onClick={() => setActiveTab('tables')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${activeTab === 'tables'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/70'
                }`}
            >
              <LayoutGrid className="w-5 h-5 shrink-0" />
              <span>Quản lý Sơ đồ bàn</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${activeTab === 'reports'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/70'
                }`}
            >
              <BarChart3 className="w-5 h-5 shrink-0" />
              <span>Báo cáo Doanh thu</span>
            </button>
          </nav>
        </div>

        {/* Cài đặt, Hồ sơ & Đăng xuất */}
        <div className="p-3 border-t border-orange-50 space-y-1.5">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${activeTab === 'profile'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
              : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/70'
              }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span>Hồ sơ</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-semibold text-slate-600 hover:text-orange-600 hover:bg-orange-50/80 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Cài đặt</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. KHU VỰC NỘI DUNG CHÍNH (MAIN WORKSPACE)                 */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* THANH TOP BAR: Ngày giờ to nổi bật + Nút cửa sổ desktop */}
        <header className="h-14 bg-white/90 backdrop-blur-md border-b border-orange-100/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-orange-50 border border-orange-200/60 text-orange-500 flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4 stroke-[2.4]" />
            </div>
            <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
              {currentTime}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors inline-block" />
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors inline-block" />
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 hover:bg-rose-400 transition-colors inline-block" />
            </div>
          </div>
        </header>

        {/* NỘI DUNG THAY ĐỔI THEO TỪNG TAB */}
        <main className="flex-1 p-2.5 sm:p-3 overflow-y-auto [scrollbar-gutter:stable]">
          {/* ===================================================== */}
          {/* TAB 1: TIẾP NHẬN THANH TOÁN (R-C01, FR-C02)           */}
          {/* ===================================================== */}
          {activeTab === 'checkout' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* CỘT TRÁI: SƠ ĐỒ BÀN (CHUẨN HÌNH MẪU 1) */}
                <div className="xl:col-span-7 bg-white rounded-lg p-5 shadow-xs border border-orange-100/70 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-orange-100/70 text-orange-600 flex items-center justify-center">
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Sơ đồ bàn
                      </h2>
                    </div>

                    {/* Chú thích 3 chấm tròn chuẩn theo hình mẫu 1 */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setTableFilter(tableFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${tableFilter === 'AVAILABLE'
                            ? 'bg-slate-200/90 text-slate-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                          }`}
                        title="Lọc bàn trống"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Trống</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableFilter(tableFilter === 'SERVING' ? 'ALL' : 'SERVING')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${tableFilter === 'SERVING'
                            ? 'bg-slate-200/90 text-slate-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                          }`}
                        title="Lọc bàn đang phục vụ"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Đang phục vụ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTableFilter(tableFilter === 'PAYMENT_REQUESTED' ? 'ALL' : 'PAYMENT_REQUESTED')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${tableFilter === 'PAYMENT_REQUESTED'
                            ? 'bg-slate-200/90 text-slate-900 font-bold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                          }`}
                        title="Lọc bàn đang thanh toán"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                        <span>Đang thanh toán</span>
                      </button>
                    </div>
                  </div>

                  {/* Lưới các bàn ăn: Có thanh cuộn độc lập khi nhà hàng có nhiều bàn */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-4 bg-[#FAF7F2]/60 rounded-md border border-orange-100/60 max-h-[calc(100vh-260px)] min-h-[420px] overflow-y-auto pr-2 [scrollbar-gutter:stable] content-start">
                    {filteredTables.length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 text-sm">
                        <p className="font-medium">Không có bàn nào ở trạng thái này</p>
                        <button
                          type="button"
                          onClick={() => setTableFilter('ALL')}
                          className="mt-2 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                        >
                          Hiển thị tất cả bàn
                        </button>
                      </div>
                    ) : (
                      filteredTables.map((tbl) => {
                        const isSelected = tbl.id === selectedTableId;
                        const isPaying = tbl.status === 'PAYMENT_REQUESTED';
                        const isServing = tbl.status === 'SERVING';

                        let tableBg = 'bg-white border-slate-200/90 text-slate-700';
                        let chairBg = 'bg-emerald-100/70 border border-emerald-200/60';
                        let statusText = 'Trống';

                        if (isPaying) {
                          tableBg = 'bg-[#FFF1F2] border-rose-400 text-rose-950';
                          chairBg = 'bg-rose-100/90 border border-rose-200/70';
                          statusText = 'Đang thanh toán';
                        } else if (isServing) {
                          tableBg = 'bg-[#FFFDF9] border-orange-200 text-slate-800';
                          chairBg = 'bg-amber-100/80 border border-amber-200/60';
                          statusText = 'Đang phục vụ';
                        }

                        return (
                          <div
                            key={tbl.id}
                            onClick={() => handleSelectTable(tbl)}
                            className={`relative flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 ${isSelected ? 'scale-105' : 'hover:scale-102'
                              }`}
                          >
                            {/* Chấm tròn thông báo đỏ số 1 như hình mẫu */}
                            {isPaying && (
                              <span className="absolute -top-1 -right-1 z-20 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                                1
                              </span>
                            )}

                            {/* Khối bàn vuông và 4 ghế nhô ra 4 phía */}
                            <div className="relative w-24 h-24 flex items-center justify-center">
                              <span className={`w-10 h-3.5 rounded-t-sm absolute -top-1.5 ${chairBg} transition-colors`} />
                              <span className={`w-10 h-3.5 rounded-b-sm absolute -bottom-1.5 ${chairBg} transition-colors`} />
                              <span className={`w-3.5 h-10 rounded-l-sm absolute -left-1.5 ${chairBg} transition-colors`} />
                              <span className={`w-3.5 h-10 rounded-r-sm absolute -right-1.5 ${chairBg} transition-colors`} />

                              <div
                                className={`w-20 h-20 rounded-md border-2 ${tableBg} flex flex-col items-center justify-center shadow-xs z-10 transition-colors ${isSelected
                                    ? (isPaying ? 'border-rose-500 ring-2 ring-rose-400/80 shadow-xs' : 'border-orange-500 ring-2 ring-orange-400/80 shadow-xs')
                                    : 'hover:border-orange-300'
                                  }`}
                              >
                                <span className="font-extrabold text-base leading-tight text-center">
                                  {tbl.name}
                                </span>
                                <span className={`text-[10px] font-bold mt-0.5 text-center leading-tight px-1 w-full block ${isPaying ? 'text-rose-600' : 'text-slate-500'
                                  }`}>
                                  {statusText}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium text-center">
                                  ({tbl.capacity} chỗ)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }))}
                  </div>
                </div>

                {/* CỘT PHẢI: CHI TIẾT ĐƠN HÀNG (STICKY LUÔN CỐ ĐỊNH TRONG TẦM NHÌN) */}
                <div className="xl:col-span-5 sticky top-2 bg-white rounded-lg p-5 shadow-xs border border-orange-100/70 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header đơn hàng */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-orange-100/70 text-orange-600 flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                            Chi tiết đơn hàng
                          </h2>
                          <span className="text-xs text-slate-400 font-medium">
                            Mã: {selectedTable?.order?.orderCode || 'Chưa có đơn'} • Đã phục vụ: {servedItemsCount}/{totalItemsCount} món
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-md bg-orange-500 text-white font-extrabold text-xs shadow-xs">
                          Bàn: {selectedTable.name}
                        </span>
                      </div>
                    </div>

                    {/* BẢNG DANH SÁCH MÓN ĂN CHUẨN THEO HÌNH MẪU */}
                    <div>
                      {/* Tiêu đề các cột bảng */}
                      <div className="grid grid-cols-12 text-xs font-bold text-slate-400 py-2 px-2 border-b border-slate-100">
                        <span className="col-span-4">Tên món</span>
                        <span className="col-span-3 text-right pr-6">Giá</span>
                        <span className="col-span-2 text-center">Số lượng</span>
                        <span className="col-span-3 text-right">Thành tiền</span>
                      </div>

                      {/* Các dòng món ăn */}
                      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {orderItems.length === 0 ? (
                          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
                            <p>Bàn này hiện chưa có món ăn nào.</p>
                          </div>
                        ) : (
                          orderItems.map((item) => (
                            <div
                              key={item.id}
                              className="grid grid-cols-12 items-center py-2.5 px-2 hover:bg-slate-50/50 transition-colors text-xs sm:text-sm font-semibold"
                            >
                              <div className="col-span-4 flex items-center gap-2.5 min-w-0 pr-1">
                                <img
                                  src={item.image || item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-md object-cover border border-slate-100 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-800 line-clamp-1">
                                    {item.name}
                                  </span>
                                  {item.status && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${item.status === 'SERVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                      }`}>
                                      {item.status === 'SERVED' ? 'Đã phục vụ' : (item.status === 'PREPARING' ? 'Đang nấu' : item.status)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="col-span-3 text-right pr-6 text-slate-500 font-medium">
                                {formatCurrency(item.unitPriceVnd)}
                              </span>
                              <span className="col-span-2 text-center font-bold text-slate-700">
                                {item.quantity}
                              </span>
                              <span className="col-span-3 text-right font-black text-slate-900">
                                {formatCurrency(item.unitPriceVnd * item.quantity)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* KHỐI TÍNH TIỀN: TẠM TÍNH, GIẢM GIÁ, VAT 8%, TỔNG CỘNG */}
                  <div className="border-t border-slate-100 pt-3 space-y-2.5">
                    <div className="flex justify-between text-xs sm:text-sm text-slate-600 font-semibold">
                      <span>Tạm tính:</span>
                      <span className="text-slate-900 font-bold">{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Ô nhập giảm giá */}
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-slate-600 font-semibold">Giảm giá:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          step="1000"
                          value={discountVnd === 0 ? '' : discountVnd}
                          onChange={(e) => setDiscountVnd(Math.max(0, Number(e.target.value) || 0))}

                          className="w-28 px-2.5 py-1 text-right rounded-md border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-orange-500"
                        />
                        <span className="text-xs text-slate-400 font-semibold">đ</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs sm:text-sm text-slate-600 font-semibold">
                      <span>VAT (8%):</span>
                      <span className="text-slate-900 font-bold">{formatCurrency(vatAmount)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                      <span>Tổng cộng:</span>
                      <span className="text-lg sm:text-xl text-orange-600 font-extrabold">{formatCurrency(grandTotal)}</span>
                    </div>

                    {/* 3 NÚT BẤM CHUẨN THEO HÌNH MẪU 1: In tạm tính, In hóa đơn, Thanh toán */}
                    <div className="grid grid-cols-3 gap-2.5 pt-2">
                      <button
                        onClick={() => setIsBillPreviewOpen(true)}
                        disabled={subtotal === 0}
                        className="py-2.5 px-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Printer className="w-4 h-4" />
                        <span>In tạm tính</span>
                      </button>

                      <button
                        onClick={() => {
                          if (subtotal === 0) return;
                          if (lastPaidInvoice && lastPaidInvoice.tableName === selectedTable.name) {
                            setIsOfficialInvoiceOpen(true);
                          } else {
                            handleOpenPaymentModal();
                          }
                        }}
                        disabled={subtotal === 0}
                        className="py-2.5 px-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>In hóa đơn</span>
                      </button>

                      <button
                        onClick={handleOpenPaymentModal}
                        disabled={subtotal === 0}
                        className="py-2.5 px-2 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 shadow-md shadow-orange-500/25 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Thanh toán</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 2: QUẢN LÝ THỰC ĐƠN (FR-C03)                      */}
          {/* ===================================================== */}
          {activeTab === 'menu' && (
            <div className="bg-white rounded-lg p-3.5 sm:p-4 shadow-xs border border-orange-100/80 space-y-3">
              {/* Tiêu đề & Nút Thêm món ăn mới */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                      Quản lý Thực đơn (FR-C03)
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Quản lý món ăn, giá bán, hình ảnh và danh mục
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDishForm({
                      name: '',
                      categoryId: categories[0]?.id || 'cat-1',
                      priceVnd: '',
                      imageUrl: '',
                      description: '',
                    });
                    setIsAddDishOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Thêm món</span>
                </button>
              </div>

              {/* THANH TÌM KIẾM VÀ CÁC NÚT DANH MỤC TRÊN CÙNG KÈM SỐ LƯỢNG */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Tìm món ăn..."
                    aria-label="Tìm kiếm món ăn"
                    className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                {/* Các pill danh mục nằm ngang hiển thị số lượng món dạng (X) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedCategory('Tất cả');
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${selectedCategory === 'Tất cả'
                      ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                      : 'border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                      }`}
                  >
                    Tất cả ({menuItems.length})
                  </button>
                  {categories.map((cat) => {
                    const count = menuItems.filter((m) => m.categoryId === cat.id || m.categoryName === cat.name).length;
                    return (
                      <button
                        key={cat.id || cat.name}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${selectedCategory === cat.name
                          ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                          : 'border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                          }`}
                      >
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bố cục 2 cột: Cột trái (Lưới món ăn) - Cột phải (Danh mục có Thêm/Sửa/Xóa) */}
              <div className="flex flex-col xl:flex-row gap-3.5 items-start">
                {/* CỘT TRÁI: LƯỚI 12 MÓN ĂN (3 HÀNG) KHUNG CỐ ĐỊNH VỪA VẶN MÀN HÌNH, KHÔNG BỊ TRỐNG PHÍA DƯỚI */}
                <div className="flex-1 w-full space-y-2.5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 h-[400px] min-h-[400px] max-h-[400px] content-start">
                    {paginatedMenuItems.map((item) => {
                      const isSelected = item.id === selectedMenuId;
                      const isAvailable = item.available !== false;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedMenuId(item.id)}
                          className={`relative group p-2 sm:p-2.5 rounded-lg border-2 transition-all duration-150 cursor-pointer flex flex-col items-center text-center justify-center ${isSelected
                            ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                            : 'border-slate-100 bg-white hover:border-orange-300 hover:shadow-xs'
                            } ${!isAvailable ? 'opacity-70 bg-slate-50/80' : ''}`}
                        >
                          {/* Huy hiệu Hết hàng */}
                          {!isAvailable && (
                            <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                              Hết
                            </span>
                          )}

                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden mb-1.5 border border-orange-100/80 shadow-xs bg-slate-50 flex items-center justify-center shrink-0 relative">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                              }}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'grayscale' : ''}`}
                            />
                          </div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 leading-tight mb-0.5">
                            {item.name}
                          </h3>
                          <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                            {formatCurrency(item.priceVnd)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Thanh phân trang & Nút Toggle hết hàng / Sửa / Xóa */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                    <div className="hidden sm:block text-[11px] font-semibold text-slate-400">
                      Hiển thị {paginatedMenuItems.length} / {filteredMenuItems.length} món (3 hàng)
                    </div>

                    {/* Phân trang: < 1 2 3 > */}
                    <div className="flex items-center gap-1 mx-auto sm:mx-0">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-600 hover:bg-orange-50 disabled:opacity-40 cursor-pointer"
                      >
                        &lt;
                      </button>
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const p = idx + 1;
                        return (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-md text-xs font-bold cursor-pointer transition-colors ${currentPage === p
                              ? 'bg-orange-500 text-white'
                              : 'border border-slate-200 text-slate-600 hover:bg-orange-50'
                              }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-600 hover:bg-orange-50 disabled:opacity-40 cursor-pointer"
                      >
                        &gt;
                      </button>
                    </div>

                    {/* Nút Toggle hết hàng & Sửa & Xóa món ăn */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selItem = menuItems.find((m) => m.id === selectedMenuId);
                        const isAvail = selItem?.available !== false;
                        return (
                          <button
                            onClick={() => handleToggleAvailability(selectedMenuId)}
                            className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${isAvail
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                              }`}
                            title={isAvail ? 'Đánh dấu món này là Hết hàng' : 'Mở bán lại món này'}
                          >
                            <span className={`w-2 h-2 rounded-full ${isAvail ? 'bg-amber-600' : 'bg-emerald-600'}`} />
                            <span>{isAvail ? 'Báo hết hàng' : 'Báo còn món'}</span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => {
                          const item = menuItems.find((m) => m.id === selectedMenuId);
                          if (item) {
                            setDishForm({
                              name: item.name,
                              categoryId: item.categoryId,
                              priceVnd: String(item.priceVnd),
                              imageUrl: item.imageUrl,
                              description: item.description || '',
                            });
                            setIsEditDishOpen(true);
                          }
                        }}
                        className="px-3 py-1.5 rounded-md bg-orange-100/80 hover:bg-orange-200/80 text-orange-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa món</span>
                      </button>
                      <button
                        onClick={() => setIsDeleteDishOpen(true)}
                        className="px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa món</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: KHUNG DANH MỤC CÓ THÊM, SỬA, XÓA DANH MỤC (KHÔNG BỊ ĐẨY XUỐNG DƯỚI) */}
                <div className="w-full xl:w-64 shrink-0 bg-white rounded-lg p-3 sm:p-3.5 border border-slate-100 shadow-xs h-[448px] min-h-[448px] max-h-[448px] flex flex-col space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0">
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
                      Danh mục
                    </h3>
                    <button
                      onClick={() => {
                        setCategoryForm({ id: '', name: '' });
                        setIsAddCategoryOpen(true);
                      }}
                      className="px-2 py-0.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm</span>
                    </button>
                  </div>

                  {/* Danh sách danh mục gắn sát ngay dưới tiêu đề */}
                  <div className="space-y-1 overflow-y-auto flex-1 pr-0.5">
                    <button
                      onClick={() => {
                        setSelectedCategory('Tất cả');
                        setCurrentPage(1);
                      }}
                      className={`w-full py-1.5 px-2.5 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer border ${selectedCategory === 'Tất cả'
                        ? 'bg-[#FFF3E8] border-orange-200/90 text-orange-600 font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 font-semibold border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Utensils className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="truncate">Tất cả món</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold shrink-0">{menuItems.length}</span>
                    </button>

                    {categories.map((cat) => {
                      const isCatActive = selectedCategory === cat.name;
                      const IconComp = cat.icon || Utensils;
                      const count = menuItems.filter((m) => m.categoryId === cat.id || m.categoryName === cat.name).length;
                      return (
                        <div
                          key={cat.id || cat.name}
                          className={`group w-full py-1 px-2 rounded-md flex items-center justify-between transition-colors border ${isCatActive
                            ? 'bg-[#FFF3E8] border-orange-200/90 text-orange-600 font-bold shadow-xs'
                            : 'hover:bg-slate-50 border-transparent text-slate-700'
                            }`}
                        >
                          <button
                            onClick={() => {
                              setSelectedCategory(cat.name);
                              setCurrentPage(1);
                            }}
                            className="flex items-center gap-2 flex-1 text-left py-0.5 text-xs font-semibold truncate cursor-pointer"
                          >
                            <IconComp className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{cat.name}</span>
                          </button>

                          <span className="text-[11px] text-slate-400 font-bold px-1 group-hover:hidden shrink-0">
                            {count}
                          </span>

                          {/* Nút sửa / xóa danh mục (FR-C03) */}
                          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoryForm({ id: cat.id, name: cat.name });
                                setIsEditCategoryOpen(true);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-white cursor-pointer"
                              title="Sửa danh mục"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoryForm({ id: cat.id, name: cat.name });
                                setIsDeleteCategoryOpen(true);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                              title="Xóa danh mục"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 3: QUẢN LÝ SƠ ĐỒ BÀN (FR-C04)                      */}
          {/* ===================================================== */}
          {activeTab === 'tables' && (
            <div className="bg-white rounded-lg p-5 lg:p-6 shadow-xs border border-orange-100/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900">
                      Quản lý Sơ đồ bàn (FR-C04)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Tổng số: <strong className="text-slate-700 font-bold">{tables.length} bàn</strong> • Thêm bàn mới, sửa tên bàn, sửa số lượng ghế (sức chứa) và xóa bàn
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewTableForm({ name: `T${tables.length + 1}`, capacity: 4 });
                    setIsAddTableOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Thêm bàn</span>
                </button>
              </div>

              {/* THANH TÌM KIẾM & BỘ LỌC THEO SỐ CHỖ KÈM SỐ LƯỢNG BÀN (FR-C04) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    placeholder="Tìm tên bàn (ví dụ: T1, T2)..."
                    aria-label="Tìm kiếm bàn"
                    className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                {/* Các pill lọc theo số chỗ ngồi kèm số lượng bàn từng loại */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
                  <button
                    onClick={() => setTableCapacityFilter('ALL')}
                    className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${tableCapacityFilter === 'ALL'
                        ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                        : 'border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                      }`}
                  >
                    Tất cả ({tables.length})
                  </button>
                  {capacityStats.map(({ capacity, count }) => (
                    <button
                      key={capacity}
                      onClick={() => setTableCapacityFilter(capacity)}
                      className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${tableCapacityFilter === capacity
                          ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                          : 'border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                        }`}
                    >
                      Bàn {capacity} chỗ ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Bố cục 2 cột: Trái là Sơ đồ bàn ghế (cuộn riêng), Phải là Panel Thông tin bàn (Ghim cố định) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 bg-[#FAF7F2]/60 rounded-lg border border-orange-100/60 p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-orange-100/60 text-xs font-semibold text-slate-500">
                    <span>
                      Hiển thị <strong>{filteredManagementTables.length}</strong> / <strong>{tables.length}</strong> bàn
                      {tableCapacityFilter !== 'ALL' && ` (Loại ${tableCapacityFilter} chỗ)`}
                    </span>
                    {tables.length > 8 && (
                      <span className="text-[11px] text-slate-400">Cuộn để xem tiếp các bàn khác</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-h-[calc(100vh-310px)] min-h-[380px] overflow-y-auto pr-2 [scrollbar-gutter:stable] content-start">
                    {filteredManagementTables.length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 text-sm">
                        <p className="font-semibold text-slate-600">Không tìm thấy bàn nào phù hợp với bộ lọc</p>
                        <button
                          onClick={() => {
                            setTableCapacityFilter('ALL');
                            setTableSearchQuery('');
                          }}
                          className="mt-2 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                        >
                          Hiển thị tất cả {tables.length} bàn
                        </button>
                      </div>
                    ) : (
                      filteredManagementTables.map((tbl) => {
                        const isSelected = tbl.id === editingTableId;

                        return (
                          <div
                            key={tbl.id}
                            onClick={() => handleSelectTableForEdit(tbl)}
                            className={`flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 ${isSelected ? 'scale-105' : 'hover:scale-102'
                              }`}
                          >
                            {/* Hình khối bàn ghế tiêu chuẩn cấu trúc mặt bằng (Không trạng thái phục vụ) */}
                            <div className="relative w-24 h-24 flex items-center justify-center">
                              <span className="w-10 h-3.5 rounded-t-sm absolute -top-1.5 bg-orange-100/90 border border-orange-200/60" />
                              <span className="w-10 h-3.5 rounded-b-sm absolute -bottom-1.5 bg-orange-100/90 border border-orange-200/60" />
                              <span className="w-3.5 h-10 rounded-l-sm absolute -left-1.5 bg-orange-100/90 border border-orange-200/60" />
                              <span className="w-3.5 h-10 rounded-r-sm absolute -right-1.5 bg-orange-100/90 border border-orange-200/60" />

                              <div
                                className={`w-20 h-20 rounded-md border-2 flex flex-col items-center justify-center shadow-xs z-10 transition-colors ${isSelected
                                  ? 'bg-orange-50/90 border-orange-500 ring-2 ring-orange-400 text-slate-900 shadow-sm'
                                  : 'bg-white border-slate-200/90 text-slate-800 hover:border-orange-300 hover:bg-orange-50/20'
                                  }`}
                              >
                                <span className="font-extrabold text-base leading-tight text-slate-900">
                                  {tbl.name}
                                </span>
                                <span className="text-xs font-bold text-orange-600 mt-1">
                                  {tbl.capacity} chỗ
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI: FORM CHỈNH SỬA TÊN BÀN & SỨC CHỨA & XÓA BÀN (STICKY LUÔN CỐ ĐỊNH TRONG TẦM MẮT) */}
                <div className="lg:col-span-4 sticky top-2 bg-[#FAF7F2]/60 rounded-lg p-5 border border-orange-100/60 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-orange-100">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Thông tin bàn ({editingTableName})
                    </h3>
                    <button
                      onClick={() => setIsDeleteTableOpen(true)}
                      className="p-1.5 rounded-md text-rose-500 hover:bg-rose-100 transition-colors"
                      title="Xóa bàn này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Tên bàn (FR-C04: Sửa tên bàn)
                      </label>
                      <input
                        type="text"
                        value={editingTableName}
                        onChange={(e) => setEditingTableName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-orange-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Sức chứa / Số lượng ghế (capacity)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={editingTableCapacity}
                        onChange={(e) => setEditingTableCapacity(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-orange-500 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSaveTableInfo}
                        className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lưu thay đổi</span>
                      </button>
                      <button
                        onClick={() => {
                          const current = tables.find((t) => t.id === editingTableId);
                          if (current) {
                            setEditingTableName(current.name);
                            setEditingTableCapacity(current.capacity || 4);
                          }
                        }}
                        className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
                      >
                        Đặt lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 4: BÁO CÁO DOANH THU (FR-C05)                     */}
          {/* ===================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Header & Bộ lọc thời gian chuẩn theo API ?date=YYYY-MM-DD */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-lg border border-orange-100/70 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900">
                      Báo cáo Doanh thu & Tổng hợp cuối ngày (FR-C05)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Dữ liệu báo cáo ngày: <span className="font-bold text-orange-600">{reportDate}</span>
                    </p>
                  </div>
                </div>

                {/* Bộ lọc Date Picker chuẩn ?date=YYYY-MM-DD */}
                <div className="flex flex-wrap items-center gap-2">


                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => handleFetchReportByDate(e.target.value)}
                      className="text-xs sm:text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 3 THẺ STATS CHUẨN BACKEND DailyRevenueReport */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-lg p-5 border border-orange-100/70 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Tổng doanh thu thực nhận
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      {formatCurrency(revenueReport.totalRevenueVnd)}
                    </h3>
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Sau thuế và giảm giá
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-orange-100/70 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Đơn hàng hoàn thành
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                      {revenueReport.totalOrdersCompleted} đơn
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Đã thanh toán thành công
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-orange-100/70 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Tạm tính:</span>
                      <strong className="text-slate-800">{formatCurrency(revenueReport.subtotalVnd)}</strong>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-rose-600">
                      <span>Giảm giá:</span>
                      <strong>-{formatCurrency(revenueReport.discountVnd)}</strong>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Thuế VAT (8%):</span>
                      <strong className="text-slate-800">+{formatCurrency(revenueReport.vatVnd)}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* BẢNG TOP 10 MÓN BÁN CHẠY NHẤT (FR-C05: GET /api/v1/reports/top-items?limit=10) */}
              <div className="bg-white rounded-lg p-5 lg:p-6 border border-orange-100/70 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        Top 10 Món bán chạy nhất trong ngày (FR-C05)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Sắp xếp theo số lượng bán và doanh thu thu về
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 border border-orange-200/70">
                    Giới hạn 10 món
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-bold">
                        <th className="py-3 px-3">Hạng</th>
                        <th className="py-3 px-3">Tên món ăn</th>
                        <th className="py-3 px-3 text-center">Số lượng đã bán</th>
                        <th className="py-3 px-3 text-right">Tổng doanh thu</th>
                        <th className="py-3 px-3 text-right">Tỷ trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {topItemsReport.slice(0, 10).map((it, idx) => {
                        const percent = revenueReport.subtotalVnd > 0
                          ? Math.round((it.totalRevenueVnd / revenueReport.subtotalVnd) * 100)
                          : 0;
                        return (
                          <tr key={it.menuItemId || idx} className="hover:bg-orange-50/40 transition-colors">
                            <td className="py-3 px-3">
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${idx === 0
                                  ? 'bg-amber-400 text-white shadow-xs'
                                  : idx === 1
                                    ? 'bg-slate-300 text-slate-700'
                                    : idx === 2
                                      ? 'bg-amber-600 text-white'
                                      : 'text-slate-400'
                                  }`}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {it.itemName}
                            </td>
                            <td className="py-3 px-3 text-center font-black text-orange-600">
                              {it.quantitySold}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900">
                              {formatCurrency(it.totalRevenueVnd)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-500">
                              {percent}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 5: HỒ SƠ NGƯỜI DÙNG (CHUẨN HÓA 100% THEO API /auth/me) */}
          {/* ===================================================== */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto space-y-6 pt-4">
              {/* Thẻ đại diện tài khoản */}
              <div className="bg-white rounded-xl p-6 lg:p-8 border border-orange-100/80 shadow-xs flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-3xl flex items-center justify-center shadow-md shadow-orange-500/20 border-4 border-white shrink-0">
                    {profileUser.avatarInitial}
                  </div>
                  {profileUser.active && (
                    <span
                      title="Tài khoản đang hoạt động"
                      className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs"
                    />
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h2 className="text-xl lg:text-2xl font-black text-slate-900">
                      {profileUser.username}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 font-extrabold text-xs">
                      {profileUser.role}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {profileUser.roleTitle} • Hệ thống Nhà Hàng ROMS
                  </p>
                </div>
              </div>

              {/* Thông tin chi tiết chuẩn theo Backend API (AppUser / UserView) */}
              <div className="bg-white rounded-xl p-6 border border-orange-100/80 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm uppercase text-slate-400 tracking-wider pb-2 border-b border-slate-100">
                  Thông tin tài khoản
                </h3>

                <div className="divide-y divide-slate-100 text-sm">
                  {/* Tên đăng nhập */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Tên đăng nhập</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {profileUser.username}
                    </span>
                  </div>

                  {/* Vai trò */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Vai trò hệ thống</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {profileUser.roleTitle}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        ({profileUser.role})
                      </span>
                    </div>
                  </div>

                  {/* Trạng thái hoạt động */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Trạng thái tài khoản</span>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                      profileUser.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${profileUser.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {profileUser.active ? 'Đang hoạt động (Active)' : 'Đã vô hiệu hóa'}
                    </span>
                  </div>

                  {/* Mã định danh (ID) */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <span className="text-xs font-bold text-slate-400">ID</span>
                      <span>Mã định danh (User ID)</span>
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded border border-slate-200/60">
                      {profileUser.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút Đăng xuất an toàn */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: IN TẠM TÍNH (PREVIEW BILL - FR-C02)              */}
      {/* ========================================================= */}
      {isBillPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center pb-3 border-b border-dashed border-slate-200">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-1 inline-block">
                Phiếu tạm tính (Chưa thanh toán)
              </span>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                NHÀ HÀNG ROMS
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bàn: <strong>{selectedTable.name}</strong> • Giờ in: {currentTime}
              </p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
              <div className="grid grid-cols-12 font-bold text-slate-400 border-b pb-1 text-xs">
                <span className="col-span-4">Tên món</span>
                <span className="col-span-3 text-right pr-6">Giá</span>
                <span className="col-span-2 text-center">Số lượng</span>
                <span className="col-span-3 text-right">Thành tiền</span>
              </div>
              <div className="space-y-1.5 divide-y divide-slate-100/60">
                {orderItems
                  .filter((it) => it.status === 'SERVED')
                  .map((it) => (
                    <div key={it.id} className="grid grid-cols-12 font-medium text-slate-700 py-1 items-center">
                      <span className="col-span-4 truncate pr-1 font-semibold">{it.name}</span>
                      <span className="col-span-3 text-right pr-6 text-slate-500">{formatCurrency(it.unitPriceVnd)}</span>
                      <span className="col-span-2 text-center font-bold text-slate-800">{it.quantity}</span>
                      <span className="col-span-3 text-right font-bold text-slate-900">{formatCurrency(it.unitPriceVnd * it.quantity)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
              </div>
              {safeDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold">-{formatCurrency(safeDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>VAT (8%):</span>
                <span className="font-bold text-slate-800">{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Tổng cộng:</span>
                <span className="text-base text-orange-600 font-extrabold">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                  setIsBillPreviewOpen(false);
                  showToast('Đã gửi lệnh in phiếu tạm tính!', 'success');
                }}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu</span>
              </button>
              <button
                onClick={() => setIsBillPreviewOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: XÁC NHẬN THANH TOÁN (POST /api/v1/orders/{id}/pay) */}
      {/* ========================================================= */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <span>Thanh toán bàn {selectedTable.name} (FR-C02)</span>
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tổng số tiền */}
            <div className="p-4 rounded-md bg-orange-50/70 border border-orange-200/80 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tổng tiền cần thanh toán
              </span>
              <h4 className="text-2xl font-black text-orange-600 mt-0.5">
                {formatCurrency(grandTotal)}
              </h4>
            </div>

            {/* Phương thức thanh toán: Tiền mặt bình thường không viền màu */}
            <div className="flex items-center justify-between text-xs text-slate-600 py-1 border-b border-slate-100 pb-2">
              <span>Phương thức thanh toán:</span>
              <span className="text-slate-800 font-normal">Tiền mặt</span>
            </div>

            {/* Ô tiền khách đưa & tiền thối */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tiền khách đưa (VNĐ):
                </label>
                <input
                  type="number"
                  value={customerPaidAmount}
                  onChange={(e) => setCustomerPaidAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-black text-slate-900 outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex justify-between items-center text-xs font-bold p-2.5 rounded-md bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Tiền thối lại cho khách:</span>
                <span className="text-sm font-black text-emerald-600">
                  {formatCurrency(Math.max(0, (Number(customerPaidAmount) || 0) - grandTotal))}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-2.5 px-4 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận & Xuất hóa đơn</span>
              </button>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: HÓA ĐƠN CHÍNH THỨC (OFFICIAL INVOICE - FR-C02)  */}
      {/* ========================================================= */}
      {isOfficialInvoiceOpen && lastPaidInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center pb-3 border-b border-dashed border-slate-200">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1 inline-block">
                Hóa đơn thanh toán chính thức
              </span>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                NHÀ HÀNG ROMS
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Số HĐ: <strong>{lastPaidInvoice.invoiceCode}</strong> • {lastPaidInvoice.paidAt}
              </p>
              <p className="text-xs text-slate-400">
                Bàn: <strong>{lastPaidInvoice.tableName}</strong> • Thu ngân: {lastPaidInvoice.cashierName}
              </p>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto text-xs">
              <div className="grid grid-cols-12 font-bold text-slate-400 border-b pb-1 text-xs">
                <span className="col-span-4">Tên món</span>
                <span className="col-span-3 text-right pr-6">Giá</span>
                <span className="col-span-2 text-center">Số lượng</span>
                <span className="col-span-3 text-right">Thành tiền</span>
              </div>
              <div className="space-y-1.5 divide-y divide-slate-100/60">
                {lastPaidInvoice.items.map((it) => (
                  <div key={it.id} className="grid grid-cols-12 font-medium text-slate-700 py-1 items-center">
                    <span className="col-span-4 truncate pr-1 font-semibold">{it.name}</span>
                    <span className="col-span-3 text-right pr-6 text-slate-500">{formatCurrency(it.unitPriceVnd)}</span>
                    <span className="col-span-2 text-center font-bold text-slate-800">{it.quantity}</span>
                    <span className="col-span-3 text-right font-bold text-slate-900">{formatCurrency(it.unitPriceVnd * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-bold text-slate-800">{formatCurrency(lastPaidInvoice.subtotal)}</span>
              </div>
              {lastPaidInvoice.discountVnd > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold">-{formatCurrency(lastPaidInvoice.discountVnd)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Thuế VAT (8%):</span>
                <span className="font-bold text-slate-800">{formatCurrency(lastPaidInvoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Tổng thanh toán:</span>
                <span className="text-base text-orange-600 font-extrabold">{formatCurrency(lastPaidInvoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                <span>Phương thức:</span>
                <span className="font-normal text-slate-700">Tiền mặt</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                  setIsOfficialInvoiceOpen(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In hóa đơn</span>
              </button>
              <button
                onClick={() => setIsOfficialInvoiceOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: THÊM MÓN ĂN MỚI (FR-C03: POST /api/v1/menu-items) */}
      {/* ========================================================= */}
      {isAddDishOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                <span>Thêm món ăn mới (FR-C03)</span>
              </h3>
              <button
                onClick={() => setIsAddDishOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tên món ăn (name) *
                </label>
                <input
                  type="text"

                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Danh mục (categoryId) *
                </label>
                <select
                  value={dishForm.categoryId}
                  onChange={(e) => setDishForm({ ...dishForm, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Giá bán VNĐ (priceVnd) *
                </label>
                <input
                  type="number"

                  value={dishForm.priceVnd}
                  onChange={(e) => setDishForm({ ...dishForm, priceVnd: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mô tả món ăn (description)
                </label>
                <input
                  type="text"

                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Link hình ảnh món (imageUrl)
                </label>
                <input
                  type="text"

                  value={dishForm.imageUrl}
                  onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreateMenuItem}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm món</span>
              </button>
              <button
                onClick={() => setIsAddDishOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: SỬA MÓN ĂN (FR-C03: PATCH /api/v1/menu-items/{id}) */}
      {/* ========================================================= */}
      {isEditDishOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-orange-500" />
                <span>Sửa món ăn (FR-C03)</span>
              </h3>
              <button
                onClick={() => setIsEditDishOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tên món ăn (name) *
                </label>
                <input
                  type="text"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Danh mục (categoryId) *
                </label>
                <select
                  value={dishForm.categoryId}
                  onChange={(e) => setDishForm({ ...dishForm, categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Giá bán VNĐ (priceVnd) *
                </label>
                <input
                  type="number"
                  value={dishForm.priceVnd}
                  onChange={(e) => setDishForm({ ...dishForm, priceVnd: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mô tả món ăn (description)
                </label>
                <input
                  type="text"
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Link hình ảnh món (imageUrl)
                </label>
                <input
                  type="text"
                  value={dishForm.imageUrl}
                  onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleUpdateMenuItem}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
              <button
                onClick={() => setIsEditDishOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: XÁC NHẬN XÓA MÓN ĂN (FR-C03: DELETE)            */}
      {/* ========================================================= */}
      {isDeleteDishOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-extrabold text-base text-slate-900">
                Xác nhận xóa món ăn?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa món này khỏi thực đơn? Món ăn sẽ không thể đặt hàng được nữa.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDeleteMenuItem}
                className="flex-1 py-2.5 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                Xóa ngay
              </button>
              <button
                onClick={() => setIsDeleteDishOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: THÊM DANH MỤC MỚI (FR-C03: POST /api/v1/categories) */}
      {/* ========================================================= */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-500" />
                <span>Thêm danh mục mới (FR-C03)</span>
              </h3>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Tên danh mục (name) *
              </label>
              <input
                type="text"

                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreateCategory}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm danh mục</span>
              </button>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: SỬA DANH MỤC (FR-C03: PATCH /api/v1/categories) */}
      {/* ========================================================= */}
      {isEditCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-orange-500" />
                <span>Sửa tên danh mục (FR-C03)</span>
              </h3>
              <button
                onClick={() => setIsEditCategoryOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Tên danh mục *
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleUpdateCategory}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
              <button
                onClick={() => setIsEditCategoryOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 9: XÁC NHẬN XÓA DANH MỤC (FR-C03: DELETE)          */}
      {/* ========================================================= */}
      {isDeleteCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-extrabold text-base text-slate-900">
                Xác nhận xóa danh mục?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa danh mục <strong>"{categoryForm.name}"</strong>?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDeleteCategory}
                className="flex-1 py-2.5 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                Xóa ngay
              </button>
              <button
                onClick={() => setIsDeleteCategoryOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 10: THÊM BÀN MỚI (FR-C04: POST /api/v1/tables)     */}
      {/* ========================================================= */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-orange-500" />
                <span>Thêm bàn mới (FR-C04)</span>
              </h3>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tên bàn (name) *
                </label>
                <input
                  type="text"

                  value={newTableForm.name}
                  onChange={(e) => setNewTableForm({ ...newTableForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Sức chứa / Số ghế (capacity) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newTableForm.capacity}
                  onChange={(e) => setNewTableForm({ ...newTableForm, capacity: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreateTable}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm bàn</span>
              </button>
              <button
                onClick={() => setIsAddTableOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 11: XÁC NHẬN XÓA BÀN (FR-C04: DELETE)              */}
      {/* ========================================================= */}
      {isDeleteTableOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-extrabold text-base text-slate-900">
                Xác nhận xóa bàn {editingTableName}?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bàn này khỏi hệ thống? Bàn sẽ bị vô hiệu hóa và không thể nhận khách được nữa.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDeleteTable}
                className="flex-1 py-2.5 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                Xóa ngay
              </button>
              <button
                onClick={() => setIsDeleteTableOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 12: CÀI ĐẶT HỆ THỐNG POS                            */}
      {/* ========================================================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                <span>Cài đặt máy in & Quầy POS</span>
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Máy in hóa đơn nhiệt
                </label>
                <select className="w-full px-3 py-2 rounded-md border border-slate-200 text-slate-800 font-medium outline-none">
                  <option>Máy in nhiệt USB (Khổ 80mm) - Mặc định</option>
                  <option>Máy in hóa đơn mạng LAN (Khổ 80mm)</option>
                  <option>Xuất file PDF</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">
                  Mức thuế VAT áp dụng
                </label>
                <input
                  type="text"
                  value="8% (Theo quy định FR-C02)"
                  disabled
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-500 font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  showToast('Đã lưu cấu hình quầy thu ngân!', 'success');
                }}
                className="w-full py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
