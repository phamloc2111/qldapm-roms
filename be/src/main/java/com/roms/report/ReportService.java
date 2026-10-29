package com.roms.report;

import com.roms.order.OrderItem;
import com.roms.order.OrderItemStatus;
import com.roms.payment.Invoice;
import com.roms.payment.InvoiceRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final InvoiceRepository invoiceRepository;

    public ReportService(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    public DailyRevenueReport getRevenue(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now(REPORT_ZONE);
        Instant start = targetDate.atStartOfDay(REPORT_ZONE).toInstant();
        Instant end = targetDate.plusDays(1).atStartOfDay(REPORT_ZONE).toInstant();

        List<Invoice> invoices = invoiceRepository.findAllByCreatedAtBetween(start, end);
        long count = invoices.size();
        long subtotal = invoices.stream().mapToLong(Invoice::getSubtotalVnd).sum();
        long discount = invoices.stream().mapToLong(Invoice::getDiscountVnd).sum();
        long vat = invoices.stream().mapToLong(Invoice::getVatVnd).sum();
        long totalRevenue = invoices.stream().mapToLong(Invoice::getTotalVnd).sum();

        return new DailyRevenueReport(targetDate, count, subtotal, discount, vat, totalRevenue);
    }

    public List<TopItemReport> getTopItems(LocalDate date, int limit) {
        LocalDate targetDate = date != null ? date : LocalDate.now(REPORT_ZONE);
        Instant start = targetDate.atStartOfDay(REPORT_ZONE).toInstant();
        Instant end = targetDate.plusDays(1).atStartOfDay(REPORT_ZONE).toInstant();

        List<Invoice> invoices = invoiceRepository.findAllByCreatedAtBetween(start, end);
        Map<UUID, ItemAggregation> map = new HashMap<>();

        for (Invoice invoice : invoices) {
            for (OrderItem item : invoice.getOrder().getItems()) {
                if (item.getStatus() == OrderItemStatus.SERVED) {
                    UUID menuItemId = item.getMenuItem().getId();
                    ItemAggregation agg = map.computeIfAbsent(menuItemId,
                            k -> new ItemAggregation(menuItemId, item.getItemName()));
                    agg.add(item.getQuantity(), item.getQuantity() * item.getUnitPriceVnd());
                }
            }
        }

        int max = limit > 0 ? limit : 10;
        return map.values().stream()
                .sorted(Comparator.comparingInt(ItemAggregation::getQuantitySold).reversed()
                        .thenComparing(Comparator.comparingLong(ItemAggregation::getTotalRevenueVnd).reversed()))
                .limit(max)
                .map(a -> new TopItemReport(a.menuItemId, a.itemName, a.quantitySold, a.totalRevenueVnd))
                .toList();
    }

    public DailySummaryReport getDailySummary(LocalDate date, int limit) {
        DailyRevenueReport revenue = getRevenue(date);
        List<TopItemReport> topItems = getTopItems(date, limit);
        return new DailySummaryReport(revenue, topItems);
    }

    private static class ItemAggregation {
        private final UUID menuItemId;
        private final String itemName;
        private int quantitySold;
        private long totalRevenueVnd;

        ItemAggregation(UUID menuItemId, String itemName) {
            this.menuItemId = menuItemId;
            this.itemName = itemName;
        }

        void add(int qty, long revenue) {
            this.quantitySold += qty;
            this.totalRevenueVnd += revenue;
        }

        int getQuantitySold() { return quantitySold; }
        long getTotalRevenueVnd() { return totalRevenueVnd; }
    }

    public record DailyRevenueReport(
            LocalDate date,
            long totalOrdersCompleted,
            long subtotalVnd,
            long discountVnd,
            long vatVnd,
            long totalRevenueVnd
    ) { }

    public record TopItemReport(
            UUID menuItemId,
            String itemName,
            int quantitySold,
            long totalRevenueVnd
    ) { }

    public record DailySummaryReport(
            DailyRevenueReport revenue,
            List<TopItemReport> topItems
    ) { }
}
