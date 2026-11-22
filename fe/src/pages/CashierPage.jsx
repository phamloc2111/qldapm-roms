import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  ClipboardList,
  BellRing,
  Minus,
  Send,
  Ban,
  MessageSquare,
  ShoppingBag,
  Users,
  Eye,
} from "lucide-react";
import { useRoms } from "../context/RomsContext";
import { formatCurrency } from "../utils/formatters";
import { GridTableGlyph } from "../components/common/TableIcon";
import { resolveDishImage, handleDishImageError } from "../utils/dishImages";

function getTodayIsoDate() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date());
  } catch {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
}

function getCategoryIcon(name = "") {
  const lower = String(name).toLowerCase();
  if (
    lower.includes("uống") ||
    lower.includes("nước") ||
    lower.includes("trà") ||
    lower.includes("cà phê")
  ) {
    return Coffee;
  }
  if (lower.includes("khai vị")) {
    return ChefHat;
  }
  if (
    lower.includes("tráng miệng") ||
    lower.includes("bánh") ||
    lower.includes("kem")
  ) {
    return Sparkles;
  }
  return Utensils;
}

function getOrderItemStatusLabel(status) {
  switch (status) {
    case "SERVED":
      return "Đã phục vụ";
    case "DONE":
      return "Chờ phục vụ";
    case "COOKING":
      return "Đang nấu";
    case "PENDING":
      return "Chờ chế biến";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status || "";
  }
}

