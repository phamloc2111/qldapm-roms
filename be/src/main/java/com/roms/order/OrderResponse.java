package com.roms.order;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(UUID id, UUID tableId, String tableName, OrderStatus status,
                            Instant createdAt, Instant submittedAt, List<OrderItemResponse> items) {

    public static OrderResponse from(RestaurantOrder order) {
        return new OrderResponse(order.getId(), order.getTable().getId(), order.getTable().getName(),
                order.getStatus(), order.getCreatedAt(), order.getSubmittedAt(),
                order.getItems().stream().map(OrderItemResponse::from).toList());
    }

    public record OrderItemResponse(UUID id, UUID menuItemId, String name, long unitPriceVnd,
                                    int quantity, String note, OrderItemStatus status) {
        static OrderItemResponse from(OrderItem item) {
            return new OrderItemResponse(item.getId(), item.getMenuItem().getId(), item.getItemName(),
                    item.getUnitPriceVnd(), item.getQuantity(), item.getNote(), item.getStatus());
        }
    }
}