package com.roms.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import java.util.UUID;
import com.roms.order.OrderResponse;
import com.roms.order.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;

    public PaymentController(PaymentService paymentService, OrderService orderService) {
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    @GetMapping("/cashier/payment-requests")
    public List<OrderResponse> getPaymentRequests() {
        return orderService.getPaymentRequests();
    }

    @GetMapping("/orders/{id}/invoice/preview")
    public PaymentService.BillResponse preview(@PathVariable UUID id,
            @RequestParam(defaultValue = "0") @PositiveOrZero long discountVnd) {
        return paymentService.preview(id, discountVnd);
    }

    @PostMapping("/orders/{id}/pay")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentService.PaymentResponse pay(@PathVariable UUID id,
                                               @Valid @RequestBody PayRequest request) {
        return paymentService.pay(id, request.discountVnd(), request.method());
    }

    public record PayRequest(@PositiveOrZero long discountVnd, PaymentMethod method) {
        public PayRequest {
            if (method == null) {
                method = PaymentMethod.CASH;
            }
        }
    }
}