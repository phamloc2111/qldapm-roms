package com.roms.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration checks for daily revenue, top items, summary and report date boundaries. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {"DELETE FROM payments", "DELETE FROM invoices", "DELETE FROM order_items", "DELETE FROM orders", "DELETE FROM menu_items", "DELETE FROM categories", "DELETE FROM restaurant_tables"})
@WithMockUser(roles = "ADMIN")
class ReportIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @PersistenceContext EntityManager entityManager;

    @Test
    void dailyRevenueAndSummaryMatchCompletedPayment() throws Exception {
        // IT-RPT-001/007: compare revenue, top items and summary with an invoice created through the HTTP flow.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        String itemId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":12501}".formatted(categoryId)).get("id").asText();
        String tableId = create("/api/v1/tables", "{\"name\":\"R1\",\"capacity\":4}").get("id").asText();
        JsonNode order = create("/api/v1/orders", "{\"tableId\":\"%s\",\"items\":[{\"menuItemId\":\"%s\",\"quantity\":2}]}".formatted(tableId, itemId));
        String orderId = order.get("id").asText();
        String orderItemId = order.get("items").get(0).get("id").asText();

        mvc.perform(post("/api/v1/kitchen/order-items/{id}/start", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/kitchen/order-items/{id}/done", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/order-items/{id}/serve", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/orders/{id}/request-payment", orderId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/orders/{id}/pay", orderId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"discountVnd\":1000,\"method\":\"CASH\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.amountVnd").value(25922));

        String date = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();
        mvc.perform(get("/api/v1/reports/revenue").param("date", date))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalOrdersCompleted").value(1))
                .andExpect(jsonPath("$.subtotalVnd").value(25002)).andExpect(jsonPath("$.discountVnd").value(1000))
                .andExpect(jsonPath("$.vatVnd").value(1920)).andExpect(jsonPath("$.totalRevenueVnd").value(25922));
        mvc.perform(get("/api/v1/reports/top-items").param("date", date).param("limit", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].itemName").value("Soup"))
                .andExpect(jsonPath("$[0].quantitySold").value(2)).andExpect(jsonPath("$[0].totalRevenueVnd").value(25002));
        mvc.perform(get("/api/v1/reports/summary").param("date", date).param("limit", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.revenue.totalRevenueVnd").value(25922))
                .andExpect(jsonPath("$.topItems[0].quantitySold").value(2));
    }

    @Test
    void dateWithoutInvoicesReturnsZeroAndInvalidDateIsRejected() throws Exception {
        // IT-RPT-003: an empty date produces zero totals; a malformed date is rejected.
        String emptyDate = LocalDate.of(2001, 1, 1).toString();
        mvc.perform(get("/api/v1/reports/revenue").param("date", emptyDate))
                .andExpect(status().isOk()).andExpect(jsonPath("$.date").value(emptyDate))
                .andExpect(jsonPath("$.totalOrdersCompleted").value(0)).andExpect(jsonPath("$.totalRevenueVnd").value(0));
        mvc.perform(get("/api/v1/reports/revenue").param("date", "not-a-date"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void revenueFiltersInvoicesAroundHoChiMinhDayBounds() throws Exception {
        // IT-RPT-002: include the requested day and exclude invoices placed one second outside its bounds.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Boundary report\"}").get("id").asText();
        String itemId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Boundary dish\",\"priceVnd\":1000}".formatted(categoryId)).get("id").asText();
        String previousId = createPaidOrder("T-before-midnight", itemId, null);
        String startId = createPaidOrder("T-at-midnight", itemId, null);
        String lastSecondId = createPaidOrder("T-last-second", itemId, null);
        String nextDayId = createPaidOrder("T-after-midnight", itemId, null);
        LocalDate date = LocalDate.of(2025, 3, 10);
        Instant start = date.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        entityManager.flush();
        setInvoiceCreatedAt(previousId, start.minusSeconds(1));
        setInvoiceCreatedAt(startId, start);
        setInvoiceCreatedAt(lastSecondId, end.minusSeconds(1));
        setInvoiceCreatedAt(nextDayId, end.plusSeconds(1));

        mvc.perform(get("/api/v1/reports/revenue").param("date", date.toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.date").value(date.toString()))
                .andExpect(jsonPath("$.totalOrdersCompleted").value(2)).andExpect(jsonPath("$.subtotalVnd").value(2000));
    }

    @Test
    void topItemsAggregateServedItemsAcrossInvoicesAndExcludeCancelledItems() throws Exception {
        // IT-RPT-004: aggregate by menu item across invoices, and ignore an order item cancelled before serving.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        String soupId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":10000}".formatted(categoryId)).get("id").asText();
        String teaId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Tea\",\"priceVnd\":5000}".formatted(categoryId)).get("id").asText();
        String waterId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Water\",\"priceVnd\":2000}".formatted(categoryId)).get("id").asText();
        createPaidOrderWithItems("T-report-1", "[{\"menuItemId\":\"%s\",\"quantity\":1},{\"menuItemId\":\"%s\",\"quantity\":1},{\"menuItemId\":\"%s\",\"quantity\":1}]".formatted(soupId, teaId, waterId), "Water");
        createPaidOrderWithItems("T-report-2", "[{\"menuItemId\":\"%s\",\"quantity\":2}]".formatted(soupId), null);

        String date = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();
        mvc.perform(get("/api/v1/reports/top-items").param("date", date))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].itemName").value("Soup")).andExpect(jsonPath("$[0].quantitySold").value(3))
                .andExpect(jsonPath("$[0].totalRevenueVnd").value(30000))
                .andExpect(jsonPath("$[1].itemName").value("Tea")).andExpect(jsonPath("$[1].quantitySold").value(1));
    }

    @Test
    void topItemsSortTiesByRevenueAndApplyLimitDefaults() throws Exception {
        // IT-RPT-005/006: sort equal quantities by revenue and use ten as the default for nonpositive limits.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Ranking\"}").get("id").asText();
        String lowId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Low\",\"priceVnd\":1000}".formatted(categoryId)).get("id").asText();
        String highId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"High\",\"priceVnd\":5000}".formatted(categoryId)).get("id").asText();
        String middleId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Middle\",\"priceVnd\":3000}".formatted(categoryId)).get("id").asText();
        createPaidOrderWithItems("T-ranking", "[{\"menuItemId\":\"%s\",\"quantity\":1},{\"menuItemId\":\"%s\",\"quantity\":1},{\"menuItemId\":\"%s\",\"quantity\":1}]".formatted(lowId, highId, middleId), null);

        String date = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();
        mvc.perform(get("/api/v1/reports/top-items").param("date", date).param("limit", "2"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].itemName").value("High")).andExpect(jsonPath("$[1].itemName").value("Middle"));
        for (String limit : new String[]{"0", "-1"}) {
            mvc.perform(get("/api/v1/reports/top-items").param("date", date).param("limit", limit))
                    .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));
        }
        mvc.perform(get("/api/v1/reports/top-items").param("date", date))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));
    }

    private String createPaidOrder(String tableName, String menuItemId, String itemToCancel) throws Exception {
        return createPaidOrderWithItems(tableName, "[{\"menuItemId\":\"%s\",\"quantity\":1}]".formatted(menuItemId), itemToCancel);
    }

    private String createPaidOrderWithItems(String tableName, String itemsJson, String itemToCancel) throws Exception {
        String tableId = create("/api/v1/tables", "{\"name\":\"%s\",\"capacity\":2}".formatted(tableName)).get("id").asText();
        JsonNode order = create("/api/v1/orders", "{\"tableId\":\"%s\",\"items\":%s}".formatted(tableId, itemsJson));
        for (JsonNode item : order.get("items")) {
            String itemId = item.get("id").asText();
            if (item.get("name").asText().equals(itemToCancel)) {
                mvc.perform(post("/api/v1/order-items/{id}/cancel", itemId)).andExpect(status().isOk());
                continue;
            }
            mvc.perform(post("/api/v1/kitchen/order-items/{id}/start", itemId)).andExpect(status().isOk());
            mvc.perform(post("/api/v1/kitchen/order-items/{id}/done", itemId)).andExpect(status().isOk());
            mvc.perform(post("/api/v1/order-items/{id}/serve", itemId)).andExpect(status().isOk());
        }
        String orderId = order.get("id").asText();
        mvc.perform(post("/api/v1/orders/{id}/request-payment", orderId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/orders/{id}/pay", orderId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"discountVnd\":0,\"method\":\"CASH\"}"))
                .andExpect(status().isCreated());
        return orderId;
    }

    private void setInvoiceCreatedAt(String orderId, Instant createdAt) {
        jdbc.update("UPDATE invoices SET created_at = ? WHERE order_id = ?", Timestamp.from(createdAt), UUID.fromString(orderId));
    }

    private JsonNode create(String endpoint, String body) throws Exception {
        String response = mvc.perform(post(endpoint).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }
}
