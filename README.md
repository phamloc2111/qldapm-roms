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

### B2: Setup trước Dữ liệu (Tài khoản, Bàn ăn & Thực đơn)

> Database chưa có tài khoản Phục vụ, Nhà bếp, Bàn ăn hay Thực đơn. Ngoài ra, cơ sở dữ liệu mặc định là **H2 in-memory** (sẽ làm mới mỗi khi tắt backend).

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

# 2. Tạo 3 tài khoản nhân viên (Phục vụ, Nhà bếp, Thu ngân)
@(
    @{ username = "waiter01";  password = "password123456"; role = "WAITER" },
    @{ username = "kitchen01"; password = "password123456"; role = "KITCHEN" },
    @{ username = "cashier01"; password = "password123456"; role = "CASHIER" }
) | ForEach-Object { try { Post-Json "/users" $_ $auth | Out-Null } catch {} }

# 3. Tạo 12 Bàn ăn (T1 -> T12 với các mức 2, 4, 6, 8 chỗ)
@(
    @{ name = "T1";  capacity = 4 },
    @{ name = "T2";  capacity = 4 },
    @{ name = "T3";  capacity = 4 },
    @{ name = "T4";  capacity = 4 },
    @{ name = "T5";  capacity = 2 },
    @{ name = "T6";  capacity = 2 },
    @{ name = "T7";  capacity = 4 },
    @{ name = "T8";  capacity = 6 },
    @{ name = "T9";  capacity = 4 },
    @{ name = "T10"; capacity = 4 },
    @{ name = "T11"; capacity = 8 },
    @{ name = "T12"; capacity = 8 }
) | ForEach-Object { try { Post-Json "/tables" $_ $auth | Out-Null } catch {} }

# 4. Tạo 4 Danh mục món ăn
$catMonChinh   = Post-Json "/categories" @{ name = "Món ăn chính" } $auth
$catKhaiVi     = Post-Json "/categories" @{ name = "Món khai vị" }  $auth
$catThucUong   = Post-Json "/categories" @{ name = "Thức uống" }    $auth
$catTrangMieng = Post-Json "/categories" @{ name = "Tráng miệng" }  $auth

# 5. Tạo 12 Món ăn trong Thực đơn
@(
    @{
        categoryId  = $catMonChinh.id
        name        = "Phở bò"
        priceVnd    = 120000
        description = "Phở bò tái nạm thơm ngon gia truyền với nước hầm xương 24h"
        imageUrl    = "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catMonChinh.id
        name        = "Bún bò Huế"
        priceVnd    = 85000
        description = "Bún bò Huế cay nồng chuẩn vị cố đô, chả cua thịt bắp bò"
        imageUrl    = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catMonChinh.id
        name        = "Cơm sườn"
        priceVnd    = 75000
        description = "Cơm sườn nướng mật ong mềm thơm ăn kèm mỡ hành"
        imageUrl    = "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catMonChinh.id
        name        = "Pizza Hải Sản"
        priceVnd    = 150000
        description = "Pizza tôm mực phô mai mozzarella kéo sợi hảo hạng"
        imageUrl    = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catMonChinh.id
        name        = "Mì Ý sốt bò bằm"
        priceVnd    = 95000
        description = "Mì Ý sợi dai sốt bolognese đậm đà rắc phô mai parmesan"
        imageUrl    = "https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catKhaiVi.id
        name        = "Gà rán"
        priceVnd    = 70000
        description = "Gà rán giòn rụm tẩm ướp sốt cay ngọt Hàn Quốc"
        imageUrl    = "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catKhaiVi.id
        name        = "Chả giò hải sản"
        priceVnd    = 55000
        description = "Chả giò chiên vàng giòn sốt mayonnaise"
        imageUrl    = "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catKhaiVi.id
        name        = "Gỏi cuốn tôm thịt"
        priceVnd    = 45000
        description = "Gỏi cuốn tôm thịt thanh đạm chấm tương đậu phộng"
        imageUrl    = "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catThucUong.id
        name        = "Trà tắc"
        priceVnd    = 25000
        description = "Trà lài tắc thanh mát giải nhiệt mùa hè"
        imageUrl    = "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catThucUong.id
        name        = "Trà đào"
        priceVnd    = 35000
        description = "Trà đào cam sả thanh ngọt thơm nức mũi miếng đào giòn"
        imageUrl    = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catThucUong.id
        name        = "Cà phê sữa đá"
        priceVnd    = 29000
        description = "Cà phê phin truyền thống đậm vị sánh đặc sữa thơm"
        imageUrl    = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
    },
    @{
        categoryId  = $catTrangMieng.id
        name        = "Bánh flan caramel"
        priceVnd    = 30000
        description = "Bánh flan mềm mịn thơm ngậy cà phê đá caramen"
        imageUrl    = "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80"
    }
) | ForEach-Object { try { Post-Json "/menu-items" $_ $auth | Out-Null } catch {} }

Write-Host ">>> Đã khởi tạo thành công Tài khoản, 12 Bàn ăn, 4 Danh mục và 12 Món ăn!" -ForegroundColor Green

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

| Phân hệ / Vai trò | Tên đăng nhập | Mật khẩu mẫu | Điều hướng mặc định | Mô tả chức năng |
| :--- | :--- | :--- | :--- | :--- |
| **Phục vụ** (`WAITER`) | `waiter01` | `password123456` | `/tables` (Sơ đồ bàn) | Xem trạng thái bàn, tạo đơn / gọi thêm món, theo dõi tiến độ món ăn, gửi yêu cầu thanh toán |
| **Nhà bếp** (`KITCHEN`) | `kitchen01` | `password123456` | `/kitchen` (Màn hình bếp) | Xem hàng đợi món theo thứ tự FIFO, chuyển trạng thái chế biến (*Chờ nấu ➔ Đang nấu ➔ Đã xong*), báo hết hàng / mở bán món |
| **Thu ngân** (`CASHIER`) | `cashier01` | `password123456` | `/cashier` (Giao diện Thu Ngân)| Thanh toán hóa đơn | 
| **Quản trị viên** (`ADMIN`) | `admin` | `adminpassword123` | `/admin` (Giao diện quản trị) | Thanh toán, Gọi món, Theo dõi món, Quản lý menu, Quản lý bàn ăn, Theo dõi doanh thu |

`ADMIN` được điều hướng đến `/admin`, `CASHIER` đến `/cashier`. Hai route dùng chung màn hình `CashierPage`; tài khoản `ADMIN` được hiển thị thêm các tab quản trị theo vai trò.
