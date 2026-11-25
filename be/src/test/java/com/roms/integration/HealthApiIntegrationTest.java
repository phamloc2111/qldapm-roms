package com.roms.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

/** Integration checks for public health and denied unknown API routes. */
@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(roles = "ADMIN")
class HealthApiIntegrationTest {
    @Autowired MockMvc mvc;

    @Test
    void healthIsPublicAndUnknownApiRouteIsDenied() throws Exception {
        // IT-HLTH-001/002: health is public while unmatched API routes are denied by security.
        mvc.perform(get("/api/v1/health").with(anonymous()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        mvc.perform(get("/api/v1/route-khong-ton-tai"))
                .andExpect(status().isForbidden());
    }
}
