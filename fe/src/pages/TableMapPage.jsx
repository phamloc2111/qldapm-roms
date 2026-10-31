import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Utensils, CreditCard } from 'lucide-react';
import { useRoms } from '../context/RomsContext';
import { TABLE_STATUS } from '../data/mockData';
import { GridTableGlyph, RestaurantTableSvg } from '../components/common/TableIcon';
import DishStatusBadge from '../components/common/DishStatusBadge';
import { formatCurrency } from '../utils/formatters';

export default function TableMapPage() {
  const { tables, selectedTable, setSelectedTableId, showToast } = useRoms();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 350);
  };

  const filteredTables =
    statusFilter === 'ALL'
      ? tables
      : tables.filter((t) => t.status === statusFilter);

  const getTableCardStyle = (table, isSelected) => {
    const selectedEffect = isSelected
      ? 'shadow-md scale-[1.02]'
      : 'hover:scale-[1.01] hover:shadow-xs';

    switch (table.status) {
      case TABLE_STATUS.READY_TO_SERVE:
        return {
          card: `bg-[#FDE68A]/70 ${selectedEffect}`,
          iconColor: 'text-amber-600',
          titleColor: 'text-slate-900',
          subColor: 'text-amber-800 font-semibold',
          badgeBg: 'bg-orange-500 text-white',
        };
      case TABLE_STATUS.OCCUPIED:
        return {
          card: `bg-[#FECACA]/75 ${selectedEffect}`,
          iconColor: 'text-rose-600',
          titleColor: 'text-slate-900',
          subColor: 'text-rose-800 font-medium',
          badgeBg: 'bg-rose-500 text-white',
        };
      case TABLE_STATUS.AVAILABLE:
      default:
        return {
          card: `bg-[#DCFCE7] ${selectedEffect}`,
          iconColor: 'text-emerald-600',
          titleColor: 'text-slate-900',
          subColor: 'text-emerald-800 font-medium',
          badgeBg: 'bg-emerald-600 text-white',
        };
    }
  };

  const getTableSubtitleText = (table) => {
    if (!table) return '';
    if (table.status === TABLE_STATUS.READY_TO_SERVE) {
      return `Có ${table.orderSummary?.readyToServeCount || 1} món đã sẵn sàng`;
    }
    if (table.status === TABLE_STATUS.OCCUPIED) {
      return `Đơn ${table.activeOrder?.code} • ${table.orderSummary?.totalDishes} món`;
    }
    return 'Bàn trống';
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
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
            />
          </button>
        </div>

        {/* Chú thích trạng thái bàn giống ảnh tham khảo */}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-xs sm:text-sm font-medium text-slate-600">
          <button
            onClick={() =>
              setStatusFilter(
                statusFilter === TABLE_STATUS.AVAILABLE ? 'ALL' : TABLE_STATUS.AVAILABLE
              )
            }
            className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
              statusFilter !== 'ALL' && statusFilter !== TABLE_STATUS.AVAILABLE
                ? 'opacity-40'
                : ''
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Bàn trống</span>
          </button>

          <button
            onClick={() =>
              setStatusFilter(
                statusFilter === TABLE_STATUS.OCCUPIED ? 'ALL' : TABLE_STATUS.OCCUPIED
              )
            }
            className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
              statusFilter !== 'ALL' && statusFilter !== TABLE_STATUS.OCCUPIED
                ? 'opacity-40'
                : ''
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span>Đang có khách</span>
          </button>

          <button
            onClick={() =>
              setStatusFilter(
                statusFilter === TABLE_STATUS.READY_TO_SERVE
                  ? 'ALL'
                  : TABLE_STATUS.READY_TO_SERVE
              )
            }
            className={`inline-flex items-center gap-1.5 transition-opacity cursor-pointer ${
              statusFilter !== 'ALL' && statusFilter !== TABLE_STATUS.READY_TO_SERVE
                ? 'opacity-40'
                : ''
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>Chờ mang món</span>
          </button>
        </div>

        {/* Lưới 3x3 hiển thị các bàn */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {filteredTables.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            const style = getTableCardStyle(table, isSelected);

            return (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`relative rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-center text-center min-h-[92px] sm:min-h-[118px] transition-all cursor-pointer ${style.card}`}
              >
                {table.badgeCount > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-extrabold flex items-center justify-center shadow-sm ${style.badgeBg}`}
                  >
                    {table.badgeCount}
                  </span>
                )}

                <GridTableGlyph className={`w-5 h-5 sm:w-7 sm:h-7 mb-1 sm:mb-1.5 ${style.iconColor}`} />
                <span className={`text-sm sm:text-lg font-extrabold ${style.titleColor}`}>
                  {table.code}
                </span>
                <span className={`text-[11px] sm:text-sm mt-0.5 leading-tight ${style.subColor}`}>
                  {table.statusLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Khung thao tác của bàn đang chọn */}
        {selectedTable && (
          <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-200 space-y-4">
            <div
              onClick={() => {
                if (
                  selectedTable.activeOrder &&
                  !selectedTable.orderSummary?.isCompleted
                ) {
                  setSelectedTableId(selectedTable.id);
                  navigate('/tracking');
                }
              }}
              className={`flex items-center justify-between gap-2.5 ${
                selectedTable.activeOrder && !selectedTable.orderSummary?.isCompleted
                  ? 'cursor-pointer hover:opacity-85 transition-opacity'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 flex items-center justify-center shrink-0">
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

              {selectedTable.activeOrder && (
                <span className="text-sm sm:text-base font-extrabold text-orange-600 shrink-0">
                  {formatCurrency(selectedTable.orderSummary.subtotal)}
                </span>
              )}
            </div>

            {/* Tóm tắt gọn đơn hàng đang mở (nhấn vào để chuyển sang Theo dõi món của bàn đó) */}
            {selectedTable.activeOrder && (
              <div
                onClick={() => {
                  setSelectedTableId(selectedTable.id);
                  navigate('/tracking');
                }}
                className="divide-y divide-slate-200 cursor-pointer"
              >
                {selectedTable.activeOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-2.5 hover:bg-slate-50 transition-colors text-xs sm:text-sm"
                  >
                    <span
                      className={`font-semibold truncate ${
                        item.status === 'CANCELLED'
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
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
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
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
                    showToast(`${selectedTable.name} chưa có đơn hàng.`, 'error');
                    return;
                  }
                  navigate(`/payment/${selectedTable.id}`);
                }}
                disabled={!selectedTable.activeOrder}
                className={`py-3 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                  selectedTable.activeOrder
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span>Thanh toán</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
