# ROMS Backend API

Backend API của hệ thống quản lý đặt món nhà hàng, viết bằng Java 21 và Spring Boot.

## Yêu cầu

- JDK 21+
- Maven 3.9+

## Chạy local

Trước khi khởi động, đặt các biến môi trường sau (không commit giá trị thật):

- `AUTH_JWT_SECRET`: khóa bí mật ngẫu nhiên, mã hóa Base64 của ít nhất 32 byte; giữ ổn định giữa các lần chạy và giữa các instance. Thay khóa sẽ vô hiệu hóa tất cả token.
- `AUTH_BOOTSTRAP_USERNAME` và `AUTH_BOOTSTRAP_PASSWORD`: tài khoản admin ban đầu, bắt buộc khi chưa có admin đang hoạt động. Chỉ tạo khi chưa có admin hoạt động; không thay đổi tài khoản hiện có. Có thể bỏ sau bootstrap nếu dùng database bền vững. H2 in-memory cần bootstrap lại sau mỗi lần khởi động.
- `AUTH_JWT_ISSUER`: issuer của token, mặc định `roms-api`.
- `FRONTEND_URL`: origin chính xác được phép gọi API và WebSocket, mặc định `http://localhost:5173`.

Username không phân biệt hoa/thường, gồm 3–64 ký tự ASCII chữ, số, dấu chấm, gạch dưới hoặc gạch ngang. Mật khẩu phải có ít nhất 12 ký tự, tối đa 72 byte UTF-8. Mật khẩu được lưu bằng BCrypt.

```bash
mvn spring-boot:run
```

Mặc định ứng dụng dùng H2 in-memory để chạy local nhanh, không cần cài PostgreSQL. API chạy tại `http://localhost:8080`.

## Kiểm thử

```bash
mvn test
```

## API hiện có

- `POST /api/v1/auth/login` — body `{"username":"...","password":"..."}`; trả `accessToken`, `tokenType`, `expiresIn` (28800 giây). Gửi `Authorization: Bearer <accessToken>` trong các request còn lại.
- `GET /api/v1/users` — danh sách người dùng, chỉ admin.
- `POST /api/v1/users` — tạo người dùng, body gồm `username`, `password`, `role`; chỉ admin.
- `PUT /api/v1/users/{id}` — cập nhật đầy đủ `username`, `role`, `active`; dùng `active: false` để khóa hoặc `true` để mở khóa. Chỉ admin.
- `POST /api/v1/users/{id}/reset-password` — body gồm `password`; chỉ admin.
- `GET /api/v1/health`
- `GET /api/v1/tables`
- `POST /api/v1/tables`
- `PATCH /api/v1/tables/{id}`
- `DELETE /api/v1/tables/{id}` — xóa mềm
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/{id}`
- `DELETE /api/v1/categories/{id}` — xóa mềm
- `GET /api/v1/menu-items?availableOnly=true`
- `POST /api/v1/menu-items`
- `PATCH /api/v1/menu-items/{id}`
- `PATCH /api/v1/menu-items/{id}/availability`
- `DELETE /api/v1/menu-items/{id}` — xóa mềm
- `POST /api/v1/orders` — tạo và gửi order xuống bếp
- `GET /api/v1/orders/{id}`
- `POST /api/v1/orders/{id}/request-payment`
- `GET /api/v1/kitchen/queue`
- `POST /api/v1/kitchen/order-items/{id}/start`
- `POST /api/v1/kitchen/order-items/{id}/done`
- `POST /api/v1/order-items/{id}/serve`
- `GET /api/v1/cashier/payment-requests`
- `GET /api/v1/orders/{id}/invoice/preview?discountVnd=0`
- `POST /api/v1/orders/{id}/pay`

## WebSocket

STOMP endpoint: `/ws`.

Client subscriptions:

- `/topic/kitchen` — order mới gửi bếp.
- `/topic/orders/{orderId}` — trạng thái món và thanh toán của order.
- `/topic/tables` — trạng thái bàn.
- `/topic/menu` — trạng thái còn/hết hàng.
- `/topic/cashier` — yêu cầu thanh toán.

WebSocket chỉ phát thông báo sau khi transaction database commit thành công.

Gửi native STOMP header `Authorization: Bearer <accessToken>` trong frame CONNECT (không dùng query string). Quyền subscription:

- WAITER: `/topic/tables`, `/topic/menu`, `/topic/orders/{orderId}` (orderId dạng UUID).
- KITCHEN: `/topic/kitchen`, `/topic/menu`.
- CASHIER: `/topic/cashier`.
- ADMIN: tất cả các topic được liệt kê ở trên.

Không chấp nhận destination khác, wildcard subscription hay client SEND. Token được kiểm tra lại khi nhận frame và khi gửi sự kiện; khóa tài khoản, đổi role/username hoặc reset password vô hiệu hóa token cũ. Kết nối cũ không nhất thiết bị đóng ngay, nhưng không tiếp tục nhận dữ liệu sau khi token hết hạn hoặc bị thu hồi. DISCONNECT được xử lý kể cả khi token đã hết hạn.

REST mặc định từ chối: WAITER đọc bàn/menu/order, tạo order, serve và yêu cầu thanh toán; KITCHEN đọc menu/queue, start/done; CASHIER xem queue/preview và pay; ADMIN có tất cả quyền được liệt kê và quản lý menu/bàn/người dùng. Health và login công khai. Không thể khóa hoặc hạ quyền admin hoạt động cuối cùng.

### Lưu ý bảo mật vận hành

- Bắt buộc triển khai HTTPS/WSS, bảo vệ khóa và bootstrap credentials bằng secret manager, và giới hạn origin. Không dùng các giá trị test trong production.
- Chưa có rate limiting/chống brute force, MFA, audit log bảo mật hoặc API logout/thu hồi token riêng lẻ; cần bổ sung ở ứng dụng hoặc gateway trước production.
- Broker in-memory và danh sách session chỉ hoạt động trong từng instance; triển khai nhiều instance cần giải pháp broker phân tán phù hợp. Mỗi request/sự kiện truy vấn database để xác thực token; dữ liệu đã gửi trước khi thu hồi không thể thu hồi lại.

## PostgreSQL

Tạo database PostgreSQL rồi chạy với profile production và các biến môi trường trong `.env.example`:

- `DATABASE_URL`: JDBC URL dạng `jdbc:postgresql://host:5432/database?sslmode=require`.
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `FRONTEND_URL`
- `PORT` (Render tự cấp)

```bash
SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
```

Trong môi trường production, Flyway áp dụng các migration khi khởi động và Hibernate dùng `ddl-auto: validate` để kiểm tra schema. Tài khoản database cần có quyền áp dụng migration; nên kiểm tra và sao lưu database trước khi deploy.