#!/bin/bash
# Script để fix lỗi duplicate code trong database

echo "Dừng và xóa database cũ..."
docker compose down -v

echo "Khởi động lại với database mới..."
docker compose up --build -d

echo "Đợi database khởi động..."
sleep 10

echo "Kiểm tra logs..."
docker compose logs api | tail -20

echo ""
echo "✅ Hoàn tất! Database đã được reset."
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8080"
