package com.roms.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

/** Integration checks for table creation, editing, validation and soft deletion. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Sql(statements = "DELETE FROM restaurant_tables")
@WithMockUser(roles = "ADMIN")
class TableIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    void tableCanBeCreatedListedUpdatedAndSoftDeleted() throws Exception {
        // IT-TBL-001/004/006: verify table creation, trimmed updates and soft deletion over HTTP.
        String body = mvc.perform(post("/api/v1/tables").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\" T1 \",\"capacity\":4}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("T1"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andReturn().getResponse().getContentAsString();
        String id = json.readTree(body).get("id").asText();

        mvc.perform(get("/api/v1/tables")).andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(patch("/api/v1/tables/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\" Patio \",\"capacity\":6}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Patio"))
                .andExpect(jsonPath("$.capacity").value(6));
        mvc.perform(delete("/api/v1/tables/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/tables")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void tableRejectsInvalidFieldsAndKitchenCannotReadTables() throws Exception {
        // IT-TBL-002/003: reject invalid capacity/name values and deny the kitchen table-list permission.
        for (String body : new String[]{
                "{\"name\":\"\",\"capacity\":4}",
                "{\"name\":\"%s\",\"capacity\":4}".formatted("T".repeat(31)),
                "{\"name\":\"T0\",\"capacity\":0}"}) {
            mvc.perform(post("/api/v1/tables").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/v1/tables").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("cook").roles("KITCHEN")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/tables")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void unknownTableCannotBeUpdatedOrDeleted() throws Exception {
        // IT-TBL-005: update and delete requests for a missing table both return 404.
        String id = UUID.randomUUID().toString();
        mvc.perform(patch("/api/v1/tables/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"T1\",\"capacity\":4}"))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/tables/{id}", id)).andExpect(status().isNotFound());
    }
}
