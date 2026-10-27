# Bộ kiểm thử backend ROMS

## Phạm vi và cách kiểm thử

Các kiểm thử tự động dùng JUnit 5; cấu hình mặc định chạy H2 in-memory ở chế độ tương thích PostgreSQL với Flyway. `ApiSmokeTest` và `BusinessFlowTest` dùng Spring Boot Test, MockMvc, `@WithMockUser` role ADMIN và transaction rollback sau mỗi test; các request trong một test dùng chung transaction, không kiểm chứng commit riêng từng request. `AuthTestBase` cấp JWT secret và bootstrap password ngẫu nhiên qua cấu hình test.

`SecurityIntegrationTest` chạy server trên port ngẫu nhiên, dùng MockMvc với token đăng nhập thật, interceptor STOMP và client WebSocket thật; class này không có `@Transactional` và tự xóa các tài khoản do test tạo. `RealtimeEventServiceTest` là unit test với messaging template mock và callback transaction mô phỏng. Các test này không thay thế kiểm thử trên PostgreSQL, frontend hoặc môi trường deploy.

Chạy toàn bộ: từ thư mục backend, thực hiện `mvn clean test`. Kết quả chi tiết được Maven tạo trong thư mục báo cáo test. Các test case dưới đây mô tả điều kiện và kết quả mong đợi.

## Danh sách test case

| Mã | Trường hợp và dữ liệu | Kết quả mong đợi | Kiểm thử |
|---|---|---|---|
| TC-01 | Gọi health với mock ADMIN | HTTP 200, trạng thái UP | `healthEndpointReturnsUp` |
| TC-02 | Tạo bàn T1, sức chứa 4, sau đó xem danh sách | HTTP 201; bàn AVAILABLE và xuất hiện trong danh sách | `canCreateAndListRestaurantTable` |
| TC-03 | Tạo bàn sức chứa 0 | HTTP 400 | `rejectsTableWithInvalidCapacity` |
| TC-04 | Tạo bàn, món; gửi order; bếp nấu/xong; phục vụ; yêu cầu và hoàn tất thanh toán | Trạng thái đúng từng bước, bàn trở về AVAILABLE, VAT và tổng tiền đúng | `orderCanTravelThroughKitchenAndServiceStates` |
| TC-05 | Đặt món hết hàng, lọc menu còn hàng | HTTP 409, món không nằm trong kết quả lọc, bàn vẫn trống | `outOfStockCannotBeOrderedAndIsFiltered` |
| TC-06 | Tạo order thứ hai cho bàn có order đang mở | HTTP 409 | `rejectsAnotherActiveOrderForSameTable` |
| TC-07 | Gửi order rỗng, số lượng 0 hoặc phần tử món null; tìm order không tồn tại | HTTP 400 cho dữ liệu sai, HTTP 404 cho ID không tồn tại | `invalidOrderInputIsRejected` |
| TC-08 | Hoàn thành/phục vụ món khi chưa nấu, yêu cầu thanh toán quá sớm, bắt đầu nấu hai lần | Các chuyển trạng thái không hợp lệ trả HTTP 409 | `invalidStatusTransitionsAreRejected` |
| TC-09 | Hai món, một món DONE trong khi món còn lại PENDING; sau đó phục vụ món DONE | Bàn READY_TO_SERVE khi có món DONE, trở lại OCCUPIED sau khi phục vụ | `tableIsReadyWhenAnyItemIsDone` |
| TC-10 | Tắt bàn đang có khách | HTTP 409 | `activeTableCannotBeDeleted` |
| TC-11 | Thiếu trạng thái availability hoặc giá; tên danh mục quá dài | HTTP 400 | `menuMutationsRequireRequiredFieldsAndValidSizes` |
| TC-12 | Gọi 3 món giá 12.501đ; đổi giá menu; giảm 1.000đ | Tạm tính 37.503đ; VAT làm tròn 2.920đ; tổng 39.423đ; giảm lớn hơn tạm tính bị từ chối | `invoiceUsesHistoricalPriceAndRoundsVat` |
| TC-13 | Thanh toán hai lần cùng order | Lần đầu HTTP 201, lần hai HTTP 409 | `paymentIsNotAcceptedTwice` |
| TC-14 | Tắt danh mục chứa món | Món không hiện trong menu; không thể tạo order mới chứa món | `deactivatedCategoryCannotExposeItemsOrBeOrdered` |
| TC-15 | Gửi order có một món hợp lệ và một ID món không tồn tại | HTTP 404, không có order trong hàng đợi, bàn vẫn trống | `unknownMenuItemDoesNotCreateOrderOrOccupyTable` |
| TC-16 | Ghi chú dài 301 ký tự hoặc giá âm | HTTP 400 | `rejectOverlongNoteAndNegativePrice` |
| TC-17 | Xem hàng đợi thu ngân trước và sau yêu cầu thanh toán | Trước: rỗng; sau: chứa order tương ứng | `cashierReceivesOnlyPaymentRequestedOrders` |
| TC-18 | Thanh toán trước khi yêu cầu hoặc giảm giá vượt tạm tính | HTTP 409/400; yêu cầu thanh toán không bị mất | `cannotPayBeforeRequestOrWithExcessiveDiscount` |
| TC-19 | Đánh dấu hết hàng, còn hàng rồi xóa mềm món | Availability cập nhật; món còn hàng xuất hiện; món đã xóa không thể đặt | `itemCanBeMadeAvailableAgainAndSoftDeleted` |
| TC-20 | Đăng ký event trong transaction, gọi callback commit | Không gửi trước commit, gửi đến đúng topic sau commit | `eventIsSentAfterCommitNotBefore` |
| TC-21 | Đăng ký event rồi rollback | Không gửi event | `rolledBackTransactionDoesNotPublish` |
| TC-22 | Phát event khi không có transaction | Event được gửi ngay đến topic tương ứng | `eventWithoutTransactionIsSentImmediately` |

