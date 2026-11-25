// Covers AccountService bootstrap, validation, persistence conflicts, token versioning, and password reset.
package com.roms.unit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.roms.auth.AccountService;
import com.roms.auth.AppUser;
import com.roms.auth.Role;
import com.roms.auth.UserRepository;
import java.util.Optional;
import java.util.stream.Stream;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {
    @Mock UserRepository users;
    @Mock PasswordEncoder passwords;
    @Mock JdbcTemplate jdbc;

    private AccountService service;

    @BeforeEach
    void setUp() {
        service = new AccountService(users, passwords, jdbc);
    }

    // Tạo user thành công, chuẩn hóa username và xác nhận mật khẩu được mã hóa trước khi lưu.
    @Test
    void createNormalizesUsernameAndStoresEncodedPassword() {
        when(users.existsByUsername("alice")).thenReturn(false);
        when(passwords.encode("a-long-test-password")).thenReturn("encoded-password");
        when(users.saveAndFlush(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountService.UserView created = service.create("ALICE", "a-long-test-password", Role.WAITER);

        assertEquals("alice", created.username());
        assertEquals(Role.WAITER, created.role());
        assertTrue(created.active());
        ArgumentCaptor<AppUser> saved = ArgumentCaptor.forClass(AppUser.class);
        verify(users).saveAndFlush(saved.capture());
        assertEquals("encoded-password", saved.getValue().getPasswordHash());
        verify(jdbc).queryForObject("SELECT id FROM auth_guard WHERE id = 1 FOR UPDATE", Integer.class);
    }

    // Username sai định dạng hoặc độ dài phải bị từ chối mà không ghi user vào repository.
    @ParameterizedTest
    @MethodSource("invalidUsernames")
    void createRejectsInvalidUsernames(String username) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.create(username, "a-long-test-password", Role.WAITER));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(users, never()).saveAndFlush(any());
    }

    // Password quá ngắn, rỗng hoặc vượt giới hạn byte UTF-8 phải bị từ chối.
    @ParameterizedTest
    @MethodSource("invalidPasswords")
    void createRejectsInvalidPasswords(String password) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.create("alice", password, Role.WAITER));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verify(users, never()).saveAndFlush(any());
    }

    // Username trùng sau chuẩn hóa phải trả conflict và không mã hóa/lưu mật khẩu.
    @Test
    void createRejectsDuplicateUsernameBeforeEncodingOrSaving() {
        when(users.existsByUsername("alice")).thenReturn(true);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.create("ALICE", "a-long-test-password", Role.WAITER));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        verifyNoInteractions(passwords);
        verify(users, never()).saveAndFlush(any());
    }

    // Lỗi unique constraint khi ghi đồng thời phải được chuyển thành HTTP conflict.
    @Test
    void createMapsDatabaseUniqueConstraintRaceToConflict() {
        when(users.existsByUsername("alice")).thenReturn(false);
        when(passwords.encode("a-long-test-password")).thenReturn("encoded-password");
        when(users.saveAndFlush(any(AppUser.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate username"));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.create("alice", "a-long-test-password", Role.WAITER));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    // Không tạo thêm bootstrap admin khi đã có admin đang hoạt động.
    @Test
    void bootstrapDoesNotCreateAnotherAdminWhenOneIsAlreadyActive() {
        when(users.countByRoleAndActiveTrue(Role.ADMIN)).thenReturn(1L);

        assertDoesNotThrow(() -> service.bootstrap("", ""));

        verify(users, never()).saveAndFlush(any());
    }

    // Cấu hình chỉ có một trong username/password bootstrap phải bị từ chối.
    @Test
    void bootstrapRejectsPartiallyConfiguredCredentials() {
        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> service.bootstrap("admin", ""));

        assertTrue(error.getMessage().contains("Both bootstrap username and password"));
        verify(users, never()).countByRoleAndActiveTrue(any());
    }

    // Thiếu bootstrap credentials khi chưa có admin phải làm bootstrap thất bại.
    @Test
    void bootstrapRequiresCredentialsWhenNoActiveAdminExists() {
        when(users.countByRoleAndActiveTrue(Role.ADMIN)).thenReturn(0L);

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> service.bootstrap("", ""));

        assertTrue(error.getMessage().contains("No active admin"));
        verify(users, never()).saveAndFlush(any());
    }

    // Tạo bootstrap admin đầu tiên khi chưa có admin và credentials hợp lệ.
    @Test
    void bootstrapCreatesAnAdminWhenNoneExistsAndCredentialsAreConfigured() {
        when(users.countByRoleAndActiveTrue(Role.ADMIN)).thenReturn(0L);
        when(users.existsByUsername("admin")).thenReturn(false);
        when(passwords.encode("a-long-bootstrap-password")).thenReturn("encoded-bootstrap-password");
        when(users.saveAndFlush(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> service.bootstrap("ADMIN", "a-long-bootstrap-password"));

        ArgumentCaptor<AppUser> saved = ArgumentCaptor.forClass(AppUser.class);
        verify(users).saveAndFlush(saved.capture());
        assertEquals("admin", saved.getValue().getUsername());
        assertEquals(Role.ADMIN, saved.getValue().getRole());
    }

    // Đổi role user thành công phải tăng token version để thu hồi token cũ.
    @Test
    void updateChangesRoleAndInvalidatesExistingTokenVersion() {
        AppUser user = createUser("alice", Role.WAITER);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));

        AccountService.UserView updated = service.update(user.getId(), "alice", Role.KITCHEN, true);

        assertEquals(Role.KITCHEN, updated.role());
        assertEquals(1, user.getTokenVersion());
        verify(users).flush();
    }

    // Không cho phép hạ quyền hoặc vô hiệu hóa admin cuối cùng đang hoạt động.
    @Test
    void updateRejectsRemovingTheOnlyActiveAdmin() {
        AppUser user = createUser("admin", Role.ADMIN);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(users.countByRoleAndActiveTrue(Role.ADMIN)).thenReturn(1L);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.update(user.getId(), "admin", Role.WAITER, false));

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(Role.ADMIN, user.getRole());
        assertTrue(user.isActive());
        verify(users, never()).flush();
    }

    // Reset password cập nhật hash và tăng token version để vô hiệu token hiện hành.
    @Test
    void resetPasswordChangesHashAndInvalidatesExistingTokens() {
        AppUser user = createUser("alice", Role.WAITER);
        when(users.findById(user.getId())).thenReturn(Optional.of(user));
        when(passwords.encode("a-new-long-password")).thenReturn("new-encoded-password");

        service.resetPassword(user.getId(), "a-new-long-password");

        assertEquals("new-encoded-password", user.getPasswordHash());
        assertEquals(1, user.getTokenVersion());
    }

    private AppUser createUser(String username, Role role) {
        when(users.existsByUsername(username)).thenReturn(false);
        when(passwords.encode("a-long-test-password")).thenReturn("encoded-password");
        AtomicReference<AppUser> created = new AtomicReference<>();
        when(users.saveAndFlush(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            created.set(user);
            return user;
        });
        service.create(username, "a-long-test-password", role);
        return created.get();
    }

    private static Stream<String> invalidUsernames() {
        return Stream.of("ab", "bad user", "name@host", "a".repeat(65));
    }

    private static Stream<String> invalidPasswords() {
        return Stream.of("short", "", "\u00e9".repeat(37));
    }
}
