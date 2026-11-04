# ROMS — Kiến trúc backend hiện tại

Tài liệu phản ánh source hiện tại, không phải cam kết rằng toàn bộ workflow SRS đã hoàn thành. Backend là một ứng dụng Spring Boot monolith, dùng controller, service và Spring Data JPA; không cần bổ sung service hay hạ tầng mới để mô tả implementation này.

## 1. Tổng quan và trạng thái

```text
Client (frontend xác thực chưa được triển khai)
    ├── REST /api/v1 + Bearer JWT
    └── WebSocket /ws + STOMP
                 ↓
Spring Boot: auth, table, menu, order, payment, realtime
                 ↓
Flyway + JPA → H2 in-memory mặc định / PostgreSQL profile prod
```

- **Đã có:** đăng nhập username/password, RBAC, quản lý tài khoản bởi admin; quản lý bàn và menu; tạo và gửi order trong cùng một request; xử lý món, yêu cầu thanh toán, xem trước và thanh toán tiền mặt; thông báo realtime.
- **Chưa có:** frontend đăng nhập/role; PIN, logout, refresh token, MFA hay rate limiting; thêm/hủy món sau khi tạo order, chuyển bàn, API báo cáo, in hóa đơn và tích hợp thanh toán online. Màn hình bếp/thu ngân và trải nghiệm reconnect của client cũng chưa được triển khai trong frontend.
- Không có package kitchen hay report riêng: xử lý bếp nằm trong `order`; hàng đợi thu ngân và thanh toán nằm trong `payment`/`order`.

## 2. Cấu trúc source thực tế

```text
be/
├── pom.xml
├── src/main/java/com/roms/
│   ├── RomApplication.java
│   ├── auth/
│   │   ├── AccountService.java  AppUser.java  AuthController.java
│   │   ├── Role.java  SecurityConfig.java  StompSecurity.java
│   │   └── TokenService.java  UserRepository.java
│   ├── common/HealthController.java
│   ├── config/WebConfig.java  WebSocketConfig.java
│   ├── menu/
│   │   ├── Category.java  CategoryRepository.java  MenuItem.java
│   │   └── MenuItemRepository.java  MenuController.java  MenuService.java
│   ├── order/
│   │   ├── RestaurantOrder.java  OrderItem.java  OrderStatus.java  OrderItemStatus.java
│   │   ├── OrderRepository.java  OrderItemRepository.java  OrderResponse.java
│   │   └── OrderController.java  OrderService.java
│   ├── payment/
│   │   ├── Invoice.java  InvoiceRepository.java  Payment.java  PaymentRepository.java
│   │   └── PaymentMethod.java  PaymentController.java  PaymentService.java
│   ├── realtime/RealtimeEventService.java
│   └── table/RestaurantTable.java  TableStatus.java  TableRepository.java  TableController.java  TableService.java
├── src/main/resources/
│   ├── application.yml  application-prod.yml
│   └── db/migration/V1__create_core_tables.sql  V2__auth.sql
└── src/test/
    ├── java/com/roms/ApiSmokeTest.java  AuthTestBase.java  BusinessFlowTest.java
    │                   RealtimeEventServiceTest.java  SecurityIntegrationTest.java
    └── resources/application.properties
```

Java 21, Spring Boot 3.5.6, Spring Security, JPA, Flyway và STOMP/WebSocket được cấu hình trong Maven. `RomApplication` ở package gốc `com.roms`. Controller gọi service và repository; một số request/response là record lồng trong controller/service.

## 3. Auth và RBAC hiện có

- Bốn role: `WAITER`, `KITCHEN`, `CASHIER`, `ADMIN`. `POST /api/v1/auth/login` nhận username/password; username được tra cứu không phân biệt chữ hoa/thường. Response có `accessToken`, `tokenType: Bearer`, `expiresIn: 28800`.
- Password lưu dạng BCrypt. Tài khoản mới/reset yêu cầu password không rỗng, ít nhất 12 ký tự và tối đa 72 byte UTF-8; username 3–64 ký tự ASCII chữ/số/dấu `.`, `_`, `-`, được chuẩn hóa thành chữ thường và là duy nhất.
- JWT HS256 có issuer, subject là user ID, role, phiên bản token, thời điểm phát hành và hết hạn sau **8 giờ**. Mỗi lần xác thực kiểm tra chữ ký, issuer, claims, thời hạn và trạng thái/role/phiên bản tài khoản trong DB. REST dùng `Authorization: Bearer <token>`; cấu hình stateless, CSRF tắt.
- Khi username, role hoặc active thực sự thay đổi, hay password được reset, `token_version` tăng và token cũ không còn hợp lệ. Tài khoản bị tắt không thể đăng nhập; bật lại cũng không khôi phục token cũ. Không có endpoint logout/refresh hoặc cơ chế thu hồi token theo từng phiên.
- Admin tạo, liệt kê, cập nhật username/role/active và reset password; không thể hạ quyền hoặc vô hiệu hóa admin đang hoạt động cuối cùng. `auth_guard` được khóa trong transaction cho các thay đổi tài khoản và bootstrap.
- Khi không có admin active, khởi động cần `AUTH_BOOTSTRAP_USERNAME` **và** `AUTH_BOOTSTRAP_PASSWORD` hợp lệ để tạo admin. Nếu một biến rỗng còn biến kia không rỗng thì khởi động thất bại; khi đã có admin active, bootstrap không đặt lại tài khoản.

