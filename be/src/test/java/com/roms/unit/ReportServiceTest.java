// Covers ReportService revenue aggregation, date ranges, served item ranking, and result limits.
package com.roms.unit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.roms.menu.Category;
import com.roms.menu.MenuItem;
import com.roms.order.OrderItem;
import com.roms.order.RestaurantOrder;
import com.roms.payment.Invoice;
import com.roms.payment.InvoiceRepository;
import com.roms.report.ReportService;
import com.roms.table.RestaurantTable;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock InvoiceRepository invoices;
    private ReportService service;

    @BeforeEach
    void setUp() {
        service = new ReportService(invoices);
    }

    // Truy vấn doanh thu dùng đầu ngày và đầu ngày kế tiếp theo múi giờ TP.HCM.
    @Test
    void revenueQueriesTheRequestedDayBoundsInHoChiMinhZone() {
        LocalDate date = LocalDate.of(2025, 4, 10);
        when(invoices.findAllByCreatedAtBetween(any(Instant.class), any(Instant.class))).thenReturn(List.of());

        ReportService.DailyRevenueReport report = service.getRevenue(date);

        ArgumentCaptor<Instant> from = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> to = ArgumentCaptor.forClass(Instant.class);
        verify(invoices).findAllByCreatedAtBetween(from.capture(), to.capture());
        assertEquals(date.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant(), from.getValue());
        assertEquals(date.plusDays(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant(), to.getValue());
        assertEquals(date, report.date());
        assertEquals(0, report.totalOrdersCompleted());
        assertEquals(0, report.totalRevenueVnd());
    }

    // Cộng chính xác số hóa đơn, subtotal, discount, VAT và tổng doanh thu.
    @Test
    void revenueSumsInvoiceAmounts() {
        RestaurantOrder order = new RestaurantOrder(new RestaurantTable("T1", 4));
        when(invoices.findAllByCreatedAtBetween(any(Instant.class), any(Instant.class))).thenReturn(List.of(
                new Invoice(order, 20000, 1000, 1520, 20520),
                new Invoice(order, 30000, 0, 2400, 32400)));

        ReportService.DailyRevenueReport report = service.getRevenue(LocalDate.of(2025, 4, 10));

        assertEquals(2, report.totalOrdersCompleted());
        assertEquals(50000, report.subtotalVnd());
        assertEquals(1000, report.discountVnd());
        assertEquals(3920, report.vatVnd());
        assertEquals(52920, report.totalRevenueVnd());
    }

    // Gộp số lượng món đã phục vụ, sắp xếp theo doanh thu khi số lượng bằng nhau và áp dụng limit.
    @Test
    void topItemsAggregatesServedQuantitiesAndHonorsLimit() {
        RestaurantOrder order = new RestaurantOrder(new RestaurantTable("T1", 4));
        MenuItem soup = new MenuItem(new Category("Food"), "Soup", "", 10000, "");
        MenuItem tea = new MenuItem(new Category("Drink"), "Tea", "", 5000, "");
        ReflectionTestUtils.setField(soup, "id", java.util.UUID.randomUUID());
        ReflectionTestUtils.setField(tea, "id", java.util.UUID.randomUUID());
        OrderItem firstSoup = new OrderItem(soup, 2, null);
        firstSoup.serve();
        OrderItem secondSoup = new OrderItem(soup, 1, null);
        secondSoup.serve();
        OrderItem teaItem = new OrderItem(tea, 3, null);
        teaItem.serve();
        order.addItem(firstSoup);
        order.addItem(secondSoup);
        order.addItem(teaItem);
        Invoice invoice = new Invoice(order, 50000, 0, 4000, 54000);
        when(invoices.findAllByCreatedAtBetween(any(Instant.class), any(Instant.class))).thenReturn(List.of(invoice));

        List<ReportService.TopItemReport> result = service.getTopItems(LocalDate.of(2025, 4, 10), 1);

        assertEquals(1, result.size());
        assertEquals("Soup", result.get(0).itemName());
        assertEquals(3, result.get(0).quantitySold());
        assertEquals(30000, result.get(0).totalRevenueVnd());
    }

    // Loại món chưa phục vụ khỏi báo cáo món bán chạy.
    @Test
    void topItemsExcludesItemsThatHaveNotBeenServed() {
        RestaurantOrder order = new RestaurantOrder(new RestaurantTable("T1", 4));
        MenuItem served = new MenuItem(new Category("Food"), "Soup", "", 10000, "");
        MenuItem pending = new MenuItem(new Category("Drink"), "Tea", "", 5000, "");
        ReflectionTestUtils.setField(served, "id", java.util.UUID.randomUUID());
        ReflectionTestUtils.setField(pending, "id", java.util.UUID.randomUUID());
        OrderItem servedItem = new OrderItem(served, 1, null);
        servedItem.serve();
        order.addItem(servedItem);
        order.addItem(new OrderItem(pending, 10, null));
        when(invoices.findAllByCreatedAtBetween(any(Instant.class), any(Instant.class)))
                .thenReturn(List.of(new Invoice(order, 10000, 0, 800, 10800)));

        List<ReportService.TopItemReport> result = service.getTopItems(LocalDate.of(2025, 4, 10), 10);

        assertEquals(1, result.size());
        assertEquals("Soup", result.get(0).itemName());
        assertEquals(1, result.get(0).quantitySold());
    }

    // Limit không dương phải dùng giới hạn mặc định 10.
    @Test
    void nonPositiveTopItemLimitFallsBackToTen() {
        when(invoices.findAllByCreatedAtBetween(any(Instant.class), any(Instant.class))).thenReturn(List.of());

        assertTrue(service.getTopItems(LocalDate.of(2025, 4, 10), 0).isEmpty());
        verify(invoices, times(1)).findAllByCreatedAtBetween(any(Instant.class), any(Instant.class));
    }
}
