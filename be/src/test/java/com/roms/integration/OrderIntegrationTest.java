package com.roms.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

/** Integration checks for order validation, active-order queries and kitchen transitions. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {"DELETE FROM payments", "DELETE FROM invoices", "DELETE FROM order_items", "DELETE FROM orders", "DELETE FROM menu_items", "DELETE FROM categories", "DELETE FROM restaurant_tables"})
@WithMockUser(roles = "ADMIN")
class OrderIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void missingRequiredOrderFieldsAndInactiveTableAreRejected() throws Exception {
        // IT-ORD-002/004: reject absent table/menu identifiers and a soft-deleted table without creating an order.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        String itemId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":1000}".formatted(categoryId)).get("id").asText();
        mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"menuItemId\":\"%s\",\"quantity\":1}]}".formatted(itemId)))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tableId\":\"%s\",\"items\":[{\"quantity\":1}]}".formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest());
        String tableId = create("/api/v1/tables", "{\"name\":\"Inactive\",\"capacity\":2}").get("id").asText();
        mvc.perform(delete("/api/v1/tables/{id}", tableId)).andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/orders").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tableId\":\"%s\",\"items\":[{\"menuItemId\":\"%s\",\"quantity\":1}]}".formatted(tableId, itemId)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/kitchen/queue")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void activeOrderIsListedAndAddingItemsAdvancesTheRound() throws Exception {
        // IT-ORD-007/008/015: return active orders in the kitchen queue and assign added items to round two.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        String itemId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":1000}".formatted(categoryId)).get("id").asText();
        String tableId = create("/api/v1/tables", "{\"name\":\"T-round\",\"capacity\":2}").get("id").asText();
        JsonNode order = create("/api/v1/orders", "{\"tableId\":\"%s\",\"items\":[{\"menuItemId\":\"%s\",\"quantity\":1}]}".formatted(tableId, itemId));
        String orderId = order.get("id").asText();

        mvc.perform(get("/api/v1/orders/active")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')]".formatted(orderId)).exists());
        mvc.perform(get("/api/v1/tables/{tableId}/current-order", tableId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(orderId));
        mvc.perform(get("/api/v1/kitchen/queue")).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(orderId));
        mvc.perform(post("/api/v1/orders/{id}/items", orderId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"items\":[{\"menuItemId\":\"%s\",\"quantity\":1}]}".formatted(itemId)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.roundCount").value(2))
                .andExpect(jsonPath("$.items[1].round").value(2));
    }

    @Test
    void repeatedServeIsRejectedAndCancellingCookingItemIsRejected() throws Exception {
        // IT-ORD-012/014: enforce valid item transitions and prevent a served item from being served twice.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        String itemId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":1000}".formatted(categoryId)).get("id").asText();
        String tableId = create("/api/v1/tables", "{\"name\":\"T-transition\",\"capacity\":2}").get("id").asText();
        JsonNode order = create("/api/v1/orders", "{\"tableId\":\"%s\",\"items\":[{\"menuItemId\":\"%s\",\"quantity\":1}]}".formatted(tableId, itemId));
        String orderItemId = order.get("items").get(0).get("id").asText();
        mvc.perform(post("/api/v1/kitchen/order-items/{id}/start", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/order-items/{id}/cancel", orderItemId)).andExpect(status().isConflict());
        mvc.perform(post("/api/v1/kitchen/order-items/{id}/done", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/order-items/{id}/serve", orderItemId)).andExpect(status().isOk());
        mvc.perform(post("/api/v1/order-items/{id}/serve", orderItemId)).andExpect(status().isConflict());
    }

    private JsonNode create(String endpoint, String body) throws Exception {
        String response = mvc.perform(post(endpoint).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }
}
