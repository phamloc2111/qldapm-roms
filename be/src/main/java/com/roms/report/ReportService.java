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
        List<InvoiceHistoryItem> invoices = getInvoices(date);
        return new DailySummaryReport(revenue, topItems, invoices);
    }

    public List<InvoiceHistoryItem> getInvoices(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now(REPORT_ZONE);
        Instant start = targetDate.atStartOfDay(REPORT_ZONE).toInstant();
        Instant end = targetDate.plusDays(1).atStartOfDay(REPORT_ZONE).toInstant();

        List<Invoice> invoices = invoiceRepository.findAllByCreatedAtBetween(start, end);
        return invoices.stream()
                .sorted(Comparator.comparing(Invoice::getCreatedAt).reversed())
                .map(inv -> {
                    var order = inv.getOrder();
                    String invCode = "HD-" + inv.getId().toString().replace("-", "").substring(0, 8).toUpperCase();
                    String ordCode = "#" + order.getId().toString().replace("-", "").substring(0, 4).toUpperCase();
                    String tableName = order.getTable() != null ? order.getTable().getName() : "Bàn";
                    List<InvoiceLineReport> lines = order.getItems().stream()
                            .filter(it -> it.getStatus() == OrderItemStatus.SERVED)
                            .map(it -> new InvoiceLineReport(
                                    it.getId(),
                                    it.getItemName(),
                                    it.getQuantity(),
                                    it.getUnitPriceVnd(),
                                    it.getUnitPriceVnd() * it.getQuantity(),
                                    it.getRoundNumber(),
                                    it.getOrderedByName(),
                                    it.getCookedByName(),
                                    it.getServedByName()
                            ))
                            .toList();
                    return new InvoiceHistoryItem(
                            inv.getId(),
                            invCode,
                            order.getId(),
                            ordCode,
                            tableName,
                            inv.getCreatedAt(),
                            inv.getCashierName() != null ? inv.getCashierName() : "Thu ngân",
                            order.getCreatedByName(),
                            inv.getSubtotalVnd(),
                            inv.getDiscountVnd(),
                            inv.getVatVnd(),
                            inv.getTotalVnd(),
                            lines
                    );
                })
                .toList();
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
            List<TopItemReport> topItems,
            List<InvoiceHistoryItem> invoices
    ) { }

    public record InvoiceHistoryItem(
            UUID invoiceId,
            String invoiceCode,
            UUID orderId,
            String orderCode,
            String tableName,
            Instant paidAt,
            String cashierName,
            String createdByName,
            long subtotalVnd,
            long discountVnd,
            long vatVnd,
            long totalVnd,
            List<InvoiceLineReport> items
    ) { }

    public record InvoiceLineReport(
            UUID orderItemId,
            String name,
            int quantity,
            long unitPriceVnd,
            long lineTotalVnd,
            int round,
            String orderedByName,
            String cookedByName,
            String servedByName
    ) { }
}
