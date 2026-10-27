package com.roms.order;

import com.roms.menu.MenuItem;
import com.roms.menu.MenuItemRepository;
import com.roms.realtime.RealtimeEventService;
import com.roms.table.RestaurantTable;
import com.roms.table.TableRepository;
import com.roms.table.TableStatus;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OrderService {

    private static final Set<OrderStatus> ACTIVE_STATUSES = Set.of(
            OrderStatus.OPEN, OrderStatus.SUBMITTED, OrderStatus.IN_PROGRESS,
            OrderStatus.READY, OrderStatus.SERVED, OrderStatus.PAYMENT_REQUESTED);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final TableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final RealtimeEventService realtimeEventService;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                        TableRepository tableRepository, MenuItemRepository menuItemRepository,
                        RealtimeEventService realtimeEventService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.tableRepository = tableRepository;
        this.menuItemRepository = menuItemRepository;
        this.realtimeEventService = realtimeEventService;
    }

    public OrderResponse createAndSubmit(UUID tableId, List<CreateOrderItem> requestedItems) {
        RestaurantTable table = tableRepository.findById(tableId)
                .filter(RestaurantTable::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bàn"));

        if (orderRepository.findFirstByTable_IdAndStatusIn(tableId, ACTIVE_STATUSES).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bàn đang có order chưa thanh toán");
        }

        RestaurantOrder order = new RestaurantOrder(table);
        for (CreateOrderItem requestedItem : requestedItems) {
            MenuItem menuItem = menuItemRepository.findById(requestedItem.menuItemId())
                    .filter(MenuItem::isActive)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món ăn"));
            if (!menuItem.isAvailable()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Món " + menuItem.getName() + " hiện đã hết hàng");
            }
            order.addItem(new OrderItem(menuItem, requestedItem.quantity(), requestedItem.note()));
        }

        order.submit();
        RestaurantOrder savedOrder = orderRepository.save(order);
        table.updateStatus(TableStatus.OCCUPIED);
        realtimeEventService.orderSubmitted(savedOrder.getId(), OrderResponse.from(savedOrder));
        realtimeEventService.tableStatusChanged(table.getId(), tableStatusPayload(table));
        return OrderResponse.from(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID id) {
        RestaurantOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy order"));
        return OrderResponse.from(order);
    }

    public OrderResponse requestPayment(UUID id) {
        RestaurantOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy order"));
        if (order.getStatus() != OrderStatus.SERVED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chỉ order đã phục vụ hết món mới có thể yêu cầu thanh toán");
        }
        order.requestPayment();
        order.getTable().updateStatus(TableStatus.PAYMENT_REQUESTED);
        OrderResponse response = OrderResponse.from(order);
        realtimeEventService.paymentRequested(order.getId(), response);
        realtimeEventService.tableStatusChanged(order.getTable().getId(), tableStatusPayload(order.getTable()));
        return response;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getPaymentRequests() {
        return orderRepository.findAllByStatusOrderBySubmittedAtAsc(OrderStatus.PAYMENT_REQUESTED)
                .stream().map(OrderResponse::from).toList();
    }

    public RestaurantOrder findOrderForPayment(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy order"));
    }

    public void markOrderPaid(RestaurantOrder order) {
        order.markPaid();
        order.getTable().updateStatus(TableStatus.AVAILABLE);
        realtimeEventService.paymentCompleted(order.getId(), OrderResponse.from(order));
        realtimeEventService.tableStatusChanged(order.getTable().getId(), tableStatusPayload(order.getTable()));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getKitchenQueue() {
        return orderRepository.findAllByStatusInOrderBySubmittedAtAsc(
                        Set.of(OrderStatus.SUBMITTED, OrderStatus.IN_PROGRESS))
                .stream()
                .map(OrderResponse::from)
                .toList();
    }

    public OrderResponse startItem(UUID itemId) {
        OrderItem item = findItem(itemId);
        if (item.getStatus() != OrderItemStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ món đang chờ mới có thể bắt đầu chế biến");
        }
        item.startCooking();
        return updateOrderAfterItemChange(item);
    }

    public OrderResponse completeItem(UUID itemId) {
        OrderItem item = findItem(itemId);
        if (item.getStatus() != OrderItemStatus.COOKING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ món đang nấu mới có thể hoàn thành");
        }
        item.complete();
        return updateOrderAfterItemChange(item);
    }

    public OrderResponse serveItem(UUID itemId) {
        OrderItem item = findItem(itemId);
        if (item.getStatus() != OrderItemStatus.DONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ món đã xong mới có thể phục vụ");
        }
        item.serve();
        return updateOrderAfterItemChange(item);
    }

    private OrderResponse updateOrderAfterItemChange(OrderItem item) {
        RestaurantOrder order = item.getOrder();
        order.refreshStatus();
        if (order.getStatus() == OrderStatus.READY) {
            order.getTable().updateStatus(TableStatus.READY_TO_SERVE);
        } else {
            order.getTable().updateStatus(TableStatus.OCCUPIED);
        }
        OrderResponse response = OrderResponse.from(order);
        realtimeEventService.itemStatusChanged(order.getId(), response);
        realtimeEventService.tableStatusChanged(order.getTable().getId(), tableStatusPayload(order.getTable()));
        return response;
    }

    private TableStatusChanged tableStatusPayload(RestaurantTable table) {
        return new TableStatusChanged(table.getId(), table.getName(), table.getStatus());
    }

    private OrderItem findItem(UUID id) {
        return orderItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy món trong order"));
    }

    public record CreateOrderItem(UUID menuItemId, int quantity, String note) { }
    public record TableStatusChanged(UUID tableId, String tableName, TableStatus status) { }
}