## Auth/RBAC và WebSocket

Các tên dưới đây thuộc `SecurityIntegrationTest`. Test dùng tài khoản bootstrap và tài khoản tạo qua API; không phải các mock role của các test nghiệp vụ. Helper đăng nhập cũng kiểm tra `expiresIn` bằng 28800 giây.

| Mã | Phạm vi kiểm tra thực tế | Kiểm thử |
|---|---|---|
| AUTH-01 | Ma trận REST cho từng role trên các route nghiệp vụ và tài khoản; request được phép có thể trả 200/400/404 tùy dữ liệu, role không được phép trả 403 | `restAuthorizationMatrix` |
| AUTH-02 | WAITER/KITCHEN/CASHIER không tạo, sửa hay reset tài khoản; kiểm tra không tạo user và tài khoản nạn nhân vẫn đăng nhập được | `nonAdminsCannotMutateAccounts` |
| AUTH-03 | Anonymous truy cập users, thông tin đăng nhập sai/thiếu, tắt/bật tài khoản, reset password; token cũ không dùng lại được | `anonymousInvalidCredentialsAndAccountLockUnlock` |
| AUTH-04 | Health public, một số quyền REST theo role và route không có trong allowlist bị từ chối | `publicEndpointsAndRoleAllowlist` |
| AUTH-05 | Reset password, đổi role, vô hiệu hóa làm token cũ không hợp lệ; bảo vệ admin active cuối cùng, username trùng không phân biệt hoa/thường, input sai | `accountChangesInvalidateTokensAndProtectLastAdmin` |
| AUTH-06 | Từ chối token giả mạo, hết hạn, thiếu expiry; chấp nhận token ký hợp lệ được tạo trong test | `rejectsForgedExpiredAndIncompleteTokens` |
| WS-01 | Ma trận interceptor subscribe theo từng role, UUID hợp lệ và topic sai; cấm client SEND | `stompSubscriptionAndSendMatrix` |
| WS-02 | WebSocket thật từ chối CONNECT thiếu, sai định dạng, sai, hết hạn, bị thu hồi hoặc trùng header Authorization | `websocketRejectsMissingAndInvalidConnectCredentials` |
| WS-03 | WebSocket thật với từng role: nhận message ở topic được phép, từ chối subscription sai và client SEND | `websocketEnforcesSubscriptionsAndClientSend` |
| WS-04 | WebSocket thật nhận message trước reset password và không nhận message mới sau reset | `websocketDeliversAuthorizedMessagesAndStopsAfterReset` |
| WS-05 | Interceptor kiểm tra topic bếp, subscription sai, cấm SEND và chặn outbound sau khi tài khoản bị tắt; DISCONNECT lặp lại | `stompRejectsUnauthorizedSubscriptionsAndAllClientSends` |

## Giới hạn và các mục chưa được xác nhận

- **Auth/RBAC:** đã có backend; không có PIN, logout, refresh token, MFA, rate limiting hay frontend đăng nhập. Các test trên không bao phủ mọi boundary của password/username, mọi claim JWT, mọi trạng thái bootstrap hoặc mọi tình huống cạnh tranh tài khoản.
- **Order:** gọi thêm món, hủy món và chuyển bàn chưa được hiện thực. Kiểm thử hiện tại không chứng minh quy tắc một order active/bàn khi hai request đồng thời.
- **Thanh toán:** kiểm thử hiện tại không chứng minh an toàn khi hai request thanh toán cùng lúc hoặc mạng bị gián đoạn.
- **Realtime:** có client WebSocket thật trong test bảo mật và mock callback trong unit test; chưa kiểm thử toàn bộ luồng nghiệp vụ qua WebSocket, reconnect hoặc đo độ trễ dưới 3 giây. Các test nghiệp vụ rollback không chứng minh phát event sau commit thực cho từng request.
- **Database:** chưa xác nhận migration và transaction trên PostgreSQL/Neon thực tế; H2 không đảm bảo tương đương hoàn toàn.
- **Báo cáo, giao diện, in hóa đơn và deployment:** chưa được kiểm thử end-to-end. Chưa có bằng chứng về NFR hiệu năng, uptime hay HTTPS trên môi trường triển khai.
