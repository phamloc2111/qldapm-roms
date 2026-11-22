## 1. Yêu cầu trước khi chạy

- **Node.js**: 18+ 
- **Backend API**: Đang chạy tại `http://localhost:8080` (sử dụng H2 in-memory hoặc PostgreSQL)

## 2. Quy trình khởi chạy

### B1: Khởi động Backend

```powershell
cd be
mvn spring-boot:run
```


---

### B2: Setup Tài khoản nhân viên mẫu (Phục vụ, Nhà bếp, Thu ngân)

> **Lưu ý:** Dữ liệu **20 Danh mục**, **50 Món ăn** (kèm hình ảnh) và **20 Bàn ăn (`Bàn 01` ➔ `Bàn 20`)** đã được Flyway tự động khởi tạo sẵn trong Database thông qua các bản migration `V4` – `V6`.
> Bạn có thể đăng nhập bằng tài khoản **`admin` / `adminpassword123`** và vào tab **Quản lý Tài khoản** trên giao diện để thêm/sửa/xóa tài khoản nhân viên, hoặc chạy nhanh đoạn lệnh **PowerShell** dưới đây để tạo 3 tài khoản nhân viên mẫu (có đầy đủ `fullName` phục vụ truy vết):

Mở **PowerShell** mới:

```powershell
$baseUrl = "http://localhost:8080/api/v1"

function Post-Json($path, $obj, $headers = @{}) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Depth 5))
    return Invoke-RestMethod -Uri "$baseUrl$path" -Method POST -Headers $headers -ContentType "application/json; charset=utf-8" -Body $bytes
}

# 1. Đăng nhập Admin lấy JWT Token
$login = Post-Json "/auth/login" @{ username = "admin"; password = "adminpassword123" }
$auth = @{ Authorization = "Bearer $($login.accessToken)" }

# 2. Tạo 3 tài khoản nhân viên (kèm Họ và tên để lưu truy vết gọi món, bếp nấu và thanh toán)
@(
    @{ username = "waiter01";  password = "password123456"; fullName = "Nguyễn Văn Phục Vụ"; role = "WAITER" },
    @{ username = "kitchen01"; password = "password123456"; fullName = "Trần Văn Đầu Bếp";   role = "KITCHEN" },
    @{ username = "cashier01"; password = "password123456"; fullName = "Lê Thị Thu Ngân";    role = "CASHIER" }
) | ForEach-Object { try { Post-Json "/users" $_ $auth | Out-Null } catch {} }

Write-Host ">>> Đã khởi tạo thành công 3 tài khoản nhân viên (waiter01, kitchen01, cashier01) kèm Họ và tên!" -ForegroundColor Green
```

---

### B3: Khởi động Frontend

```bash
cd fe
npm install
npm run dev
```

Truy cập ứng dụng tại: **`http://localhost:5173`**


## 3. Tài khoản đăng nhập theo vai trò

| Phân hệ / Vai trò | Tên đăng nhập (`User ID`) | Họ và tên mẫu | Mật khẩu mẫu | Điều hướng mặc định | Mô tả chức năng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phục vụ** (`WAITER`) | `waiter01` | Nguyễn Văn Phục Vụ | `password123456` | `/tables` (Sơ đồ bàn) | Xem trạng thái bàn, tạo đơn / gọi thêm món (lưu tên người gọi), theo dõi tiến độ món ăn, xác nhận phục vụ, gửi yêu cầu thanh toán |
| **Nhà bếp** (`KITCHEN`) | `kitchen01` | Trần Văn Đầu Bếp | `password123456` | `/kitchen` (Màn hình bếp) | Xem hàng đợi món theo thứ tự FIFO, chuyển trạng thái chế biến (*Chờ nấu ➔ Đang nấu ➔ Đã xong*, lưu tên bếp chế biến), báo hết hàng / mở bán món |
| **Thu ngân** (`CASHIER`) | `cashier01` | Lê Thị Thu Ngân | `password123456` | `/cashier` (Giao diện Thu Ngân) | Thanh toán hóa đơn & in hóa đơn (lưu tên nhân viên thanh toán trên hóa đơn) |
| **Quản trị viên** (`ADMIN`) | `admin` | Quản trị viên | `adminpassword123` | `/admin` (Giao diện Quản trị) | Thanh toán, Gọi món, Theo dõi món, Quản lý Thực đơn, Quản lý Sơ đồ bàn, Báo cáo Doanh thu & Lịch sử hóa đơn chi tiết, Quản lý Tài khoản (Thêm/Sửa/Xóa) |

`ADMIN` được điều hướng đến `/admin`, `CASHIER` đến `/cashier`. Hai route dùng chung màn hình `CashierPage`; tài khoản `ADMIN` được hiển thị thêm các tab quản trị theo vai trò.
