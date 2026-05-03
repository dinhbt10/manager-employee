#!/bin/bash

echo "🧪 Script test tính năng STT và Phân trang"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker không chạy. Vui lòng mở Docker Desktop!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker đang chạy${NC}"
echo ""

# Step 1: Clean up old database
echo "📦 Bước 1: Dọn dẹp database cũ..."
docker compose down -v > /dev/null 2>&1
echo -e "${GREEN}✅ Đã xóa database cũ${NC}"
echo ""

# Step 2: Start backend
echo "🚀 Bước 2: Khởi động backend + database..."
docker compose up --build -d

echo "⏳ Đợi database khởi động (15 giây)..."
sleep 15

# Check if containers are running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Backend đang chạy${NC}"
else
    echo -e "${RED}❌ Backend không khởi động được. Kiểm tra logs:${NC}"
    docker compose logs api | tail -20
    exit 1
fi

# Check for errors in logs
if docker compose logs api | grep -i "error\|exception" | grep -v "DEBUG" > /dev/null; then
    echo -e "${YELLOW}⚠️  Có lỗi trong logs. Kiểm tra:${NC}"
    docker compose logs api | grep -i "error\|exception" | tail -10
else
    echo -e "${GREEN}✅ Không có lỗi trong logs${NC}"
fi

echo ""

# Step 3: Check if frontend is ready
echo "🎨 Bước 3: Kiểm tra frontend..."
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules đã có${NC}"
else
    echo -e "${YELLOW}⚠️  Chưa cài node_modules. Chạy: cd frontend && npm install${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Hoàn tất setup!${NC}"
echo ""
echo "📋 Các bước tiếp theo:"
echo "1. Mở terminal mới và chạy:"
echo "   cd frontend && npm run dev"
echo ""
echo "2. Mở trình duyệt: http://localhost:5173"
echo ""
echo "3. Đăng nhập với:"
echo "   - Admin: admin / admin123"
echo "   - Manager: manager / manager123"
echo "   - Employee: nhanvien / nv123456"
echo ""
echo "4. Vào màn 'Request cấp quyền'"
echo ""
echo "5. Kiểm tra:"
echo "   ✓ Cột STT hiển thị"
echo "   ✓ Phân trang hoạt động"
echo "   ✓ Dropdown chọn số bản ghi/trang"
echo "   ✓ Nút Trước/Sau"
echo "   ✓ Click số trang"
echo ""
echo "6. Tạo thêm request để test phân trang (ít nhất 15-20 request)"
echo ""
echo "=========================================="
echo ""
echo "📊 Kiểm tra trạng thái:"
echo "Backend API: http://localhost:8080/actuator/health"
echo "Database: localhost:5432 (user: emp, password: emp, db: empdb)"
echo ""
echo "📝 Xem logs:"
echo "docker compose logs -f api"
echo ""
echo "🛑 Dừng:"
echo "docker compose down"
