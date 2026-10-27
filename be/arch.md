# ROMS — Kiến trúc đơn giản cho bài tập Quản lý dự án phần mềm

> Mục tiêu của dự án là xây dựng một ứng dụng web nhỏ, dễ hiểu, dễ demo và đáp ứng các yêu cầu chính trong SRS. Không hướng tới hệ thống thương mại hoặc kiến trúc phức tạp.

## 1. Phạm vi đề xuất

Quy trình chính:

```text
Phục vụ tạo order → Bếp xử lý → Phục vụ mang món → Thu ngân thanh toán
```

Phạm vi V1.0:

- Một nhà hàng duy nhất.
- Khoảng 15–20 bàn.
- Một backend API duy nhất.
- Một database PostgreSQL.
- Một frontend responsive, hiển thị giao diện theo role.
- Realtime đơn giản bằng WebSocket hoặc Socket.IO.
- Không làm microservices, Redis, Kubernetes, message broker hoặc offline-first.
- Không tích hợp VNPay/Momo và không quản lý kho nguyên liệu chi tiết.

### Công nghệ chính

- Frontend: **React**.
- Backend: **Spring Boot**.
- Database: **PostgreSQL**.
- Real-time: **WebSocket**.
- Quản lý mã nguồn: **Git và GitHub**.
- Frontend deployment: **Vercel**.
- Backend deployment: **Render**.

### Workflow nghiệm thu chính

Đây là workflow cần được ưu tiên trong mọi quyết định về scope, schedule và chất lượng:

```text
Chọn bàn → Chọn món → Gửi order → Bếp nhận order →
Bếp cập nhật trạng thái → Phục vụ thấy món hoàn thành →
Thu ngân tính tiền → Hoàn tất thanh toán
```

## 2. Kiến trúc tổng thể

Chọn kiến trúc **monolithic 3 lớp** vì phù hợp với bài tập và nhóm nhỏ:

```text
┌─────────────────────────────────────┐
│ Frontend Web                        │
│ Waiter | Kitchen | Cashier | Admin  │
└───────────────┬─────────────────────┘
                │ REST API + WebSocket
┌───────────────▼─────────────────────┐
│ Backend Application                 │
│ Auth | Menu | Tables | Orders       │
│ Kitchen | Payment | Report          │
└───────────────┬─────────────────────┘
                │ SQL
┌───────────────▼─────────────────────┐
│ PostgreSQL                          │
└─────────────────────────────────────┘
```

### Ba lớp

1. **Presentation:** route/controller, nhận request và trả response.
2. **Business:** xử lý order, trạng thái món, tính tiền và phân quyền.
3. **Data access:** model, ORM/query và migration database.

Chỉ cần một backend chạy trên Render, không tách thành nhiều service.

## 3. Cấu trúc source code Spring Boot

Backend sử dụng cấu trúc project Maven chuẩn của Spring Boot. Package gốc chứa class khởi động phải nằm ở cấp cao nhất để Spring Boot tự động scan các package con.

