import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { DISH_STATUS } from '../utils/constants';
import { getCurrentTimeStr, getDerivedTableInfo } from '../utils/formatters';

const RomsContext = createContext(null);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const SESSION_TOKEN_KEY = 'roms_access_token';
const SESSION_USER_KEY = 'roms_current_user';

const DEFAULT_DISH_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

function formatInstantToHHMM(isoStr) {
  if (!isoStr) return getCurrentTimeStr();
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

function getRoleDisplay(role) {
  switch (role) {
    case 'KITCHEN':
      return 'Nhà bếp';
    case 'WAITER':
      return 'Phục vụ';
    case 'CASHIER':
      return 'Thu ngân';
    case 'ADMIN':
      return 'Quản trị';
    default:
      return role || 'Nhân viên';
  }
}

function mapUserView(userDto) {
  if (!userDto) return null;
  const username = userDto.username || '';
  return {
    id: String(userDto.id),
    username,
    role: userDto.role,
    roleDisplay: getRoleDisplay(userDto.role),
    avatarInitial: (username[0] || 'U').toUpperCase(),
    active: Boolean(userDto.active),
  };
}

function formatShortOrderCode(orderId) {
  if (!orderId) return '#0000';
  const clean = String(orderId).replace(/-/g, '').toUpperCase();
  return `#${clean.slice(0, 4)}`;
}

function formatTableShortCode(name) {
  if (!name) return '';
  const trimmed = String(name).trim();
  const withoutPrefix = trimmed.replace(/^bàn\s+/i, '');
  return withoutPrefix || trimmed;
}

export function RomsProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    () => sessionStorage.getItem(SESSION_TOKEN_KEY) || ''
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [rawTables, setRawTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([{ id: 'ALL', name: 'Tất cả' }]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [draftCartByTable, setDraftCartByTable] = useState({});
  const [toast, setToast] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(() => getCurrentTimeStr());
  const [notifications, setNotifications] = useState([]);

  const menuMapRef = useRef(new Map());
  useEffect(() => {
    const map = new Map();
    menuItems.forEach((m) => map.set(String(m.id), m));
    menuMapRef.current = map;
  }, [menuItems]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 3200 ? null : prev));
    }, 3400);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // Hàm gọi API chuẩn có đính kèm JWT Bearer Token
  const apiFetch = useCallback(
    async (path, options = {}, tokenOverride = null) => {
      const token = tokenOverride ?? accessToken;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });

      if (response.status === 204) {
        return null;
      }

      let data = null;
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!response.ok) {
        const errMessage =
          data?.message ||
          data?.detail ||
          data?.error ||
          `Lỗi kết nối API (${response.status})`;
        const error = new Error(errMessage);
        error.status = response.status;
        throw error;
      }

      return data;
    },
    [accessToken]
  );

  // Chuyển đổi OrderResponse từ Backend sang cấu trúc Order của Frontend
  const mapOrderFromApi = useCallback((orderDto, index = 0) => {
    if (!orderDto) return null;
    const submittedTimeMs = orderDto.submittedAt
      ? new Date(orderDto.submittedAt).getTime()
      : orderDto.createdAt
      ? new Date(orderDto.createdAt).getTime()
      : Date.now() + index;

    const mappedItems = (orderDto.items || []).map((itemDto) => {
      const matchedDish = menuMapRef.current.get(String(itemDto.menuItemId));
      const itemCreatedMs = itemDto.createdAt
        ? new Date(itemDto.createdAt).getTime()
        : submittedTimeMs;

      return {
        id: String(itemDto.id),
        dishId: String(itemDto.menuItemId),
        name: itemDto.name,
        price: Number(itemDto.unitPriceVnd) || 0,
        quantity: Number(itemDto.quantity) || 1,
        note: itemDto.note || '',
        status: itemDto.status || DISH_STATUS.PENDING,
        orderedAt: formatInstantToHHMM(
          itemDto.createdAt || orderDto.submittedAt || orderDto.createdAt
        ),
        updatedAt: formatInstantToHHMM(itemDto.createdAt || orderDto.submittedAt),
        round: Number(itemDto.round) || 1,
        roundFifo: itemCreatedMs,
        image: matchedDish?.image || DEFAULT_DISH_IMAGE,
      };
    });

    return {
      id: String(orderDto.id),
      code: formatShortOrderCode(orderDto.id),
      tableId: String(orderDto.tableId),
      tableName: orderDto.tableName || 'Bàn',
      status: orderDto.status,
      priority: index % 2 === 0 ? 'PRIORITY' : 'NORMAL',
      fifoOrder: submittedTimeMs,
      guests: 2,
      createdAt: formatInstantToHHMM(orderDto.submittedAt || orderDto.createdAt),
      paymentRequested: orderDto.status === 'PAYMENT_REQUESTED',
      roundCount: Number(orderDto.roundCount) || 1,
      items: mappedItems,
    };
  }, []);

  // Tải đồng bộ dữ liệu từ Backend theo vai trò tài khoản hiện tại
  const refreshData = useCallback(
    async (tokenOverride = null, userOverride = null) => {
      const token = tokenOverride ?? accessToken;
      const user = userOverride ?? currentUser;
      if (!token || !user) return;

      try {
        // 1. Lấy Danh mục & Thực đơn (cả WAITER, KITCHEN, ADMIN đều có quyền)
        const [catsDto, itemsDto] = await Promise.all([
          apiFetch('/categories', { method: 'GET' }, token),
          apiFetch('/menu-items', { method: 'GET' }, token),
        ]);

        const mappedCategories = [
          { id: 'ALL', name: 'Tất cả' },
          ...(catsDto || []).map((c) => ({
            id: String(c.id),
            name: c.name,
          })),
        ];
        setCategories(mappedCategories);

        const mappedMenu = (itemsDto || []).map((item) => ({
          id: String(item.id),
          categoryId: String(item.categoryId),
          categoryName: item.categoryName || '',
          name: item.name,
          description: item.description || '',
          price: Number(item.priceVnd) || 0,
          image: item.imageUrl || DEFAULT_DISH_IMAGE,
          available: Boolean(item.available),
        }));
        setMenuItems(mappedMenu);

        const localMenuMap = new Map();
        mappedMenu.forEach((m) => localMenuMap.set(String(m.id), m));
        menuMapRef.current = localMenuMap;

        // 2. Nếu là WAITER, CASHIER hoặc ADMIN: Lấy danh sách bàn & danh sách đơn đang hoạt động
        if (user.role === 'WAITER' || user.role === 'CASHIER' || user.role === 'ADMIN') {
          const [tablesDto, activeOrdersDto] = await Promise.all([
            apiFetch('/tables', { method: 'GET' }, token),
            apiFetch('/orders/active', { method: 'GET' }, token),
          ]);

          const mappedOrders = (activeOrdersDto || []).map((o, idx) =>
            mapOrderFromApi(o, idx)
          );
          setOrders(mappedOrders);

          const mappedTables = (tablesDto || []).map((t) => {
            const tId = String(t.id);
            const openOrder = mappedOrders.find((o) => o.tableId === tId);
            return {
              id: tId,
              code: formatTableShortCode(t.name),
              name: t.name,
              capacity: Number(t.capacity) || 4,
              guests: Number(t.capacity) || 2,
              status: t.status,
              activeOrderId: openOrder ? openOrder.id : null,
            };
          });
          setRawTables(mappedTables);
          setSelectedTableId((prev) =>
            prev && mappedTables.some((t) => t.id === prev)
              ? prev
              : mappedTables[0]?.id || ''
          );
        }

        // 3. Nếu là KITCHEN: Lấy hàng đợi đơn của Nhà Bếp (/api/v1/kitchen/queue)
        if (user.role === 'KITCHEN') {
          const queueDto = await apiFetch(
            '/kitchen/queue',
            { method: 'GET' },
            token
          );
          const mappedQueue = (queueDto || []).map((o, idx) =>
            mapOrderFromApi(o, idx)
          );
          setOrders(mappedQueue);
        }

        setLastSyncTime(getCurrentTimeStr());
      } catch (err) {
        if (err.status === 401) {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
          sessionStorage.removeItem(SESSION_USER_KEY);
          setAccessToken('');
          setCurrentUser(null);
        }
      }
    },
    [accessToken, currentUser, apiFetch, mapOrderFromApi]
  );

  // Tự động tải dữ liệu khi đã đăng nhập và đồng bộ định kỳ mỗi 3 giây
  useEffect(() => {
    if (!accessToken || !currentUser) return;
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 3000);
    return () => clearInterval(interval);
  }, [accessToken, currentUser, refreshData]);

  // 1. Đăng nhập qua API POST /api/v1/auth/login & GET /api/v1/auth/me
  const login = useCallback(
    async (username, password) => {
      const trimmedUsername = (username || '').trim();
      const rawPassword = password || '';

      if (!trimmedUsername && !rawPassword) {
        return {
          ok: false,
          error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.',
        };
      }
      if (!trimmedUsername) {
        return {
          ok: false,
          error: 'Vui lòng nhập tên đăng nhập của nhân viên.',
        };
      }
      if (!rawPassword) {
        return {
          ok: false,
          error: 'Vui lòng nhập mật khẩu.',
        };
      }

      try {
        const tokenRes = await apiFetch(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({
              username: trimmedUsername,
              password: rawPassword,
            }),
          },
          ''
        );

        const token = tokenRes?.accessToken;
        if (!token) {
          return {
            ok: false,
            error: 'Không nhận được token xác thực từ máy chủ.',
          };
        }

        const meDto = await apiFetch('/auth/me', { method: 'GET' }, token);
        const mappedUser = mapUserView(meDto);

        sessionStorage.setItem(SESSION_TOKEN_KEY, token);
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(mappedUser));
        setAccessToken(token);
        setCurrentUser(mappedUser);

        await refreshData(token, mappedUser);

        showToast(
          `Xin chào, ${mappedUser.username}! Chúc bạn ca làm việc hiệu quả.`
        );
        return { ok: true, user: mappedUser };
      } catch (err) {
        const msg =
          err.status === 401
            ? 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
            : err.message || 'Không thể kết nối tới máy chủ Backend.';
        return {
          ok: false,
          error: msg,
        };
      }
    },
    [apiFetch, refreshData, showToast]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setAccessToken('');
    setCurrentUser(null);
    setRawTables([]);
    setOrders([]);
    setDraftCartByTable({});
    showToast('Đã đăng xuất khỏi hệ thống ROMS.', 'info');
  }, [showToast]);

  // 2. Danh sách bàn kèm trạng thái suy diễn tự động
  const enrichedTables = useMemo(() => {
    return rawTables.map((table) => getDerivedTableInfo(table, orders));
  }, [rawTables, orders]);

  const selectedTable = useMemo(() => {
    return (
      enrichedTables.find((t) => t.id === selectedTableId) ||
      enrichedTables[0] ||
      null
    );
  }, [enrichedTables, selectedTableId]);

  // 3. Quản lý giỏ chọn món tạm thời theo từng bàn
  const getCartForTable = useCallback(
    (tableId) => {
      return draftCartByTable[tableId] || [];
    },
    [draftCartByTable]
  );

  const addToCart = useCallback((tableId, dish) => {
    if (!dish.available) return;
    setDraftCartByTable((prev) => {
      const currentList = prev[tableId] || [];
      const existingIndex = currentList.findIndex(
        (item) => item.dishId === dish.id
      );
      if (existingIndex > -1) {
        const updated = [...currentList];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return { ...prev, [tableId]: updated };
      }
      return {
        ...prev,
        [tableId]: [
          ...currentList,
          {
            dishId: dish.id,
            name: dish.name,
            price: dish.price,
            image: dish.image,
            quantity: 1,
            note: '',
          },
        ],
      };
    });
  }, []);

  const updateCartQuantity = useCallback((tableId, dishId, delta) => {
    setDraftCartByTable((prev) => {
      const currentList = prev[tableId] || [];
      const updated = currentList
        .map((item) => {
          if (item.dishId !== dishId) return item;
          return { ...item, quantity: item.quantity + delta };
        })
        .filter((item) => item.quantity > 0);
      return { ...prev, [tableId]: updated };
    });
  }, []);

  const updateCartNote = useCallback((tableId, dishId, note) => {
    setDraftCartByTable((prev) => {
      const currentList = prev[tableId] || [];
      const updated = currentList.map((item) =>
        item.dishId === dishId ? { ...item, note } : item
      );
      return { ...prev, [tableId]: updated };
    });
  }, []);

  const removeFromCart = useCallback((tableId, dishId) => {
    setDraftCartByTable((prev) => {
      const currentList = prev[tableId] || [];
      return {
        ...prev,
        [tableId]: currentList.filter((item) => item.dishId !== dishId),
      };
    });
  }, []);

  const clearCart = useCallback((tableId) => {
    setDraftCartByTable((prev) => ({
      ...prev,
      [tableId]: [],
    }));
  }, []);

  // 4. Gửi đơn xuống bếp qua API POST /api/v1/orders hoặc POST /api/v1/orders/{id}/items
  const submitCartToKitchen = useCallback(
    async (tableId, guestCountInput) => {
      const cartItems = draftCartByTable[tableId] || [];
      if (cartItems.length === 0) {
        showToast(
          'Vui lòng chọn ít nhất 1 món trước khi gửi xuống bếp.',
          'error'
        );
        return null;
      }

      const targetTable = rawTables.find((t) => t.id === tableId);
      if (!targetTable) return null;

      const itemsPayload = cartItems.map((c) => ({
        menuItemId: c.dishId,
        quantity: c.quantity,
        note: (c.note || '').trim() || null,
      }));

      try {
        const isAddingToExisting = Boolean(targetTable.activeOrderId);
        let orderDto = null;

        if (isAddingToExisting) {
          orderDto = await apiFetch(
            `/orders/${targetTable.activeOrderId}/items`,
            {
              method: 'POST',
              body: JSON.stringify({ items: itemsPayload }),
            }
          );
        } else {
          orderDto = await apiFetch('/orders', {
            method: 'POST',
            body: JSON.stringify({
              tableId: targetTable.id,
              items: itemsPayload,
            }),
          });
        }

        const mappedOrder = mapOrderFromApi(orderDto);
        if (guestCountInput) {
          mappedOrder.guests = guestCountInput;
        }

        setDraftCartByTable((prev) => ({
          ...prev,
          [tableId]: [],
        }));
        setSelectedTableId(tableId);

        await refreshData();

        const totalNewQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
        const nowStr = getCurrentTimeStr();
        const actionMsg = isAddingToExisting
          ? `Đã gửi thêm ${totalNewQty} món của ${targetTable.name} xuống bếp!`
          : `Đã tạo đơn mới và gửi ${totalNewQty} món của ${targetTable.name} xuống bếp!`;

        showToast(actionMsg, 'success');

        setNotifications((prev) => [
          {
            id: `notif-${Date.now()}`,
            title: isAddingToExisting
              ? `Gọi thêm món - ${targetTable.name}`
              : `Đơn hàng mới - ${targetTable.name}`,
            message: `Đã chuyển ${totalNewQty} món xuống bếp lúc ${nowStr}.`,
            time: nowStr,
            tableId,
            unread: true,
          },
          ...prev,
        ]);

        return {
          ok: true,
          isAddingToExisting,
          order: mappedOrder,
          addedCount: totalNewQty,
        };
      } catch (err) {
        showToast(err.message || 'Không thể gửi đơn xuống bếp.', 'error');
        return null;
      }
    },
    [draftCartByTable, rawTables, apiFetch, mapOrderFromApi, refreshData, showToast]
  );

  // 5. Xác nhận đã phục vụ: POST /api/v1/order-items/{id}/serve
  const markDishServed = useCallback(
    async (orderId, itemId) => {
      try {
        await apiFetch(`/order-items/${itemId}/serve`, { method: 'POST' });
        await refreshData();
        showToast('Đã xác nhận phục vụ món lên bàn.', 'success');
      } catch (err) {
        showToast(err.message || 'Không thể xác nhận phục vụ món.', 'error');
      }
    },
    [apiFetch, refreshData, showToast]
  );

  // 6. Hủy món đang chờ nấu: POST /api/v1/order-items/{id}/cancel
  const cancelDish = useCallback(
    async (orderId, itemId) => {
      try {
        await apiFetch(`/order-items/${itemId}/cancel`, { method: 'POST' });
        await refreshData();
        showToast('Đã hủy món thành công.', 'info');
      } catch (err) {
        showToast(err.message || 'Không thể hủy món.', 'error');
      }
    },
    [apiFetch, refreshData, showToast]
  );

  // 7. FR-K02: Chuyển trạng thái món 1 chạm tại Nhà Bếp:
  // PENDING -> POST /kitchen/order-items/{id}/start -> COOKING
  // COOKING -> POST /kitchen/order-items/{id}/done  -> DONE
  const advanceDishKitchenStatus = useCallback(
    async (orderId, itemId) => {
      const targetOrder = orders.find((o) => o.id === String(orderId));
      const targetItem = targetOrder?.items?.find(
        (i) => i.id === String(itemId)
      );
      if (!targetItem) return;

      try {
        if (targetItem.status === DISH_STATUS.PENDING) {
          await apiFetch(`/kitchen/order-items/${itemId}/start`, {
            method: 'POST',
          });
          await refreshData();
          showToast(
            `${targetOrder.tableName}: "${targetItem.name}" → Đang nấu`,
            'success'
          );
        } else if (targetItem.status === DISH_STATUS.COOKING) {
          await apiFetch(`/kitchen/order-items/${itemId}/done`, {
            method: 'POST',
          });
          await refreshData();
          showToast(
            `${targetOrder.tableName}: "${targetItem.name}" → Đã xong`,
            'success'
          );
        }
      } catch (err) {
        showToast(
          err.message || 'Không thể cập nhật trạng thái món.',
          'error'
        );
      }
    },
    [orders, apiFetch, refreshData, showToast]
  );

  // 8. Gửi yêu cầu thanh toán: POST /api/v1/orders/{id}/request-payment
  const requestPayment = useCallback(
    async (orderId) => {
      try {
        await apiFetch(`/orders/${orderId}/request-payment`, {
          method: 'POST',
        });
        await refreshData();
        showToast('Đã gửi yêu cầu thanh toán đến thu ngân!', 'success');
        return { ok: true };
      } catch (err) {
        showToast(
          err.message ||
            'Chỉ đơn hàng đã phục vụ hết món mới có thể yêu cầu thanh toán.',
          'error'
        );
        return { ok: false, error: err.message };
      }
    },
    [apiFetch, refreshData, showToast]
  );

  // 9. FR-K03: Khóa món (Out of stock): PATCH /api/v1/menu-items/{id}/availability
  const toggleDishAvailability = useCallback(
    async (dishId) => {
      const targetDish = menuItems.find((m) => m.id === String(dishId));
      if (!targetDish) return;
      const nextAvailable = !targetDish.available;

      try {
        await apiFetch(`/menu-items/${dishId}/availability`, {
          method: 'PATCH',
          body: JSON.stringify({ available: nextAvailable }),
        });
        await refreshData();
        showToast(
          nextAvailable
            ? `Đã mở bán lại món "${targetDish.name}".`
            : `Đã báo hết hàng món "${targetDish.name}".`,
          nextAvailable ? 'success' : 'info'
        );
      } catch (err) {
        showToast(
          err.message || 'Không thể cập nhật trạng thái món ăn.',
          'error'
        );
      }
    },
    [menuItems, apiFetch, refreshData, showToast]
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      login,
      logout,
      tables: enrichedTables,
      orders,
      categories,
      menuItems,
      selectedTableId,
      setSelectedTableId,
      selectedTable,
      getCartForTable,
      addToCart,
      updateCartQuantity,
      updateCartNote,
      removeFromCart,
      clearCart,
      submitCartToKitchen,
      markDishServed,
      cancelDish,
      advanceDishKitchenStatus,
      requestPayment,
      toggleDishAvailability,
      refreshData,
      toast,
      showToast,
      dismissToast,
      notifications,
      markAllNotificationsRead,
      lastSyncTime,
      apiFetch,
    }),
    [
      currentUser,
      login,
      logout,
      enrichedTables,
      orders,
      categories,
      menuItems,
      selectedTableId,
      selectedTable,
      getCartForTable,
      addToCart,
      updateCartQuantity,
      updateCartNote,
      removeFromCart,
      clearCart,
      submitCartToKitchen,
      markDishServed,
      cancelDish,
      advanceDishKitchenStatus,
      requestPayment,
      toggleDishAvailability,
      refreshData,
      toast,
      showToast,
      dismissToast,
      notifications,
      markAllNotificationsRead,
      lastSyncTime,
      apiFetch,
    ]
  );

  return <RomsContext.Provider value={value}>{children}</RomsContext.Provider>;
}

export function useRoms() {
  const context = useContext(RomsContext);
  if (!context) {
    throw new Error('useRoms must be used within a RomsProvider');
  }
  return context;
}
