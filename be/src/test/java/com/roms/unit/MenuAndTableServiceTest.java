// Covers MenuService and TableService filtering, updates, availability events, and business guards.
package com.roms.unit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.roms.menu.*;
import com.roms.realtime.RealtimeEventService;
import com.roms.table.*;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class MenuAndTableServiceTest {
    @Mock CategoryRepository categories;
    @Mock MenuItemRepository menuItems;
    @Mock RealtimeEventService events;
    @Mock TableRepository tables;

    private MenuService menuService;
    private TableService tableService;

    @BeforeEach
    void setUp() {
        menuService = new MenuService(categories, menuItems, events);
        tableService = new TableService(tables);
    }

    // Tên danh mục được trim trước khi lưu.
    @Test
    void createCategoryTrimsNameBeforeSaving() {
        menuService.createCategory("  Drinks  ");

        verify(categories).save(argThat(category -> category.getName().equals("Drinks")));
    }

    // Chọn đúng truy vấn repository theo bộ lọc availableOnly.
    @Test
    void getMenuUsesRepositoryQueryMatchingAvailabilityFilter() {
        menuService.getMenu(true);
        menuService.getMenu(false);

        verify(menuItems).findAllByActiveTrueAndCategory_ActiveTrueAndAvailableTrueOrderByNameAsc();
        verify(menuItems).findAllByActiveTrueAndCategory_ActiveTrueOrderByNameAsc();
    }

    // Cập nhật availability đồng thời phát event đúng ID, tên và trạng thái mới.
    @Test
    void setAvailabilityPublishesTheChangedMenuItem() {
        UUID id = UUID.randomUUID();
        Category category = new Category("Food");
        MenuItem item = new MenuItem(category, "Soup", "", 10000, "");
        ReflectionTestUtils.setField(item, "id", id);
        when(menuItems.findById(id)).thenReturn(Optional.of(item));

        MenuItem changed = menuService.setAvailability(id, false);

        assertFalse(changed.isAvailable());
        verify(events).menuAvailabilityChanged(eq(id), argThat(payload ->
                payload instanceof MenuService.AvailabilityChanged availability
                        && availability.menuItemId().equals(id)
                        && availability.name().equals("Soup")
                        && !availability.available()));
    }

    // Không tạo món thuộc danh mục đã ngừng hoạt động.
    @Test
    void inactiveCategoryIsNotFoundWhenCreatingMenuItem() {
        UUID id = UUID.randomUUID();
        Category inactive = new Category("Archived");
        inactive.deactivate();
        when(categories.findById(id)).thenReturn(Optional.of(inactive));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> menuService.createMenuItem(id, "Soup", "", 10000, ""));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verify(menuItems, never()).save(any());
    }

    // Cập nhật tên bàn đã trim và capacity mới.
    @Test
    void updateTableTrimsNameAndChangesCapacity() {
        UUID id = UUID.randomUUID();
        RestaurantTable table = new RestaurantTable("Old", 2);
        when(tables.findById(id)).thenReturn(Optional.of(table));

        RestaurantTable updated = tableService.update(id, "  Patio  ", 6);

        assertEquals("Patio", updated.getName());
        assertEquals(6, updated.getCapacity());
    }

    // Không soft-delete bàn đang có khách và giữ bàn active khi bị từ chối.
    @Test
    void cannotDeactivateOccupiedTable() {
        UUID id = UUID.randomUUID();
        RestaurantTable table = new RestaurantTable("T1", 4);
        table.updateStatus(TableStatus.OCCUPIED);
        when(tables.findById(id)).thenReturn(Optional.of(table));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> tableService.deactivate(id));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertTrue(table.isActive());
    }
}