```text
be/
├── pom.xml
├── README.md
├── .gitignore
├── .env.example
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/roms/
    │   │       ├── RomApplication.java
    │   │       ├── config/
    │   │       │   ├── SecurityConfig.java
    │   │       │   ├── WebSocketConfig.java
    │   │       │   └── CorsConfig.java
    │   │       ├── common/
    │   │       │   ├── exception/
    │   │       │   ├── response/
    │   │       │   └── validation/
    │   │       ├── auth/
    │   │       │   ├── AuthController.java
    │   │       │   ├── AuthService.java
    │   │       │   ├── AuthRequest.java
    │   │       │   └── AuthResponse.java
    │   │       ├── user/
    │   │       │   ├── User.java
    │   │       │   ├── UserRepository.java
    │   │       │   └── UserService.java
    │   │       ├── table/
    │   │       │   ├── RestaurantTable.java
    │   │       │   ├── TableRepository.java
    │   │       │   ├── TableController.java
    │   │       │   └── TableService.java
    │   │       ├── menu/
    │   │       │   ├── Category.java
    │   │       │   ├── MenuItem.java
    │   │       │   ├── CategoryRepository.java
    │   │       │   ├── MenuItemRepository.java
    │   │       │   ├── MenuController.java
    │   │       │   └── MenuService.java
    │   │       ├── order/
    │   │       │   ├── Order.java
    │   │       │   ├── OrderItem.java
    │   │       │   ├── OrderStatus.java
    │   │       │   ├── OrderItemStatus.java
    │   │       │   ├── OrderRepository.java
    │   │       │   ├── OrderController.java
    │   │       │   └── OrderService.java
    │   │       ├── kitchen/
    │   │       │   ├── KitchenController.java
    │   │       │   └── KitchenService.java
    │   │       ├── payment/
    │   │       │   ├── Invoice.java
    │   │       │   ├── Payment.java
    │   │       │   ├── PaymentRepository.java
    │   │       │   ├── PaymentController.java
    │   │       │   └── PaymentService.java
    │   │       ├── report/
    │   │       │   ├── ReportController.java
    │   │       │   └── ReportService.java
    │   │       └── realtime/
    │   │           └── RealtimeEventService.java
    │   └── resources/
    │       ├── application.yml
    │       ├── application-dev.yml
    │       ├── application-prod.yml
    │       └── db/
    │           └── migration/
    └── test/
        ├── java/
        │   └── com/roms/
        │       ├── order/OrderServiceTest.java
        │       ├── payment/PaymentServiceTest.java
        │       └── integration/OrderFlowIntegrationTest.java
        └── resources/
            └── application-test.yml
```

### Quy tắc tổ chức package

- `RomApplication.java` là class có `@SpringBootApplication`, đặt tại package `com.roms`.
- Các package chức năng (`auth`, `menu`, `order`, `kitchen`, `payment`...) nằm bên dưới `com.roms` để được component scan tự động.
- `Controller` chỉ nhận request, validate DTO và gọi `Service`.
- `Service` chứa business logic và transaction.
- `Repository` kế thừa Spring Data JPA repository để truy cập database.
- `Entity` ánh xạ với bảng PostgreSQL; không trả trực tiếp entity ra API nếu cần kiểm soát response.
- `DTO` dùng cho request/response, tránh phụ thuộc trực tiếp vào cấu trúc entity.
- `config` chứa cấu hình Spring Security, CORS, WebSocket và các bean dùng chung.
- `common` chứa exception handler, response format và validation dùng chung; không đặt business logic vào đây.
- `resources` chứa cấu hình theo môi trường và database migration.
- Test giữ đúng package tương ứng với code trong `src/main/java`.

### Ví dụ luồng xử lý request

```text
OrderController
    → OrderService
        → OrderRepository / MenuItemRepository
        → PostgreSQL
        → RealtimeEventService
```

Không đặt business logic trực tiếp trong controller và không để frontend tự thay đổi trạng thái order mà không qua service/backend.

## 4. Các module chức năng

### Auth và phân quyền

Các role:

- `WAITER`: phục vụ.
- `KITCHEN`: bếp.
- `CASHIER`: thu ngân.
- `ADMIN`: quản lý.

Chức năng cần có:

- Đăng nhập bằng username/password hoặc PIN.
- Đăng xuất.
- Kiểm tra role ở backend.
- Hash mật khẩu/PIN, không lưu plain text.

JWT đơn giản là đủ cho bài tập. Không cần SSO, MFA hoặc hệ thống identity phức tạp.

### Quản lý bàn

- Admin thêm, sửa tên và tắt/bật bàn.
- Waiter xem sơ đồ bàn.
- Trạng thái bàn: `AVAILABLE`, `OCCUPIED`, `READY_TO_SERVE`, `PAYMENT_REQUESTED`.
- V1.0 chỉ cho một order đang mở trên một bàn để đơn giản hóa.

### Quản lý thực đơn

