import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCw, Utensils, CreditCard, X, Search, ChevronDown } from "lucide-react";
import { useRoms } from "../context/RomsContext";
import { TABLE_STATUS } from "../utils/constants";
import {
  GridTableGlyph,
  RestaurantTableSvg,
} from "../components/common/TableIcon";
import DishStatusBadge from "../components/common/DishStatusBadge";
import { formatCurrency } from "../utils/formatters";

export default function TableMapPage() {
  const { tables, selectedTable, setSelectedTableId, refreshData, showToast } =
    useRoms();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [capacityFilter, setCapacityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  const handleSelectTable = (tableId) => {
    if (selectedTable?.id === tableId && isDetailOpen) {
      setIsDetailOpen(false);
      return;
    }
    setSelectedTableId(tableId);
    setIsDetailOpen(true);
  };

  // Thống kê số lượng bàn theo sức chứa (số chỗ ngồi)
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

  // Lọc bàn theo trạng thái, sức chứa và từ khóa tìm kiếm
  const filteredTables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tables.filter((t) => {
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchCapacity =
        capacityFilter === "ALL" ||
        (Number(t.capacity) || 4) === Number(capacityFilter);
      const matchSearch =
        !q ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.code && t.code.toLowerCase().includes(q));
      return matchStatus && matchCapacity && matchSearch;
    });
  }, [tables, statusFilter, capacityFilter, searchQuery]);

  const getTableCardStyle = (table, isSelected) => {
    const selectedEffect = isSelected
      ? "shadow-md scale-[1.02]"
      : "hover:scale-[1.01] hover:shadow-xs";

    switch (table.status) {
      case TABLE_STATUS.READY_TO_SERVE:
        return {
          card: `bg-[#FDE68A]/70 ${selectedEffect}`,
          iconColor: "text-amber-600",
          titleColor: "text-slate-900",
          subColor: "text-amber-800 font-semibold",
          badgeBg: "bg-orange-500 text-white",
        };
      case TABLE_STATUS.OCCUPIED:
        return {
          card: `bg-[#FECACA]/75 ${selectedEffect}`,
          iconColor: "text-rose-600",
          titleColor: "text-slate-900",
          subColor: "text-rose-800 font-medium",
          badgeBg: "bg-rose-500 text-white",
        };
      case TABLE_STATUS.AVAILABLE:
      default:
        return {
          card: `bg-[#DCFCE7] ${selectedEffect}`,
          iconColor: "text-emerald-600",
          titleColor: "text-slate-900",
          subColor: "text-emerald-800 font-medium",
          badgeBg: "bg-emerald-600 text-white",
        };
    }
  };

  const getTableSubtitleText = (table) => {
    if (!table) return "";
    if (table.status === TABLE_STATUS.READY_TO_SERVE) {
      return `Có ${table.orderSummary?.readyToServeCount || 1} món đã sẵn sàng`;
    }
    if (table.status === TABLE_STATUS.OCCUPIED) {
      return `Đơn ${table.activeOrder?.code}  ${table.orderSummary?.totalDishes} món`;
    }
    return "Bàn trống";
  };

  return (
    <div className="w-full min-w-0 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="w-full bg-white p-4 sm:p-6 shadow-sm">
        {/* Tiêu đề & nút làm mới */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900">
            Sơ đồ bàn
          </h1>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer shrink-0"
            aria-label="Làm mới"
          >
            <RotateCw
              className={`w-5 h-5 ${isRefreshing ? "animate-spin text-orange-500" : ""}`}
            />
          </button>
        </div>

        {/* Thanh tìm kiếm bàn & Dropdown lọc theo sức chứa ghế (Mobile-first) */}
        <div className="flex items-center gap-2.5 mb-4 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm bàn"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-100 border-0 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative shrink-0">
            <select
              value={capacityFilter}
              onChange={(e) =>
                setCapacityFilter(
                  e.target.value === "ALL" ? "ALL" : Number(e.target.value),
                )
              }
              aria-label="Lọc bàn theo sức chứa"
              className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả ({tables.length})</option>
              {capacityStats.map(({ capacity, count }) => (
                <option key={capacity} value={capacity}>
                  Bàn {capacity} chỗ ({count})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Chú thích trạng thái bàn */}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-xs sm:text-sm font-medium text-slate-600">
          <button
            onClick={() =>
              setStatusFilter(
                statusFilter === TABLE_STATUS.AVAILABLE
                  ? "ALL"
                  : TABLE_STATUS.AVAILABLE,
              )
            }
            className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
              statusFilter !== "ALL" && statusFilter !== TABLE_STATUS.AVAILABLE
                ? "opacity-40"
                : ""
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Bàn trống</span>
          </button>

          <button
            onClick={() =>
              setStatusFilter(
                statusFilter === TABLE_STATUS.OCCUPIED
                  ? "ALL"
                  : TABLE_STATUS.OCCUPIED,
              )
            }
            className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
              statusFilter !== "ALL" && statusFilter !== TABLE_STATUS.OCCUPIED
                ? "opacity-40"
                : ""
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span>Đang có khách</span>
          </button>

          <button
            onClick={() =>
              setStatusFilter(
                statusFilter === TABLE_STATUS.READY_TO_SERVE
                  ? "ALL"
                  : TABLE_STATUS.READY_TO_SERVE,
              )
            }
            className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
              statusFilter !== "ALL" &&
              statusFilter !== TABLE_STATUS.READY_TO_SERVE
                ? "opacity-40"
                : ""
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>Chờ mang món</span>
          </button>
        </div>

        {/* Lưới 3 cột hiển thị các bàn */}
        {filteredTables.length === 0 ? (
          <div className="py-12 text-center space-y-2.5">
            <p className="text-xs sm:text-sm font-bold text-slate-400">
              Không tìm thấy bàn nào phù hợp với bộ lọc.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setCapacityFilter("ALL");
                setSearchQuery("");
              }}
              className="text-xs sm:text-sm font-bold text-orange-600 hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {filteredTables.map((table) => {
              const isSelected = isDetailOpen && selectedTable?.id === table.id;
              const style = getTableCardStyle(table, isSelected);

              return (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table.id)}
                  className={`relative rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-center text-center min-h-[96px] sm:min-h-[124px] transition-all cursor-pointer ${style.card}`}
                >
                  {table.badgeCount > 0 && (
                    <span
                      className={`absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-extrabold flex items-center justify-center shadow-sm ${style.badgeBg}`}
                    >
                      {table.badgeCount}
                    </span>
                  )}

                  <GridTableGlyph
                    className={`w-5 h-5 sm:w-7 sm:h-7 mb-1 sm:mb-1.5 ${style.iconColor}`}
                  />
                  <span
                    className={`text-sm sm:text-lg font-extrabold ${style.titleColor}`}
                  >
                    {table.code}
                  </span>
                  <span
                    className={`text-[11px] sm:text-sm mt-0.5 leading-tight ${style.subColor}`}
                  >
                    {table.statusLabel}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">
                    ({table.capacity || 4} chỗ)
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Khung chi tiết bàn luôn bám sát mép dưới màn hình ở mọi kích thước */}
        {isDetailOpen && selectedTable && (
          <div className="fixed bottom-16 md:bottom-0 left-0 md:left-28 lg:left-56 right-0 z-30 bg-white border-t border-slate-200 px-4 sm:px-6 py-4 animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-3.5">
              <div className="flex items-center justify-between gap-2.5">
                <div
                  onClick={() => {
                    if (
                      selectedTable.activeOrder &&
                      !selectedTable.orderSummary?.isCompleted
                    ) {
                      setSelectedTableId(selectedTable.id);
                      navigate("/tracking");
                    }
                  }}
                  className={`flex items-center gap-3 min-w-0 flex-1 ${
                    selectedTable.activeOrder &&
                    !selectedTable.orderSummary?.isCompleted
                      ? "cursor-pointer hover:opacity-85 transition-opacity"
                      : ""
                  }`}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 text-orange-600 flex items-center justify-center shrink-0">
                    <RestaurantTableSvg className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {selectedTable.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 truncate">
                      {getTableSubtitleText(selectedTable)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedTable.activeOrder && (
                    <span className="text-sm sm:text-base font-extrabold text-orange-600">
                      {formatCurrency(selectedTable.orderSummary.subtotal)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDetailOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label="Đóng chi tiết bàn"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tóm tắt gọn đơn hàng đang mở (nhấn vào để chuyển sang Theo dõi món của bàn đó) */}
              {selectedTable.activeOrder && (
                <div
                  onClick={() => {
                    setSelectedTableId(selectedTable.id);
                    navigate("/tracking");
                  }}
                  className="max-h-40 overflow-y-auto divide-y divide-slate-200 cursor-pointer"
                >
                  {selectedTable.activeOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 py-2 hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                    >
                      <span
                        className={`font-semibold truncate ${
                          item.status === "CANCELLED"
                            ? "line-through text-slate-400"
                            : "text-slate-800"
                        }`}
                      >
                        {item.name} × {item.quantity}
                      </span>
                      <DishStatusBadge status={item.status} compact />
                    </div>
                  ))}
                </div>
              )}

              {/* Hai nút chính: Gọi món & Thanh toán */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <button
                  onClick={() => navigate(`/menu/${selectedTable.id}`)}
                  className="py-3 px-3 sm:px-4 rounded-xl bg-slate-100 hover:bg-orange-50 text-orange-600 font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Utensils className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Gọi món</span>
                </button>

                <button
                  onClick={() => {
                    if (!selectedTable.activeOrder) {
                      showToast(
                        `${selectedTable.name} chưa có đơn hàng.`,
                        "error",
                      );
                      return;
                    }
                    navigate(`/payment/${selectedTable.id}`);
                  }}
                  disabled={!selectedTable.activeOrder}
                  className={`py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                    selectedTable.activeOrder
                      ? "bg-orange-500 hover:bg-orange-600 text-white active:scale-[0.99] cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Thanh toán</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
