// Covers OrderService creation, adding rounds, lifecycle guards, cancellation, and realtime events.
package com.roms.unit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.roms.auth.AccountService;
import com.roms.menu.Category;
import com.roms.menu.MenuItem;
import com.roms.menu.MenuItemRepository;
import com.roms.order.*;
import com.roms.realtime.RealtimeEventService;
import com.roms.table.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository orders;
    @Mock OrderItemRepository orderItems;
    @Mock TableRepository tables;
    @Mock MenuItemRepository menuItems;
    @Mock RealtimeEventService events;
    @Mock AccountService accountService;

    private OrderService service;
    private RestaurantTable table;
    private MenuItem menuItem;
    private UUID tableId;
    private UUID menuItemId;

    @BeforeEach
    void setUp() {
        service = new OrderService(orders, orderItems, tables, menuItems, events, accountService);
        table = new RestaurantTable("T1", 4);
        Category category = new Category("Food");
        menuItem = new MenuItem(category, "Soup", "", 12501, "");
        tableId = UUID.randomUUID();
        menuItemId = UUID.randomUUID();
        ReflectionTestUtils.setField(table, "id", tableId);
        ReflectionTestUtils.setField(menuItem, "id", menuItemId);
    }

    private void stubAvailableOrderContext() {
        when(tables.findById(tableId)).thenReturn(Optional.of(table));
        when(orders.findFirstByTable_IdAndStatusIn(eq(tableId), anyCollection())).thenReturn(Optional.empty());
        when(menuItems.findById(menuItemId)).thenReturn(Optional.of(menuItem));
        when(orders.save(any(RestaurantOrder.class))).thenAnswer(invocation -> {
            RestaurantOrder saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });
    }

    // Tạo order hợp lệ phải snapshot giá món, chiếm bàn và phát realtime events.
    @Test
    void createAndSubmitSnapshotsMenuPriceAndOccupiesTable() {
        stubAvailableOrderContext();
        when(accountService.getCurrentActorDisplayName()).thenReturn("test-user");
        OrderResponse response = service.createAndSubmit(tableId,
                List.of(new OrderService.CreateOrderItem(menuItemId, 2, "less salt")));

        assertEquals(OrderStatus.SUBMITTED, response.status());
        assertEquals(1, response.roundCount());
        assertEquals(1, response.items().size());
        assertEquals("Soup", response.items().get(0).name());
        assertEquals(12501, response.items().get(0).unitPriceVnd());
        assertEquals(2, response.items().get(0).quantity());
        assertEquals("less salt", response.items().get(0).note());
        assertEquals("test-user", response.createdByName());
        assertEquals("test-user", response.items().get(0).orderedByName());
        assertEquals(TableStatus.OCCUPIED, table.getStatus());
        verify(events).orderSubmitted(any(UUID.class), any(OrderResponse.class));
        verify(events).tableStatusChanged(any(UUID.class), any(OrderService.TableStatusChanged.class));
    }

    // Không tạo order cho bàn đã soft-delete và không phát event khi thất bại.
    @Test
    void createAndSubmitRejectsInactiveTableAndDoesNotSave() {
        RestaurantTable inactive = new RestaurantTable("T2", 2);
        inactive.deactivate();
        when(tables.findById(tableId)).thenReturn(Optional.of(inactive));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.createAndSubmit(tableId, List.of(new OrderService.CreateOrderItem(menuItemId, 1, null))));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(orders, never()).save(any());
        verifyNoInteractions(events);
    }

    // Từ chối order thứ hai khi bàn đã có order đang hoạt động.
    @Test
    void createAndSubmitRejectsSecondActiveOrderForSameTable() {
        when(tables.findById(tableId)).thenReturn(Optional.of(table));
        when(orders.findFirstByTable_IdAndStatusIn(eq(tableId), anyCollection()))
                .thenReturn(Optional.of(new RestaurantOrder(table)));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.createAndSubmit(tableId, List.of(new OrderService.CreateOrderItem(menuItemId, 1, null))));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(menuItems, never()).findById(any());
        verify(orders, never()).save(any());
    }

    // Không tạo order với món hết hàng và giữ nguyên trạng thái bàn.
    @Test
    void createAndSubmitRejectsUnavailableMenuItemWithoutChangingTable() {
        when(tables.findById(tableId)).thenReturn(Optional.of(table));
        when(orders.findFirstByTable_IdAndStatusIn(eq(tableId), anyCollection())).thenReturn(Optional.empty());
        when(menuItems.findById(menuItemId)).thenReturn(Optional.of(menuItem));
        menuItem.setAvailable(false);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.createAndSubmit(tableId, List.of(new OrderService.CreateOrderItem(menuItemId, 1, null))));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(TableStatus.AVAILABLE, table.getStatus());
        verify(orders, never()).save(any());
        verifyNoInteractions(events);
    }

    // Không cho hoàn tất món đang PENDING trước khi bếp bắt đầu chế biến.
    @Test
    void completeItemRejectsItemThatHasNotStartedCooking() {
        UUID itemId = UUID.randomUUID();
        OrderItem item = new OrderItem(menuItem, 1, null);
        when(orderItems.findById(itemId)).thenReturn(Optional.of(item));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.completeItem(itemId));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(OrderItemStatus.PENDING, item.getStatus());
        verifyNoInteractions(events);
    }

    // Hủy món pending cuối cùng phải đóng order và giải phóng bàn.
    @Test
    void cancellingLastPendingItemClosesOrderAndMakesTableAvailable() {
        UUID itemId = UUID.randomUUID();
        RestaurantOrder order = new RestaurantOrder(table);
        OrderItem item = new OrderItem(menuItem, 1, null);
        order.addItem(item);
        when(orderItems.findById(itemId)).thenReturn(Optional.of(item));

        OrderResponse response = service.cancelItem(itemId);

        assertEquals(OrderStatus.CLOSED, response.status());
        assertEquals(OrderItemStatus.CANCELLED, response.items().get(0).status());
        assertEquals(TableStatus.AVAILABLE, table.getStatus());
    }

    // Thêm món vào order mở phải tăng round và phát event với order mới.
    @Test
    void addItemsCreatesNextRoundAndPublishesUpdatedOrder() {
        UUID orderId = UUID.randomUUID();
        RestaurantOrder order = new RestaurantOrder(table);
        ReflectionTestUtils.setField(order, "id", orderId);
        order.addItem(new OrderItem(menuItem, 1, null));
        order.submit();
        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(menuItems.findById(menuItemId)).thenReturn(Optional.of(menuItem));
        when(accountService.getCurrentActorDisplayName()).thenReturn("test-user");
        when(orders.save(any(RestaurantOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = service.addItems(orderId,
                List.of(new OrderService.CreateOrderItem(menuItemId, 2, "extra")));

        assertEquals(2, response.roundCount());
        assertEquals(2, response.items().size());
        assertEquals(2, response.items().get(1).round());
        assertEquals("test-user", response.items().get(1).orderedByName());
        assertEquals(OrderStatus.SUBMITTED, response.status());
        verify(events).orderSubmitted(eq(orderId), any(OrderResponse.class));
        verify(events).itemStatusChanged(eq(orderId), any(OrderResponse.class));
    }

    // Không cho thêm món vào order đã thanh toán và không tra cứu món mới.
    @Test
    void addItemsRejectsPaidOrdersWithoutLookingUpRequestedItems() {
        UUID orderId = UUID.randomUUID();
        RestaurantOrder order = new RestaurantOrder(table);
        order.markPaid();
        when(orders.findById(orderId)).thenReturn(Optional.of(order));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.addItems(orderId, List.of(new OrderService.CreateOrderItem(menuItemId, 1, null))));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verify(menuItems, never()).findById(any());
        verify(orders, never()).save(any());
    }
}
