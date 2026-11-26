// Covers PaymentService bill calculation, validation, persistence, and payment state transitions.
package com.roms.unit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.roms.auth.AccountService;
import com.roms.menu.Category;
import com.roms.menu.MenuItem;
import com.roms.order.*;
import com.roms.payment.*;
import com.roms.table.RestaurantTable;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock OrderService orderService;
    @Mock InvoiceRepository invoices;
    @Mock PaymentRepository payments;
    @Mock AccountService accountService;

    private PaymentService service;
    private RestaurantOrder order;
    private UUID orderId;

    @BeforeEach
    void setUp() {
        service = new PaymentService(orderService, invoices, payments, accountService);
        RestaurantTable table = new RestaurantTable("T1", 4);
        Category category = new Category("Food");
        MenuItem menuItem = new MenuItem(category, "Soup", "", 12501, "");
        order = new RestaurantOrder(table);
        OrderItem item = new OrderItem(menuItem, 3, null);
        item.serve();
        order.addItem(item);
        order.refreshStatus();
        order.requestPayment();
        orderId = UUID.randomUUID();
        when(orderService.findOrderForPayment(orderId)).thenReturn(order);
    }

    // Tính subtotal, discount, VAT làm tròn HALF_UP và tổng hóa đơn chính xác.
    @Test
    void previewCalculatesDiscountAndRoundsVatHalfUp() {
        PaymentService.BillResponse bill = service.preview(orderId, 1000);

        assertEquals(37503, bill.subtotalVnd());
        assertEquals(1000, bill.discountVnd());
        assertEquals(2920, bill.vatVnd());
        assertEquals(39423, bill.totalVnd());
        assertEquals(1, bill.items().size());
        assertEquals(12501, bill.items().get(0).unitPriceVnd());
        assertEquals(37503, bill.items().get(0).lineTotalVnd());
    }

    // Từ chối discount âm hoặc lớn hơn subtotal.
    @Test
    void previewRejectsNegativeDiscountAndDiscountAboveSubtotal() {
        for (long discount : new long[]{-1, 37504}) {
            ResponseStatusException error = assertThrows(ResponseStatusException.class,
                    () -> service.preview(orderId, discount));
            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }
    }

    // Lưu invoice/payment hợp lệ và ủy quyền chuyển order sang trạng thái đã trả.
    @Test
    void payPersistsInvoiceAndPaymentAndDelegatesOrderPaidTransition() {
        when(accountService.getCurrentActorDisplayName()).thenReturn("test-cashier");
        when(invoices.findByOrder_Id(orderId)).thenReturn(Optional.empty());
        when(invoices.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(payments.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentService.PaymentResponse result = service.pay(orderId, 1000, PaymentMethod.CASH);

        assertEquals(39423, result.amountVnd());
        assertEquals(PaymentMethod.CASH, result.method());
        assertEquals("test-cashier", result.cashierName());
        assertEquals(OrderStatus.PAYMENT_REQUESTED, order.getStatus());
        verify(invoices).save(argThat(invoice -> invoice.getSubtotalVnd() == 37503
                && invoice.getDiscountVnd() == 1000 && invoice.getVatVnd() == 2920 && invoice.getTotalVnd() == 39423
                && "test-cashier".equals(invoice.getCashierName())));
        verify(payments).save(argThat(payment -> payment.getAmountVnd() == 39423
                && payment.getMethod() == PaymentMethod.CASH));
        verify(orderService).markOrderPaid(order);
    }

    // Không thanh toán order chưa ở trạng thái PAYMENT_REQUESTED.
    @Test
    void payRejectsOrderThatHasNotRequestedPayment() {
        order.markPaid();

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.pay(orderId, 0, PaymentMethod.CASH));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(invoices, never()).save(any());
        verify(payments, never()).save(any());
    }

    // Chặn thanh toán lần hai nếu order đã có invoice.
    @Test
    void payRejectsOrderWithExistingInvoice() {
        when(invoices.findByOrder_Id(orderId)).thenReturn(Optional.of(new Invoice(order, 37503, 0, 3000, 40503)));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.pay(orderId, 0, PaymentMethod.CASH));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(invoices, never()).save(any());
        verify(payments, never()).save(any());
    }
}
