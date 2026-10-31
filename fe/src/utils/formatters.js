import { DISH_STATUS, TABLE_STATUS } from '../data/mockData';

export function formatCurrency(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function getCurrentTimeStr() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Tính toán thông tin tổng hợp của một đơn hàng / lần gọi món
 * Tuân thủ chặt chẽ quy tắc nghiệp vụ:
 * - Chỉ khi tất cả món trong lần gọi đã chuyển sang trạng thái Đã phục vụ lên bàn (SERVED)
 *   thì lần gọi đó mới có trạng thái "Đã xong".
 * - Món đã nấu xong (DONE) nhưng chưa được mang ra bàn không được tính là đã hoàn thành lần gọi.
 * - Nếu có món bị hủy (CANCELLED), vẫn hiển thị món đó với trạng thái Đã hủy;
 *   không tự xem món bị hủy là đã phục vụ.
 */
export function getOrderSummary(order) {
  if (!order || !Array.isArray(order.items)) {
    return {
      totalDishes: 0,
      totalQuantity: 0,
      counts: {
        [DISH_STATUS.PENDING]: 0,
        [DISH_STATUS.COOKING]: 0,
        [DISH_STATUS.DONE]: 0,
        [DISH_STATUS.SERVED]: 0,
        [DISH_STATUS.CANCELLED]: 0,
      },
      isCompleted: false,
      overallStatusLabel: 'Chưa có món',
      progressPercent: 0,
      remainingToServeCount: 0,
      readyToServeCount: 0,
      subtotal: 0,
    };
  }

  const counts = {
    [DISH_STATUS.PENDING]: 0,
    [DISH_STATUS.COOKING]: 0,
    [DISH_STATUS.DONE]: 0,
    [DISH_STATUS.SERVED]: 0,
    [DISH_STATUS.CANCELLED]: 0,
  };

  let totalQuantity = 0;
  let subtotal = 0;

  order.items.forEach((item) => {
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
    if (item.status !== DISH_STATUS.CANCELLED) {
      totalQuantity += item.quantity;
      subtotal += item.price * item.quantity;
    }
  });

  const totalDishes = order.items.length;
  const activeDishes = totalDishes - counts[DISH_STATUS.CANCELLED];
  const servedDishes = counts[DISH_STATUS.SERVED];
  const readyToServeCount = counts[DISH_STATUS.DONE];
  const remainingToServeCount =
    counts[DISH_STATUS.PENDING] + counts[DISH_STATUS.COOKING] + counts[DISH_STATUS.DONE];

  // Khi không còn món nào đang chờ nấu, đang nấu hoặc chờ mang ra (remainingToServeCount === 0)
  // thì lần gọi món đó đã được phục vụ xác nhận hoàn thành.
  const isCompleted = totalDishes > 0 && remainingToServeCount === 0;

  const progressPercent =
    activeDishes > 0 ? Math.round((servedDishes / activeDishes) * 100) : 100;

  const overallStatusLabel = isCompleted ? 'Đã xong' : 'Đang phục vụ';

  return {
    totalDishes,
    totalQuantity,
    counts,
    isCompleted,
    overallStatusLabel,
    progressPercent,
    remainingToServeCount,
    readyToServeCount,
    subtotal,
  };
}

/**
 * Suy diễn trạng thái bàn trực quan từ đơn hàng đang mở của bàn:
 * - AVAILABLE: Bàn trống (không có đơn đang mở)
 * - READY_TO_SERVE: Bàn có ít nhất 1 món Đã nấu xong (DONE) cần mang ra bàn ("Chờ mang món")
 * - OCCUPIED: Bàn đang có khách (có đơn đang mở nhưng không có món DONE đang chờ mang ra)
 */
export function getDerivedTableInfo(table, orders) {
  const activeOrder = table.activeOrderId
    ? orders.find((o) => o.id === table.activeOrderId) || null
    : null;

  if (!activeOrder) {
    return {
      ...table,
      status: TABLE_STATUS.AVAILABLE,
      statusLabel: 'Trống',
      badgeCount: 0,
      activeOrder: null,
      orderSummary: null,
    };
  }

  const orderSummary = getOrderSummary(activeOrder);

  if (orderSummary.readyToServeCount > 0) {
    return {
      ...table,
      status: TABLE_STATUS.READY_TO_SERVE,
      statusLabel: 'Chờ mang món',
      badgeCount: orderSummary.readyToServeCount,
      activeOrder,
      orderSummary,
    };
  }

  return {
    ...table,
    status: TABLE_STATUS.OCCUPIED,
    statusLabel: 'Có khách',
    badgeCount: orderSummary.remainingToServeCount > 0 ? orderSummary.remainingToServeCount : 0,
    activeOrder,
    orderSummary,
  };
}

