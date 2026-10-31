import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Clock,
  Flame,
  CheckCircle2,
  Search,
  RotateCw,
  Utensils,
  MessageSquareText,
  Check,
  X,
  User,
  Briefcase,
  LogOut,
} from 'lucide-react';
import { useRoms } from '../context/RomsContext';
import { DISH_STATUS, CATEGORIES } from '../data/mockData';

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const h = Number(parts[0]) || 0;
  const m = Number(parts[1]) || 0;
  return h * 60 + m;
}

function getCurrentTimeHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
}

export default function KitchenPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    orders,
    menuItems,
    advanceDishKitchenStatus,
    toggleDishAvailability,
    showToast,
    logout,
  } = useRoms();

  const user = currentUser || {
    fullName: 'Lê Hoàng Nam',
    username: 'bep',
    roleDisplay: 'Nhà bếp',
    title: 'Bếp trưởng điều hành',
    avatarInitial: 'B',
  };

  // 4 tab trạng thái: 'ALL' (Tất cả) | 'PENDING' (Hàng đợi) | 'COOKING' (Đang nấu) | 'DONE' (Đã xong)
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [menuPopupOpen, setMenuPopupOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [menuSelectedCategory, setMenuSelectedCategory] = useState('ALL');
  const [tick, setTick] = useState(0);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeHHMM);

  // Đồng hồ cập nhật thời gian thực và thời gian chờ trên các thẻ order
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      setCurrentTime(getCurrentTimeHHMM());
    }, 15000);
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
    return {
      total: pending + cooking + done,
      pending,
      cooking,
      done,
    };
  }, [allKitchenTickets]);

  // Hàm lọc phiếu theo trạng thái cụ thể (PENDING / COOKING / DONE) và từ khóa tìm kiếm
  const getTicketsByStatus = (status) => {
    const q = searchQuery.trim().toLowerCase();

    return allKitchenTickets
      .map((ticket) => {
        const itemsByStatus = ticket.items.filter((i) => i.status === status);
        const matchingItems = !q
          ? itemsByStatus
          : itemsByStatus.filter(
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
  };

  const pendingTickets = useMemo(
    () => getTicketsByStatus(DISH_STATUS.PENDING),
    [allKitchenTickets, searchQuery]
  );
  const cookingTickets = useMemo(
    () => getTicketsByStatus(DISH_STATUS.COOKING),
    [allKitchenTickets, searchQuery]
  );
  const doneTickets = useMemo(
    () => getTicketsByStatus(DISH_STATUS.DONE),
    [allKitchenTickets, searchQuery]
  );

  // Lọc và nhóm danh sách món ăn theo danh mục trong Popup Menu (FR-K03)
  const groupedPopupMenu = useMemo(() => {
    const q = menuSearchQuery.trim().toLowerCase();
    const filtered = menuItems.filter((item) => {
      const matchCat =
        menuSelectedCategory === 'ALL' ||
        item.categoryId === menuSelectedCategory;
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.categoryName && item.categoryName.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });

    return CATEGORIES.filter((cat) => cat.id !== 'ALL')
      .map((cat) => ({
        ...cat,
        items: filtered.filter((item) => item.categoryId === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [menuItems, menuSelectedCategory, menuSearchQuery]);

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
    setCurrentTime(getCurrentTimeHHMM());
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Đã đồng bộ dữ liệu Nhà Bếp mới nhất.', 'info');
    }, 300);
  };

  // Hàm render lưới các thẻ đơn hàng theo từng trạng thái (kích thước thu gọn ~20%)
  const renderTicketGrid = (ticketsList, statusType, isSplitColumn = false) => {
    if (ticketsList.length === 0) {
      return (
        <div className="bg-white p-6 text-center shadow-2xs">
          <p className="text-xs sm:text-sm font-bold text-slate-400">
            {statusType === DISH_STATUS.PENDING
              ? 'Không có món chờ trong hàng đợi.'
              : statusType === DISH_STATUS.COOKING
              ? 'Không có món đang chế biến.'
              : 'Chưa có món đã nấu xong.'}
          </p>
        </div>
      );
    }

    const gridColsClass = isSplitColumn
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch'
      : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 items-stretch';

    return (
      <div className={gridColsClass}>
        {ticketsList.map((ticket, index) => {
          const banner = getTicketBannerStyle(index);
          const elapsed = getElapsedDisplay(ticket.receivedAt, index);

          return (
            <div
              key={`${ticket.ticketId}-${statusType}`}
              className="bg-white shadow-xs flex flex-col justify-between overflow-hidden animate-fade-in"
            >
              <div>
                {/* Đầu thẻ màu sắc trực quan (thu gọn ~20%): Số đơn + Số bàn + Thời gian chờ + Phục vụ */}
                <div className={`${banner.headerBg} text-white p-2.5 space-y-1.5`}>
                  <div className="flex items-baseline justify-between gap-1.5">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-sm sm:text-base font-extrabold tracking-tight">
                        {ticket.code}
                      </span>
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {ticket.tableName}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-extrabold shrink-0 tabular-nums">
                      {elapsed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-semibold">
                    <div className="flex items-center gap-1 opacity-95 truncate">
                      <Utensils className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        Phục vụ: {ticket.waiterName}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full bg-white text-[10px] font-extrabold shrink-0 ${banner.badgeText}`}
                    >
                      {banner.label}
                    </span>
                  </div>
                </div>

                {/* Danh sách các món trong thẻ (FR-K02: Chạm 1 lần để chuyển trạng thái Pending -> Cooking -> Done) */}
                <div className="divide-y divide-slate-100 px-2.5">
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
                        className={`py-2 space-y-1.5 transition-colors select-none ${
                          canAdvance
                            ? 'cursor-pointer hover:bg-orange-50/60 active:bg-orange-100/60'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Nút tròn 1-touch */}
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                item.status === DISH_STATUS.DONE
                                  ? 'bg-emerald-500 text-white'
                                  : item.status === DISH_STATUS.COOKING
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-100 text-transparent hover:bg-orange-100 hover:text-orange-500'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>

                            <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {item.name}
                            </span>
                          </div>

                          <span className="text-xs sm:text-sm font-extrabold text-slate-800 shrink-0">
                            x{item.quantity}
                          </span>
                        </div>

                        {/* Ghi chú đặc biệt nổi bật (FR-K01) */}
                        {item.note && (
                          <div className="ml-6 px-2.5 py-1 bg-[#FFF3E6] text-orange-800 text-[11px] font-bold flex items-center gap-1">
                            <MessageSquareText className="w-3 h-3 text-orange-500 shrink-0" />
                            <span>{item.note}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chân thẻ: Thời điểm nhận đơn */}
              <div className="bg-slate-50 px-2.5 py-2 flex items-center justify-between gap-1.5 text-[11px] font-semibold text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Nhận lúc: {ticket.receivedAt}</span>
                </div>

                {statusType !== DISH_STATUS.DONE && (
                  <span className="text-[10px] font-bold text-orange-600">
                    {statusType === DISH_STATUS.PENDING
                      ? 'Chạm → Nấu'
                      : 'Chạm → Xong'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#F4EDE4] text-slate-800 flex flex-col">
      {/* THANH HEADER NHÀ BẾP (Nền trắng tách biệt rõ ranh giới với vùng Order bên dưới) */}
      <header className="sticky top-0 z-30 bg-white shadow-xs px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        {/* Cụm Trái: Thời gian chữ lớn + 4 Tab Tất cả / Hàng đợi / Đang nấu / Đã xong */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {currentTime}
            </span>
          </div>

          <div className="hidden sm:block h-7 w-px bg-slate-200" />

          {/* Bộ chuyển 4 trạng thái: Tất cả | Hàng đợi (Pending) | Đang nấu (Cooking) | Đã xong (Done) */}
          <div className="inline-flex items-center bg-[#F4EDE4] p-1 rounded-full gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Tất cả ({statusCounts.total})</span>
            </button>

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

        {/* Cụm Phải: Nút Menu (mở popup trạng thái món), Tìm kiếm, Làm mới, Hồ sơ */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          <button
            type="button"
            onClick={() => setMenuPopupOpen(true)}
            className="px-4 py-2 rounded-full bg-[#F4EDE4] hover:bg-orange-50 text-slate-800 hover:text-orange-600 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer"
            title="Điều chỉnh trạng thái món trong Menu"
          >
            <Utensils className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Menu</span>
          </button>

          {searchOpen ? (
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                aria-label="Tìm bàn hoặc tên món"
                className="w-40 sm:w-52 pl-9 pr-8 py-2 bg-[#F4EDE4] text-xs sm:text-sm font-medium text-slate-800 focus:outline-none"
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
              className="w-10 h-10 rounded-full bg-[#F4EDE4] hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="w-10 h-10 rounded-full bg-[#F4EDE4] hover:bg-orange-50 text-slate-600 hover:text-orange-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Làm mới"
          >
            <RotateCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setProfilePopupOpen(true)}
            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center shadow-sm shadow-orange-500/30 transition-colors cursor-pointer"
            title="Hồ sơ cá nhân"
            aria-label="Hồ sơ cá nhân"
          >
            {user.avatarInitial || 'B'}
          </button>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH: TOÀN BỘ KHÔNG GIAN DÀNH CHO HÀNG ĐỢI ORDER (FIFO) */}
      <div className="flex-1 px-4 sm:px-6 pt-5 pb-6 w-full">
        {activeTab === 'ALL' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-slate-200 gap-6 lg:gap-0 items-start">
            {/* Cột dọc 1: Hàng đợi */}
            <section className="lg:pr-5 space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Hàng đợi ({statusCounts.pending})
                </h2>
              </div>
              {renderTicketGrid(pendingTickets, DISH_STATUS.PENDING, true)}
            </section>

            {/* Cột dọc 2: Đang nấu */}
            <section className="lg:px-5 space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Đang nấu ({statusCounts.cooking})
                </h2>
              </div>
              {renderTicketGrid(cookingTickets, DISH_STATUS.COOKING, true)}
            </section>

            {/* Cột dọc 3: Đã xong */}
            <section className="lg:pl-5 space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Đã xong ({statusCounts.done})
                </h2>
              </div>
              {renderTicketGrid(doneTickets, DISH_STATUS.DONE, true)}
            </section>
          </div>
        ) : activeTab === DISH_STATUS.PENDING ? (
          renderTicketGrid(pendingTickets, DISH_STATUS.PENDING, false)
        ) : activeTab === DISH_STATUS.COOKING ? (
          renderTicketGrid(cookingTickets, DISH_STATUS.COOKING, false)
        ) : (
          renderTicketGrid(doneTickets, DISH_STATUS.DONE, false)
        )}
      </div>

      {/* POPUP ĐIỀU CHỈNH TRẠNG THÁI MÓN TRONG MENU (FR-K03) */}
      {menuPopupOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setMenuPopupOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Popup */}
            <div className="bg-[#FFF3E6] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-orange-500 shrink-0" />
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Trạng thái món trong Menu
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMenuPopupOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thanh tìm kiếm & Bộ lọc danh mục */}
            <div className="px-5 pt-4 pb-3 space-y-3 bg-white shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  aria-label="Tìm kiếm món ăn trong menu"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-100 border-0 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none transition-all"
                />
                {menuSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setMenuSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => {
                  const active = menuSelectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setMenuSelectedCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                        active
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danh sách món ăn chia theo từng danh mục có tiêu đề danh mục ngăn cách */}
            <div className="overflow-y-auto px-5 pb-4 flex-1 divide-y divide-slate-200 space-y-5">
              {groupedPopupMenu.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-xs sm:text-sm font-bold text-slate-400">
                    Không tìm thấy món ăn phù hợp.
                  </p>
                </div>
              ) : (
                groupedPopupMenu.map((group) => (
                  <div key={group.id} className="pt-4 first:pt-1 space-y-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-orange-600">
                      {group.name}
                    </h3>

                    <div className="divide-y divide-slate-100">
                      {group.items.map((dish) => (
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
                                    dish.available
                                      ? 'bg-emerald-500'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                <span
                                  className={`text-xs font-bold ${
                                    dish.available
                                      ? 'text-emerald-600'
                                      : 'text-slate-500'
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
                                dish.available
                                  ? 'translate-x-5'
                                  : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Popup */}
            <div className="p-4 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setMenuPopupOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP HỒ SƠ CÁ NHÂN & ĐĂNG XUẤT */}
      {profilePopupOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setProfilePopupOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white p-6 sm:p-7 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Thông tin cá nhân
              </h2>
              <button
                type="button"
                onClick={() => setProfilePopupOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#FFF8F1] flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#FFEAD5] text-orange-500 font-extrabold text-2xl flex items-center justify-center shrink-0">
                {user.avatarInitial || 'B'}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                  {user.fullName}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-orange-600 mt-0.5">
                  {user.title}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Tên đăng nhập</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {user.username}
                </span>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>Vai trò</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {user.roleDisplay}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setProfilePopupOpen(false);
                logout();
                navigate('/login', { replace: true });
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

