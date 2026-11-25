package com.roms.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

/** Integration checks for categories, menu item validation and availability filtering. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = {"DELETE FROM menu_items", "DELETE FROM categories"})
@WithMockUser(roles = "ADMIN")
class MenuIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void categoryNameIsTrimmedAndBlankOrOverlongNamesAreRejected() throws Exception {
        // IT-MENU-001/002: trim valid category names and reject blank or overlong values.
        mvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"  Food  \"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("Food"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/categories").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(java.util.Map.of("name", "x".repeat(81)))))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/categories")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void categorySoftDeleteHidesItsMenuItems() throws Exception {
        // IT-MENU-004: deactivating a category hides the category and its associated menu items.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":12000}".formatted(categoryId));
        mvc.perform(delete("/api/v1/categories/{id}", categoryId)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/categories")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/v1/menu-items")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void menuAllowsZeroAndBoundaryLengthButRejectsInvalidFieldsAndCategoryIds() throws Exception {
        // IT-MENU-005/006/007: accept price zero and 500-character fields; reject invalid category, name, price and lengths.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Free tasting\",\"priceVnd\":0}".formatted(categoryId));
        mvc.perform(post("/api/v1/menu-items").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Boundary fields\",\"priceVnd\":1,\"description\":\"%s\",\"imageUrl\":\"%s\"}"
                                .formatted(categoryId, "d".repeat(500), "i".repeat(500))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("d".repeat(500)))
                .andExpect(jsonPath("$.imageUrl").value("i".repeat(500)));
        mvc.perform(post("/api/v1/menu-items").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Missing category\",\"priceVnd\":1}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/menu-items").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\",\"name\":\"Bad category\",\"priceVnd\":1}".formatted(UUID.randomUUID())))
                .andExpect(status().isNotFound());
        for (String field : new String[]{"description", "imageUrl"}) {
            mvc.perform(post("/api/v1/menu-items").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"categoryId\":\"%s\",\"name\":\"Long field\",\"priceVnd\":1,\"%s\":\"%s\"}"
                                    .formatted(categoryId, field, "x".repeat(501))))
                    .andExpect(status().isBadRequest());
        }
        for (String invalidMenuItem : new String[]{
                "{\"categoryId\":\"%s\",\"name\":\"\",\"priceVnd\":1}".formatted(categoryId),
                "{\"categoryId\":\"%s\",\"name\":\"%s\",\"priceVnd\":1}".formatted(categoryId, "M".repeat(121)),
                "{\"categoryId\":\"%s\",\"name\":\"Negative price\",\"priceVnd\":-1}".formatted(categoryId)}) {
            mvc.perform(post("/api/v1/menu-items").contentType(MediaType.APPLICATION_JSON).content(invalidMenuItem))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/v1/menu-items")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void menuAvailabilityFilterAndSoftDeleteReflectPersistedState() throws Exception {
        // IT-MENU-009/011: filter unavailable items, then confirm soft-deleted items disappear from the menu.
        String categoryId = create("/api/v1/categories", "{\"name\":\"Food\"}").get("id").asText();
        String itemId = create("/api/v1/menu-items", "{\"categoryId\":\"%s\",\"name\":\"Soup\",\"priceVnd\":12000}".formatted(categoryId)).get("id").asText();
        mvc.perform(patch("/api/v1/menu-items/{id}/availability", itemId)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"available\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.available").value(false));
        mvc.perform(get("/api/v1/menu-items").param("availableOnly", "true"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/v1/menu-items")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(delete("/api/v1/menu-items/{id}", itemId)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/menu-items")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    private JsonNode create(String endpoint, String body) throws Exception {
        String response = mvc.perform(post(endpoint).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }
}
