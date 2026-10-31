import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Info,
  Send,
  Utensils,
  XCircle,
  Check,
  PlusCircle,
} from 'lucide-react';
import { useRoms } from '../context/RomsContext';
import { DISH_STATUS, DISH_STATUS_META } from '../data/mockData';
import { RestaurantTableSvg } from '../components/common/TableIcon';
import DishStatusBadge from '../components/common/DishStatusBadge';
import { getOrderSummary } from '../utils/formatters';

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const {
    tables,
    selectedTable,
    setSelectedTableId,
    markDishServed,
    cancelDish,
  } = useRoms();

  const [viewMode, setViewMode] = useState('BY_DISH');

  const activeTables = useMemo(
    () => tables.filter((t) => Boolean(t.activeOrder)),
    [tables]
  );

  const currentTable = useMemo(() => {
    if (selectedTable?.activeOrder) return selectedTable;
    return activeTables[0] || selectedTable || tables[0];
  }, [selectedTable, activeTables, tables]);

  const activeOrder = currentTable?.activeOrder || null;
  const summary = useMemo(() => getOrderSummary(activeOrder), [activeOrder]);

  const timelineSteps = useMemo(() => {
    if (!activeOrder) return [];
    const hasCookingOrBeyond = activeOrder.items.some((i) =>
      [DISH_STATUS.COOKING, DISH_STATUS.DONE, DISH_STATUS.SERVED].includes(i.status)
    );
    const hasDoneOrServed = activeOrder.items.some((i) =>
      [DISH_STATUS.DONE, DISH_STATUS.SERVED].includes(i.status)
    );
    const isAllServed = summary.isCompleted;

    return [
      {
        key: 'ordered',
        label: 'Gọi món',
        time: activeOrder.createdAt ? `(${activeOrder.createdAt})` : '',
        done: true,
      },
      {
        key: 'cooking',
        label: 'Đang chế biến',
        time: activeOrder.cookingStartedAt ? `(${activeOrder.cookingStartedAt})` : '',
        done: hasCookingOrBeyond,
      },
      {
        key: 'cooked',
        label: 'Đã xong',
        time: activeOrder.cookedAt ? `(${activeOrder.cookedAt})` : '',
        done: hasDoneOrServed,
      },
      {
        key: 'served',
        label: 'Phục vụ',
        time: isAllServed && activeOrder.servedAt ? `(${activeOrder.servedAt})` : '',
        done: isAllServed,
      },
    ];
  }, [activeOrder, summary]);

  const getTimelineNodeStyle = (status) => {
    switch (status) {
      case DISH_STATUS.PENDING:
        return 'bg-orange-500 text-white';
      case DISH_STATUS.COOKING:
        return 'bg-sky-500 text-white';
      case DISH_STATUS.DONE:
        return 'bg-emerald-500 text-white';
      case DISH_STATUS.SERVED:
        return 'bg-slate-400 text-white';
      case DISH_STATUS.CANCELLED:
        return 'bg-rose-500 text-white';
      default:
        return 'bg-orange-500 text-white';
    }
  };

  return (
    <div className="max-w-2xl w-full min-w-0 mx-auto space-y-4 sm:space-y-5 animate-fade-in">
      {/* Thanh chọn nhanh giữa các bàn đang có đơn mở */}
      {activeTables.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl p-3 shadow-2xs">
          {activeTables.map((t) => {
            const isSelected = currentTable?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Khung chính Theo dõi món */}
      <div className="w-full min-w-0 bg-white rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
        {/* Header: <- Theo dõi món & Nút chuyển chế độ [Theo món | Tổng thể] */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/tables')}
              className="p-2 rounded-xl hover:bg-orange-50 text-orange-600 transition-colors cursor-pointer"
              aria-label="Quay về sơ đồ bàn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900">
              Theo dõi món
            </h1>
          </div>

          <div className="inline-flex items-center bg-slate-100 p-1 rounded-full">
            <button
              onClick={() => setViewMode('BY_DISH')}
              className={`px-3.5 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'BY_DISH'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              Theo món
            </button>
            <button
              onClick={() => setViewMode('OVERALL')}
              className={`px-3.5 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                viewMode === 'OVERALL'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-700 hover:text-orange-600'
              }`}
            >
              Tổng thể
            </button>
          </div>
        </div>

        {!activeOrder ? (
          <div className="py-12 text-center space-y-3">
            <button
              onClick={() => navigate(`/menu/${currentTable?.id || 'T1'}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gọi món</span>
            </button>
          </div>
        ) : viewMode === 'BY_DISH' ? (
          /* CHẾ ĐỘ 1: THEO MÓN */
          <div className="space-y-5 animate-fade-in">
            <div className="rounded-2xl bg-[#FFF3E6] p-3.5 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                  <RestaurantTableSvg className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
                    {activeOrder.tableName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                    Đơn {activeOrder.code} • {activeOrder.createdAt}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold ${
                  summary.isCompleted
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-orange-200/60 text-orange-700'
                }`}
              >
                {summary.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 shrink-0" />
                )}
                <span>{summary.overallStatusLabel}</span>
              </span>
            </div>

            {/* Danh sách từng món kèm trục Timeline dọc */}
            <div className="relative pl-6 sm:pl-8 space-y-3.5 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200">
              {activeOrder.items.map((item) => {
                const isHighlightCard =
                  item.status === DISH_STATUS.PENDING ||
                  item.status === DISH_STATUS.DONE;

                return (
                  <div key={item.id} className="relative min-w-0">
                    <span
                      className={`absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${getTimelineNodeStyle(
                        item.status
                      )}`}
                    >
                      {item.status === DISH_STATUS.SERVED ||
                      item.status === DISH_STATUS.DONE ||
                      item.status === DISH_STATUS.COOKING ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>

                    <div
                      className={`rounded-2xl p-3 sm:p-4 transition-all ${
                        item.status === DISH_STATUS.DONE
                          ? 'bg-emerald-50/70'
                          : isHighlightCard
                          ? 'bg-[#FFF6EC]'
                          : item.status === DISH_STATUS.CANCELLED
                          ? 'bg-rose-50/50 opacity-80'
                          : 'bg-slate-50/80'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0 flex-1">
                            <h3
                              className={`text-sm sm:text-base font-extrabold ${
                                item.status === DISH_STATUS.CANCELLED
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900'
                              }`}
                            >
                              {item.name}
                            </h3>

                            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                              SL: {item.quantity}
                              {item.note ? (
                                <span> • Ghi chú: {item.note}</span>
                              ) : null}
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-wrap shrink-0 pt-1 sm:pt-0">
                          <DishStatusBadge status={item.status} />

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {item.status === DISH_STATUS.DONE && (
                              <button
                                onClick={() => markDishServed(activeOrder.id, item.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Xác nhận đã phục vụ</span>
                              </button>
                            )}

                            {item.status === DISH_STATUS.PENDING && (
                              <button
                                onClick={() => cancelDish(activeOrder.id, item.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-100/80 hover:bg-rose-200/80 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Hủy món</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl bg-[#FFF3E6] p-3.5 px-4 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
              <Info className="w-5 h-5 text-orange-500 shrink-0" />
              <span>Vui lòng xác nhận đã mang món ra cho khách</span>
            </div>
          </div>
        ) : (
          /* CHẾ ĐỘ 2: TỔNG THỂ */
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl bg-[#FFF3E6] p-3.5 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                  <RestaurantTableSvg className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
                    {activeOrder.tableName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                    Đơn {activeOrder.code} • {activeOrder.createdAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                  <svg className="w-14 h-14 sm:w-16 sm:h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#FED7AA"
                      strokeWidth="6"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke={summary.isCompleted ? '#16A34A' : '#F97316'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 26}
                      strokeDashoffset={
                        2 * Math.PI * 26 * (1 - summary.progressPercent / 100)
                      }
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute text-xs sm:text-sm font-extrabold text-slate-900">
                    {summary.progressPercent}%
                  </span>
                </div>

                <div>
                  <p
                    className={`text-sm sm:text-lg font-extrabold leading-tight ${
                      summary.isCompleted ? 'text-emerald-600' : 'text-orange-600'
                    }`}
                  >
                    {summary.overallStatusLabel}
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {summary.isCompleted
                      ? 'Đã xong'
                      : `Còn ${summary.remainingToServeCount} món`}
                  </p>
                </div>
              </div>
            </div>

            {/* Thanh tiến trình 4 bước ngang */}
            <div className="px-1 sm:px-6 py-2">
              <div className="grid grid-cols-4 relative">
                {timelineSteps.map((step, index) => (
                  <div
                    key={step.key}
                    className="relative flex flex-col items-center text-center px-1"
                  >
                    {index < timelineSteps.length - 1 && (
                      <div
                        className={`absolute top-3.5 left-1/2 w-full h-0.5 ${
                          timelineSteps[index + 1].done
                            ? 'bg-orange-400'
                            : 'bg-slate-200'
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step.done
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {step.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '+'}
                    </div>

                    <p
                      className={`text-[11px] sm:text-xs font-bold mt-2 leading-tight ${
                        step.done ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.time && (
                      <span className="text-[10px] sm:text-[11px] text-slate-500">
                        {step.time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Số lượng món theo từng trạng thái */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {Object.values(DISH_STATUS).map((stKey) => {
                const meta = DISH_STATUS_META[stKey];
                const count = summary.counts[stKey] || 0;
                return (
                  <div
                    key={stKey}
                    className={`p-2.5 rounded-2xl text-center transition-all ${meta.bgClass}`}
                  >
                    <p className="text-lg font-extrabold">{count}</p>
                    <p className="text-[11px] font-bold mt-0.5 leading-tight">
                      {meta.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Danh sách món thuộc lần gọi */}
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Danh sách món</span>
              </h3>

              <div className="space-y-2.5">
                {activeOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-50 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-sm sm:text-base font-extrabold truncate ${
                            item.status === DISH_STATUS.CANCELLED
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          SL: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                      <DishStatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút Yêu cầu thanh toán */}
            <button
              onClick={() => navigate(`/payment/${currentTable.id}`)}
              className="w-full py-3.5 px-6 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Yêu cầu thanh toán</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