- Admin CRUD danh mục và món ăn.
- Cập nhật tên, giá, mô tả và URL hình ảnh.
- Bếp/Admin bật hoặc tắt trạng thái còn hàng.
- Waiter không được chọn món hết hàng.
- Không xóa vật lý món đã xuất hiện trong order; chỉ đánh dấu không hoạt động.

### Order

Waiter có thể chọn bàn, chọn món, tăng/giảm số lượng, thêm ghi chú, gửi bếp, theo dõi món và yêu cầu thanh toán.

Trạng thái order:

```text
OPEN → SUBMITTED → IN_PROGRESS → READY → SERVED → PAYMENT_REQUESTED → PAID → CLOSED
```

Trạng thái món:

```text
PENDING → COOKING → DONE → SERVED
```

Quy tắc tối thiểu:

- Chỉ order đã gửi mới xuất hiện ở bếp.
- Bếp xử lý món theo thứ tự gửi trước làm trước.
- Bếp chuyển `PENDING → COOKING → DONE`.
- Waiter chuyển `DONE → SERVED`.
- Backend phải kiểm tra quyền và trạng thái trong mọi thao tác.

### Màn hình bếp

- Hiển thị món đang chờ và đang nấu.
- Sắp xếp theo thời gian gửi.
- Hiển thị số bàn, tên món, số lượng và ghi chú.
- Có nút lớn để chuyển sang `COOKING` và `DONE`.
- Có thể bật/tắt hết hàng cho món.

Không cần làm nhiều khu bếp, nhiều KDS hoặc điều phối bếp nâng cao.

### Thanh toán và hóa đơn

Cashier xem yêu cầu thanh toán, xem món, áp dụng giảm giá, tính VAT 8%, đánh dấu đã thanh toán và in hóa đơn bằng trình duyệt.

```text
Tạm tính = tổng số lượng × đơn giá
Sau giảm giá = Tạm tính - Giảm giá
VAT = Sau giảm giá × 8%
Tổng tiền = Sau giảm giá + VAT
```

Đơn giá cần được lưu trong order item để giá cũ không thay đổi khi Admin cập nhật menu. V1.0 chỉ cần phương thức tiền mặt; không tích hợp cổng thanh toán online.

### Báo cáo

Admin xem theo ngày:

- Tổng doanh thu.
- Số order hoàn thành.
- Tổng VAT và giảm giá.
- Top món bán chạy.

Có thể tính trực tiếp bằng SQL, chưa cần hệ thống báo cáo riêng.

## 5. Database tối giản

Các bảng chính:

```text
users
roles
restaurant_tables
categories
menu_items
orders
order_items
invoices
payments
```

Quan hệ:

```text
categories 1 ─── n menu_items
restaurant_tables 1 ─── n orders
orders 1 ─── n order_items
orders 1 ─── 1 invoices
invoices 1 ─── 1 payments
```

Trường quan trọng:

- `users`: id, username, password_hash, display_name, role, is_active.
- `restaurant_tables`: id, name, status, is_active.
- `categories`: id, name, is_active.
- `menu_items`: id, category_id, name, price, image_url, is_available, is_active.
- `orders`: id, table_id, created_by, status, created_at, updated_at.
- `order_items`: id, order_id, menu_item_id, item_name, unit_price, quantity, note, status.
- `invoices`: id, order_id, subtotal, discount, vat, total, status, created_at.
- `payments`: id, invoice_id, amount, method, paid_by, paid_at.

Nên lưu `item_name` và `unit_price` trong `order_items` như snapshot tại thời điểm gọi món.

## 6. REST API tối thiểu

Prefix: `/api/v1`.

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Bàn và menu

- `GET /tables`
- `POST /tables` — Admin
- `PATCH /tables/:id` — Admin
- `DELETE /tables/:id` — Admin
- `GET /menu`
- `POST /categories` — Admin
- `PATCH /categories/:id` — Admin
- `POST /menu-items` — Admin
- `PATCH /menu-items/:id` — Admin
- `DELETE /menu-items/:id` — Admin
- `PATCH /menu-items/:id/availability` — Kitchen/Admin

### Order và bếp

