package com.roms;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ApiSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointReturnsUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void canCreateAndListRestaurantTable() throws Exception {
        mockMvc.perform(post("/api/v1/tables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"T1","capacity":4}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("T1"))
                .andExpect(jsonPath("$.capacity").value(4))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));

        mockMvc.perform(get("/api/v1/tables"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("T1"));
    }

    @Test
    void rejectsTableWithInvalidCapacity() throws Exception {
        mockMvc.perform(post("/api/v1/tables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"T-invalid","capacity":0}
                                """))
                .andExpect(status().isBadRequest());
    }

            @Test
            void orderCanTravelThroughKitchenAndServiceStates() throws Exception {
            String category = mockMvc.perform(post("/api/v1/categories")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"name":"Món chính test"}
                        """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
            String categoryId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(category).get("id").asText();

            String menuItem = mockMvc.perform(post("/api/v1/menu-items")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"categoryId":"%s","name":"Phở test","description":"","priceVnd":50000,"imageUrl":""}
                        """.formatted(categoryId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
            String menuItemId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(menuItem).get("id").asText();

            String table = mockMvc.perform(post("/api/v1/tables")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"name":"T-order-flow","capacity":4}
                        """))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
            String tableId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(table).get("id").asText();

            String order = mockMvc.perform(post("/api/v1/orders")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"tableId":"%s","items":[{"menuItemId":"%s","quantity":2,"note":"Ít cay"}]}
                        """.formatted(tableId, menuItemId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.items[0].unitPriceVnd").value(50000))
                .andReturn().getResponse().getContentAsString();
            String orderId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(order).get("id").asText();
            String orderItemId = new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(order).get("items").get(0).get("id").asText();

            mockMvc.perform(get("/api/v1/kitchen/queue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(orderId));

            mockMvc.perform(post("/api/v1/kitchen/order-items/{id}/start", orderItemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("COOKING"));
            mockMvc.perform(post("/api/v1/kitchen/order-items/{id}/done", orderItemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READY"));
            mockMvc.perform(post("/api/v1/order-items/{id}/serve", orderItemId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SERVED"));

            mockMvc.perform(get("/api/v1/orders/{id}", orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SERVED"));

            mockMvc.perform(post("/api/v1/orders/{id}/request-payment", orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_REQUESTED"));
            mockMvc.perform(get("/api/v1/orders/{id}/invoice/preview", orderId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtotalVnd").value(100000))
                .andExpect(jsonPath("$.vatVnd").value(8000))
                .andExpect(jsonPath("$.totalVnd").value(108000));
            mockMvc.perform(post("/api/v1/orders/{id}/pay", orderId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {"discountVnd":0,"method":"CASH"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amountVnd").value(108000))
                .andExpect(jsonPath("$.method").value("CASH"));
            mockMvc.perform(get("/api/v1/tables"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name == 'T-order-flow')].status").value("AVAILABLE"));
            }
}