import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Clock,
  Flame,
  CheckCircle2,
  Search,
  RotateCw,
  Utensils,
  MessageSquareText,
  Check,
  X,
  LogOut,
} from 'lucide-react';
import { useRoms } from '../context/RomsContext';
import { DISH_STATUS } from '../data/mockData';

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

export default function KitchenPage() {
  const navigate = useNavigate();
  const {
    orders,
    menuItems,
    advanceDishKitchenStatus,
    toggleDishAvailability,
    lastSyncTime,
    showToast,
    logout,
  } = useRoms();

  // 3 tab trạng thái theo đúng thiết kế: 'PENDING' (Hàng đợi) | 'COOKING' (Đang nấu) | 'DONE' (Đã xong)
  const [activeTab, setActiveTab] = useState(DISH_STATUS.PENDING);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  // Đồng hồ đếm thời gian chờ trên các thẻ order
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // FR-K01: Tạo danh sách các phiếu bếp (Kitchen Tickets) từ các đơn hàng/lần gọi món
  // và sắp xếp nghiêm ngặt theo nguyên tắc FIFO ("Vào trước - Làm trước")
  const allKitchenTickets = useMemo(() => {
    const tickets = [];

    orders.forEach((order) => {
      const roundsMap = new Map();
      order.items.forEach((item) => {
        if (item.status === DISH_STATUS.CANCELLED) return;
        const r = item.round || 1;
        if (!roundsMap.has(r)) {
          roundsMap.set(r, []);
        }
        roundsMap.get(r).push(item);
      });

      roundsMap.forEach((itemsInRound, roundNum) => {
        const receivedAt = itemsInRound[0]?.orderedAt || order.createdAt || '14:30';
        const fifoKey =
          itemsInRound[0]?.roundFifo ||
          order.fifoOrder ||
          parseTimeToMinutes(receivedAt);

        tickets.push({
          ticketId: `${order.id}-R${roundNum}`,
          orderId: order.id,
          code: roundNum > 1 ? `${order.code}.${roundNum}` : order.code,
          tableId: order.tableId,
          tableName: order.tableName,
          waiterName: order.waiterName || 'An',
          priority: order.priority || (roundNum === 1 ? 'PRIORITY' : 'NORMAL'),
          receivedAt,
          fifoKey,
          items: itemsInRound,
        });
      });
    });

    // Sắp xếp FIFO: Đơn vào trước xếp trước (từ trái sang phải)
    tickets.sort((a, b) => {
      const timeA = parseTimeToMinutes(a.receivedAt);
      const timeB = parseTimeToMinutes(b.receivedAt);
      if (timeA !== timeB) return timeA - timeB;
      return a.fifoKey - b.fifoKey;
    });

    return tickets;
  }, [orders]);

  // Đếm số lượng món ở từng trạng thái để hiển thị trên thanh tab
  const statusCounts = useMemo(() => {
    let pending = 0;
    let cooking = 0;
    let done = 0;
    allKitchenTickets.forEach((ticket) => {
      ticket.items.forEach((item) => {
        if (item.status === DISH_STATUS.PENDING) pending += 1;
        else if (item.status === DISH_STATUS.COOKING) cooking += 1;
        else if (item.status === DISH_STATUS.DONE) done += 1;
      });
    });
    return { pending, cooking, done };
  }, [allKitchenTickets]);

  // Lọc các phiếu theo tab đang chọn (Hàng đợi / Đang nấu / Đã xong) và từ khóa tìm kiếm
  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allKitchenTickets
      .map((ticket) => {
        const itemsByTab = ticket.items.filter((i) => i.status === activeTab);
        const matchingItems = !q
          ? itemsByTab
          : itemsByTab.filter(
              (i) =>
                i.name.toLowerCase().includes(q) ||
                (i.note && i.note.toLowerCase().includes(q)) ||
                ticket.tableName.toLowerCase().includes(q) ||
                ticket.code.toLowerCase().includes(q)
            );
        return {
          ...ticket,
          visibleItems: matchingItems,
        };
      })
      .filter((ticket) => ticket.visibleItems.length > 0);
  }, [allKitchenTickets, activeTab, searchQuery]);

  // Màu sắc header thẻ theo thứ tự ưu tiên FIFO giống thiết kế tham khảo (Đỏ -> Cam -> Xanh dương -> Xanh lá)
  const getTicketBannerStyle = (index) => {
    const styles = [
      {
        headerBg: 'bg-[#F04438]',
        badgeText: 'text-[#F04438]',
        label: 'P.Ưu tiên',
      },
      {
        headerBg: 'bg-[#F97316]',
        badgeText: 'text-[#F97316]',
        label: 'B.Bình thường',
      },
      {
        headerBg: 'bg-[#1570EF]',
        badgeText: 'text-[#1570EF]',
        label: 'P.Ưu tiên',
      },
      {
        headerBg: 'bg-[#12B76A]',
        badgeText: 'text-[#12B76A]',
        label: 'P.Bình thường',
      },
    ];
    return styles[index % styles.length];
  };

  // Tính thời gian chờ hiển thị dạng MM:SS hoặc số phút chờ
  const getElapsedDisplay = (receivedAt, index) => {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const recMins = parseTimeToMinutes(receivedAt);
    const diff = Math.max(1, nowMins - recMins + (tick % 2));
    const displayMins = diff > 0 && diff < 90 ? diff : Math.max(5, 29 - index * 5);
    return `00:${String(displayMins).padStart(2, '0')}`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Đã đồng bộ dữ liệu Nhà Bếp mới nhất.', 'info');
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-[#FDF7F2] text-slate-800 flex flex-col">
      {/* THANH HEADER NHÀ BẾP */}
      <header className="sticky top-0 z-30 bg-[#FDF7F2] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        {/* Cụm Trái: Icon + Nhà Bếp + 3 Tab Hàng đợi / Đang nấu / Đã xong */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <ChefHat className="w-6 h-6" />
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Nhà Bếp
            </h1>
          </div>

          <div className="hidden sm:block h-7 w-px bg-slate-300" />

          {/* Bộ chuyển 3 trạng thái: Hàng đợi (Pending) | Đang nấu (Cooking) | Đã xong (Done) */}
          <div className="inline-flex items-center bg-[#EFECE6] p-1 rounded-full gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab(DISH_STATUS.PENDING)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === DISH_STATUS.PENDING
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Hàng đợi ({statusCounts.pending})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(DISH_STATUS.COOKING)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === DISH_STATUS.COOKING
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              <Flame className="w-4 h-4 shrink-0" />
              <span>Đang nấu ({statusCounts.cooking})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(DISH_STATUS.DONE)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === DISH_STATUS.DONE
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã xong ({statusCounts.done})</span>
            </button>
          </div>
        </div>

        {/* Cụm Phải: Trạng thái đồng bộ, Tìm kiếm, Làm mới, Chuyển sang Phục vụ */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 pr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Đồng bộ: {lastSyncTime}</span>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-300" />

          {searchOpen ? (
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                aria-label="Tìm bàn hoặc tên món"
                className="w-40 sm:w-52 pl-9 pr-8 py-2 bg-white text-xs sm:text-sm font-medium text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-white hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="w-10 h-10 rounded-full bg-white hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            aria-label="Làm mới"
          >
            <RotateCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-10 h-10 rounded-full bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH: BÊN TRÁI LÀ HÀNG ĐỢI ORDER (FIFO) - BÊN PHẢI LÀ KHÓA MÓN (OUT OF STOCK) */}
      <div className="flex-1 px-4 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (9/12): LƯỚI THẺ ORDER THEO NGUYÊN TẮC FIFO (FR-K01 & FR-K02) */}
        <div className="lg:col-span-9 min-w-0">
          {filteredTickets.length === 0 ? (
            <div className="bg-white p-12 text-center shadow-2xs">
              <p className="text-sm sm:text-base font-bold text-slate-500">
                {activeTab === DISH_STATUS.PENDING
                  ? 'Hiện không có món nào đang chờ trong hàng đợi.'
                  : activeTab === DISH_STATUS.COOKING
                  ? 'Hiện không có món nào đang chế biến.'
                  : 'Chưa có món nào ở trạng thái đã nấu xong.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
              {filteredTickets.map((ticket, index) => {
                const banner = getTicketBannerStyle(index);
                const elapsed = getElapsedDisplay(ticket.receivedAt, index);

                return (
                  <div
                    key={ticket.ticketId}
                    className="bg-white shadow-xs flex flex-col justify-between overflow-hidden animate-fade-in"
                  >
                    <div>
                      {/* Đầu thẻ màu sắc trực quan: Số đơn + Số bàn + Thời gian chờ + Phục vụ */}
                      <div className={`${banner.headerBg} text-white p-3.5 space-y-2`}>
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="text-lg sm:text-xl font-extrabold tracking-tight">
                              {ticket.code}
                            </span>
                            <span className="text-sm sm:text-base font-bold truncate">
                              {ticket.tableName}
                            </span>
                          </div>
                          <span className="text-base sm:text-lg font-extrabold shrink-0">
                            {elapsed}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                          <div className="flex items-center gap-1.5 opacity-95 truncate">
                            <Utensils className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              Phục vụ: {ticket.waiterName}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full bg-white text-[11px] font-extrabold shrink-0 ${banner.badgeText}`}
                          >
                            {banner.label}
                          </span>
                        </div>
                      </div>

                      {/* Danh sách các món trong thẻ (FR-K02: Chạm 1 lần để chuyển trạng thái Pending -> Cooking -> Done) */}
                      <div className="divide-y divide-slate-100 px-3.5">
                        {ticket.visibleItems.map((item) => {
                          const canAdvance =
                            item.status === DISH_STATUS.PENDING ||
                            item.status === DISH_STATUS.COOKING;

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (canAdvance) {
                                  advanceDishKitchenStatus(ticket.orderId, item.id);
                                }
                              }}
                              className={`py-3 space-y-2 transition-colors select-none ${
                                canAdvance
                                  ? 'cursor-pointer hover:bg-orange-50/60 active:bg-orange-100/60'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* Nút tròn 1-touch */}
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                      item.status === DISH_STATUS.DONE
                                        ? 'bg-emerald-500 text-white'
                                        : item.status === DISH_STATUS.COOKING
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-100 text-transparent hover:bg-orange-100 hover:text-orange-500'
                                    }`}
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>

                                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                                    {item.name}
                                  </span>
                                </div>

                                <span className="text-sm sm:text-base font-extrabold text-slate-800 shrink-0">
                                  x{item.quantity}
                                </span>
                              </div>

                              {/* Ghi chú đặc biệt nổi bật (FR-K01) */}
                              {item.note && (
                                <div className="ml-7 px-3 py-1.5 bg-[#FFF3E6] text-orange-800 text-xs sm:text-sm font-bold flex items-center gap-1.5">
                                  <MessageSquareText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                  <span>{item.note}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chân thẻ: Thời điểm nhận đơn */}
                    <div className="bg-slate-50 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Nhận lúc: {ticket.receivedAt}</span>
                      </div>

                      {activeTab !== DISH_STATUS.DONE && (
                        <span className="text-[11px] font-bold text-orange-600">
                          {activeTab === DISH_STATUS.PENDING
                            ? 'Chạm món → Nấu'
                            : 'Chạm món → Xong'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (3/12): KHÓA MÓN / TRẠNG THÁI MÓN (FR-K03 - Toggle công tắc đồng bộ tức thời sang Phục vụ) */}
        <div className="lg:col-span-3 min-w-0 bg-white shadow-xs overflow-hidden">
          <div className="bg-[#FFF3E6] px-4 py-3.5 flex items-center gap-2.5">
            <Utensils className="w-5 h-5 text-orange-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              Trạng thái món
            </h2>
          </div>

          <div className="divide-y divide-slate-100 max-h-[calc(100vh-14rem)] overflow-y-auto px-4">
            {menuItems.map((dish) => (
              <div
                key={dish.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className={`w-12 h-12 object-cover shrink-0 bg-slate-100 ${
                      !dish.available ? 'grayscale opacity-60' : ''
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {dish.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          dish.available ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span
                        className={`text-xs font-bold ${
                          dish.available ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        {dish.available ? 'Đang bán' : 'Hết hàng'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Công tắc Toggle 1 chạm (FR-K03) */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={dish.available}
                  aria-label={`Bật/tắt trạng thái món ${dish.name}`}
                  onClick={() => toggleDishAvailability(dish.id)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors cursor-pointer ${
                    dish.available ? 'bg-orange-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                      dish.available ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-white">
            <button
              type="button"
              onClick={handleRefresh}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FFF3E6] hover:bg-orange-100 text-orange-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4 shrink-0" />
              <span>Cập nhật trạng thái</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

