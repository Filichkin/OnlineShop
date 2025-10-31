#!/bin/bash

# Cart Debugging Test Script
# This script helps verify the cart backend is working correctly

echo "=========================================="
echo "Cart Backend Debugging Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is NOT running${NC}"
    echo "Please start the backend first:"
    echo "  cd backend && uvicorn app.main:app --reload"
    exit 1
fi
echo ""

# Test cart endpoint without session
echo "2. Testing cart endpoint (new session)..."
RESPONSE=$(curl -s -c cookies.txt http://localhost:8000/cart/)
echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract session_id from cookies
if [ -f cookies.txt ]; then
    SESSION_ID=$(grep session_id cookies.txt | awk '{print $7}')
    if [ -n "$SESSION_ID" ]; then
        echo -e "${GREEN}✓ Session cookie created: $SESSION_ID${NC}"
    else
        echo -e "${YELLOW}⚠ No session cookie in response${NC}"
    fi
fi
echo ""

# Add item to cart
echo "3. Adding test item to cart (product_id=15, quantity=2)..."
ADD_RESPONSE=$(curl -s -b cookies.txt -X POST \
  http://localhost:8000/cart/items \
  -H "Content-Type: application/json" \
  -d '{"product_id": 15, "quantity": 2}')
echo "Response:"
echo "$ADD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ADD_RESPONSE"
echo ""

# Get cart with items
echo "4. Getting cart with items..."
CART_RESPONSE=$(curl -s -b cookies.txt http://localhost:8000/cart/)
echo "Response:"
echo "$CART_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CART_RESPONSE"
echo ""

# Check items array
ITEMS_LENGTH=$(echo "$CART_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('items', [])))" 2>/dev/null)
if [ -n "$ITEMS_LENGTH" ] && [ "$ITEMS_LENGTH" -gt 0 ]; then
    echo -e "${GREEN}✓ Cart has $ITEMS_LENGTH item(s)${NC}"
else
    echo -e "${RED}✗ Cart is empty or invalid${NC}"
fi
echo ""

# Check item structure
echo "5. Checking first item structure..."
FIRST_ITEM=$(echo "$CART_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data['items'][0], indent=2))" 2>/dev/null)
if [ -n "$FIRST_ITEM" ]; then
    echo "$FIRST_ITEM"
    echo ""

    # Check for required fields
    echo "Checking required fields:"

    HAS_PRODUCT=$(echo "$FIRST_ITEM" | grep -q '"product"' && echo "yes" || echo "no")
    HAS_QUANTITY=$(echo "$FIRST_ITEM" | grep -q '"quantity"' && echo "yes" || echo "no")
    HAS_PRICE=$(echo "$FIRST_ITEM" | grep -q '"price_at_addition"' && echo "yes" || echo "no")
    HAS_MAIN_IMAGE=$(echo "$FIRST_ITEM" | grep -q '"main_image"' && echo "yes" || echo "no")

    if [ "$HAS_PRODUCT" = "yes" ]; then
        echo -e "  ${GREEN}✓ Has 'product' field${NC}"
    else
        echo -e "  ${RED}✗ Missing 'product' field${NC}"
    fi

    if [ "$HAS_QUANTITY" = "yes" ]; then
        echo -e "  ${GREEN}✓ Has 'quantity' field${NC}"
    else
        echo -e "  ${RED}✗ Missing 'quantity' field${NC}"
    fi

    if [ "$HAS_PRICE" = "yes" ]; then
        echo -e "  ${GREEN}✓ Has 'price_at_addition' field${NC}"
    else
        echo -e "  ${RED}✗ Missing 'price_at_addition' field${NC}"
    fi

    if [ "$HAS_MAIN_IMAGE" = "yes" ]; then
        echo -e "  ${GREEN}✓ Has 'main_image' in product${NC}"
    else
        echo -e "  ${RED}✗ Missing 'main_image' in product${NC}"
    fi
else
    echo -e "${RED}✗ Could not parse first item${NC}"
fi
echo ""

# Test CORS headers
echo "6. Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I -H "Origin: http://localhost:5173" http://localhost:8000/cart/)
CORS_ALLOW_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin")
CORS_ALLOW_CREDS=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-credentials")

if [ -n "$CORS_ALLOW_ORIGIN" ]; then
    echo -e "${GREEN}✓ CORS Allow-Origin header present${NC}"
    echo "  $CORS_ALLOW_ORIGIN"
else
    echo -e "${RED}✗ CORS Allow-Origin header missing${NC}"
fi

if [ -n "$CORS_ALLOW_CREDS" ]; then
    echo -e "${GREEN}✓ CORS Allow-Credentials header present${NC}"
    echo "  $CORS_ALLOW_CREDS"
else
    echo -e "${RED}✗ CORS Allow-Credentials header missing${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "Session ID: ${SESSION_ID:-'Not created'}"
echo "Cart items count: ${ITEMS_LENGTH:-0}"
echo ""
echo "Next steps:"
echo "1. Start the frontend: cd frontend && npm run dev"
echo "2. Open browser DevTools (F12)"
echo "3. Go to http://localhost:5173/cart"
echo "4. Check console logs for detailed debugging info"
echo "5. Compare frontend console output with this backend test"
echo ""
echo "Session cookie saved to cookies.txt"
echo "You can use it to test frontend manually:"
echo "  - Copy session_id value from cookies.txt"
echo "  - In browser DevTools > Application > Cookies"
echo "  - Add cookie manually if needed"
echo ""

# Cleanup
rm -f cookies.txt

echo "Test complete!"
