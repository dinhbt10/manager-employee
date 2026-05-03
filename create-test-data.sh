#!/bin/bash

echo "🎲 Script tạo dữ liệu test cho phân trang"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq chưa cài. Cài bằng: brew install jq (macOS) hoặc apt install jq (Linux)${NC}"
    exit 1
fi

# API base URL
API_URL="http://localhost:8080/api"

# Login to get token
echo "🔐 Đăng nhập với tài khoản admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Đăng nhập thất bại. Kiểm tra backend đang chạy.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Đăng nhập thành công${NC}"
echo ""

# Get users and features
echo "📋 Lấy danh sách users và features..."
USERS=$(curl -s -X GET "$API_URL/users" -H "Authorization: Bearer $TOKEN")
FEATURES=$(curl -s -X GET "$API_URL/features" -H "Authorization: Bearer $TOKEN")

USER_IDS=($(echo $USERS | jq -r '.[].id'))
FEATURE_CODES=($(echo $FEATURES | jq -r '.[].code'))

if [ ${#USER_IDS[@]} -eq 0 ]; then
    echo -e "${RED}❌ Không có users. Kiểm tra seed data.${NC}"
    exit 1
fi

if [ ${#FEATURE_CODES[@]} -eq 0 ]; then
    echo -e "${RED}❌ Không có features. Kiểm tra seed data.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Có ${#USER_IDS[@]} users và ${#FEATURE_CODES[@]} features${NC}"
echo ""

# Number of requests to create
NUM_REQUESTS=25

echo "🎲 Tạo $NUM_REQUESTS requests..."
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for i in $(seq 1 $NUM_REQUESTS); do
    # Random user
    RANDOM_USER_INDEX=$((RANDOM % ${#USER_IDS[@]}))
    TARGET_USER_ID=${USER_IDS[$RANDOM_USER_INDEX]}
    
    # Random 2-4 features
    NUM_FEATURES=$((2 + RANDOM % 3))
    SELECTED_FEATURES=()
    for j in $(seq 1 $NUM_FEATURES); do
        RANDOM_FEATURE_INDEX=$((RANDOM % ${#FEATURE_CODES[@]}))
        SELECTED_FEATURES+=(${FEATURE_CODES[$RANDOM_FEATURE_INDEX]})
    done
    
    # Remove duplicates
    UNIQUE_FEATURES=($(echo "${SELECTED_FEATURES[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))
    
    # Build JSON array
    FEATURES_JSON=$(printf '%s\n' "${UNIQUE_FEATURES[@]}" | jq -R . | jq -s .)
    
    # Random title
    TITLES=(
        "Xin cấp quyền xem danh sách nhân viên"
        "Yêu cầu quyền chỉnh sửa thông tin"
        "Xin quyền duyệt request"
        "Cần quyền xuất Excel"
        "Xin quyền quản lý phòng ban"
        "Yêu cầu quyền xem báo cáo"
        "Xin quyền tạo nhân viên mới"
        "Cần quyền chỉnh sửa chức năng"
    )
    RANDOM_TITLE_INDEX=$((RANDOM % ${#TITLES[@]}))
    TITLE="${TITLES[$RANDOM_TITLE_INDEX]} #$i"
    
    # Random description
    DESCRIPTIONS=(
        "Cần hỗ trợ công việc điều phối"
        "Để thực hiện nhiệm vụ được giao"
        "Yêu cầu từ quản lý trực tiếp"
        "Cần thiết cho công việc hàng ngày"
        "Hỗ trợ team trong dự án mới"
    )
    RANDOM_DESC_INDEX=$((RANDOM % ${#DESCRIPTIONS[@]}))
    DESCRIPTION="${DESCRIPTIONS[$RANDOM_DESC_INDEX]}"
    
    # Create request
    REQUEST_DATA=$(jq -n \
        --arg title "$TITLE" \
        --arg desc "$DESCRIPTION" \
        --argjson targetUserId "$TARGET_USER_ID" \
        --argjson features "$FEATURES_JSON" \
        '{
            title: $title,
            description: $desc,
            targetUserId: $targetUserId,
            requestedFeatureCodes: $features
        }')
    
    RESPONSE=$(curl -s -X POST "$API_URL/requests" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$REQUEST_DATA")
    
    REQUEST_ID=$(echo $RESPONSE | jq -r '.id')
    
    if [ "$REQUEST_ID" != "null" ] && [ ! -z "$REQUEST_ID" ]; then
        echo -e "${GREEN}✅ Request #$i: $TITLE${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        
        # Random: submit some requests (50% chance)
        if [ $((RANDOM % 2)) -eq 0 ]; then
            curl -s -X POST "$API_URL/requests/$REQUEST_ID/submit" \
                -H "Authorization: Bearer $TOKEN" > /dev/null
            echo "   → Đã gửi duyệt"
            
            # Random: approve some submitted requests (30% chance)
            if [ $((RANDOM % 10)) -lt 3 ]; then
                curl -s -X POST "$API_URL/requests/$REQUEST_ID/approve" \
                    -H "Authorization: Bearer $TOKEN" > /dev/null
                echo "   → Đã duyệt"
            fi
        fi
    else
        echo -e "${RED}❌ Request #$i: Thất bại${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    
    # Small delay to avoid overwhelming the server
    sleep 0.2
done

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Hoàn tất!${NC}"
echo ""
echo "📊 Kết quả:"
echo "   - Thành công: $SUCCESS_COUNT/$NUM_REQUESTS"
echo "   - Thất bại: $FAIL_COUNT/$NUM_REQUESTS"
echo ""
echo "🎯 Bây giờ có thể:"
echo "   1. Mở http://localhost:5173"
echo "   2. Đăng nhập với admin / admin123"
echo "   3. Vào màn 'Request cấp quyền'"
echo "   4. Test phân trang với $SUCCESS_COUNT requests"
echo ""
echo "📸 Chụp màn hình theo hướng dẫn trong SCREENSHOT_GUIDE.md"
echo ""
