package com.roms.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Integration checks for payment request defaults, enum validation and missing invoices. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {"DELETE FROM payments", "DELETE FROM invoices", "DELETE FROM order_items", "DELETE FROM orders", "DELETE FROM menu_items", "DELETE FROM categories", "DELETE FROM restaurant_tables"})
@WithMockUser(roles = "ADMIN")
class PaymentIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void omittedPaymentMethodDefaultsToCashAndUnknownMethodIsRejected() throws Exception {
        // IT-PAY-008/009: default an omitted method to CASH and return not found for a missing invoice order.
        String orderId = createServedOrder();
        mvc.perform(post("/api/v1/orders/{id}/request-payment", orderId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/orders/{id}/pay", orderId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"discountVnd\":0}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.method").value("CASH"));
        mvc.perform(post("/api/v1/orders/{id}/pay", UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"discountVnd\":0,\"method\":\"CARD\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/orders/{id}/invoice/preview", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    private String createServedOrder() throws Exception {
        String categoryId = create("/api/v1/categories", "{\"name\":\"Payment food\"}").get("id").asText();
        String itemId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Dish\",\"priceVnd\":10000}".formatted(categoryId)).get("id").asText();
        String tableId = create("/api/v1/tables", "{\"name\":\"T-payment\",\"capacity\":2}").get("id").asText();
        JsonNode order = create("/api/v1/orders", "{\"tableId\":\"%s\",\"items\":[{\"menuItemId\":\"%s\",\"quantity\":1}]}".formatted(tableId, itemId));
        String orderItemId = order.get("items").get(0).get("id").asText();
        mvc.perform(post("/api/v1/kitchen/order-items/{id}/start", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/kitchen/order-items/{id}/done", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/order-items/{id}/serve", orderItemId)).andExpect(status().isOk());
        return order.get("id").asText();
    }

    private JsonNode create(String endpoint, String body) throws Exception {
        String response = mvc.perform(post(endpoint).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }
}
