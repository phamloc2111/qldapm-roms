# ROMS Backend API

Backend API của hệ thống quản lý đặt món nhà hàng, viết bằng Java 21 và Spring Boot.

## Yêu cầu

- JDK 21+
- Maven 3.9+

## Chạy local

```bash
mvn spring-boot:run
```

Mặc định ứng dụng dùng H2 in-memory để chạy local nhanh, không cần cài PostgreSQL. API chạy tại `http://localhost:8080`.

## Kiểm thử

```bash
mvn test
```

## API hiện có

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

Trong môi trường production, Hibernate dùng `ddl-auto: validate`; cần có schema/migration trước khi deploy.