export default function CashierPage() {
  const navigate = useNavigate();
  const { logout, showToast, currentUser, apiFetch } = useRoms();

  // Tab đang hoạt động: 'checkout' | 'menu' | 'tables' | 'reports' | 'profile'
  const [activeTab, setActiveTab] = useState("checkout");

  // Lấy dữ liệu hồ sơ người dùng thực tế từ Backend API (GET /api/v1/auth/me)
  const [profileData, setProfileData] = useState(() => currentUser || null);

  useEffect(() => {
    if (apiFetch) {
      apiFetch("/auth/me")
        .then((res) => {
          if (res) {
            setProfileData({
              id: res.id,
              username: res.username,
              fullName: res.fullName || "",
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
    const username = u.username || "cashier";
    const fullName = u.fullName || "";
    const displayName = fullName.trim() ? fullName.trim() : username;
    const role = u.role || "CASHIER";
    let roleTitle = "Thu ngân";
    if (role === "ADMIN") roleTitle = "Quản trị viên";
    else if (role === "WAITER") roleTitle = "Nhân viên phục vụ";
    else if (role === "KITCHEN") roleTitle = "Nhân viên nhà bếp";

    return {
      id: u.id || "N/A",
      username,
      fullName,
      displayName,
      role,
      roleTitle,
      avatarInitial: ((displayName[0] || username[0]) || "U").toUpperCase(),
      active: u.active !== false,
    };
  }, [profileData, currentUser]);

  // Phân quyền màn hình:
  // - CASHIER: Chỉ sử dụng tab Thanh toán ('checkout') và Hồ sơ ('profile')
  // - ADMIN: Có đầy đủ các tab quản trị + Thanh toán + Gọi món ('order') + Theo dõi món ('tracking')
  const isAdmin = profileUser.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin && activeTab !== "checkout" && activeTab !== "profile") {
      setActiveTab("checkout");
    }
  }, [isAdmin, activeTab]);

  // ==========================================================================
  // TAB 1: TIẾP NHẬN THANH TOÁN & TÍNH TIỀN (R-C01, FR-C02)
  // ==========================================================================
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tableFilter, setTableFilter] = useState("ALL"); // 'ALL' | 'PAYMENT_REQUESTED' | 'SERVING' | 'AVAILABLE'

  // Giảm giá (VNĐ) nhập từ quầy thu ngân (FR-C02)
  const [discountVnd, setDiscountVnd] = useState(0);

  // Modals Thanh toán & In ấn
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const payMethod = "CASH";
  const [customerPaidAmount, setCustomerPaidAmount] = useState("");
  const [lastPaidInvoice, setLastPaidInvoice] = useState(null);
  const [isOfficialInvoiceOpen, setIsOfficialInvoiceOpen] = useState(false);
  const [billPreviewData, setBillPreviewData] = useState(null);

  // ==========================================================================
  // TAB 2: QUẢN LÝ THỰC ĐƠN (FR-C03)
  // ==========================================================================
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [menuItems, setMenuItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals Thực đơn & Danh mục
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [isEditDishOpen, setIsEditDishOpen] = useState(false);
  const [isDeleteDishOpen, setIsDeleteDishOpen] = useState(false);
  const [dishForm, setDishForm] = useState({
    name: "",
    categoryId: "",
    priceVnd: "",
    imageUrl: "",
    description: "",
  });

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ id: "", name: "" });

  // ==========================================================================
  // TAB 3: QUẢN LÝ SƠ ĐỒ BÀN (FR-C04)
  // ==========================================================================
  const [editingTableId, setEditingTableId] = useState("");
  const [editingTableName, setEditingTableName] = useState("");
  const [editingTableCapacity, setEditingTableCapacity] = useState(4);
  const [tableCapacityFilter, setTableCapacityFilter] = useState("ALL");
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [isDeleteTableOpen, setIsDeleteTableOpen] = useState(false);
  const [newTableForm, setNewTableForm] = useState({ name: "", capacity: 4 });

  // ==========================================================================
  // TAB 4: BÁO CÁO DOANH THU CUỐI NGÀY (FR-C05)
  // ==========================================================================
  const [reportDate, setReportDate] = useState(getTodayIsoDate);
  const [revenueReport, setRevenueReport] = useState(() => ({
    date: getTodayIsoDate(),
    totalOrdersCompleted: 0,
    subtotalVnd: 0,
    discountVnd: 0,
    vatVnd: 0,
    totalRevenueVnd: 0,
  }));
  const [topItemsReport, setTopItemsReport] = useState([]);
  const [invoicesReport, setInvoicesReport] = useState([]);
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState(null);

  // ==========================================================================
  // TAB DÀNH CHO ADMIN: QUẢN LÝ TÀI KHOẢN ('accounts')
  // ==========================================================================
  const [accountsList, setAccountsList] = useState([]);
  const [accountRoleFilter, setAccountRoleFilter] = useState("ALL");
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [selectedAccountForAction, setSelectedAccountForAction] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    fullName: "",
    password: "",
    role: "WAITER",
    active: true,
  });

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ==========================================================================
  // TAB DÀNH CHO ADMIN: GỌI MÓN ('order') & THEO DÕI MÓN ('tracking') (PHỤC VỤ)
  // ==========================================================================
  const [orderTableStatusFilter, setOrderTableStatusFilter] = useState("ALL"); // 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'READY_TO_SERVE'
  const [orderSelectedCategory, setOrderSelectedCategory] = useState("Tất cả");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderCartByTable, setOrderCartByTable] = useState({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [trackingStatusFilter, setTrackingStatusFilter] = useState("ALL"); // 'ALL' | 'PENDING' | 'COOKING' | 'DONE' | 'SERVED'

  // ==========================================================================
  // ĐỒNG HỒ THỜI GIAN THỰC
  // ==========================================================================
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${hh}:${mm} ${day}/${month}/${year}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      setCurrentTime(`${hh}:${mm} ${day}/${month}/${year}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================================================
  // ĐỒNG BỘ DỮ LIỆU TRỰC TIẾP VỚI BACKEND API (KHÔNG DÙNG MOCK DATA)
  // ==========================================================================
  const mapOrderDtoToView = useCallback((orderDto, menuImageMap) => {
    if (!orderDto || !orderDto.id) return null;
    const cleanId = String(orderDto.id).replace(/-/g, "").toUpperCase();
    return {
      id: String(orderDto.id),
      orderCode: `#${cleanId.slice(0, 4)}`,
      status: orderDto.status,
      roundCount: Number(orderDto.roundCount) || 1,
      createdAt: orderDto.createdAt,
      submittedAt: orderDto.submittedAt,
      createdByName: orderDto.createdByName || "",
      items: (orderDto.items || [])
        .filter((it) => it.status !== "CANCELLED")
        .map((it) => ({
          id: String(it.id),
          menuItemId: String(it.menuItemId),
          name: it.name,
          unitPriceVnd: Number(it.unitPriceVnd) || 0,
          quantity: Number(it.quantity) || 1,
          status: it.status || "PENDING",
          note: it.note || "",
          round: Number(it.round) || 1,
          orderedByName: it.orderedByName || orderDto.createdByName || "",
          cookedByName: it.cookedByName || "",
          servedByName: it.servedByName || "",
          image: resolveDishImage(
            it.name,
            menuImageMap?.get(String(it.menuItemId)),
          ),
        })),
    };
  }, []);

  const fetchBackendData = useCallback(async () => {
    if (!apiFetch) return;
    try {
      const [
        tablesData,
        catsData,
        menuData,
        activeOrdersData,
        payRequestsData,
      ] = await Promise.all([
        apiFetch("/tables").catch(() => null),
        apiFetch("/categories").catch(() => null),
        apiFetch("/menu-items").catch(() => null),
        apiFetch("/orders/active").catch(() => null),
        apiFetch("/cashier/payment-requests").catch(() => null),
      ]);

      // 1. Cập nhật Danh mục (GET /api/v1/categories)
      if (Array.isArray(catsData)) {
        const mappedCats = catsData.map((c) => ({
          id: String(c.id),
          name: c.name,
          icon: getCategoryIcon(c.name),
          active: c.active !== false,
        }));
        setCategories(mappedCats);
      }

      // 2. Cập nhật Thực đơn (GET /api/v1/menu-items)
      const menuImageMap = new Map();
      if (Array.isArray(menuData)) {
        const mappedMenu = menuData.map((m) => {
          const img = resolveDishImage(m.name, m.imageUrl);
          menuImageMap.set(String(m.id), img);
          return {
            id: String(m.id),
            categoryId: String(m.categoryId),
            categoryName: m.categoryName || "",
            name: m.name,
            description: m.description || "",
            priceVnd: Number(m.priceVnd) || 0,
            imageUrl: m.imageUrl || "",
            available: m.available !== false,
            active: m.active !== false,
          };
        });
        setMenuItems(mappedMenu);
        setSelectedMenuId((prev) =>
          prev && mappedMenu.some((m) => m.id === prev)
            ? prev
            : mappedMenu[0]?.id || "",
        );
      }

      // 3. Gom các đơn hàng đang hoạt động và đơn yêu cầu thanh toán theo bàn
      const orderByTableId = new Map();
      if (Array.isArray(activeOrdersData)) {
        activeOrdersData.forEach((ord) => {
          if (ord && ord.tableId) {
            orderByTableId.set(String(ord.tableId), ord);
          }
        });
      }
      if (Array.isArray(payRequestsData)) {
        payRequestsData.forEach((ord) => {
          if (ord && ord.tableId) {
            orderByTableId.set(String(ord.tableId), ord);
          }
        });
      }

      // 4. Cập nhật Danh sách Bàn kèm Đơn hàng hiện tại (GET /api/v1/tables)
      if (Array.isArray(tablesData)) {
        const mappedTables = tablesData.map((t) => {
          const tId = String(t.id);
          const matchedOrderDto = orderByTableId.get(tId);
          const mappedOrder = mapOrderDtoToView(matchedOrderDto, menuImageMap);
          const effectiveStatus =
            mappedOrder?.status === "PAYMENT_REQUESTED"
              ? "PAYMENT_REQUESTED"
              : t.status || (mappedOrder ? "OCCUPIED" : "AVAILABLE");

          return {
            id: tId,
            name: t.name,
            capacity: Number(t.capacity) || 4,
            status: effectiveStatus,
            active: t.active !== false,
            hasNotification: effectiveStatus === "PAYMENT_REQUESTED",
            order: mappedOrder,
          };
        });

        setTables(mappedTables);
        setSelectedTableId((prev) =>
          prev && mappedTables.some((t) => t.id === prev)
            ? prev
            : mappedTables[0]?.id || "",
        );
        setEditingTableId((prev) => {
          const existing = mappedTables.find((t) => t.id === prev);
          if (existing) return prev;
          const first = mappedTables[0];
          if (first) {
            setEditingTableName(first.name);
            setEditingTableCapacity(first.capacity || 4);
            return first.id;
          }
          setEditingTableName("");
          setEditingTableCapacity(4);
          return "";
        });
      }
    } catch {
      // Lỗi mạng tạm thời sẽ được đồng bộ lại ở chu kỳ tiếp theo
    }
  }, [apiFetch, mapOrderDtoToView]);

  // Tự động tải dữ liệu từ BE khi vào trang và đồng bộ định kỳ mỗi 4 giây
  useEffect(() => {
    fetchBackendData();
    const interval = setInterval(() => {
      fetchBackendData();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchBackendData]);

  // ==========================================================================
  // HÀM XỬ LÝ BÁO CÁO DOANH THU (FR-C05: GET /api/v1/reports/...)
  // ==========================================================================
  const handleFetchReportByDate = useCallback(
    async (targetDate) => {
      const dateStr = targetDate || reportDate || getTodayIsoDate();
      setReportDate(dateStr);
      if (!apiFetch) return;
      try {
        // FR-C05: GET /api/v1/reports/summary?date=YYYY-MM-DD&limit=10
        const summary = await apiFetch(
          `/reports/summary?date=${dateStr}&limit=10`,
        ).catch(() => null);
        if (summary && summary.revenue) {
          setRevenueReport({
            date: summary.revenue.date || dateStr,
            totalOrdersCompleted:
              Number(summary.revenue.totalOrdersCompleted) || 0,
            subtotalVnd: Number(summary.revenue.subtotalVnd) || 0,
            discountVnd: Number(summary.revenue.discountVnd) || 0,
            vatVnd: Number(summary.revenue.vatVnd) || 0,
            totalRevenueVnd: Number(summary.revenue.totalRevenueVnd) || 0,
          });
          setTopItemsReport(
            Array.isArray(summary.topItems) ? summary.topItems : [],
          );
          if (Array.isArray(summary.invoices)) {
            setInvoicesReport(summary.invoices);
          } else {
            const invList = await apiFetch(
              `/reports/invoices?date=${dateStr}`,
            ).catch(() => []);
            setInvoicesReport(Array.isArray(invList) ? invList : []);
          }
          return;
        }

        // Fallback gọi lẻ GET /api/v1/reports/revenue, /top-items & /invoices
        const [rev, top, invList] = await Promise.all([
          apiFetch(`/reports/revenue?date=${dateStr}`).catch(() => null),
          apiFetch(`/reports/top-items?date=${dateStr}&limit=10`).catch(
            () => null,
          ),
          apiFetch(`/reports/invoices?date=${dateStr}`).catch(() => []),
        ]);
        if (rev) {
          setRevenueReport({
            date: rev.date || dateStr,
            totalOrdersCompleted: Number(rev.totalOrdersCompleted) || 0,
            subtotalVnd: Number(rev.subtotalVnd) || 0,
            discountVnd: Number(rev.discountVnd) || 0,
            vatVnd: Number(rev.vatVnd) || 0,
            totalRevenueVnd: Number(rev.totalRevenueVnd) || 0,
          });
        }
        if (Array.isArray(top)) {
          setTopItemsReport(top);
        }
        if (Array.isArray(invList)) {
          setInvoicesReport(invList);
        }
      } catch {
        // Ignored
      }
    },
    [apiFetch, reportDate],
  );

  // Tải báo cáo doanh thu khi khởi chạy và khi mở tab Báo cáo (chỉ dành cho ADMIN)
  useEffect(() => {
    if (isAdmin) {
      handleFetchReportByDate(reportDate);
    }
  }, [activeTab, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================================
  // TÍNH TOÁN HÓA ĐƠN VÀ SỐ LƯỢNG MÓN ĐÃ PHỤC VỤ (R-C01 & FR-C02)
  // ==========================================================================
  const selectedTable = useMemo(() => {
    return tables.find((t) => t.id === selectedTableId) || tables[0] || null;
  }, [tables, selectedTableId]);

  const orderItems = useMemo(() => {
    return selectedTable?.order?.items || [];
  }, [selectedTable]);

  // Đếm số lượng món đã phục vụ (SERVED) so với tổng số món (R-C01)
  const servedItemsCount = useMemo(() => {
    return orderItems.filter((it) => it.status === "SERVED").length;
  }, [orderItems]);

  const totalItemsCount = orderItems.length;

  // Giảm giá hợp lệ (0 <= discountVnd <= subtotal)
  const safeDiscount = useMemo(() => {
    const rawSubtotal = orderItems
      .filter((item) => item.status === "SERVED")
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
    if (billPreviewData?.subtotalVnd != null)
      return billPreviewData.subtotalVnd;
    return orderItems
      .filter((item) => item.status === "SERVED")
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

  // Lọc bàn ở Tab 1 theo trạng thái chuẩn BE TableStatus (AVAILABLE, OCCUPIED, READY_TO_SERVE, PAYMENT_REQUESTED)
  const filteredTables = useMemo(() => {
    if (tableFilter === "ALL") return tables;
    if (tableFilter === "PAYMENT_REQUESTED") {
      return tables.filter((t) => t.status === "PAYMENT_REQUESTED");
    }
    if (tableFilter === "SERVING") {
      return tables.filter(
        (t) =>
          t.status === "OCCUPIED" ||
          t.status === "READY_TO_SERVE" ||
          t.status === "SERVING",
      );
    }
    if (tableFilter === "AVAILABLE") {
      return tables.filter((t) => t.status === "AVAILABLE");
    }
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
        tableCapacityFilter === "ALL" ||
        (Number(t.capacity) || 4) === Number(tableCapacityFilter);
      const matchSearch =
        !tableSearchQuery.trim() ||
        t.name.toLowerCase().includes(tableSearchQuery.trim().toLowerCase());
      return matchCap && matchSearch;
    });
  }, [tables, tableCapacityFilter, tableSearchQuery]);

  // ==========================================================================
  // HÀM XỬ LÝ THANH TOÁN (FR-C02: POST /api/v1/orders/{id}/pay)
  // ==========================================================================
  // Chọn bàn và nạp chi tiết đơn hàng mới nhất từ BE (R-C01: GET /api/v1/tables/{id}/current-order)
  const handleSelectTable = async (tbl) => {
    setSelectedTableId(tbl.id);
    setDiscountVnd(0);
    setBillPreviewData(null);
    if (!apiFetch) return;

    const menuImageMap = new Map();
    menuItems.forEach((m) =>
      menuImageMap.set(String(m.id), resolveDishImage(m.name, m.imageUrl)),
    );

    try {
      const currentOrder = await apiFetch(
        `/tables/${tbl.id}/current-order`,
      ).catch(() => null);
      if (currentOrder && currentOrder.id) {
        const mappedOrder = mapOrderDtoToView(currentOrder, menuImageMap);
        setTables((prev) =>
          prev.map((t) =>
            t.id === tbl.id
              ? {
                  ...t,
                  status:
                    currentOrder.status === "PAYMENT_REQUESTED"
                      ? "PAYMENT_REQUESTED"
                      : currentOrder.status === "PAID" ||
                          currentOrder.status === "CLOSED"
                        ? "AVAILABLE"
                        : "OCCUPIED",
                  hasNotification: currentOrder.status === "PAYMENT_REQUESTED",
                  order: mappedOrder,
                }
              : t,
          ),
        );
      } else {
        setTables((prev) =>
          prev.map((t) =>
            t.id === tbl.id
              ? {
                  ...t,
                  status: "AVAILABLE",
                  hasNotification: false,
                  order: null,
                }
              : t,
          ),
        );
      }
    } catch {
      // Ignored
    }
  };

  const handleOpenPaymentModal = () => {
    if (!selectedTable?.order || orderItems.length === 0) {
      showToast("Bàn này chưa có đơn hàng để thanh toán.", "error");
      return;
    }
    if (servedItemsCount === 0) {
      showToast(
        'Chưa có món ăn nào được đánh dấu "Đã phục vụ" để tính tiền!',
        "error",
      );
      return;
    }
    if (servedItemsCount < totalItemsCount) {
      showToast(
        "Vẫn còn món chưa phục vụ xong! Chỉ đơn đã phục vụ hết món mới có thể thanh toán.",
        "error",
      );
      return;
    }
    setCustomerPaidAmount(String(grandTotal));
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTable?.order?.id) return;
    const paidAmount = Number(customerPaidAmount);
    if (
      String(customerPaidAmount).trim() === "" ||
      Number.isNaN(paidAmount) ||
      paidAmount < grandTotal
    ) {
      showToast(
        `Tiền khách đưa không được nhỏ hơn tổng tiền hóa đơn (${formatCurrency(grandTotal)})!`,
        "error",
      );
      return;
    }
    const orderId = selectedTable.order.id;

    try {
      // Trong Backend (PaymentService.pay), order bắt buộc phải ở trạng thái PAYMENT_REQUESTED.
      // Nếu đơn đã phục vụ xong hết món (SERVED) nhưng phục vụ chưa bấm yêu cầu thanh toán,
      // thu ngân tự động chuyển sang PAYMENT_REQUESTED trước khi gọi /pay.
      if (selectedTable.order.status !== "PAYMENT_REQUESTED") {
        await apiFetch(`/orders/${orderId}/request-payment`, {
          method: "POST",
        });
      }

      const payResult = await apiFetch(`/orders/${orderId}/pay`, {
        method: "POST",
        body: JSON.stringify({
          discountVnd: safeDiscount,
          method: "CASH", // PaymentMethod trong BE: CASH
        }),
      });

      const servedOrderItems = orderItems.filter((it) => it.status === "SERVED");
      const invoiceItems = servedOrderItems.map((it) => ({
        id: it.id || it.orderItemId,
        name: it.name,
        quantity: it.quantity,
        unitPriceVnd: it.unitPriceVnd,
        orderedByName: it.orderedByName || selectedTable.order?.createdByName || "",
        cookedByName: it.cookedByName || "",
        servedByName: it.servedByName || "",
      }));

      const finalAmount = payResult?.amountVnd ?? grandTotal;

      // Tạo đối tượng hóa đơn chính thức từ dữ liệu thanh toán BE (FR-C02)
      const invoice = {
        invoiceCode: payResult?.invoiceId
          ? `HD-${String(payResult.invoiceId).slice(0, 8).toUpperCase()}`
          : `HD-${Date.now().toString().slice(-6)}`,
        paymentId: payResult?.paymentId
          ? String(payResult.paymentId).slice(0, 8).toUpperCase()
          : null,
        orderCode: selectedTable.order?.orderCode || "#0000",
        tableName: selectedTable.name,
        cashierName: payResult?.cashierName || profileUser.displayName,
        createdByName: selectedTable.order?.createdByName || "",
        paidAt: payResult?.paidAt
          ? new Date(payResult.paidAt).toLocaleString("vi-VN")
          : new Date().toLocaleString("vi-VN"),
        method: payMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản (VietQR)",
        items: invoiceItems,
        subtotal,
        discountVnd: safeDiscount,
        vatAmount,
        grandTotal: finalAmount,
        customerPaid: Number(customerPaidAmount) || finalAmount,
        changeAmount: Math.max(
          0,
          (Number(customerPaidAmount) || finalAmount) - finalAmount,
        ),
      };

      setLastPaidInvoice(invoice);
      setIsPayModalOpen(false);
      setIsOfficialInvoiceOpen(true);
      setDiscountVnd(0);
      setBillPreviewData(null);

      await fetchBackendData();
      await handleFetchReportByDate(reportDate);

      showToast(
        `Đã thanh toán thành công hóa đơn cho ${selectedTable.name}!`,
        "success",
      );
    } catch (err) {
      showToast(err.message || "Không thể thanh toán đơn hàng này.", "error");
    }
  };

  // ==========================================================================
  // HÀM XỬ LÝ QUẢN LÝ THỰC ĐƠN & DANH MỤC (FR-C03)
  // ==========================================================================
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === "Tất cả" ||
        item.categoryName === selectedCategory ||
        item.categoryId === selectedCategory;
      const matchSearch = item.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMenuItems.length / itemsPerPage),
  );
  const paginatedMenuItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMenuItems.slice(start, start + itemsPerPage);
  }, [filteredMenuItems, currentPage, itemsPerPage]);

  // Thêm món ăn mới (POST /api/v1/menu-items)
  const handleCreateMenuItem = async () => {
    if (!dishForm.name.trim()) {
      showToast("Vui lòng nhập tên món ăn.", "error");
      return;
    }
    const priceNum = Number(dishForm.priceVnd);
    if (dishForm.priceVnd === "" || Number.isNaN(priceNum) || priceNum < 0) {
      showToast("Giá món ăn không hợp lệ.", "error");
      return;
    }

    const targetCat =
      categories.find((c) => c.id === dishForm.categoryId) || categories[0];
    if (!targetCat) {
      showToast(
        "Vui lòng tạo ít nhất 1 danh mục trước khi thêm món ăn.",
        "error",
      );
      return;
    }

    try {
      const created = await apiFetch("/menu-items", {
        method: "POST",
        body: JSON.stringify({
          categoryId: targetCat.id,
          name: dishForm.name.trim(),
          description: dishForm.description.trim() || null,
          priceVnd: Math.round(priceNum),
          imageUrl: dishForm.imageUrl.trim() || null,
        }),
      });

      const newDish = {
        id: String(created.id),
        categoryId: String(created.categoryId),
        categoryName: created.categoryName || targetCat.name,
        name: created.name,
        description: created.description || "",
        priceVnd: Number(created.priceVnd) || 0,
        imageUrl: created.imageUrl || "",
        available: created.available !== false,
        active: created.active !== false,
      };

      setMenuItems((prev) => [newDish, ...prev]);
      setSelectedMenuId(newDish.id);
      setIsAddDishOpen(false);
      setDishForm({
        name: "",
        categoryId: categories[0]?.id || "",
        priceVnd: "",
        imageUrl: "",
        description: "",
      });
      showToast(`Đã thêm món "${newDish.name}" vào thực đơn!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể thêm món ăn mới.", "error");
    }
  };

  // Sửa món ăn (PATCH /api/v1/menu-items/{id})
  const handleUpdateMenuItem = async () => {
    if (!selectedMenuId) return;
    if (!dishForm.name.trim()) {
      showToast("Vui lòng nhập tên món ăn.", "error");
      return;
    }
    const priceNum = Number(dishForm.priceVnd);
    if (dishForm.priceVnd === "" || Number.isNaN(priceNum) || priceNum < 0) {
      showToast("Giá món ăn không hợp lệ.", "error");
      return;
    }

    const targetCat =
      categories.find((c) => c.id === dishForm.categoryId) || categories[0];
    if (!targetCat) {
      showToast("Không tìm thấy danh mục hợp lệ.", "error");
      return;
    }

    try {
      const updated = await apiFetch(`/menu-items/${selectedMenuId}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoryId: targetCat.id,
          name: dishForm.name.trim(),
          description: dishForm.description.trim() || null,
          priceVnd: Math.round(priceNum),
          imageUrl: dishForm.imageUrl.trim() || null,
        }),
      });

      setMenuItems((prev) =>
        prev.map((m) =>
          m.id === selectedMenuId
            ? {
                ...m,
                id: String(updated.id),
                name: updated.name,
                categoryId: String(updated.categoryId),
                categoryName: updated.categoryName || targetCat.name,
                priceVnd: Number(updated.priceVnd) || 0,
                imageUrl: updated.imageUrl || "",
                description: updated.description || "",
                available: updated.available !== false,
              }
            : m,
        ),
      );

      setIsEditDishOpen(false);
      showToast("Đã cập nhật thông tin món ăn!", "success");
    } catch (err) {
      showToast(err.message || "Không thể cập nhật món ăn.", "error");
    }
  };

  // Bật / Tắt trạng thái Còn món - Hết hàng (FR-C03: PATCH /api/v1/menu-items/{id}/availability)
  const handleToggleAvailability = async (targetId) => {
    const idToToggle = targetId || selectedMenuId;
    if (!idToToggle) return;
    const item = menuItems.find((m) => m.id === idToToggle);
    if (!item) return;

    const newAvailable = !item.available;

    try {
      const updated = await apiFetch(`/menu-items/${idToToggle}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ available: newAvailable }),
      });

      const finalAvailable = updated
        ? updated.available !== false
        : newAvailable;
      setMenuItems((prev) =>
        prev.map((m) =>
          m.id === idToToggle ? { ...m, available: finalAvailable } : m,
        ),
      );

      showToast(
        `Đã chuyển món "${item.name}" sang: ${
          finalAvailable ? "Còn hàng (Đang phục vụ)" : "Hết hàng (Tạm ngưng)"
        }`,
        finalAvailable ? "success" : "info",
      );
    } catch (err) {
      showToast(err.message || "Không thể đổi trạng thái món ăn.", "error");
    }
  };

  // Xóa món ăn (DELETE /api/v1/menu-items/{id})
  const handleDeleteMenuItem = async () => {
    if (!selectedMenuId) return;
    try {
      await apiFetch(`/menu-items/${selectedMenuId}`, { method: "DELETE" });
      const remaining = menuItems.filter((m) => m.id !== selectedMenuId);
      setMenuItems(remaining);
      setSelectedMenuId(remaining[0]?.id || "");
      setIsDeleteDishOpen(false);
      showToast("Đã xóa món ăn khỏi thực đơn!", "info");
    } catch (err) {
      showToast(err.message || "Không thể xóa món ăn.", "error");
    }
  };

  // Quản lý Danh mục (POST/PATCH/DELETE /api/v1/categories)
  const handleCreateCategory = async () => {
    const trimmed = categoryForm.name.trim();
    if (!trimmed) {
      showToast("Vui lòng nhập tên danh mục.", "error");
      return;
    }

    try {
      const created = await apiFetch("/categories", {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });

      const newCat = {
        id: String(created.id),
        name: created.name,
        icon: getCategoryIcon(created.name),
        active: created.active !== false,
      };

      setCategories((prev) => [...prev, newCat]);
      setIsAddCategoryOpen(false);
      setCategoryForm({ id: "", name: "" });
      showToast(`Đã thêm danh mục "${newCat.name}"!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể thêm danh mục.", "error");
    }
  };

  const handleUpdateCategory = async () => {
    const trimmed = categoryForm.name.trim();
    if (!trimmed) {
      showToast("Vui lòng nhập tên danh mục.", "error");
      return;
    }
    if (!categoryForm.id) return;

    try {
      const updated = await apiFetch(`/categories/${categoryForm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed }),
      });

      const updatedName = updated?.name || trimmed;
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryForm.id
            ? { ...c, name: updatedName, icon: getCategoryIcon(updatedName) }
            : c,
        ),
      );
      setMenuItems((prev) =>
        prev.map((m) =>
          m.categoryId === categoryForm.id
            ? { ...m, categoryName: updatedName }
            : m,
        ),
      );
      setIsEditCategoryOpen(false);
      showToast(`Đã đổi tên danh mục thành "${updatedName}"!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể cập nhật danh mục.", "error");
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryForm.id) return;
    try {
      await apiFetch(`/categories/${categoryForm.id}`, { method: "DELETE" });
      if (selectedCategory === categoryForm.name) {
        setSelectedCategory("Tất cả");
      }
      setIsDeleteCategoryOpen(false);
      await fetchBackendData();
      showToast("Đã xóa danh mục!", "info");
    } catch (err) {
      showToast(err.message || "Không thể xóa danh mục.", "error");
    }
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
      showToast("Vui lòng nhập tên bàn.", "error");
      return;
    }
    const cap = Math.max(1, Number(newTableForm.capacity) || 4);

    try {
      const created = await apiFetch("/tables", {
        method: "POST",
        body: JSON.stringify({ name: newTableForm.name.trim(), capacity: cap }),
      });

      const newTbl = {
        id: String(created.id),
        name: created.name,
        capacity: Number(created.capacity) || cap,
        status: created.status || "AVAILABLE",
        active: created.active !== false,
        hasNotification: false,
        order: null,
      };

      setTables((prev) => [...prev, newTbl]);
      handleSelectTableForEdit(newTbl);
      if (!selectedTableId) {
        setSelectedTableId(newTbl.id);
      }
      setIsAddTableOpen(false);
      setNewTableForm({ name: "", capacity: 4 });
      showToast(
        `Đã thêm bàn "${newTbl.name}" (${newTbl.capacity} chỗ)!`,
        "success",
      );
    } catch (err) {
      showToast(err.message || "Không thể thêm bàn mới.", "error");
    }
  };

  const handleSaveTableInfo = async () => {
    if (!editingTableId) return;
    const trimmed = editingTableName.trim();
    if (!trimmed) {
      showToast("Tên bàn không được để trống.", "error");
      return;
    }
    const cap = Math.max(1, Number(editingTableCapacity) || 4);

    try {
      const updated = await apiFetch(`/tables/${editingTableId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmed, capacity: cap }),
      });

      const finalName = updated?.name || trimmed;
      const finalCap = Number(updated?.capacity) || cap;

      setTables((prev) =>
        prev.map((t) =>
          t.id === editingTableId
            ? { ...t, name: finalName, capacity: finalCap }
            : t,
        ),
      );
      showToast(`Đã lưu thông tin bàn ${finalName}!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể cập nhật thông tin bàn.", "error");
    }
  };

  const handleDeleteTable = async () => {
    if (!editingTableId) return;
    try {
      await apiFetch(`/tables/${editingTableId}`, { method: "DELETE" });
      const remaining = tables.filter((t) => t.id !== editingTableId);
      setTables(remaining);
      setIsDeleteTableOpen(false);
      if (remaining.length > 0) {
        handleSelectTableForEdit(remaining[0]);
      } else {
        setEditingTableId("");
        setEditingTableName("");
        setEditingTableCapacity(4);
      }
      showToast("Đã xóa bàn khỏi sơ đồ!", "info");
    } catch (err) {
      setIsDeleteTableOpen(false);
      showToast(err.message || "Không thể xóa bàn đang có khách.", "error");
    }
  };

  // ==========================================================================
  // HÀM XỬ LÝ GỌI MÓN & THEO DÕI MÓN DÀNH CHO ADMIN (CHỨC NĂNG PHỤC VỤ)
  // ==========================================================================
  const filteredOrderMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        orderSelectedCategory === "Tất cả" ||
        item.categoryName === orderSelectedCategory ||
        item.categoryId === orderSelectedCategory;
      const matchSearch = item.name
        .toLowerCase()
        .includes(orderSearchQuery.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, orderSelectedCategory, orderSearchQuery]);

  const currentTableCart = useMemo(() => {
    if (!selectedTable?.id) return [];
    return orderCartByTable[selectedTable.id] || [];
  }, [orderCartByTable, selectedTable]);

  const currentCartTotalVnd = useMemo(() => {
    return currentTableCart.reduce(
      (acc, it) => acc + it.priceVnd * it.quantity,
      0,
    );
  }, [currentTableCart]);

  const handleAddDishToOrderCart = (dish) => {
    if (!selectedTable?.id) {
      showToast("Vui lòng chọn một bàn trước khi gọi món.", "error");
      return;
    }
    if (dish.available === false) {
      showToast(`Món "${dish.name}" hiện đang tạm hết hàng.`, "error");
      return;
    }
    if (selectedTable.status === "PAYMENT_REQUESTED") {
      showToast(
        "Bàn này đang chờ thanh toán, vui lòng hoàn tất thanh toán trước.",
        "error",
      );
      return;
    }
    const tId = selectedTable.id;
    setOrderCartByTable((prev) => {
      const existingList = prev[tId] || [];
      const idx = existingList.findIndex((i) => i.menuItemId === dish.id);
      if (idx >= 0) {
        const updated = [...existingList];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return { ...prev, [tId]: updated };
      }
      return {
        ...prev,
        [tId]: [
          ...existingList,
          {
            menuItemId: dish.id,
            name: dish.name,
            priceVnd: dish.priceVnd,
            imageUrl: resolveDishImage(dish.name, dish.imageUrl),
            quantity: 1,
            note: "",
          },
        ],
      };
    });
  };

  const handleUpdateCartItemQty = (menuItemId, delta) => {
    if (!selectedTable?.id) return;
    const tId = selectedTable.id;
    setOrderCartByTable((prev) => {
      const existingList = prev[tId] || [];
      const updated = existingList
        .map((it) =>
          it.menuItemId === menuItemId
            ? { ...it, quantity: it.quantity + delta }
            : it,
        )
        .filter((it) => it.quantity > 0);
      return { ...prev, [tId]: updated };
    });
  };

  const handleUpdateCartItemNote = (menuItemId, note) => {
    if (!selectedTable?.id) return;
    const tId = selectedTable.id;
    setOrderCartByTable((prev) => {
      const existingList = prev[tId] || [];
      const updated = existingList.map((it) =>
        it.menuItemId === menuItemId ? { ...it, note } : it,
      );
      return { ...prev, [tId]: updated };
    });
  };

  const handleRemoveCartItem = (menuItemId) => {
    if (!selectedTable?.id) return;
    const tId = selectedTable.id;
    setOrderCartByTable((prev) => ({
      ...prev,
      [tId]: (prev[tId] || []).filter((it) => it.menuItemId !== menuItemId),
    }));
  };

  // Gửi đơn gọi món xuống bếp (POST /api/v1/orders hoặc POST /api/v1/orders/{id}/items)
  const handleSubmitOrderToKitchen = async () => {
    if (
      !selectedTable?.id ||
      currentTableCart.length === 0 ||
      isSubmittingOrder
    )
      return;
    setIsSubmittingOrder(true);
    try {
      const payloadItems = currentTableCart.map((it) => ({
        menuItemId: it.menuItemId,
        quantity: it.quantity,
        note: it.note?.trim() || null,
      }));

      const activeOrderId = selectedTable.order?.id;
      if (
        activeOrderId &&
        selectedTable.order.status !== "PAID" &&
        selectedTable.order.status !== "CLOSED"
      ) {
        await apiFetch(`/orders/${activeOrderId}/items`, {
          method: "POST",
          body: JSON.stringify({ items: payloadItems }),
        });
      } else {
        await apiFetch("/orders", {
          method: "POST",
          body: JSON.stringify({
            tableId: selectedTable.id,
            items: payloadItems,
          }),
        });
      }

      setOrderCartByTable((prev) => ({ ...prev, [selectedTable.id]: [] }));
      await fetchBackendData();
      await handleSelectTable(selectedTable);
      showToast(
        `Đã gửi đơn gọi món của bàn ${selectedTable.name} xuống bếp!`,
        "success",
      );
    } catch (err) {
      showToast(err.message || "Không thể gửi đơn gọi món xuống bếp.", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Xác nhận đã phục vụ món (POST /api/v1/order-items/{id}/serve)
  const handleServeOrderItem = async (orderItemId, itemName) => {
    try {
      await apiFetch(`/order-items/${orderItemId}/serve`, { method: "POST" });
      await fetchBackendData();
      if (selectedTable) await handleSelectTable(selectedTable);
      showToast(`Đã xác nhận phục vụ món "${itemName}"!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể xác nhận phục vụ món ăn.", "error");
    }
  };

  // Hủy món đang chờ chế biến (POST /api/v1/order-items/{id}/cancel)
  const handleCancelOrderItem = async (orderItemId, itemName) => {
    try {
      await apiFetch(`/order-items/${orderItemId}/cancel`, { method: "POST" });
      await fetchBackendData();
      if (selectedTable) await handleSelectTable(selectedTable);
      showToast(`Đã hủy món "${itemName}" khỏi đơn hàng.`, "info");
    } catch (err) {
      showToast(
        err.message || "Chỉ có thể hủy món khi bếp chưa bắt đầu chế biến.",
        "error",
      );
    }
  };

  // Gửi yêu cầu thanh toán (POST /api/v1/orders/{id}/request-payment)
  const handleRequestPaymentForTable = async () => {
    if (!selectedTable?.order?.id) return;
    try {
      await apiFetch(`/orders/${selectedTable.order.id}/request-payment`, {
        method: "POST",
      });
      await fetchBackendData();
      await handleSelectTable(selectedTable);
      showToast(
        `Đã chuyển bàn ${selectedTable.name} sang trạng thái Chờ thanh toán!`,
        "success",
      );
    } catch (err) {
      showToast(
        err.message ||
          "Tất cả món trong đơn phải được phục vụ trước khi yêu cầu thanh toán.",
        "error",
      );
    }
  };

  // Tổng số món đang chờ phục vụ (DONE) trên toàn nhà hàng để gắn badge trên tab Theo dõi món
  const totalReadyToServeCount = useMemo(() => {
    return tables.reduce((sum, tbl) => {
      const items = tbl.order?.items || [];
      return sum + items.filter((it) => it.status === "DONE").length;
    }, 0);
  }, [tables]);

  // ==========================================================================
  // HÀM QUẢN LÝ TÀI KHOẢN DÀNH CHO ADMIN (GET / POST / PUT / DELETE /api/v1/users)
  // ==========================================================================
  const fetchAccounts = useCallback(async () => {
    if (!apiFetch || !isAdmin) return;
    try {
      const list = await apiFetch("/users");
      if (Array.isArray(list)) {
        setAccountsList(
          list.map((u) => ({
            id: String(u.id),
            username: u.username,
            fullName: u.fullName || "",
            role: u.role,
            active: u.active !== false,
          })),
        );
      }
    } catch {
      // Ignored
    }
  }, [apiFetch, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchAccounts();
    }
  }, [isAdmin, activeTab, fetchAccounts]);

  const filteredAccounts = useMemo(() => {
    return accountsList.filter((acc) => {
      const matchRole =
        accountRoleFilter === "ALL" || acc.role === accountRoleFilter;
      const q = accountSearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        acc.username.toLowerCase().includes(q) ||
        (acc.fullName && acc.fullName.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [accountsList, accountRoleFilter, accountSearchQuery]);

  const handleCreateAccount = async () => {
    const username = accountForm.username.trim();
    const fullName = accountForm.fullName.trim();
    const password = accountForm.password;
    if (!username) {
      showToast("Vui lòng nhập User ID (Tên đăng nhập).", "error");
      return;
    }
    if (!fullName) {
      showToast("Vui lòng nhập Họ và tên nhân viên.", "error");
      return;
    }
    if (!password || password.length < 12) {
      showToast("Mật khẩu phải có ít nhất 12 ký tự.", "error");
      return;
    }

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          fullName,
          role: accountForm.role,
        }),
      });
      setIsAddAccountOpen(false);
      await fetchAccounts();
      showToast(`Đã tạo tài khoản "${username}" (${fullName})!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể tạo tài khoản mới.", "error");
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccountForAction?.id) return;
    const username = accountForm.username.trim();
    const fullName = accountForm.fullName.trim();
    const password = accountForm.password;
    if (!username) {
      showToast("Vui lòng nhập User ID (Tên đăng nhập).", "error");
      return;
    }
    if (!fullName) {
      showToast("Vui lòng nhập Họ và tên nhân viên.", "error");
      return;
    }
    if (password && password.length < 12) {
      showToast("Mật khẩu mới phải có ít nhất 12 ký tự.", "error");
      return;
    }

    try {
      await apiFetch(`/users/${selectedAccountForAction.id}`, {
        method: "PUT",
        body: JSON.stringify({
          username,
          fullName,
          role: accountForm.role,
          active: accountForm.active,
          password: password || null,
        }),
      });
      setIsEditAccountOpen(false);
      await fetchAccounts();
      if (String(selectedAccountForAction.id) === String(profileUser.id)) {
        const me = await apiFetch("/auth/me").catch(() => null);
        if (me) setProfileData(me);
      }
      showToast(`Đã cập nhật tài khoản "${username}"!`, "success");
    } catch (err) {
      showToast(err.message || "Không thể cập nhật tài khoản.", "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccountForAction?.id) return;
    try {
      await apiFetch(`/users/${selectedAccountForAction.id}`, {
        method: "DELETE",
      });
      setIsDeleteAccountOpen(false);
      setSelectedAccountForAction(null);
      await fetchAccounts();
      showToast(
        `Đã xóa tài khoản "${selectedAccountForAction.username}"!`,
        "info",
      );
    } catch (err) {
      setIsDeleteAccountOpen(false);
      showToast(
        err.message || "Không thể xóa tài khoản quản trị viên cuối cùng.",
        "error",
      );
    }
  };

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
                  e.target.style.display = "none";
                }}
              />
            </div>
            <h1 className="text-xl font-extrabold text-orange-600 tracking-tight flex items-center gap-1">
              ROMS
            </h1>
            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200/70 text-[10px] font-extrabold text-orange-700 uppercase tracking-wider">
              {isAdmin ? "Quản trị viên" : "Thu ngân"}
            </span>
          </div>

          {/* Danh sách Tab chức năng phân quyền theo Role */}
          <nav className="p-3 space-y-1.5 mt-1">
            {/* Tab Thanh toán: Dành cho cả CASHIER và ADMIN */}
            <button
              onClick={() => setActiveTab("checkout")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
                activeTab === "checkout"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                  : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
              }`}
            >
              <CreditCard className="w-5 h-5 shrink-0" />
              <span>Thanh toán</span>
            </button>

            {/* Các Tab chức năng Phục vụ & Quản trị: Chỉ hiển thị cho ADMIN */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab("order")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
                    activeTab === "order"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
                  }`}
                >
                  <ClipboardList className="w-5 h-5 shrink-0" />
                  <span>Gọi món</span>
                </button>

                <button
                  onClick={() => setActiveTab("tracking")}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
                    activeTab === "tracking"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BellRing className="w-5 h-5 shrink-0" />
                    <span>Theo dõi món</span>
                  </div>
                  {totalReadyToServeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === "tracking"
                          ? "bg-white text-orange-600"
                          : "bg-emerald-500 text-white"
                      }`}
                    >
                      {totalReadyToServeCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("menu")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
                    activeTab === "menu"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
                  }`}
                >
                  <Utensils className="w-5 h-5 shrink-0" />
                  <span>Quản lý Thực đơn</span>
                </button>

                <button
                  onClick={() => setActiveTab("tables")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
                    activeTab === "tables"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 shrink-0" />
                  <span>Quản lý Sơ đồ bàn</span>
                </button>

                <button
                  onClick={() => setActiveTab("reports")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
                    activeTab === "reports"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
                  }`}
                >
                  <BarChart3 className="w-5 h-5 shrink-0" />
                  <span>Báo cáo Doanh thu</span>
                </button>

                <button
                  onClick={() => setActiveTab("accounts")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
                    activeTab === "accounts"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                      : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
                  }`}
                >
                  <Users className="w-5 h-5 shrink-0" />
                  <span>Quản lý Tài khoản</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Cài đặt, Hồ sơ & Đăng xuất */}
        <div className="p-3 border-t border-orange-50 space-y-1.5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors duration-150 cursor-pointer ${
              activeTab === "profile"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25"
                : "text-slate-600 hover:text-orange-600 hover:bg-orange-50/70"
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
              navigate("/login", { replace: true });
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
          {activeTab === "checkout" && (
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
                        onClick={() =>
                          setTableFilter(
                            tableFilter === "AVAILABLE" ? "ALL" : "AVAILABLE",
                          )
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          tableFilter === "AVAILABLE"
                            ? "bg-slate-200/90 text-slate-900 font-bold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                        }`}
                        title="Lọc bàn trống"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Trống</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTableFilter(
                            tableFilter === "SERVING" ? "ALL" : "SERVING",
                          )
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          tableFilter === "SERVING"
                            ? "bg-slate-200/90 text-slate-900 font-bold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
                        }`}
                        title="Lọc bàn đang phục vụ"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <span>Đang phục vụ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTableFilter(
                            tableFilter === "PAYMENT_REQUESTED"
                              ? "ALL"
                              : "PAYMENT_REQUESTED",
                          )
                        }
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          tableFilter === "PAYMENT_REQUESTED"
                            ? "bg-slate-200/90 text-slate-900 font-bold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium"
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
                        <p className="font-medium">
                          Không có bàn nào ở trạng thái này
                        </p>
                        <button
                          type="button"
                          onClick={() => setTableFilter("ALL")}
                          className="mt-2 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                        >
                          Hiển thị tất cả bàn
                        </button>
                      </div>
                    ) : (
                      filteredTables.map((tbl) => {
                        const isSelected = tbl.id === selectedTableId;
                        const isPaying = tbl.status === "PAYMENT_REQUESTED";
                        const isServing =
                          tbl.status === "OCCUPIED" ||
                          tbl.status === "READY_TO_SERVE" ||
                          tbl.status === "SERVING";

                        let tableBg =
                          "bg-white border-slate-200/90 text-slate-700";
                        let chairBg =
                          "bg-emerald-100/70 border border-emerald-200/60";
                        let statusText = "Trống";

                        if (isPaying) {
                          tableBg =
                            "bg-[#FFF1F2] border-rose-400 text-rose-950";
                          chairBg = "bg-rose-100/90 border border-rose-200/70";
                          statusText = "Đang thanh toán";
                        } else if (isServing) {
                          tableBg =
                            "bg-[#FFFDF9] border-orange-200 text-slate-800";
                          chairBg =
                            "bg-amber-100/80 border border-amber-200/60";
                          statusText = "Đang phục vụ";
                        }

                        return (
                          <div
                            key={tbl.id}
                            onClick={() => handleSelectTable(tbl)}
                            className={`relative flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 ${
                              isSelected ? "scale-105" : "hover:scale-102"
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
                              <span
                                className={`w-10 h-3.5 rounded-t-sm absolute -top-1.5 ${chairBg} transition-colors`}
                              />
                              <span
                                className={`w-10 h-3.5 rounded-b-sm absolute -bottom-1.5 ${chairBg} transition-colors`}
                              />
                              <span
                                className={`w-3.5 h-10 rounded-l-sm absolute -left-1.5 ${chairBg} transition-colors`}
                              />
                              <span
                                className={`w-3.5 h-10 rounded-r-sm absolute -right-1.5 ${chairBg} transition-colors`}
                              />

                              <div
                                className={`w-20 h-20 rounded-md border-2 ${tableBg} flex flex-col items-center justify-center shadow-xs z-10 transition-colors ${
                                  isSelected
                                    ? isPaying
                                      ? "border-rose-500 ring-2 ring-rose-400/80 shadow-xs"
                                      : "border-orange-500 ring-2 ring-orange-400/80 shadow-xs"
                                    : "hover:border-orange-300"
                                }`}
                              >
                                <span className="font-extrabold text-base leading-tight text-center">
                                  {tbl.name}
                                </span>
                                <span
                                  className={`text-[10px] font-bold mt-0.5 text-center leading-tight px-1 w-full block ${
                                    isPaying
                                      ? "text-rose-600"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {statusText}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium text-center">
                                  ({tbl.capacity} chỗ)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
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
                            Mã:{" "}
                            {selectedTable?.order?.orderCode || "Chưa có đơn"}
                            Đã phục vụ: {servedItemsCount}/{totalItemsCount} món
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-md bg-orange-500 text-white font-extrabold text-xs shadow-xs">
                          Bàn: {selectedTable?.name || "Chưa chọn"}
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
                        <span className="col-span-3 text-right">
                          Thành tiền
                        </span>
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
                                  src={resolveDishImage(
                                    item.name,
                                    item.image || item.imageUrl,
                                  )}
                                  onError={handleDishImageError}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-md object-cover border border-slate-100 shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-800 line-clamp-1">
                                    {item.name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                    {item.status && (
                                      <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${
                                          item.status === "SERVED"
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-amber-50 text-amber-600"
                                        }`}
                                      >
                                        {getOrderItemStatusLabel(item.status)}
                                      </span>
                                    )}
                                    {(item.orderedByName || item.cookedByName) && (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        {item.orderedByName ? `Gọi: ${item.orderedByName}` : ""}
                                        {item.orderedByName && item.cookedByName ? " • " : ""}
                                        {item.cookedByName ? `Bếp: ${item.cookedByName}` : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="col-span-3 text-right pr-6 text-slate-500 font-medium">
                                {formatCurrency(item.unitPriceVnd)}
                              </span>
                              <span className="col-span-2 text-center font-bold text-slate-700">
                                {item.quantity}
                              </span>
                              <span className="col-span-3 text-right font-black text-slate-900">
                                {formatCurrency(
                                  item.unitPriceVnd * item.quantity,
                                )}
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
                      <span className="text-slate-900 font-bold">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>

                    {/* Ô nhập giảm giá */}
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-slate-600 font-semibold">
                        Giảm giá:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          step="1000"
                          value={discountVnd === 0 ? "" : discountVnd}
                          onChange={(e) =>
                            setDiscountVnd(
                              Math.max(0, Number(e.target.value) || 0),
                            )
                          }
                          className="w-28 px-2.5 py-1 text-right rounded-md border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:border-orange-500"
                        />
                        <span className="text-xs text-slate-400 font-semibold">
                          đ
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs sm:text-sm text-slate-600 font-semibold">
                      <span>VAT (8%):</span>
                      <span className="text-slate-900 font-bold">
                        {formatCurrency(vatAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-dashed border-slate-200">
                      <span>Tổng cộng:</span>
                      <span className="text-lg sm:text-xl text-orange-600 font-extrabold">
                        {formatCurrency(grandTotal)}
                      </span>
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
                          if (
                            lastPaidInvoice &&
                            lastPaidInvoice.tableName === selectedTable?.name
                          ) {
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
          {/* TAB DÀNH CHO ADMIN: GỌI MÓN (CHỨC NĂNG PHỤC VỤ)        */}
          {/* ===================================================== */}
          {isAdmin && activeTab === "order" && (
            <div className="space-y-4">
              {/* Sơ đồ bàn chuẩn giao diện Phục vụ */}
              <div className="bg-white rounded-lg p-4 sm:p-5 shadow-xs border border-orange-100/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Sơ đồ bàn
                    </h2>
                  </div>

                  {/* Bộ lọc trạng thái bàn giống bên Phục vụ */}
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-slate-600">
                    <button
                      type="button"
                      onClick={() =>
                        setOrderTableStatusFilter(
                          orderTableStatusFilter === "AVAILABLE"
                            ? "ALL"
                            : "AVAILABLE",
                        )
                      }
                      className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
                        orderTableStatusFilter !== "ALL" &&
                        orderTableStatusFilter !== "AVAILABLE"
                          ? "opacity-40"
                          : ""
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Bàn trống</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOrderTableStatusFilter(
                          orderTableStatusFilter === "OCCUPIED"
                            ? "ALL"
                            : "OCCUPIED",
                        )
                      }
                      className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
                        orderTableStatusFilter !== "ALL" &&
                        orderTableStatusFilter !== "OCCUPIED"
                          ? "opacity-40"
                          : ""
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Đang có khách</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOrderTableStatusFilter(
                          orderTableStatusFilter === "READY_TO_SERVE"
                            ? "ALL"
                            : "READY_TO_SERVE",
                        )
                      }
                      className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
                        orderTableStatusFilter !== "ALL" &&
                        orderTableStatusFilter !== "READY_TO_SERVE"
                          ? "opacity-40"
                          : ""
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span>Chờ mang món</span>
                    </button>
                  </div>
                </div>

                {/* Lưới thẻ bàn chuẩn giao diện Phục vụ (TableMapPage) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-1 [scrollbar-gutter:stable]">
                  {tables
                    .filter((tbl) => {
                      const items = tbl.order?.items || [];
                      const readyCount = items.filter(
                        (i) => i.status === "DONE",
                      ).length;
                      const waiterStatus =
                        readyCount > 0 || tbl.status === "READY_TO_SERVE"
                          ? "READY_TO_SERVE"
                          : tbl.order || tbl.status !== "AVAILABLE"
                            ? "OCCUPIED"
                            : "AVAILABLE";
                      return (
                        orderTableStatusFilter === "ALL" ||
                        waiterStatus === orderTableStatusFilter
                      );
                    })
                    .map((tbl) => {
                      const isSelected = tbl.id === selectedTable?.id;
                      const items = tbl.order?.items || [];
                      const readyCount = items.filter(
                        (i) => i.status === "DONE",
                      ).length;
                      const draftCount = (
                        orderCartByTable[tbl.id] || []
                      ).reduce((s, i) => s + i.quantity, 0);
                      const isReadyToServe =
                        readyCount > 0 || tbl.status === "READY_TO_SERVE";
                      const isOccupied =
                        !isReadyToServe &&
                        (Boolean(tbl.order) || tbl.status !== "AVAILABLE");

                      let cardClass = "bg-[#DCFCE7]";
                      let iconColor = "text-emerald-600";
                      let subColor = "text-emerald-800 font-medium";
                      let statusLabel = "Bàn trống";
                      let badgeBg = "bg-emerald-600 text-white";
                      let badgeCount = draftCount;

                      if (isReadyToServe) {
                        cardClass = "bg-[#FDE68A]/70";
                        iconColor = "text-amber-600";
                        subColor = "text-amber-800 font-semibold";
                        statusLabel = "Chờ mang món";
                        badgeBg = "bg-orange-500 text-white";
                        badgeCount = readyCount;
                      } else if (isOccupied) {
                        cardClass = "bg-[#FECACA]/75";
                        iconColor = "text-rose-600";
                        subColor = "text-rose-800 font-medium";
                        statusLabel = "Đang có khách";
                        badgeBg = "bg-rose-500 text-white";
                        badgeCount = items.length;
                      }

                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => handleSelectTable(tbl)}
                          className={`relative rounded-2xl p-3 flex flex-col items-center justify-center text-center min-h-[88px] transition-all cursor-pointer ${cardClass} ${
                            isSelected
                              ? "ring-2 ring-orange-500 shadow-md scale-[1.02]"
                              : "hover:scale-[1.01] hover:shadow-xs"
                          }`}
                        >
                          {badgeCount > 0 && (
                            <span
                              className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shadow-sm ${badgeBg}`}
                            >
                              {badgeCount}
                            </span>
                          )}
                          <GridTableGlyph
                            className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 ${iconColor}`}
                          />
                          <span className="text-sm sm:text-base font-extrabold text-slate-900">
                            {tbl.name}
                          </span>
                          <span
                            className={`text-[11px] sm:text-xs mt-0.5 leading-tight ${subColor}`}
                          >
                            {statusLabel}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Lưới Thực đơn gọi món (Trái) & Giỏ món chuẩn bị gửi bếp (Phải) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* CỘT TRÁI: THỰC ĐƠN ĐỂ CHỌN MÓN */}
                <div className="xl:col-span-7 bg-white rounded-lg p-4 shadow-xs border border-orange-100/80 space-y-3.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                    <div className="relative w-full sm:w-64 shrink-0">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        aria-label="Tìm kiếm món ăn"
                        className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-orange-500 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setOrderSelectedCategory("Tất cả")}
                        className={`px-3 py-1 rounded-md text-xs font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors ${
                          orderSelectedCategory === "Tất cả"
                            ? "border-orange-500 bg-orange-500 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                        }`}
                      >
                        Tất cả ({menuItems.length})
                      </button>
                      {categories.map((cat) => {
                        const count = menuItems.filter(
                          (m) =>
                            m.categoryId === cat.id ||
                            m.categoryName === cat.name,
                        ).length;
                        return (
                          <button
                            key={cat.id || cat.name}
                            type="button"
                            onClick={() => setOrderSelectedCategory(cat.name)}
                            className={`px-3 py-1 rounded-md text-xs font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors ${
                              orderSelectedCategory === cat.name
                                ? "border-orange-500 bg-orange-500 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                            }`}
                          >
                            {cat.name} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danh sách món ăn có thể bấm chọn */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[calc(100vh-380px)] min-h-[340px] overflow-y-auto pr-1 [scrollbar-gutter:stable] content-start">
                    {filteredOrderMenuItems.length === 0 ? (
                      <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                        Không tìm thấy món ăn phù hợp.
                      </div>
                    ) : (
                      filteredOrderMenuItems.map((dish) => {
                        const isAvail = dish.available !== false;
                        const inCartItem = currentTableCart.find(
                          (i) => i.menuItemId === dish.id,
                        );
                        return (
                          <div
                            key={dish.id}
                            onClick={() =>
                              isAvail && handleAddDishToOrderCart(dish)
                            }
                            className={`relative group rounded-lg border p-2.5 flex flex-col justify-between transition-all ${
                              isAvail
                                ? "cursor-pointer bg-white hover:border-orange-400 hover:shadow-xs"
                                : "opacity-60 bg-slate-50 cursor-not-allowed border-slate-200"
                            } ${inCartItem ? "border-orange-500 ring-1 ring-orange-400 bg-orange-50/20" : "border-slate-200/80"}`}
                          >
                            {!isAvail && (
                              <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold uppercase">
                                Hết hàng
                              </span>
                            )}
                            {inCartItem && (
                              <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black shadow-xs">
                                x{inCartItem.quantity}
                              </span>
                            )}

                            <div>
                              <div className="w-full h-24 rounded-md overflow-hidden bg-slate-100 mb-2 border border-orange-100/50">
                                <img
                                  src={resolveDishImage(
                                    dish.name,
                                    dish.imageUrl,
                                  )}
                                  alt={dish.name}
                                  onError={handleDishImageError}
                                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvail ? "grayscale" : ""}`}
                                />
                              </div>
                              <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                                {dish.name}
                              </h3>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                              <span className="text-xs sm:text-sm font-black text-orange-600">
                                {formatCurrency(dish.priceVnd)}
                              </span>
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                                  isAvail
                                    ? "bg-orange-100 text-orange-600 group-hover:bg-orange-500 group-hover:text-white"
                                    : "bg-slate-200 text-slate-400"
                                } transition-colors`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CỘT PHẢI: GIỎ GỌI MÓN CỦA BÀN ĐANG CHỌN */}
                <div className="xl:col-span-5 sticky top-2 bg-white rounded-lg p-5 shadow-xs border border-orange-100/80 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                          Phiếu gọi món
                        </h3>
                      </div>

                      <span className="px-3 py-1 rounded-md bg-orange-500 text-white font-extrabold text-xs">
                        Bàn: {selectedTable?.name || "Chưa chọn"}
                      </span>
                    </div>

                    {/* Danh sách món trong giỏ chuẩn bị gửi bếp */}
                    <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto pr-1">
                      {currentTableCart.length === 0 ? (
                        <div className="py-14 flex flex-col items-center justify-center text-slate-400 text-sm">
                          <Utensils className="w-8 h-8 text-slate-300 mb-1" />
                          <p className="font-semibold text-slate-500">
                            Chưa có món nào
                          </p>
                        </div>
                      ) : (
                        currentTableCart.map((item) => (
                          <div key={item.menuItemId} className="py-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={resolveDishImage(
                                    item.name,
                                    item.imageUrl,
                                  )}
                                  onError={handleDishImageError}
                                  alt={item.name}
                                  className="w-10 h-10 rounded-md object-cover border border-slate-100 shrink-0"
                                />
                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {item.name}
                                  </h4>
                                  <span className="text-xs font-semibold text-orange-600">
                                    {formatCurrency(item.priceVnd)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCartItemQty(item.menuItemId, -1)
                                  }
                                  className="w-7 h-7 rounded-md border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center text-xs sm:text-sm font-black text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCartItemQty(item.menuItemId, 1)
                                  }
                                  className="w-7 h-7 rounded-md border border-orange-200 bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-orange-600 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveCartItem(item.menuItemId)
                                  }
                                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                                  title="Xóa món"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Ô nhập ghi chú riêng cho từng món */}
                            <div className="relative">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={item.note || ""}
                                onChange={(e) =>
                                  handleUpdateCartItemNote(
                                    item.menuItemId,
                                    e.target.value,
                                  )
                                }
                                aria-label="Ghi chú món"
                                className="w-full pl-8 pr-3 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-xs text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tổng tiền giỏ gọi món & Nút Gửi xuống bếp */}
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                      <span>
                        Tổng cộng (
                        {currentTableCart.reduce((s, i) => s + i.quantity, 0)}{" "}
                        món):
                      </span>
                      <span className="text-lg font-extrabold text-orange-600">
                        {formatCurrency(currentCartTotalVnd)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitOrderToKitchen}
                      disabled={
                        currentTableCart.length === 0 || isSubmittingOrder
                      }
                      className="w-full py-3 px-4 rounded-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {isSubmittingOrder ? "Đang gửi..." : "Gửi xuống bếp"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB DÀNH CHO ADMIN: THEO DÕI MÓN (CHỨC NĂNG PHỤC VỤ)   */}
          {/* ===================================================== */}
          {isAdmin && activeTab === "tracking" && (
            <div className="space-y-4">
              {/* Sơ đồ bàn chuẩn giao diện Phục vụ */}
              <div className="bg-white rounded-lg p-4 sm:p-5 shadow-xs border border-orange-100/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Sơ đồ bàn
                    </h2>
                  </div>

                  {/* Bộ lọc trạng thái bàn giống bên Phục vụ */}
                  <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-medium text-slate-600">
                    <button
                      type="button"
                      onClick={() =>
                        setOrderTableStatusFilter(
                          orderTableStatusFilter === "AVAILABLE"
                            ? "ALL"
                            : "AVAILABLE",
                        )
                      }
                      className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
                        orderTableStatusFilter !== "ALL" &&
                        orderTableStatusFilter !== "AVAILABLE"
                          ? "opacity-40"
                          : ""
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>Bàn trống</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOrderTableStatusFilter(
                          orderTableStatusFilter === "OCCUPIED"
                            ? "ALL"
                            : "OCCUPIED",
                        )
                      }
                      className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
                        orderTableStatusFilter !== "ALL" &&
                        orderTableStatusFilter !== "OCCUPIED"
                          ? "opacity-40"
                          : ""
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <span>Đang có khách</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOrderTableStatusFilter(
                          orderTableStatusFilter === "READY_TO_SERVE"
                            ? "ALL"
                            : "READY_TO_SERVE",
                        )
                      }
                      className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
                        orderTableStatusFilter !== "ALL" &&
                        orderTableStatusFilter !== "READY_TO_SERVE"
                          ? "opacity-40"
                          : ""
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <span>Chờ mang món</span>
                    </button>
                  </div>
                </div>

                {/* Lưới thẻ bàn chuẩn giao diện Phục vụ (TableMapPage) */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-1 [scrollbar-gutter:stable]">
                  {tables
                    .filter((tbl) => {
                      const items = tbl.order?.items || [];
                      const readyCount = items.filter(
                        (i) => i.status === "DONE",
                      ).length;
                      const waiterStatus =
                        readyCount > 0 || tbl.status === "READY_TO_SERVE"
                          ? "READY_TO_SERVE"
                          : tbl.order || tbl.status !== "AVAILABLE"
                            ? "OCCUPIED"
                            : "AVAILABLE";
                      return (
                        orderTableStatusFilter === "ALL" ||
                        waiterStatus === orderTableStatusFilter
                      );
                    })
                    .map((tbl) => {
                      const isSelected = tbl.id === selectedTable?.id;
                      const items = tbl.order?.items || [];
                      const readyCount = items.filter(
                        (i) => i.status === "DONE",
                      ).length;
                      const isReadyToServe =
                        readyCount > 0 || tbl.status === "READY_TO_SERVE";
                      const isOccupied =
                        !isReadyToServe &&
                        (Boolean(tbl.order) || tbl.status !== "AVAILABLE");

                      let cardClass = "bg-[#DCFCE7]";
                      let iconColor = "text-emerald-600";
                      let subColor = "text-emerald-800 font-medium";
                      let statusLabel = "Bàn trống";
                      let badgeBg = "bg-emerald-600 text-white";
                      let badgeCount = 0;

                      if (isReadyToServe) {
                        cardClass = "bg-[#FDE68A]/70";
                        iconColor = "text-amber-600";
                        subColor = "text-amber-800 font-semibold";
                        statusLabel = "Chờ mang món";
                        badgeBg = "bg-orange-500 text-white";
                        badgeCount = readyCount;
                      } else if (isOccupied) {
                        cardClass = "bg-[#FECACA]/75";
                        iconColor = "text-rose-600";
                        subColor = "text-rose-800 font-medium";
                        statusLabel = "Đang có khách";
                        badgeBg = "bg-rose-500 text-white";
                        badgeCount = items.length;
                      }

                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => handleSelectTable(tbl)}
                          className={`relative rounded-2xl p-3 flex flex-col items-center justify-center text-center min-h-[88px] transition-all cursor-pointer ${cardClass} ${
                            isSelected
                              ? "ring-2 ring-orange-500 shadow-md scale-[1.02]"
                              : "hover:scale-[1.01] hover:shadow-xs"
                          }`}
                        >
                          {badgeCount > 0 && (
                            <span
                              className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shadow-sm ${badgeBg}`}
                            >
                              {badgeCount}
                            </span>
                          )}
                          <GridTableGlyph
                            className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 ${iconColor}`}
                          />
                          <span className="text-sm sm:text-base font-extrabold text-slate-900">
                            {tbl.name}
                          </span>
                          <span
                            className={`text-[11px] sm:text-xs mt-0.5 leading-tight ${subColor}`}
                          >
                            {statusLabel}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Nội dung theo dõi chi tiết của bàn đang chọn */}
              <div className="bg-white rounded-lg p-5 shadow-xs border border-orange-100/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-md bg-orange-500 text-white font-black text-sm">
                      {selectedTable?.name || "Chưa chọn bàn"}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {selectedTable?.order
                        ? `Đơn ${selectedTable.order.orderCode}  Đã phục vụ ${servedItemsCount}/${totalItemsCount} món`
                        : "Chưa có đơn hàng"}
                    </h3>
                  </div>

                  {/* Bộ lọc trạng thái món trong đơn + nút Gọi thêm món / Thanh toán */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { key: "ALL", label: `Tất cả (${orderItems.length})` },
                      {
                        key: "DONE",
                        label: `Chờ phục vụ (${orderItems.filter((i) => i.status === "DONE").length})`,
                      },
                      {
                        key: "COOKING",
                        label: `Đang nấu (${orderItems.filter((i) => i.status === "COOKING").length})`,
                      },
                      {
                        key: "PENDING",
                        label: `Chờ bếp (${orderItems.filter((i) => i.status === "PENDING").length})`,
                      },
                      {
                        key: "SERVED",
                        label: `Đã phục vụ (${orderItems.filter((i) => i.status === "SERVED").length})`,
                      },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setTrackingStatusFilter(f.key)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                          trackingStatusFilter === f.key
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-orange-50"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setActiveTab("order")}
                      className="ml-1 px-3 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Gọi thêm món</span>
                    </button>

                    {selectedTable?.order && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("checkout")}
                        className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                        <span>Thanh toán</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Danh sách món ăn trong đơn kèm nút Xác nhận phục vụ / Hủy món */}
                {orderItems.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-sm space-y-2">
                    <BellRing className="w-10 h-10 text-slate-300" />
                    <p className="font-bold text-slate-600">Chưa có món ăn</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {orderItems
                      .filter(
                        (it) =>
                          trackingStatusFilter === "ALL" ||
                          it.status === trackingStatusFilter,
                      )
                      .map((item) => {
                        const isDone = item.status === "DONE";
                        const isPending = item.status === "PENDING";
                        const isCooking = item.status === "COOKING";
                        const isServed = item.status === "SERVED";

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                              isDone
                                ? "bg-emerald-50/70 border-emerald-400 shadow-xs"
                                : isCooking
                                  ? "bg-blue-50/40 border-blue-200"
                                  : isPending
                                    ? "bg-amber-50/40 border-amber-200"
                                    : "bg-slate-50/60 border-slate-200/80"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={resolveDishImage(item.name, item.image)}
                                onError={handleDishImageError}
                                alt={item.name}
                                className="w-14 h-14 rounded-md object-cover border border-white shadow-xs shrink-0"
                              />
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[10px] font-extrabold">
                                    Lượt {item.round || 1}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                    {item.name}
                                  </h4>
                                  <span className="text-xs font-black text-orange-600">
                                    x{item.quantity}
                                  </span>
                                </div>

                                {item.note && (
                                  <p className="text-xs text-rose-600 font-semibold italic">
                                    {item.note}
                                  </p>
                                )}

                                {(item.orderedByName || item.cookedByName || item.servedByName) && (
                                  <p className="text-[11px] text-slate-500 font-semibold">
                                    {item.orderedByName ? `Phục vụ gọi: ${item.orderedByName}` : ""}
                                    {item.orderedByName && item.cookedByName ? " • " : ""}
                                    {item.cookedByName ? `Bếp: ${item.cookedByName}` : ""}
                                    {(item.orderedByName || item.cookedByName) && item.servedByName ? " • " : ""}
                                    {item.servedByName ? `Bưng món: ${item.servedByName}` : ""}
                                  </p>
                                )}

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                      isDone
                                        ? "bg-emerald-500 text-white"
                                        : isCooking
                                          ? "bg-blue-100 text-blue-700"
                                          : isPending
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {getOrderItemStatusLabel(item.status)}
                                  </span>
                                  <span className="text-xs font-bold text-slate-500">
                                    {formatCurrency(
                                      item.unitPriceVnd * item.quantity,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Các nút thao tác của Phục vụ: Bưng món ra bàn / Hủy món */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isDone && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleServeOrderItem(item.id, item.name)
                                  }
                                  className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Đã phục vụ</span>
                                </button>
                              )}

                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancelOrderItem(item.id, item.name)
                                  }
                                  className="px-3 py-2 rounded-md bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Hủy món</span>
                                </button>
                              )}

                              {isServed && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 px-2">
                                  <CheckCircle2 className="w-4 h-4" /> Hoàn tất
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Thanh hành động cuối đơn: Yêu cầu thanh toán khi đã phục vụ xong hết món */}
                {selectedTable?.order && totalItemsCount > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs sm:text-sm font-semibold text-slate-600">
                      Tạm tính:{" "}
                      <strong className="text-base font-black text-orange-600">
                        {formatCurrency(subtotal)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {selectedTable.order.status !== "PAYMENT_REQUESTED" &&
                        servedItemsCount === totalItemsCount && (
                          <button
                            type="button"
                            onClick={handleRequestPaymentForTable}
                            className="px-4 py-2.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Receipt className="w-4 h-4" />
                            <span>Gửi yêu cầu thanh toán</span>
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 2: QUẢN LÝ THỰC ĐƠN (FR-C03 - CHỈ ADMIN)          */}
          {/* ===================================================== */}
          {isAdmin && activeTab === "menu" && (
            <div className="bg-white rounded-lg p-3.5 sm:p-4 shadow-xs border border-orange-100/80 space-y-3">
              {/* Tiêu đề & Nút Thêm món ăn mới */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                      Quản lý Thực đơn
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDishForm({
                      name: "",
                      categoryId: categories[0]?.id || "cat-1",
                      priceVnd: "",
                      imageUrl: "",
                      description: "",
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
                    aria-label="Tìm kiếm món ăn"
                    className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                {/* Các pill danh mục nằm ngang hiển thị số lượng món dạng (X) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedCategory("Tất cả");
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${
                      selectedCategory === "Tất cả"
                        ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                        : "border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                    }`}
                  >
                    Tất cả ({menuItems.length})
                  </button>
                  {categories.map((cat) => {
                    const count = menuItems.filter(
                      (m) =>
                        m.categoryId === cat.id || m.categoryName === cat.name,
                    ).length;
                    return (
                      <button
                        key={cat.id || cat.name}
                        onClick={() => {
                          setSelectedCategory(cat.name);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${
                          selectedCategory === cat.name
                            ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                            : "border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
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
                          className={`relative group p-2 sm:p-2.5 rounded-lg border-2 transition-all duration-150 cursor-pointer flex flex-col items-center text-center justify-center ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/40 shadow-xs"
                              : "border-slate-100 bg-white hover:border-orange-300 hover:shadow-xs"
                          } ${!isAvailable ? "opacity-70 bg-slate-50/80" : ""}`}
                        >
                          {/* Huy hiệu Hết hàng */}
                          {!isAvailable && (
                            <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                              Hết
                            </span>
                          )}

                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden mb-1.5 border border-orange-100/80 shadow-xs bg-slate-50 flex items-center justify-center shrink-0 relative">
                            <img
                              src={resolveDishImage(item.name, item.imageUrl)}
                              alt={item.name}
                              onError={handleDishImageError}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? "grayscale" : ""}`}
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
                      Hiển thị {paginatedMenuItems.length} /{" "}
                      {filteredMenuItems.length} món (3 hàng)
                    </div>

                    {/* Phân trang: < 1 2 3 > */}
                    <div className="flex items-center gap-1 mx-auto sm:mx-0">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
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
                            className={`w-7 h-7 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                              currentPage === p
                                ? "bg-orange-500 text-white"
                                : "border border-slate-200 text-slate-600 hover:bg-orange-50"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-600 hover:bg-orange-50 disabled:opacity-40 cursor-pointer"
                      >
                        &gt;
                      </button>
                    </div>

                    {/* Nút Toggle hết hàng & Sửa & Xóa món ăn */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selItem = menuItems.find(
                          (m) => m.id === selectedMenuId,
                        );
                        const isAvail = selItem?.available !== false;
                        return (
                          <button
                            onClick={() =>
                              handleToggleAvailability(selectedMenuId)
                            }
                            className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isAvail
                                ? "bg-amber-100 hover:bg-amber-200 text-amber-900"
                                : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900"
                            }`}
                            title={
                              isAvail
                                ? "Đánh dấu món này là Hết hàng"
                                : "Mở bán lại món này"
                            }
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${isAvail ? "bg-amber-600" : "bg-emerald-600"}`}
                            />
                            <span>
                              {isAvail ? "Báo hết hàng" : "Báo còn món"}
                            </span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => {
                          const item = menuItems.find(
                            (m) => m.id === selectedMenuId,
                          );
                          if (item) {
                            setDishForm({
                              name: item.name,
                              categoryId: item.categoryId,
                              priceVnd: String(item.priceVnd),
                              imageUrl: item.imageUrl,
                              description: item.description || "",
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
                        setCategoryForm({ id: "", name: "" });
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
                        setSelectedCategory("Tất cả");
                        setCurrentPage(1);
                      }}
                      className={`w-full py-1.5 px-2.5 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer border ${
                        selectedCategory === "Tất cả"
                          ? "bg-[#FFF3E8] border-orange-200/90 text-orange-600 font-bold shadow-xs"
                          : "text-slate-700 hover:bg-slate-50 font-semibold border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Utensils className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="truncate">Tất cả món</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold shrink-0">
                        {menuItems.length}
                      </span>
                    </button>

                    {categories.map((cat) => {
                      const isCatActive = selectedCategory === cat.name;
                      const IconComp = cat.icon || Utensils;
                      const count = menuItems.filter(
                        (m) =>
                          m.categoryId === cat.id ||
                          m.categoryName === cat.name,
                      ).length;
                      return (
                        <div
                          key={cat.id || cat.name}
                          className={`group w-full py-1 px-2 rounded-md flex items-center justify-between transition-colors border ${
                            isCatActive
                              ? "bg-[#FFF3E8] border-orange-200/90 text-orange-600 font-bold shadow-xs"
                              : "hover:bg-slate-50 border-transparent text-slate-700"
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
          {/* TAB 3: QUẢN LÝ SƠ ĐỒ BÀN (FR-C04 - CHỈ ADMIN)          */}
          {/* ===================================================== */}
          {isAdmin && activeTab === "tables" && (
            <div className="bg-white rounded-lg p-5 lg:p-6 shadow-xs border border-orange-100/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900">
                      Quản lý Sơ đồ bàn{" "}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewTableForm({
                      name: `T${tables.length + 1}`,
                      capacity: 4,
                    });
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
                    aria-label="Tìm kiếm bàn"
                    className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                {/* Các pill lọc theo số chỗ ngồi kèm số lượng bàn từng loại */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
                  <button
                    onClick={() => setTableCapacityFilter("ALL")}
                    className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${
                      tableCapacityFilter === "ALL"
                        ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                        : "border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                    }`}
                  >
                    Tất cả ({tables.length})
                  </button>
                  {capacityStats.map(({ capacity, count }) => (
                    <button
                      key={capacity}
                      onClick={() => setTableCapacityFilter(capacity)}
                      className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors duration-150 ${
                        tableCapacityFilter === capacity
                          ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                          : "border-slate-200/90 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-h-[calc(100vh-310px)] min-h-[380px] overflow-y-auto pr-2 [scrollbar-gutter:stable] content-start">
                    {filteredManagementTables.length === 0 ? (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 text-sm">
                        <p className="font-semibold text-slate-600">
                          Không tìm thấy bàn nào phù hợp với bộ lọc
                        </p>
                        <button
                          onClick={() => {
                            setTableCapacityFilter("ALL");
                            setTableSearchQuery("");
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
                            className={`flex flex-col items-center justify-center cursor-pointer transition-transform duration-150 ${
                              isSelected ? "scale-105" : "hover:scale-102"
                            }`}
                          >
                            {/* Hình khối bàn ghế tiêu chuẩn cấu trúc mặt bằng (Không trạng thái phục vụ) */}
                            <div className="relative w-24 h-24 flex items-center justify-center">
                              <span className="w-10 h-3.5 rounded-t-sm absolute -top-1.5 bg-orange-100/90 border border-orange-200/60" />
                              <span className="w-10 h-3.5 rounded-b-sm absolute -bottom-1.5 bg-orange-100/90 border border-orange-200/60" />
                              <span className="w-3.5 h-10 rounded-l-sm absolute -left-1.5 bg-orange-100/90 border border-orange-200/60" />
                              <span className="w-3.5 h-10 rounded-r-sm absolute -right-1.5 bg-orange-100/90 border border-orange-200/60" />

                              <div
                                className={`w-20 h-20 rounded-md border-2 flex flex-col items-center justify-center shadow-xs z-10 transition-colors ${
                                  isSelected
                                    ? "bg-orange-50/90 border-orange-500 ring-2 ring-orange-400 text-slate-900 shadow-sm"
                                    : "bg-white border-slate-200/90 text-slate-800 hover:border-orange-300 hover:bg-orange-50/20"
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
                        Tên bàn
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
                        onChange={(e) =>
                          setEditingTableCapacity(
                            Math.max(1, Number(e.target.value) || 1),
                          )
                        }
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
                          const current = tables.find(
                            (t) => t.id === editingTableId,
                          );
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
          {/* TAB 4: BÁO CÁO DOANH THU (FR-C05 - CHỈ ADMIN)         */}
          {/* ===================================================== */}
          {isAdmin && activeTab === "reports" && (
            <div className="space-y-6">
              {/* Header & Bộ lọc thời gian chuẩn theo API ?date=YYYY-MM-DD */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-lg border border-orange-100/70 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg lg:text-xl font-extrabold text-slate-900">
                      Báo cáo Doanh thu
                    </h2>
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
                      <TrendingUp className="w-3.5 h-3.5" /> Sau thuế và giảm
                      giá
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
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-orange-100/70 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Percent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Tạm tính:</span>
                      <strong className="text-slate-800">
                        {formatCurrency(revenueReport.subtotalVnd)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-rose-600">
                      <span>Giảm giá:</span>
                      <strong>
                        -{formatCurrency(revenueReport.discountVnd)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Thuế VAT (8%):</span>
                      <strong className="text-slate-800">
                        +{formatCurrency(revenueReport.vatVnd)}
                      </strong>
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
                        Top 10 Món bán chạy nhất trong ngày
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-bold">
                        <th className="py-3 px-3">Hạng</th>
                        <th className="py-3 px-3">Tên món ăn</th>
                        <th className="py-3 px-3 text-center">
                          Số lượng đã bán
                        </th>
                        <th className="py-3 px-3 text-right">Tổng doanh thu</th>
                        <th className="py-3 px-3 text-right">Tỷ trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {topItemsReport.slice(0, 10).map((it, idx) => {
                        const percent =
                          revenueReport.subtotalVnd > 0
                            ? Math.round(
                                (it.totalRevenueVnd /
                                  revenueReport.subtotalVnd) *
                                  100,
                              )
                            : 0;
                        return (
                          <tr
                            key={it.menuItemId || idx}
                            className="hover:bg-orange-50/40 transition-colors"
                          >
                            <td className="py-3 px-3">
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${
                                  idx === 0
                                    ? "bg-amber-400 text-white shadow-xs"
                                    : idx === 1
                                      ? "bg-slate-300 text-slate-700"
                                      : idx === 2
                                        ? "bg-amber-600 text-white"
                                        : "text-slate-400"
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

              {/* BẢNG LỊCH SỬ CHI TIẾT CÁC HÓA ĐƠN TRONG NGÀY (RÀ SOÁT CUỐI NGÀY) */}
              <div className="bg-white rounded-lg p-5 lg:p-6 border border-orange-100/70 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">
                        Lịch sử chi tiết các hóa đơn trong ngày ({invoicesReport.length})
                      </h3>
                    </div>
                  </div>
                </div>

                {invoicesReport.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium">
                    Chưa có hóa đơn thanh toán nào trong ngày {reportDate}.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-bold">
                          <th className="py-3 px-3">Mã HĐ</th>
                          <th className="py-3 px-3">Bàn / Mã đơn</th>
                          <th className="py-3 px-3">Thời gian</th>
                          <th className="py-3 px-3">Nhân viên thanh toán</th>
                          <th className="py-3 px-3 text-right">Tạm tính</th>
                          <th className="py-3 px-3 text-right">Giảm giá</th>
                          <th className="py-3 px-3 text-right">VAT (8%)</th>
                          <th className="py-3 px-3 text-right">Tổng thu</th>
                          <th className="py-3 px-3 text-center">Chi tiết</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {invoicesReport.map((inv) => {
                          const paidTimeStr = inv.paidAt
                            ? new Date(inv.paidAt).toLocaleString("vi-VN")
                            : "";
                          return (
                            <tr
                              key={inv.invoiceId}
                              className="hover:bg-orange-50/40 transition-colors"
                            >
                              <td className="py-3 px-3 font-black text-slate-900">
                                {inv.invoiceCode}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-900">
                                  {inv.tableName}
                                </span>{" "}
                                <span className="text-xs text-slate-400">
                                  ({inv.orderCode})
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {paidTimeStr}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200/60 text-xs font-bold">
                                  {inv.cashierName || "Thu ngân"}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right text-slate-600">
                                {formatCurrency(inv.subtotalVnd)}
                              </td>
                              <td className="py-3 px-3 text-right text-rose-600">
                                {inv.discountVnd > 0
                                  ? `-${formatCurrency(inv.discountVnd)}`
                                  : "0 đ"}
                              </td>
                              <td className="py-3 px-3 text-right text-slate-600">
                                {formatCurrency(inv.vatVnd)}
                              </td>
                              <td className="py-3 px-3 text-right font-black text-orange-600">
                                {formatCurrency(inv.totalVnd)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedHistoryInvoice(inv)}
                                  className="px-2.5 py-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Xem</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB DÀNH CHO ADMIN: QUẢN LÝ TÀI KHOẢN                 */}
          {/* ===================================================== */}
          {isAdmin && activeTab === "accounts" && (
            <div className="bg-white rounded-lg p-5 lg:p-6 shadow-xs border border-orange-100/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg lg:text-xl font-extrabold text-slate-900">
                    Quản lý Tài khoản ({accountsList.length})
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAccountForm({
                      username: "",
                      fullName: "",
                      password: "",
                      role: "WAITER",
                      active: true,
                    });
                    setIsAddAccountOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Thêm tài khoản</span>
                </button>
              </div>

              {/* Thanh tìm kiếm & Lọc theo Role */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    aria-label="Tìm kiếm tài khoản"
                    className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-xs sm:text-sm font-medium outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
                  {[
                    { key: "ALL", label: `Tất cả (${accountsList.length})` },
                    {
                      key: "ADMIN",
                      label: `Quản trị (${accountsList.filter((a) => a.role === "ADMIN").length})`,
                    },
                    {
                      key: "CASHIER",
                      label: `Thu ngân (${accountsList.filter((a) => a.role === "CASHIER").length})`,
                    },
                    {
                      key: "WAITER",
                      label: `Phục vụ (${accountsList.filter((a) => a.role === "WAITER").length})`,
                    },
                    {
                      key: "KITCHEN",
                      label: `Nhà bếp (${accountsList.filter((a) => a.role === "KITCHEN").length})`,
                    },
                  ].map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setAccountRoleFilter(r.key)}
                      className={`px-3 py-1 rounded-md text-xs sm:text-sm font-bold border whitespace-nowrap cursor-pointer shrink-0 transition-colors ${
                        accountRoleFilter === r.key
                          ? "border-orange-500 bg-orange-500 text-white shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bảng danh sách tài khoản */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-bold">
                      <th className="py-3 px-3">User ID (Tên đăng nhập)</th>
                      <th className="py-3 px-3">Họ và tên</th>
                      <th className="py-3 px-3">Vai trò (Role)</th>
                      <th className="py-3 px-3">Trạng thái</th>
                      <th className="py-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredAccounts.map((acc) => {
                      const roleLabel =
                        acc.role === "ADMIN"
                          ? "Quản trị viên (ADMIN)"
                          : acc.role === "CASHIER"
                            ? "Thu ngân (CASHIER)"
                            : acc.role === "KITCHEN"
                              ? "Nhà bếp (KITCHEN)"
                              : "Phục vụ (WAITER)";
                      return (
                        <tr
                          key={acc.id}
                          className="hover:bg-orange-50/40 transition-colors"
                        >
                          <td className="py-3 px-3 font-extrabold text-slate-900">
                            {acc.username}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {acc.fullName || acc.username}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200/70 text-xs font-bold">
                              {roleLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                                acc.active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  acc.active ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {acc.active ? "Hoạt động" : "Đã khóa"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAccountForAction(acc);
                                  setAccountForm({
                                    username: acc.username,
                                    fullName: acc.fullName || "",
                                    password: "",
                                    role: acc.role,
                                    active: acc.active,
                                  });
                                  setIsEditAccountOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-md bg-orange-100/80 hover:bg-orange-200/80 text-orange-700 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAccountForAction(acc);
                                  setIsDeleteAccountOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 5: HỒ SƠ NGƯỜI DÙNG (CHUẨN HÓA 100% THEO API /auth/me) */}
          {/* ===================================================== */}
          {activeTab === "profile" && (
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
                      {profileUser.displayName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 font-extrabold text-xs">
                      {profileUser.role}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {profileUser.roleTitle}
                  </p>
                </div>
              </div>

              {/* Thông tin chi tiết chuẩn theo Backend API (AppUser / UserView) */}
              <div className="bg-white rounded-xl p-6 border border-orange-100/80 shadow-xs space-y-4">
                <h3 className="font-extrabold text-sm uppercase text-slate-400 tracking-wider pb-2 border-b border-slate-100">
                  Thông tin tài khoản
                </h3>

                <div className="divide-y divide-slate-100 text-sm">
                  {/* Họ và tên */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Họ và tên</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {profileUser.displayName}
                    </span>
                  </div>

                  {/* Tên đăng nhập */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-slate-600 font-medium">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>User ID (Tên đăng nhập)</span>
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
                </div>
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
                Phiếu tạm tính
              </span>
              <h3 className="font-black text-lg text-slate-900 tracking-tight">
                NHÀ HÀNG ROMS
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bàn: <strong>{selectedTable?.name || "N/A"}</strong> Giờ in:{" "}
                {currentTime}
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
                  .filter((it) => it.status === "SERVED")
                  .map((it) => (
                    <div
                      key={it.id}
                      className="grid grid-cols-12 font-medium text-slate-700 py-1 items-center"
                    >
                      <span className="col-span-4 truncate pr-1 font-semibold">
                        {it.name}
                      </span>
                      <span className="col-span-3 text-right pr-6 text-slate-500">
                        {formatCurrency(it.unitPriceVnd)}
                      </span>
                      <span className="col-span-2 text-center font-bold text-slate-800">
                        {it.quantity}
                      </span>
                      <span className="col-span-3 text-right font-bold text-slate-900">
                        {formatCurrency(it.unitPriceVnd * it.quantity)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {safeDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold">
                    -{formatCurrency(safeDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>VAT (8%):</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(vatAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Tổng cộng:</span>
                <span className="text-base text-orange-600 font-extrabold">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                  setIsBillPreviewOpen(false);
                  showToast("Đã gửi lệnh in phiếu tạm tính!", "success");
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
                <span>Thanh toán bàn {selectedTable?.name || ""}</span>
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
            {(() => {
              const paidNum = Number(customerPaidAmount);
              const isInsufficient =
                String(customerPaidAmount).trim() === "" ||
                Number.isNaN(paidNum) ||
                paidNum < grandTotal;

              return (
                <>
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Tiền khách đưa (VNĐ):
                      </label>
                      <input
                        type="number"
                        min={grandTotal}
                        value={customerPaidAmount}
                        onChange={(e) => setCustomerPaidAmount(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-md border text-sm font-black text-slate-900 outline-none ${
                          isInsufficient
                            ? "border-rose-500 focus:border-rose-600 bg-rose-50/30"
                            : "border-slate-200 focus:border-orange-500"
                        }`}
                      />
                      {isInsufficient && (
                        <p className="mt-1.5 text-xs font-bold text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Tiền khách đưa không được nhỏ hơn hóa đơn (
                            {formatCurrency(grandTotal)})
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold p-2.5 rounded-md bg-slate-50 border border-slate-100">
                      <span className="text-slate-500">
                        Tiền thối lại cho khách:
                      </span>
                      <span className="text-sm font-black text-emerald-600">
                        {formatCurrency(
                          isInsufficient
                            ? 0
                            : Math.max(0, paidNum - grandTotal),
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleConfirmPayment}
                      disabled={isInsufficient}
                      className={`flex-1 py-2.5 px-4 rounded-md font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors ${
                        isInsufficient
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white cursor-pointer"
                      }`}
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
                </>
              );
            })()}
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
                Số HĐ: <strong>{lastPaidInvoice.invoiceCode}</strong>{" "}
                {lastPaidInvoice.paidAt}
              </p>
              <p className="text-xs text-slate-400">
                Bàn: <strong>{lastPaidInvoice.tableName}</strong> • Nhân viên thanh toán:{" "}
                <strong className="text-slate-700">{lastPaidInvoice.cashierName}</strong>
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
                {lastPaidInvoice.items.map((it, idx) => (
                  <div
                    key={it.id || it.orderItemId || idx}
                    className="grid grid-cols-12 font-medium text-slate-700 py-1 items-center"
                  >
                    <span className="col-span-4 truncate pr-1 font-semibold">
                      {it.name}
                    </span>
                    <span className="col-span-3 text-right pr-6 text-slate-500">
                      {formatCurrency(it.unitPriceVnd)}
                    </span>
                    <span className="col-span-2 text-center font-bold text-slate-800">
                      {it.quantity}
                    </span>
                    <span className="col-span-3 text-right font-bold text-slate-900">
                      {formatCurrency(it.unitPriceVnd * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(lastPaidInvoice.subtotal)}
                </span>
              </div>
              {lastPaidInvoice.discountVnd > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold">
                    -{formatCurrency(lastPaidInvoice.discountVnd)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Thuế VAT (8%):</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(lastPaidInvoice.vatAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Tổng thanh toán:</span>
                <span className="text-base text-orange-600 font-extrabold">
                  {formatCurrency(lastPaidInvoice.grandTotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                <span>Nhân viên thanh toán:</span>
                <span className="font-bold text-slate-800">{lastPaidInvoice.cashierName}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
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
                <span>Thêm món ăn mới</span>
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
                  Tên món ăn
                </label>
                <input
                  type="text"
                  value={dishForm.name}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Danh mục
                </label>
                <select
                  value={dishForm.categoryId}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, categoryId: e.target.value })
                  }
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
                  Giá bán VNĐ
                </label>
                <input
                  type="number"
                  value={dishForm.priceVnd}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, priceVnd: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mô tả món ăn
                </label>
                <input
                  type="text"
                  value={dishForm.description}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Link hình ảnh món
                </label>
                <input
                  type="text"
                  value={dishForm.imageUrl}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, imageUrl: e.target.value })
                  }
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
                <span>Sửa món ăn</span>
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
                  Tên món ăn
                </label>
                <input
                  type="text"
                  value={dishForm.name}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Danh mục
                </label>
                <select
                  value={dishForm.categoryId}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, categoryId: e.target.value })
                  }
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
                  Giá bán VNĐ
                </label>
                <input
                  type="number"
                  value={dishForm.priceVnd}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, priceVnd: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mô tả món ăn
                </label>
                <input
                  type="text"
                  value={dishForm.description}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Link hình ảnh món
                </label>
                <input
                  type="text"
                  value={dishForm.imageUrl}
                  onChange={(e) =>
                    setDishForm({ ...dishForm, imageUrl: e.target.value })
                  }
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
              Bạn có chắc chắn muốn xóa món này khỏi thực đơn? Món ăn sẽ không
              thể đặt hàng được nữa.
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
                <span>Thêm danh mục mới</span>
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
                Tên danh mục
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
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
                <span>Sửa tên danh mục </span>
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
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
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
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <strong>"{categoryForm.name}"</strong>?
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
                <span>Thêm bàn mới </span>
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
                  Tên bàn
                </label>
                <input
                  type="text"
                  value={newTableForm.name}
                  onChange={(e) =>
                    setNewTableForm({ ...newTableForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Sức chứa / Số ghế
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newTableForm.capacity}
                  onChange={(e) =>
                    setNewTableForm({
                      ...newTableForm,
                      capacity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
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
              Bạn có chắc chắn muốn xóa bàn này khỏi hệ thống? Bàn sẽ bị vô hiệu
              hóa và không thể nhận khách được nữa.
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
                  <option>Máy in nhiệt USB (Khổ 80mm)</option>
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
                  value="8%"
                  disabled
                  className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-slate-500 font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  showToast("Đã lưu cấu hình quầy thu ngân!", "success");
                }}
                className="w-full py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 13: CHI TIẾT HÓA ĐƠN TRONG LỊCH SỬ DOANH THU        */}
      {/* ========================================================= */}
      {selectedHistoryInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-1 inline-block">
                  Chi tiết hóa đơn đã thanh toán
                </span>
                <h3 className="font-black text-lg text-slate-900">
                  Hóa đơn {selectedHistoryInvoice.invoiceCode} ({selectedHistoryInvoice.tableName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryInvoice(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Mã đơn hàng:</span>
                <strong className="text-slate-800 font-extrabold">
                  {selectedHistoryInvoice.orderCode}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Thời gian thanh toán:</span>
                <strong className="text-slate-800 font-extrabold">
                  {selectedHistoryInvoice.paidAt
                    ? new Date(selectedHistoryInvoice.paidAt).toLocaleString("vi-VN")
                    : ""}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Nhân viên thanh toán:</span>
                <strong className="text-orange-600 font-extrabold">
                  {selectedHistoryInvoice.cashierName || "Thu ngân"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Nhân viên mở đơn:</span>
                <strong className="text-slate-800 font-extrabold">
                  {selectedHistoryInvoice.createdByName || "Phục vụ"}
                </strong>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Món ăn</th>
                    <th className="py-2.5 px-3">Truy vết (Gọi / Bếp)</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-center">SL</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {(selectedHistoryInvoice.items || []).map((it, idx) => (
                    <tr key={it.orderItemId || idx}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {it.name}{" "}
                        <span className="text-[10px] text-slate-400 font-semibold">
                          (Lượt {it.round || 1})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        <div>Gọi: <strong className="text-slate-700">{it.orderedByName || selectedHistoryInvoice.createdByName || "N/A"}</strong></div>
                        {it.cookedByName && (
                          <div>Bếp: <strong className="text-slate-700">{it.cookedByName}</strong></div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatCurrency(it.unitPriceVnd)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {it.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {formatCurrency(it.lineTotalVnd ?? it.unitPriceVnd * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-xs font-semibold">
              <div className="flex justify-between text-slate-500">
                <span>Tạm tính:</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(selectedHistoryInvoice.subtotalVnd)}
                </span>
              </div>
              {selectedHistoryInvoice.discountVnd > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá:</span>
                  <span className="font-bold">
                    -{formatCurrency(selectedHistoryInvoice.discountVnd)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Thuế VAT (8%):</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(selectedHistoryInvoice.vatVnd)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Tổng thanh toán:</span>
                <span className="text-base text-orange-600 font-extrabold">
                  {formatCurrency(selectedHistoryInvoice.totalVnd)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In lại hóa đơn</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedHistoryInvoice(null)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 14: THÊM TÀI KHOẢN MỚI (POST /api/v1/users)         */}
      {/* ========================================================= */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span>Thêm tài khoản mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  User ID (Tên đăng nhập)
                </label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={accountForm.fullName}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mật khẩu (tối thiểu 12 ký tự)
                </label>
                <input
                  type="password"
                  value={accountForm.password}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={accountForm.role}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="WAITER">Phục vụ (WAITER)</option>
                  <option value="KITCHEN">Nhà bếp (KITCHEN)</option>
                  <option value="CASHIER">Thu ngân (CASHIER)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCreateAccount}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo tài khoản</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 15: SỬA TÀI KHOẢN (PUT /api/v1/users/{id})          */}
      {/* ========================================================= */}
      {isEditAccountOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-orange-500" />
                <span>Sửa thông tin tài khoản</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditAccountOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  User ID (Tên đăng nhập)
                </label>
                <input
                  type="text"
                  value={accountForm.username}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, username: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={accountForm.fullName}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, fullName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Vai trò (Role)
                </label>
                <select
                  value={accountForm.role}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="WAITER">Phục vụ (WAITER)</option>
                  <option value="KITCHEN">Nhà bếp (KITCHEN)</option>
                  <option value="CASHIER">Thu ngân (CASHIER)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Trạng thái tài khoản
                </label>
                <select
                  value={accountForm.active ? "true" : "false"}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      active: e.target.value === "true",
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Khóa tài khoản</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Đặt lại mật khẩu mới (Để trống nếu giữ nguyên)
                </label>
                <input
                  type="password"
                  value={accountForm.password}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 text-sm font-medium outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleUpdateAccount}
                className="flex-1 py-2.5 px-4 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditAccountOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 16: XÁC NHẬN XÓA TÀI KHOẢN (DELETE /api/v1/users/{id}) */}
      {/* ========================================================= */}
      {isDeleteAccountOpen && selectedAccountForAction && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-extrabold text-base text-slate-900">
                Xóa tài khoản {selectedAccountForAction.username}?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản{" "}
              <strong>
                {selectedAccountForAction.fullName ||
                  selectedAccountForAction.username}
              </strong>{" "}
              ({selectedAccountForAction.username}) khỏi hệ thống?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-colors cursor-pointer"
              >
                Xóa ngay
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteAccountOpen(false)}
                className="py-2.5 px-4 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
