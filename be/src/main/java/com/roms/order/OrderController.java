package com.roms.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        List<OrderService.CreateOrderItem> items = request.items().stream()
                .map(item -> new OrderService.CreateOrderItem(item.menuItemId(), item.quantity(), item.note()))
                .toList();
        return orderService.createAndSubmit(request.tableId(), items);
    }

    @GetMapping("/orders/{id}")
    public OrderResponse getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id);
    }

    @PostMapping("/orders/{id}/request-payment")
    public OrderResponse requestPayment(@PathVariable UUID id) {
        return orderService.requestPayment(id);
    }

    @GetMapping("/kitchen/queue")
    public List<OrderResponse> getKitchenQueue() {
        return orderService.getKitchenQueue();
    }

    @PostMapping("/kitchen/order-items/{id}/start")
    public OrderResponse startItem(@PathVariable UUID id) {
        return orderService.startItem(id);
    }

    @PostMapping("/kitchen/order-items/{id}/done")
    public OrderResponse completeItem(@PathVariable UUID id) {
        return orderService.completeItem(id);
    }

    @PostMapping("/order-items/{id}/serve")
    public OrderResponse serveItem(@PathVariable UUID id) {
        return orderService.serveItem(id);
    }

    public record CreateOrderRequest(@NotNull UUID tableId, @NotEmpty List<@Valid CreateOrderItemRequest> items) { }

    public record CreateOrderItemRequest(@NotNull UUID menuItemId, @Min(1) int quantity, String note) { }
}