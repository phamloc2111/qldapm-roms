import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
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
    markAllDishesServed,
    cancelDish,
  } = useRoms();

  const [viewMode, setViewMode] = useState('BY_DISH');

  // Chỉ hiển thị các bàn có lần gọi món chưa hoàn thành (còn món chưa được phục vụ xác nhận)
  const activeTables = useMemo(
    () =>
      tables.filter(
        (t) =>
          Boolean(t.activeOrder) &&
          !t.orderSummary?.isCompleted &&
          t.orderSummary?.remainingToServeCount > 0
      ),
    [tables]
  );

  const currentTable = useMemo(() => {
    if (
      selectedTable &&
      activeTables.some((t) => t.id === selectedTable.id)
    ) {
      return selectedTable;
    }
    return activeTables[0] || null;
  }, [selectedTable, activeTables]);

  const activeOrder = currentTable?.activeOrder || null;

  // Chỉ lấy các lần gọi món (round) chưa hoàn thành của bàn hiện tại;
  // nếu một lần gọi món đã được phục vụ xác nhận hoàn thành thì không hiển thị trong bảng theo dõi nữa.
  const trackingOrder = useMemo(() => {
    if (!activeOrder) return null;
    const roundsMap = new Map();
    activeOrder.items.forEach((item) => {
      const r = item.round || 1;
      if (!roundsMap.has(r)) roundsMap.set(r, []);
      roundsMap.get(r).push(item);
    });

    const uncompletedItems = [];
    roundsMap.forEach((itemsInRound) => {
      const hasUnfinished = itemsInRound.some(
        (i) =>
          i.status === DISH_STATUS.PENDING ||
          i.status === DISH_STATUS.COOKING ||
          i.status === DISH_STATUS.DONE
      );
      if (hasUnfinished) {
        uncompletedItems.push(...itemsInRound);
      }
    });

    if (uncompletedItems.length === 0) return null;

    return {
      ...activeOrder,
      items: uncompletedItems,
    };
  }, [activeOrder]);

  const summary = useMemo(() => getOrderSummary(trackingOrder), [trackingOrder]);

  const timelineSteps = useMemo(() => {
    if (!trackingOrder) return [];
    const hasCookingOrBeyond = trackingOrder.items.some((i) =>
      [DISH_STATUS.COOKING, DISH_STATUS.DONE, DISH_STATUS.SERVED].includes(i.status)
    );
    const hasDoneOrServed = trackingOrder.items.some((i) =>
      [DISH_STATUS.DONE, DISH_STATUS.SERVED].includes(i.status)
    );
    const isAllServed = summary.isCompleted;

    return [
      {
        key: 'ordered',
        label: 'Gọi món',
        time: trackingOrder.createdAt ? `(${trackingOrder.createdAt})` : '',
        done: true,
      },
      {
        key: 'cooking',
        label: 'Đang chế biến',
        time: trackingOrder.cookingStartedAt ? `(${trackingOrder.cookingStartedAt})` : '',
        done: hasCookingOrBeyond,
      },
      {
        key: 'cooked',
        label: 'Đã xong',
        time: trackingOrder.cookedAt ? `(${trackingOrder.cookedAt})` : '',
        done: hasDoneOrServed,
      },
      {
        key: 'served',
        label: 'Phục vụ',
        time: isAllServed && trackingOrder.servedAt ? `(${trackingOrder.servedAt})` : '',
        done: isAllServed,
      },
    ];
  }, [trackingOrder, summary]);

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
      {activeTables.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 bg-white p-3.5 sm:p-4 shadow-2xs">
          {activeTables.map((t) => {
            const isSelected = currentTable?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
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
      <div className="w-full min-w-0 bg-white p-4 sm:p-6 shadow-sm space-y-5">
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

          {trackingOrder && (
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
          )}
        </div>

        {!trackingOrder ? (
          <div className="py-12 text-center space-y-3">
            <button
              onClick={() => navigate('/tables')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Chọn bàn gọi món</span>
            </button>
          </div>
        ) : viewMode === 'BY_DISH' ? (
          /* CHẾ ĐỘ 1: THEO MÓN */
          <div className="space-y-5 animate-fade-in">
            <div className="bg-[#FFF3E6] p-3.5 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                  <RestaurantTableSvg className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
                    {trackingOrder.tableName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                    Đơn {trackingOrder.code} • {trackingOrder.createdAt}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold ${
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

            {/* Danh sách từng món kèm trục Timeline dọc: mỗi thông tin 1 hàng theo thứ tự Tên món, Số lượng, Ghi chú, Trạng thái */}
            <div className="relative pl-6 sm:pl-8 divide-y divide-slate-200 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-200">
              {trackingOrder.items.map((item) => (
                <div key={item.id} className="relative min-w-0 py-3.5 first:pt-1 last:pb-1">
                  <span
                    className={`absolute -left-6 sm:-left-8 top-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${getTimelineNodeStyle(
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

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-15 h-15 sm:w-16 sm:h-16 rounded-none object-cover shrink-0 bg-slate-100 mt-0.5"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Hàng 1: Tên món */}
                        <h3
                          className={`text-sm sm:text-base font-extrabold leading-snug ${
                            item.status === DISH_STATUS.CANCELLED
                              ? 'line-through text-slate-400'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.name}
                        </h3>

                        {/* Hàng 2: Số lượng */}
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">
                          Số lượng: {item.quantity}
                        </p>

                        {/* Hàng 3: Ghi chú */}
                        {item.note && (
                          <p className="text-xs sm:text-sm text-slate-500">
                            Ghi chú: {item.note}
                          </p>
                        )}

                        {/* Hàng 4: Trạng thái */}
                        <div className="pt-0.5">
                          <DishStatusBadge status={item.status} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap sm:justify-end shrink-0">
                      {item.status !== DISH_STATUS.SERVED &&
                        item.status !== DISH_STATUS.CANCELLED && (
                          <button
                            onClick={() => markDishServed(trackingOrder.id, item.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Xác nhận đã phục vụ</span>
                          </button>
                        )}

                      {item.status === DISH_STATUS.PENDING && (
                        <button
                          onClick={() => cancelDish(trackingOrder.id, item.id)}
                          className="px-3 py-2 rounded-xl bg-rose-100/80 hover:bg-rose-200/80 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>Hủy món</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => markAllDishesServed(trackingOrder.id)}
              className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Xác nhận đã phục vụ tất cả món</span>
            </button>
          </div>
        ) : (
          /* CHẾ ĐỘ 2: TỔNG THỂ */
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#FFF3E6] p-3.5 sm:p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-500/15 text-orange-600 flex items-center justify-center shrink-0">
                  <RestaurantTableSvg className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-extrabold text-slate-900">
                    {trackingOrder.tableName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                    Đơn {trackingOrder.code} • {trackingOrder.createdAt}
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

            {/* Số lượng món theo từng trạng thái (không bo góc) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {Object.values(DISH_STATUS).map((stKey) => {
                const meta = DISH_STATUS_META[stKey];
                const count = summary.counts[stKey] || 0;
                return (
                  <div
                    key={stKey}
                    className={`p-2.5 text-center transition-all ${meta.bgClass}`}
                  >
                    <p className="text-lg font-extrabold">{count}</p>
                    <p className="text-[11px] font-bold mt-0.5 leading-tight">
                      {meta.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Danh sách món thuộc lần gọi: mỗi thông tin 1 hàng theo thứ tự Tên món, Số lượng, Ghi chú, Trạng thái */}
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Danh sách món</span>
              </h3>

              <div className="divide-y divide-slate-200">
                {trackingOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-start gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-15 h-15 sm:w-16 sm:h-16 rounded-none object-cover shrink-0 bg-slate-100 mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Hàng 1: Tên món */}
                      <p
                        className={`text-sm sm:text-base font-extrabold leading-snug ${
                          item.status === DISH_STATUS.CANCELLED
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.name}
                      </p>

                      {/* Hàng 2: Số lượng */}
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">
                        Số lượng: {item.quantity}
                      </p>

                      {/* Hàng 3: Ghi chú */}
                      {item.note && (
                        <p className="text-xs sm:text-sm text-slate-500">
                          Ghi chú: {item.note}
                        </p>
                      )}

                      {/* Hàng 4: Trạng thái */}
                      <div className="pt-0.5">
                        <DishStatusBadge status={item.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút Yêu cầu thanh toán */}
            <button
              onClick={() => navigate(`/payment/${currentTable.id}`)}
              className="w-full py-3.5 px-6 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
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
