import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  DISH_STATUS,
  INITIAL_ORDERS,
  INITIAL_TABLES,
  MENU_ITEMS,
  MOCK_USERS,
} from '../data/mockData';
import { getCurrentTimeStr, getDerivedTableInfo } from '../utils/formatters';

const RomsContext = createContext(null);

export function RomsProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [menuItems, setMenuItems] = useState(MENU_ITEMS);
  const [selectedTableId, setSelectedTableId] = useState('T4');
  const [draftCartByTable, setDraftCartByTable] = useState({});
  const [toast, setToast] = useState(null);
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

  // 4. Gửi đơn xuống bếp (Hỗ trợ cả 2 trường hợp: Tạo lần gọi đầu tiên & Gọi thêm món vào lần gọi đang mở)
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
      let resultOrder = null;
      let isAddingToExisting = false;

      if (targetTable.activeOrderId) {
        // Trường hợp 2: Gọi thêm món vào lần gọi đang mở
        isAddingToExisting = true;
        const existingOrder = orders.find((o) => o.id === targetTable.activeOrderId);
        const nextRound = (existingOrder?.roundCount || 1) + 1;

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
        // Trường hợp 1: Tạo lần gọi món đầu tiên cho bàn trống
        const nextOrderNumber = 1046 + orders.length;
        const newOrderId = `ORD-${nextOrderNumber}`;
        const newOrderCode = `#${nextOrderNumber}`;
        const guests = guestCountInput || 2;

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
          image: c.image,
        }));

        const newOrder = {
          id: newOrderId,
          code: newOrderCode,
          tableId: targetTable.id,
          tableName: targetTable.name,
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

        setOrders((prev) => [newOrder, ...prev]);
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? { ...t, activeOrderId: newOrderId, guests }
              : t
          )
        );
      }

      // Xóa giỏ tạm sau khi gửi xuống bếp
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
    [draftCartByTable, tables, orders, showToast]
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
            if (item.id !== itemId) return item;
            dishName = item.name;
            return {
              ...item,
              status: DISH_STATUS.SERVED,
              updatedAt: nowStr,
            };
          });

          const allServed =
            updatedItems.length > 0 &&
            updatedItems.every((i) => i.status === DISH_STATUS.SERVED);

          return {
            ...order,
            servedAt: allServed ? nowStr : order.servedAt,
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

  // 6. Thao tác trên màn hình Theo dõi món: Hủy món đang chờ chế biến (PENDING -> CANCELLED)
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

  // Hỗ trợ mô phỏng tiến độ bếp ngay trên giao diện để dễ dàng kiểm thử toàn bộ luồng
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
        showToast(`[Mô phỏng Bếp] "${dishName}" → ${statusText}`, 'info');
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

  // Bật/tắt trạng thái còn hàng/hết hàng của món (hỗ trợ demo trực quan)
  const toggleDishAvailability = useCallback((dishId) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === dishId ? { ...item, available: !item.available } : item
      )
    );
  }, []);

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
      simulateKitchenStep,
      requestPayment,
      toggleDishAvailability,
      resetDemoData,
      toast,
      showToast,
      dismissToast,
      notifications,
      markAllNotificationsRead,
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
      simulateKitchenStep,
      requestPayment,
      toggleDishAvailability,
      resetDemoData,
      toast,
      showToast,
      dismissToast,
      notifications,
      markAllNotificationsRead,
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

