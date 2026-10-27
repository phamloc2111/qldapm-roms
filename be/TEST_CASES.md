# Bộ kiểm thử backend ROMS

## Phạm vi và cách kiểm thử

Các kiểm thử tự động dùng JUnit 5, Spring Boot Test, MockMvc, H2 in-memory ở chế độ tương thích PostgreSQL và Flyway migration. Mỗi integration test dùng transaction được rollback sau khi chạy; các request MockMvc trong một test dùng chung transaction, nên không kiểm chứng commit riêng của từng request như khi chạy thực tế. Không sử dụng dữ liệu thật. Kiểm thử này chỉ bao phủ backend hiện có, không thay thế kiểm thử trên PostgreSQL, frontend hoặc môi trường deploy.

Chạy toàn bộ: từ thư mục backend, thực hiện `mvn clean test`. Kết quả chi tiết được Maven tạo trong thư mục báo cáo test. Các test case dưới đây mô tả điều kiện và kết quả mong đợi.

## Danh sách test case

| Mã | Trường hợp và dữ liệu | Kết quả mong đợi | Kiểm thử |
|---|---|---|---|
| TC-01 | Gọi health | HTTP 200, trạng thái UP | `healthEndpointReturnsUp` |
| TC-02 | Tạo bàn T1, sức chứa 4, sau đó xem danh sách | HTTP 201; bàn AVAILABLE và xuất hiện trong danh sách | `canCreateAndListRestaurantTable` |
| TC-03 | Tạo bàn sức chứa 0 | HTTP 400 | `rejectsTableWithInvalidCapacity` |
| TC-04 | Tạo bàn, món; gửi order; bếp nấu/xong; phục vụ; yêu cầu và hoàn tất thanh toán | Trạng thái đúng từng bước, bàn trở về AVAILABLE, VAT và tổng tiền đúng | `orderCanTravelThroughKitchenAndServiceStates` |
| TC-05 | Đặt món hết hàng, lọc menu còn hàng | HTTP 409, món không nằm trong kết quả lọc, bàn vẫn trống | `outOfStockCannotBeOrderedAndIsFiltered` |
| TC-06 | Tạo order thứ hai cho bàn có order đang mở | HTTP 409 | `rejectsAnotherActiveOrderForSameTable` |
| TC-07 | Gửi order rỗng, số lượng 0 hoặc phần tử món null; tìm order không tồn tại | HTTP 400 cho dữ liệu sai, HTTP 404 cho ID không tồn tại | `invalidOrderInputIsRejected` |
| TC-08 | Hoàn thành/phục vụ món khi chưa nấu, yêu cầu thanh toán quá sớm, bắt đầu nấu hai lần | Các chuyển trạng thái không hợp lệ trả HTTP 409 | `invalidStatusTransitionsAreRejected` |
| TC-09 | Hai món, một món DONE trong khi món còn lại PENDING; sau đó phục vụ món DONE | Bàn READY_TO_SERVE khi có món DONE, trở lại OCCUPIED sau khi phục vụ | `tableIsReadyWhenAnyItemIsDone` |
| TC-10 | Tắt bàn đang có khách | HTTP 409; bàn không bị tắt | `activeTableCannotBeDeleted` |
| TC-11 | Thiếu trạng thái availability hoặc giá; tên danh mục quá dài | HTTP 400, không thay đổi dữ liệu | `menuMutationsRequireRequiredFieldsAndValidSizes` |
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

## Các mục chưa được xác nhận

- **Auth/RBAC:** chưa được hiện thực; các API và WebSocket chưa được bảo vệ. Không triển khai công khai trước khi bổ sung xác thực và phân quyền.
- **Order:** gọi thêm món, hủy món, chuyển bàn và xử lý hai request đồng thời chưa có test/hoặc chưa được hiện thực; cần xác nhận policy trước khi triển khai.
- **Thanh toán:** kiểm thử hiện tại không chứng minh an toàn khi hai request thanh toán cùng lúc hoặc mạng bị gián đoạn.
- **Realtime:** các test chỉ kiểm tra logic gửi event và callback transaction, chưa có client WebSocket kết nối thật hay đo độ trễ dưới 3 giây.
- **Database:** chưa xác nhận migration và transaction trên PostgreSQL/Neon thực tế; H2 không đảm bảo tương đương hoàn toàn.
- **Báo cáo, giao diện, in hóa đơn và deployment:** chưa được kiểm thử end-to-end. Chưa có bằng chứng về NFR hiệu năng, uptime hay HTTPS trên môi trường triển khai.
