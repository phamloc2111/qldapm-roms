import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Home, Check } from 'lucide-react';
import { useRoms } from '../context/RomsContext';
import { DISH_STATUS } from '../utils/constants';
import { resolveDishImage, handleDishImageError } from '../utils/dishImages';
import { RestaurantTableSvg } from '../components/common/TableIcon';
import DishStatusBadge from '../components/common/DishStatusBadge';
import { formatCurrency, getOrderSummary } from '../utils/formatters';

export default function PaymentPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { tables, selectedTable, requestPayment } = useRoms();

  const currentTableId = tableId || selectedTable?.id || 'T4';
  const currentTable = useMemo(
    () => tables.find((t) => t.id === currentTableId) || tables[0],
    [tables, currentTableId]
  );

  const activeOrder = currentTable?.activeOrder || null;
  const summary = useMemo(() => getOrderSummary(activeOrder), [activeOrder]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(
    Boolean(activeOrder?.paymentRequested)
  );

  const handleConfirmPayment = async () => {
    if (!activeOrder) return;
    setShowConfirmModal(false);
    const res = await requestPayment(activeOrder.id);
    if (res?.ok) {
      setIsSubmitted(true);
    }
  };

  if (!activeOrder) {
    return (
      <div className="max-w-lg mx-auto bg-white p-8 text-center shadow-sm space-y-4 animate-fade-in">
        <button
          onClick={() => navigate('/tables')}
          className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm cursor-pointer"
        >
          Quay về sơ đồ bàn
        </button>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto bg-white p-7 sm:p-10 shadow-sm text-center space-y-6 animate-fade-in">
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full bg-[#FFF3E6]">
          <svg
            viewBox="0 0 80 80"
            className="w-20 h-20 text-slate-700"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 14C20 11.7909 21.7909 10 24 10H52C54.2091 10 56 11.7909 56 14V66L50 61L44 66L38 61L32 66L26 61L20 66V14Z"
              fill="#F8FAFC"
              stroke="#334155"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M29 25H47M29 35H47M29 45H40"
              stroke="#475569"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Đã gửi yêu cầu thanh toán!
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xs mx-auto leading-relaxed">
            Vui lòng chờ thu ngân xử lý và in hóa đơn.
          </p>
        </div>

        <button
          onClick={() => navigate('/tables')}
          className="w-full py-4 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span>Quay về sơ đồ bàn</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-5 sm:p-7 shadow-sm space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-colors cursor-pointer"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Đơn hàng {activeOrder.code}
          </h1>
        </div>
      </div>

      {/* Thông tin bàn */}
      <div className="bg-[#FFF3E6] p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RestaurantTableSvg className="w-6 h-6 text-orange-600" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            {activeOrder.tableName}
          </h2>
        </div>

        <span className="text-xs sm:text-sm font-semibold text-slate-600">
          Khách: {activeOrder.guests} người
        </span>
      </div>

      {/* Danh sách các món trong đơn: mỗi thông tin 1 hàng theo thứ tự Tên món, Số lượng, Ghi chú, Trạng thái */}
      <div className="divide-y divide-slate-200">
        {activeOrder.items.map((item) => {
          const isCancelled = item.status === DISH_STATUS.CANCELLED;
          const lineTotal = isCancelled ? 0 : item.price * item.quantity;

          return (
            <div
              key={item.id}
              className={`py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 ${
                isCancelled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <img
                  src={resolveDishImage(item.name, item.image)}
                  onError={handleDishImageError}
                  alt={item.name}
                  className="w-15 h-15 sm:w-16 sm:h-16 rounded-none object-cover shrink-0 bg-slate-100 mt-0.5"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Hàng 1: Tên món */}
                  <p
                    className={`text-sm sm:text-base font-extrabold leading-snug ${
                      isCancelled ? 'line-through text-slate-400' : 'text-slate-900'
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
                    <DishStatusBadge status={item.status} compact />
                  </div>
                </div>
              </div>

              <p
                className={`text-sm sm:text-base font-extrabold shrink-0 pt-0.5 ${
                  isCancelled ? 'text-slate-400' : 'text-slate-900'
                }`}
              >
                {formatCurrency(lineTotal)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tổng tiền tạm tính */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
          <span>Tạm tính</span>
          <span className="font-bold text-slate-800">
            {formatCurrency(summary.subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base sm:text-lg font-extrabold text-slate-900">
            Tổng cộng
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-orange-600">
            {formatCurrency(summary.subtotal)}
          </span>
        </div>
      </div>

      <button
        onClick={() => setShowConfirmModal(true)}
        className="w-full py-4 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Send className="w-5 h-5" />
        <span>Yêu cầu thanh toán</span>
      </button>

      {/* Popup xác nhận thanh toán Có / Không */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm p-5 sm:p-6 space-y-4 shadow-lg">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 text-center">
              Xác nhận thanh toán
            </h3>

            <div className="bg-[#FFF3E6] p-3.5 space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Bàn:</span>
                <span className="font-bold text-slate-900">{activeOrder.tableName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Đơn hàng:</span>
                <span className="font-bold text-slate-900">{activeOrder.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tổng cộng:</span>
                <span className="font-extrabold text-orange-600">
                  {formatCurrency(summary.subtotal)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
              >
                Không
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Có</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
