import React from 'react';
import { Clock, ChefHat, CheckCircle2, Check, XCircle } from 'lucide-react';
import { DISH_STATUS, DISH_STATUS_META } from '../../utils/constants';

export default function DishStatusBadge({ status, compact = false }) {
  const meta = DISH_STATUS_META[status] || DISH_STATUS_META[DISH_STATUS.PENDING];

  const renderIcon = () => {
    switch (status) {
      case DISH_STATUS.PENDING:
        return <Clock className="w-3.5 h-3.5 shrink-0" />;
      case DISH_STATUS.COOKING:
        return <ChefHat className="w-3.5 h-3.5 shrink-0" />;
      case DISH_STATUS.DONE:
        return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
      case DISH_STATUS.SERVED:
        return <Check className="w-3.5 h-3.5 shrink-0" />;
      case DISH_STATUS.CANCELLED:
        return <XCircle className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${meta.bgClass}`}
    >
      {renderIcon()}
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
}