### Biến cấu hình thực tế

| Biến | Ý nghĩa |
|---|---|
| `AUTH_JWT_SECRET` | Bắt buộc: Base64 giải mã thành ít nhất 32 byte; nên dùng byte ngẫu nhiên và giữ bí mật. |
| `AUTH_JWT_ISSUER` | Issuer; mặc định `roms-api`, không được rỗng. |
| `AUTH_BOOTSTRAP_USERNAME`, `AUTH_BOOTSTRAP_PASSWORD` | Cặp thông tin admin ban đầu như quy tắc trên; không commit giá trị thật. |
| `FRONTEND_URL` | Origin duy nhất cho CORS `/api/**` và WebSocket; mặc định `http://localhost:5173`. |
| `PORT` | Port HTTP, mặc định 8080. |
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Profile `prod`: JDBC URL PostgreSQL và thông tin kết nối; username/password mặc định rỗng. Profile mặc định dùng H2 in-memory. |

## 4. REST API và quyền thực tế

Prefix `/api/v1`; bảng liệt kê endpoint **đã hiện thực**, `{id}` là UUID. Các request không khớp allowlist bị từ chối; request không có xác thực tới route được bảo vệ nhận 401, user đủ xác thực nhưng sai role nhận 403. `OPTIONS /**` được phép; HTTP GET `/ws` cho phép handshake nhưng STOMP vẫn phải xác thực. Một header Authorization sai cũng bị từ chối, kể cả trên route public.

| Method và route | Role / truy cập |
|---|---|
| `GET /health` | Public |
| `POST /auth/login` | Public |
| `GET /users`, `POST /users`, `PUT /users/{id}`, `POST /users/{id}/reset-password` | ADMIN |
| `GET /tables`, `GET /orders/{id}` | WAITER, ADMIN |
| `GET /categories`, `GET /menu-items` | WAITER, KITCHEN, ADMIN |
| `POST /orders`, `POST /orders/{id}/request-payment`, `POST /order-items/{id}/serve` | WAITER, ADMIN |
| `GET /kitchen/queue`, `POST /kitchen/order-items/{id}/start`, `POST /kitchen/order-items/{id}/done` | KITCHEN, ADMIN |
| `GET /cashier/payment-requests`, `GET /orders/{id}/invoice/preview`, `POST /orders/{id}/pay` | CASHIER, ADMIN |
| `POST /tables`, `PATCH /tables/{id}`, `DELETE /tables/{id}` | ADMIN |
| `POST /categories`, `PATCH /categories/{id}`, `DELETE /categories/{id}` | ADMIN |
| `POST /menu-items`, `PATCH /menu-items/{id}`, `DELETE /menu-items/{id}`, `PATCH /menu-items/{id}/availability` | ADMIN (không phải KITCHEN) |

Không có `/auth/me`, `/auth/logout`, endpoint submit order riêng, lấy order hiện tại theo bàn, `/menu`, hay endpoint báo cáo. Không coi các route dự kiến đó là API đang hoạt động.

## 5. Nghiệp vụ hiện có và giới hạn

