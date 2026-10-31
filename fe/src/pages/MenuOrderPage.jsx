import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Send,
  ShoppingCart,
  Pencil,
  X,
  Check,
  CheckCircle2,
  ListChecks,
  Home,
} from 'lucide-react';
import { useRoms } from '../context/RomsContext';
import { CATEGORIES } from '../data/mockData';
import { RestaurantTableSvg } from '../components/common/TableIcon';
import { formatCurrency } from '../utils/formatters';

export default function MenuOrderPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const {
    tables,
    selectedTable,
    menuItems,
    getCartForTable,
    addToCart,
    updateCartQuantity,
    updateCartNote,
    removeFromCart,
    submitCartToKitchen,
  } = useRoms();

  const currentTableId = tableId || selectedTable?.id || 'T4';
  const currentTable = useMemo(
    () => tables.find((t) => t.id === currentTableId) || tables[0],
    [tables, currentTableId]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [guestCount, setGuestCount] = useState(currentTable?.guests || 2);
  const [step, setStep] = useState('MENU'); // 'MENU' | 'CONFIRM'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  const cartItems = getCartForTable(currentTable.id);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory =
        selectedCategory === 'ALL' || item.categoryId === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const groupedMenu = useMemo(() => {
    return CATEGORIES.filter((cat) => cat.id !== 'ALL')
      .map((cat) => ({
        ...cat,
        items: filteredMenu.filter((item) => item.categoryId === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredMenu]);

  const cartSummary = useMemo(() => {
    const totalItemsCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const newSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const existingSubtotal = currentTable?.orderSummary?.subtotal || 0;
    return {
      totalItemsCount,
      newSubtotal,
      existingSubtotal,
      combinedTotal: existingSubtotal + newSubtotal,
    };
  }, [cartItems, currentTable]);

  const handleConfirmSendToKitchen = () => {
    setShowConfirmModal(false);
    const res = submitCartToKitchen(currentTable.id, guestCount);
    if (res && res.ok) {
      setSubmittedResult(res);
    }
  };

  if (submittedResult) {
    return (
      <div className="max-w-lg w-full min-w-0 mx-auto bg-white p-6 sm:p-8 shadow-sm text-center space-y-5 animate-fade-in">
        <div className="w-20 h-20 bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-11 h-11" />
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Đã gửi xuống bếp!
        </h2>

        <div className="p-4 bg-[#FFF8F1] text-left space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Bàn:</span>
            <span className="font-bold text-slate-900">{currentTable.name}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Đơn hàng:</span>
            <span className="font-bold text-orange-600">
              {submittedResult.order?.code}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigate('/tracking')}
            className="py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ListChecks className="w-4 h-4 shrink-0" />
            <span>Theo dõi món</span>
          </button>
          <button
            onClick={() => navigate('/tables')}
            className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Sơ đồ bàn</span>
          </button>
        </div>
      </div>
    );
  }

  const isAddingToOpenOrder = Boolean(currentTable?.activeOrder);

  // BƯỚC 2: XÁC NHẬN ĐƠN HÀNG & GỬI XUỐNG BẾP
  if (step === 'CONFIRM' && cartItems.length > 0) {
    return (
      <div className="max-w-2xl w-full min-w-0 mx-auto bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5 animate-fade-in">
        {/* Tiêu đề <- Đơn hàng */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setStep('MENU')}
            className="p-2 rounded-xl hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-colors shrink-0 cursor-pointer"
            aria-label="Quay lại thực đơn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
            {isAddingToOpenOrder
              ? `Đơn hàng ${currentTable.activeOrder.code}`
              : 'Đơn hàng mới'}
          </h1>
        </div>

        {/* Thẻ thông tin Bàn & Số khách */}
        <div className="p-3.5 bg-[#FFF4E8] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <RestaurantTableSvg className="w-6 h-6 text-orange-600 shrink-0" />
            <span className="font-extrabold text-slate-900 text-sm sm:text-base">
              {currentTable.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600">
            <span>Khách:</span>
            <input
              type="number"
              min={1}
              max={20}
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-10 text-center py-0.5 px-1 bg-white border-0 font-bold text-slate-900 focus:outline-none"
            />
            <span>người</span>
          </div>
        </div>

        {/* Danh sách các món đã chọn kèm ô ghi chú riêng */}
        <div className="divide-y divide-slate-200">
          {cartItems.map((item) => (
            <div
              key={item.dishId}
              className="py-3.5 first:pt-1 last:pb-1 bg-transparent rounded-none space-y-3"
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-none object-cover shrink-0 bg-slate-200"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full p-1 shrink-0">
                  <button
                    onClick={() => updateCartQuantity(currentTable.id, item.dishId, -1)}
                    className="w-7 h-7 rounded-full bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 min-w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(currentTable.id, item.dishId, 1)}
                    className="w-7 h-7 rounded-full bg-white hover:bg-orange-50 text-orange-600 flex items-center justify-center font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Trường ghi chú riêng cho từng món */}
              <div className="relative flex items-center">
                <Pencil className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) =>
                    updateCartNote(currentTable.id, item.dishId, e.target.value)
                  }
                  aria-label={`Ghi chú cho món ${item.name}`}
                  className="w-full pl-8 pr-8 py-2 bg-slate-100 border-0 text-xs font-medium text-slate-700 focus:outline-none"
                />
                {item.note ? (
                  <button
                    onClick={() => updateCartNote(currentTable.id, item.dishId, '')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => removeFromCart(currentTable.id, item.dishId)}
                    className="absolute right-2.5 text-slate-300 hover:text-rose-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Nút + Thêm món khác */}
        <button
          type="button"
          onClick={() => {
            setStep('MENU');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Thêm món khác</span>
        </button>

        {/* Tổng tiền tạm tính & Nút Gửi xuống bếp */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
            <span>Tạm tính</span>
            <span className="font-bold text-slate-800">
              {formatCurrency(cartSummary.newSubtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm sm:text-base font-extrabold text-slate-900">
              Tổng cộng
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-orange-600">
              {formatCurrency(cartSummary.newSubtotal)}
            </span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all bg-orange-500 hover:bg-orange-600 text-white active:scale-[0.99] cursor-pointer"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>Gửi xuống bếp</span>
          </button>
        </div>

        {/* Hộp thoại Xác nhận trước khi gửi xuống bếp */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm p-5 sm:p-6 space-y-4 shadow-lg">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 text-center">
                Xác nhận gửi xuống bếp
              </h3>

              <div className="bg-[#FFF4E8] p-3.5 space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Bàn:</span>
                  <span className="font-bold text-slate-900">{currentTable.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Số lượng:</span>
                  <span className="font-bold text-slate-900">
                    {cartSummary.totalItemsCount} món
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tổng tiền:</span>
                  <span className="font-extrabold text-orange-600">
                    {formatCurrency(cartSummary.newSubtotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendToKitchen}
                  className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Xác nhận</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // BƯỚC 1: CHỌN MÓN TRÊN THỰC ĐƠN
  return (
    <div className="max-w-2xl w-full min-w-0 mx-auto bg-white p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5 animate-fade-in">
      {/* Tiêu đề <- Thực đơn */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/tables')}
          className="p-2 rounded-xl hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-colors shrink-0 cursor-pointer"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
          Thực đơn
        </h1>
      </div>

      {/* Thanh tìm kiếm món ăn */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Tìm kiếm món ăn"
          className="w-full pl-11 pr-10 py-3 bg-slate-100 border-0 text-sm font-medium text-slate-800 focus:outline-none transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bộ lọc danh mục */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
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

      {/* Danh sách món ăn tách theo từng danh mục có tiêu đề phía trước */}
      <div
        className={`space-y-6 ${
          cartSummary.totalItemsCount > 0 ? 'pb-16 md:pb-0' : ''
        }`}
      >
        {groupedMenu.map((group) => (
          <div key={group.id} className="space-y-2">
            <h2 className="text-base sm:text-lg font-extrabold text-orange-600 pt-1">
              {group.name}
            </h2>

            <div className="divide-y divide-slate-200">
              {group.items.map((dish) => {
                const inCart = cartItems.find((c) => c.dishId === dish.id);
                const quantity = inCart?.quantity || 0;

                return (
                  <div
                    key={dish.id}
                    className={`py-3.5 first:pt-2 last:pb-1 bg-transparent rounded-none flex items-center justify-between gap-2.5 sm:gap-4 ${
                      !dish.available ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-15 h-15 sm:w-18 sm:h-18 rounded-none object-cover bg-slate-100 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                            {dish.name}
                          </h3>
                          {!dish.available && (
                            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 bg-rose-100/80 text-rose-700 shrink-0">
                              Hết hàng
                            </span>
                          )}
                        </div>

                        <p className="text-sm sm:text-base font-extrabold text-emerald-700 mt-1">
                          {formatCurrency(dish.price)}
                        </p>
                      </div>
                    </div>

                    {/* Nút thêm món (+) hoặc bộ điều chỉnh số lượng (- 1 +) */}
                    <div className="shrink-0">
                      {!dish.available ? null : quantity > 0 ? (
                        <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full p-1">
                          <button
                            onClick={() => updateCartQuantity(currentTable.id, dish.id, -1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center font-bold cursor-pointer"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 min-w-4 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(currentTable.id, dish.id, 1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-orange-600 hover:bg-orange-50 flex items-center justify-center font-bold cursor-pointer"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(currentTable.id, dish)}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                          aria-label={`Thêm ${dish.name}`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Thanh giỏ hàng luôn bám sát mép dưới màn hình / sát thanh nav */}
      {cartSummary.totalItemsCount > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 md:left-28 lg:left-56 right-0 z-30 bg-white rounded-none shadow-none px-4 sm:px-6 py-3 animate-fade-in">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
            <button
              onClick={() => {
                setStep('CONFIRM');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer"
            >
              <div className="relative p-2.5 bg-orange-50 text-orange-600 shrink-0">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-extrabold flex items-center justify-center">
                  {cartSummary.totalItemsCount}
                </span>
              </div>
              <p className="text-xs sm:text-base font-extrabold text-slate-900">
                {cartSummary.totalItemsCount} món •{' '}
                {formatCurrency(cartSummary.newSubtotal)}
              </p>
            </button>

            <button
              onClick={() => {
                setStep('CONFIRM');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="py-3 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>Xác nhận</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
