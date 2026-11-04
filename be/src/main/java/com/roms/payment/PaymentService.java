package com.roms.payment;

import com.roms.order.OrderItem;
import com.roms.order.OrderItemStatus;
import com.roms.order.OrderService;
import com.roms.order.OrderStatus;
import com.roms.order.RestaurantOrder;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class PaymentService {

    private static final BigDecimal VAT_RATE = new BigDecimal("0.08");

    private final OrderService orderService;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public PaymentService(OrderService orderService, InvoiceRepository invoiceRepository,
                          PaymentRepository paymentRepository) {
        this.orderService = orderService;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public BillResponse preview(UUID orderId, long discountVnd) {
        RestaurantOrder order = orderService.findOrderForPayment(orderId);
        return calculateBill(order, discountVnd, null);
    }

    public PaymentResponse pay(UUID orderId, long discountVnd, PaymentMethod method) {
        RestaurantOrder order = orderService.findOrderForPayment(orderId);
        if (order.getStatus() != OrderStatus.PAYMENT_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order chưa được yêu cầu thanh toán");
        }
        if (invoiceRepository.findByOrder_Id(orderId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Order đã được thanh toán");
        }

        BillResponse bill = calculateBill(order, discountVnd, null);
        Invoice invoice = invoiceRepository.save(new Invoice(order, bill.subtotalVnd(), bill.discountVnd(),
                bill.vatVnd(), bill.totalVnd()));
        Payment payment = paymentRepository.save(new Payment(invoice, bill.totalVnd(), method));
        orderService.markOrderPaid(order);
        return new PaymentResponse(invoice.getId(), payment.getId(), orderId, payment.getAmountVnd(),
                payment.getMethod(), payment.getPaidAt());
    }

    private BillResponse calculateBill(RestaurantOrder order, long discountVnd, UUID invoiceId) {
        List<BillLine> lines = order.getItems().stream()
                .filter(item -> item.getStatus() == OrderItemStatus.SERVED)
                .map(BillLine::from)
                .toList();
        long subtotal = lines.stream().mapToLong(BillLine::lineTotalVnd).reduce(0L, Math::addExact);
        if (discountVnd < 0 || discountVnd > subtotal) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Giảm giá phải từ 0 đến bằng tạm tính");
        }
        long taxableAmount = Math.subtractExact(subtotal, discountVnd);
        long vat = BigDecimal.valueOf(taxableAmount).multiply(VAT_RATE)
                .setScale(0, RoundingMode.HALF_UP).longValueExact();
        long total = Math.addExact(taxableAmount, vat);
        return new BillResponse(invoiceId, order.getId(), lines, subtotal, discountVnd, vat, total);
    }

    public record BillLine(UUID orderItemId, String name, int quantity, long unitPriceVnd, long lineTotalVnd) {
        static BillLine from(OrderItem item) {
            long lineTotal = Math.multiplyExact(item.getUnitPriceVnd(), item.getQuantity());
            return new BillLine(item.getId(), item.getItemName(), item.getQuantity(), item.getUnitPriceVnd(), lineTotal);
        }
    }

    public record BillResponse(UUID invoiceId, UUID orderId, List<BillLine> items,
                               long subtotalVnd, long discountVnd, long vatVnd, long totalVnd) { }

    public record PaymentResponse(UUID invoiceId, UUID paymentId, UUID orderId, long amountVnd,
                                  PaymentMethod method, java.time.Instant paidAt) { }
}