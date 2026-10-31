import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import {
  DISH_STATUS,
  INITIAL_ORDERS,
  INITIAL_TABLES,
  MENU_ITEMS,
  MOCK_USERS,
} from '../data/mockData';
import { getCurrentTimeStr, getDerivedTableInfo } from '../utils/formatters';

const RomsContext = createContext(null);

const STORAGE_KEYS = {
  TABLES: 'roms_tables_v2',
  ORDERS: 'roms_orders_v2',
  MENU: 'roms_menu_v2',
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function RomsProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [tables, setTables] = useState(() =>
    loadFromStorage(STORAGE_KEYS.TABLES, INITIAL_TABLES)
  );
  const [orders, setOrders] = useState(() =>
    loadFromStorage(STORAGE_KEYS.ORDERS, INITIAL_ORDERS)
  );
  const [menuItems, setMenuItems] = useState(() =>
    loadFromStorage(STORAGE_KEYS.MENU, MENU_ITEMS)
  );
  const [selectedTableId, setSelectedTableId] = useState('T4');
  const [draftCartByTable, setDraftCartByTable] = useState({});
  const [toast, setToast] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(() => getCurrentTimeStr());
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Bàn T4 có món đã nấu xong',
      message: 'Súp hải sản (SL: 1) đã sẵn sàng tại quầy bếp.',
      time: '14:38',
      tableId: 'T4',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Bàn T8 đã phục vụ đủ món',
      message: 'Tất cả 3 món của Đơn #1045 đã phục vụ lên bàn.',
      time: '14:08',
      tableId: 'T8',
      unread: false,
    },
  ]);

  // Lưu và đồng bộ realtime giữa các tab trình duyệt (Phục vụ <-> Nhà Bếp)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    } catch {
      // ignore
    }
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      setLastSyncTime(getCurrentTimeStr());
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
      setLastSyncTime(getCurrentTimeStr());
    } catch {
      // ignore
    }
  }, [menuItems]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.TABLES && e.newValue) {
        try {
          setTables(JSON.parse(e.newValue));
          setLastSyncTime(getCurrentTimeStr());
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEYS.ORDERS && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
          setLastSyncTime(getCurrentTimeStr());
        } catch {
          // ignore
        }
      } else if (e.key === STORAGE_KEYS.MENU && e.newValue) {
        try {
          setMenuItems(JSON.parse(e.newValue));
          setLastSyncTime(getCurrentTimeStr());
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((prev) => (prev && Date.now() - prev.id >= 3200 ? null : prev));
    }, 3400);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // 1. Đăng nhập mô phỏng
  const login = useCallback(
    (username, password) => {
      const trimmedUsername = (username || '').trim().toLowerCase();
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

      const found = MOCK_USERS.find(
        (u) => u.username.toLowerCase() === trimmedUsername && u.password === rawPassword
      );

      if (!found) {
        return {
          ok: false,
          error: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.',
        };
      }

      setCurrentUser(found);
      showToast(`Xin chào, ${found.fullName}! Chúc bạn ca làm việc hiệu quả.`);
      return { ok: true, user: found };
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    showToast('Đã đăng xuất khỏi hệ thống ROMS.', 'info');
  }, [showToast]);

  // 2. Danh sách bàn kèm trạng thái suy diễn tự động
  const enrichedTables = useMemo(() => {
    return tables.map((table) => getDerivedTableInfo(table, orders));
  }, [tables, orders]);

  const selectedTable = useMemo(() => {
    return enrichedTables.find((t) => t.id === selectedTableId) || enrichedTables[0] || null;
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
      const existingIndex = currentList.findIndex((item) => item.dishId === dish.id);
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

  // 4. Gửi đơn xuống bếp (FR-K01: Tự động đưa vào hàng đợi FIFO "Vào trước - Làm trước")
  const submitCartToKitchen = useCallback(
    (tableId, guestCountInput) => {
      const cartItems = draftCartByTable[tableId] || [];
      if (cartItems.length === 0) {
        showToast('Vui lòng chọn ít nhất 1 món trước khi gửi xuống bếp.', 'error');
        return null;
      }

      const targetTable = tables.find((t) => t.id === tableId);
      if (!targetTable) return null;

      const nowStr = getCurrentTimeStr();
      const shortWaiterName =
        currentUser?.fullName?.trim().split(/\s+/).pop() || 'An';
      let resultOrder = null;
      let isAddingToExisting = false;

      if (targetTable.activeOrderId) {
        isAddingToExisting = true;
        const existingOrder = orders.find((o) => o.id === targetTable.activeOrderId);
        const nextRound = (existingOrder?.roundCount || 1) + 1;
        const roundFifo = Date.now();

        const newOrderItems = cartItems.map((c, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          dishId: c.dishId,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          note: (c.note || '').trim(),
          status: DISH_STATUS.PENDING,
          orderedAt: nowStr,
          updatedAt: nowStr,
          round: nextRound,
          roundFifo,
          image: c.image,
        }));

        setOrders((prev) =>
          prev.map((order) => {
            if (order.id !== targetTable.activeOrderId) return order;
            const updatedOrder = {
              ...order,
              guests: guestCountInput || order.guests || 2,
              roundCount: nextRound,
              servedAt: null,
              paymentRequested: false,
              items: [...order.items, ...newOrderItems],
            };
            resultOrder = updatedOrder;
            return updatedOrder;
          })
        );

        if (guestCountInput) {
          setTables((prev) =>
            prev.map((t) => (t.id === tableId ? { ...t, guests: guestCountInput } : t))
          );
        }
      } else {
        const nextOrderNumber = 1046 + orders.length;
        const newOrderId = `ORD-${nextOrderNumber}`;
        const newOrderCode = `#${nextOrderNumber}`;
        const guests = guestCountInput || 2;
        const roundFifo = Date.now();

        const newOrderItems = cartItems.map((c, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          dishId: c.dishId,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          note: (c.note || '').trim(),
          status: DISH_STATUS.PENDING,
          orderedAt: nowStr,
          updatedAt: nowStr,
          round: 1,
          roundFifo,
          image: c.image,
        }));

        const newOrder = {
          id: newOrderId,
          code: newOrderCode,
          tableId: targetTable.id,
          tableName: targetTable.name,
          waiterName: shortWaiterName,
          priority: 'NORMAL',
          fifoOrder: roundFifo,
          guests,
          createdAt: nowStr,
          cookingStartedAt: null,
          cookedAt: null,
          servedAt: null,
          paymentRequested: false,
          paymentRequestedAt: null,
          roundCount: 1,
          items: newOrderItems,
        };

        resultOrder = newOrder;

        setOrders((prev) => [...prev, newOrder]);
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? { ...t, activeOrderId: newOrderId, guests }
              : t
          )
        );
      }

      setDraftCartByTable((prev) => ({
        ...prev,
        [tableId]: [],
      }));

      setSelectedTableId(tableId);

      const totalNewQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
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
        order: resultOrder,
        addedCount: totalNewQty,
      };
    },
    [draftCartByTable, tables, orders, currentUser, showToast]
  );

  // 5. Thao tác trên màn hình Theo dõi món: Xác nhận đã phục vụ (DONE -> SERVED)
  const markDishServed = useCallback(
    (orderId, itemId) => {
      const nowStr = getCurrentTimeStr();
      let dishName = '';
      let tableName = '';

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          tableName = order.tableName;
          const updatedItems = order.items.map((item) => {
            if (item.id !== itemId || item.status !== DISH_STATUS.DONE) return item;
            dishName = item.name;
            return {
              ...item,
              status: DISH_STATUS.SERVED,
              updatedAt: nowStr,
            };
          });

          const allDone =
            updatedItems.length > 0 &&
            updatedItems.every(
              (i) =>
                i.status === DISH_STATUS.SERVED ||
                i.status === DISH_STATUS.CANCELLED
            );

          return {
            ...order,
            servedAt: allDone ? nowStr : order.servedAt,
            items: updatedItems,
          };
        })
      );

      if (dishName) {
        showToast(`Đã xác nhận phục vụ món "${dishName}" cho ${tableName}.`, 'success');
      }
    },
    [showToast]
  );

  // 6. Thao tác hủy món đang chờ chế biến (PENDING -> CANCELLED)
  const cancelDish = useCallback(
    (orderId, itemId) => {
      const nowStr = getCurrentTimeStr();
      let dishName = '';
      let tableName = '';

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          tableName = order.tableName;
          const updatedItems = order.items.map((item) => {
            if (item.id !== itemId || item.status !== DISH_STATUS.PENDING) return item;
            dishName = item.name;
            return {
              ...item,
              status: DISH_STATUS.CANCELLED,
              updatedAt: nowStr,
            };
          });
          return {
            ...order,
            items: updatedItems,
          };
        })
      );

      if (dishName) {
        showToast(`Đã hủy món "${dishName}" (${tableName}).`, 'info');
      }
    },
    [showToast]
  );

  // FR-K02: Nút bấm 1 chạm (1-touch) cho Nhà Bếp chuyển trạng thái món:
  // PENDING (Chờ nấu) -> COOKING (Đang nấu) -> DONE (Đã xong)
  const advanceDishKitchenStatus = useCallback(
    (orderId, itemId) => {
      const nowStr = getCurrentTimeStr();
      let dishName = '';
      let tableName = '';
      let nextStatus = null;

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          tableName = order.tableName;
          const updatedItems = order.items.map((item) => {
            if (item.id !== itemId) return item;
            if (item.status === DISH_STATUS.PENDING) {
              nextStatus = DISH_STATUS.COOKING;
            } else if (item.status === DISH_STATUS.COOKING) {
              nextStatus = DISH_STATUS.DONE;
            } else {
              return item;
            }
            dishName = item.name;
            return {
              ...item,
              status: nextStatus,
              updatedAt: nowStr,
            };
          });

          if (!nextStatus) return order;

          return {
            ...order,
            cookingStartedAt:
              nextStatus === DISH_STATUS.COOKING && !order.cookingStartedAt
                ? nowStr
                : order.cookingStartedAt,
            cookedAt:
              nextStatus === DISH_STATUS.DONE ? nowStr : order.cookedAt,
            items: updatedItems,
          };
        })
      );

      if (dishName && nextStatus) {
        const statusText =
          nextStatus === DISH_STATUS.COOKING ? 'Đang nấu' : 'Đã xong';
        showToast(`${tableName}: "${dishName}" → ${statusText}`, 'success');
      }
    },
    [showToast]
  );

  const simulateKitchenStep = useCallback(
    (orderId, itemId, targetStatus) => {
      const nowStr = getCurrentTimeStr();
      let dishName = '';
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          const updatedItems = order.items.map((item) => {
            if (item.id !== itemId) return item;
            dishName = item.name;
            return {
              ...item,
              status: targetStatus,
              updatedAt: nowStr,
            };
          });
          return {
            ...order,
            cookingStartedAt:
              targetStatus === DISH_STATUS.COOKING && !order.cookingStartedAt
                ? nowStr
                : order.cookingStartedAt,
            cookedAt:
              targetStatus === DISH_STATUS.DONE ? nowStr : order.cookedAt,
            items: updatedItems,
          };
        })
      );

      if (dishName) {
        const statusText =
          targetStatus === DISH_STATUS.COOKING ? 'Đang chế biến' : 'Đã nấu xong';
        showToast(`"${dishName}" → ${statusText}`, 'info');
      }
    },
    [showToast]
  );

  // 7. Gửi yêu cầu thanh toán cho thu ngân
  const requestPayment = useCallback(
    (orderId) => {
      const nowStr = getCurrentTimeStr();
      let targetTableName = '';

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          targetTableName = order.tableName;
          return {
            ...order,
            paymentRequested: true,
            paymentRequestedAt: nowStr,
          };
        })
      );

      if (targetTableName) {
        showToast(`Đã gửi yêu cầu thanh toán của ${targetTableName} đến thu ngân!`, 'success');
      }
    },
    [showToast]
  );

  // FR-K03: Khóa món (Out of stock) - Toggle công tắc Hết hàng / Đang bán đồng bộ tức thời sang Phục vụ
  const toggleDishAvailability = useCallback(
    (dishId) => {
      let targetDishName = '';
      let nextAvailable = true;

      setMenuItems((prev) =>
        prev.map((item) => {
          if (item.id !== dishId) return item;
          targetDishName = item.name;
          nextAvailable = !item.available;
          return { ...item, available: nextAvailable };
        })
      );

      if (targetDishName) {
        showToast(
          nextAvailable
            ? `Đã mở bán lại món "${targetDishName}".`
            : `Đã báo hết hàng món "${targetDishName}" (đã đồng bộ sang Phục vụ).`,
          nextAvailable ? 'success' : 'info'
        );
      }
    },
    [showToast]
  );

  // Khôi phục dữ liệu mẫu ban đầu
  const resetDemoData = useCallback(() => {
    setTables(INITIAL_TABLES);
    setOrders(INITIAL_ORDERS);
    setMenuItems(MENU_ITEMS);
    setDraftCartByTable({});
    setSelectedTableId('T4');
    showToast('Đã khôi phục dữ liệu mẫu ban đầu.', 'info');
  }, [showToast]);

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
      simulateKitchenStep,
      requestPayment,
      toggleDishAvailability,
      resetDemoData,
      toast,
      showToast,
      dismissToast,
      notifications,
      markAllNotificationsRead,
      lastSyncTime,
    }),
    [
      currentUser,
      login,
      logout,
      enrichedTables,
      orders,
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
      simulateKitchenStep,
      requestPayment,
      toggleDishAvailability,
      resetDemoData,
      toast,
      showToast,
      dismissToast,
      notifications,
      markAllNotificationsRead,
      lastSyncTime,
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