- **Bàn:** tạo, xem bàn active, sửa tên/sức chứa, tắt mềm khi bàn `AVAILABLE`; chưa có API bật lại. Trạng thái gồm `AVAILABLE`, `OCCUPIED`, `READY_TO_SERVE`, `PAYMENT_REQUESTED`.
- **Menu:** tạo, sửa, tắt mềm danh mục/món; chỉ admin thay đổi availability. `GET /menu-items?availableOnly=true` lọc món còn hàng; món hoặc danh mục bị tắt không xuất hiện và không thể đặt.
- **Order:** `POST /orders` tạo và submit ngay, yêu cầu ít nhất một item hợp lệ, lưu snapshot tên và giá. Service từ chối order mới nếu bàn đã có order active; chưa chứng minh bảo đảm này khi request đồng thời. Bếp xử lý `PENDING → COOKING → DONE`, waiter chuyển `DONE → SERVED`. Bàn `READY_TO_SERVE` nếu có ít nhất một item `DONE`, ngược lại `OCCUPIED` trong quá trình xử lý.
- **Trạng thái order:** `OPEN` là trạng thái khởi tạo nội bộ, sau tạo là `SUBMITTED`; cập nhật món tính `IN_PROGRESS`, `READY` khi mọi món DONE/SERVED, `SERVED` khi tất cả SERVED; tiếp theo `PAYMENT_REQUESTED → PAID`. Enum có `CLOSED` nhưng không có luồng chuyển sang trạng thái này. Hàng đợi bếp lấy order `SUBMITTED`/`IN_PROGRESS` theo thời gian gửi, không cưỡng chế FIFO khi thao tác.
- **Thanh toán:** chỉ order `SERVED` mới yêu cầu thanh toán; preview tính các item `SERVED`, giảm giá là số tiền VND từ 0 đến tạm tính, VAT 8% trên số sau giảm và làm tròn HALF_UP đến đồng. Pay yêu cầu `PAYMENT_REQUESTED`, tạo invoice/payment, đặt order `PAID`, trả bàn về `AVAILABLE`; phương thức hiện tại chỉ `CASH`. Chưa chứng minh an toàn cho thanh toán đồng thời.

## 6. Database và migration

Flyway chạy với Hibernate `ddl-auto: validate`. `V1__create_core_tables.sql` tạo `categories`, `menu_items`, `restaurant_tables`, `orders`, `order_items`, `invoices`, `payments`. Quan hệ chính: category–menu items, table–orders, order–items là một-nhiều; invoice có `order_id` unique và payment có `invoice_id` unique. `order_items` lưu `item_name`, `unit_price_vnd` snapshot.

`V2__auth.sql` tạo `app_users` (`id`, `username`, `password_hash`, `role`, `active`, `token_version`) và `auth_guard` (một hàng id 1 dùng khóa transaction). Role được lưu trực tiếp trong `app_users` với CHECK constraint; **không có bảng `users` hay `roles`**, cũng không có cột người tạo order/người nhận thanh toán trong schema hiện tại.

## 7. Realtime và quyền STOMP

Endpoint WebSocket `/ws` dùng Spring simple broker `/topic`; client phải gửi đúng một native header `Authorization: Bearer <JWT>` trong frame STOMP `CONNECT` (hoặc `STOMP`). Handshake HTTP public không đồng nghĩa subscription public. Server xác thực lại token khi xử lý frame và trước khi gửi MESSAGE; token hết hạn hoặc tài khoản thay đổi sẽ không còn nhận delivery. Client không được `SEND` tới broker hay `/app`; chỉ được subscribe các topic sau:

| Topic | Role được subscribe | Event server phát |
|---|---|---|
| `/topic/tables` | WAITER, ADMIN | `table.status_changed` |
| `/topic/menu` | WAITER, KITCHEN, ADMIN | `menu.availability_changed` |
| `/topic/kitchen` | KITCHEN, ADMIN | `order.submitted` |
| `/topic/cashier` | CASHIER, ADMIN | `payment.requested` |
| `/topic/orders/{uuid}` | WAITER, ADMIN | `order_item.status_changed`, `payment.completed` |

Chỉ topic order với UUID đúng định dạng được cho phép; không có kiểm tra sở hữu theo order. Event gồm `eventId`, `eventType`, `entityId`, `occurredAt`, `data`; được phát sau commit khi có transaction synchronization, hoặc ngay khi không có. Database là nguồn dữ liệu chính; frontend reconnect/chạy lại REST chưa có implementation.

## 8. Kiểm thử và triển khai

Test hiện dùng H2 chế độ PostgreSQL, không chứng minh tính tương đương PostgreSQL thực tế; profile `prod` cấu hình PostgreSQL nhưng môi trường triển khai, HTTPS và frontend chưa được xác nhận bởi source. Xem TEST_CASES.md để biết chính xác từng kiểm thử, bao gồm các kiểm thử WebSocket thực và giới hạn của chúng. Không có bằng chứng hiện tại về MFA, rate limiting, hiệu năng hay kiểm thử end-to-end frontend.