- `GET /tables/:tableId/orders/current`
- `POST /orders`
- `GET /orders/:id`
- `POST /orders/:id/submit`
- `POST /orders/:id/request-payment`
- `POST /order-items/:id/serve`
- `GET /kitchen/queue`
- `POST /kitchen/order-items/:id/start`
- `POST /kitchen/order-items/:id/done`

### Thu ngân và báo cáo

- `GET /cashier/payment-requests`
- `GET /orders/:id/invoice`
- `POST /orders/:id/pay`
- `GET /reports/revenue?date=YYYY-MM-DD`
- `GET /reports/top-items?date=YYYY-MM-DD`

Frontend và backend cần thống nhất tên API, status code và format lỗi. Không cần thiết kế API quá lớn.

## 7. Realtime đơn giản

Các event cần có:

- `order.submitted`: báo cho bếp.
- `order_item.status_changed`: báo cho phục vụ.
- `menu.availability_changed`: báo món hết hàng.
- `payment.requested`: báo cho thu ngân.
- `payment.completed`: cập nhật bàn.

WebSocket chỉ dùng để thông báo. Database vẫn là nguồn dữ liệu chính.

Nếu mất kết nối, frontend hiển thị thông báo và gọi lại API khi kết nối lại. Không cần xây dựng event queue hoặc cơ chế đồng bộ phức tạp.

## 8. Bảo mật tối thiểu

- Dùng HTTPS khi deploy.
- Không commit `.env`.
- Hash mật khẩu/PIN.
- Kiểm tra authentication và role ở backend.
- Validate dữ liệu đầu vào.
- Dùng ORM hoặc parameterized query.
- Cấu hình CORS cho frontend.
- Không log password hoặc token.

## 9. Triển khai

Theo SRS:

- Frontend: Vercel.
- Backend: Render.
- Database: Neon PostgreSQL.

Biến môi trường tối thiểu:

```text
DATABASE_URL=...
JWT_SECRET=...
FRONTEND_URL=...
PORT=...
```

Backend nên có `GET /health` để kiểm tra server đang chạy.

## 10. Kiểm thử vừa đủ

### Unit test

- Tính tổng tiền, VAT và giảm giá.
- Kiểm tra chuyển trạng thái order.
- Kiểm tra quyền theo role.

### Integration test

- Đăng nhập.
- Tạo và submit order.
- Bếp cập nhật món.
- Request payment và pay.
- Món hết hàng không thể thêm vào order mới.

### Kịch bản demo end-to-end

1. Waiter đăng nhập, chọn bàn và gọi món.
2. Kitchen nhận order, chuyển món sang đang nấu và đã xong.
3. Waiter thấy món đã xong và đánh dấu đã phục vụ.
4. Waiter yêu cầu thanh toán.
5. Cashier tính tiền, VAT, giảm giá và hoàn tất.
6. Admin kiểm tra menu, bàn và báo cáo.

## 11. Những điểm cần chốt với nhóm

1. V1.0 chỉ có một order đang mở trên mỗi bàn.
2. Gọi thêm món thì thêm item vào order hiện tại.
3. Waiter là người đánh dấu món đã phục vụ.
4. Cashier dùng tiền mặt trong bản đầu tiên.
5. Giảm giá dùng một số tiền cố định.
6. In hóa đơn bằng trình duyệt, chưa cần máy in nhiệt.
7. Một nhà hàng duy nhất, chưa làm multi-tenant.
8. Chỉ cần một màn hình bếp và một màn hình thu ngân trong demo.

## 12. Kết luận

Kiến trúc phù hợp nhất là:

> **Một frontend web responsive + một backend monolithic 3 lớp + một PostgreSQL database + WebSocket đơn giản.**

Thiết kế này đủ đáp ứng các yêu cầu chính trong SRS nhưng vẫn giữ dự án nhỏ, dễ triển khai và phù hợp mục tiêu môn học. Không nên bổ sung microservices, event-driven architecture, Redis, Kubernetes, offline-first hoặc các tính năng thương mại điện tử vì không cần thiết cho bài tập.
