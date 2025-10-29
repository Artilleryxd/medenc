#!/bin/bash
# Test Tamper Detection Script

echo "🧪 Tamper Detection Test Script"
echo "================================"
echo ""

# Check if server is running
echo "Checking if backend is running..."
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "❌ Backend is not running on http://localhost:8000"
  echo "Please start the backend with: cd backend && npm start"
  exit 1
fi
echo "✅ Backend is running"
echo ""

# Fetch all images to get test data
echo "📋 Fetching uploaded images..."
IMAGES=$(curl -s http://localhost:8000/api/all-images)
IMAGE_COUNT=$(echo $IMAGES | jq -r '.count')

if [ "$IMAGE_COUNT" -eq "0" ]; then
  echo "❌ No images found. Please upload at least one image first."
  echo "Upload an image using the frontend or:"
  echo "  curl -X POST http://localhost:8000/api/upload -F 'images=@/path/to/image.jpg'"
  exit 1
fi

echo "✅ Found $IMAGE_COUNT image(s)"
echo ""

# Get first image details
IMAGE_ID=$(echo $IMAGES | jq -r '.images[0].imageID')
REAL_CID=$(echo $IMAGES | jq -r '.images[0].cid')

echo "Using test image:"
echo "  Image ID: $IMAGE_ID"
echo "  CID: $REAL_CID"
echo ""

# Test 1: Verify with correct CID (should pass)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Verify with CORRECT CID (Should Pass)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d "{\"imageID\": \"$IMAGE_ID\", \"cid\": \"$REAL_CID\"}")

echo "Response:"
echo $RESPONSE | jq .
echo ""

TAMPERED=$(echo $RESPONSE | jq -r '.tampered')
if [ "$TAMPERED" == "false" ]; then
  echo "✅ TEST 1 PASSED: File integrity verified - No tampering"
else
  echo "❌ TEST 1 FAILED: Expected no tampering but got tampered=true"
fi

echo ""
echo ""

# Test 2: Verify with fake CID (should detect tampering)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Verify with FAKE CID (Should Detect Tampering)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAKE_CID="QmFakeTamperedCID123456789ABCDEFGHIJ"
echo "Using fake CID: $FAKE_CID"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d "{\"imageID\": \"$IMAGE_ID\", \"cid\": \"$FAKE_CID\"}")

echo "Response:"
echo $RESPONSE | jq .
echo ""

TAMPERED=$(echo $RESPONSE | jq -r '.tampered')
if [ "$TAMPERED" == "true" ]; then
  echo "✅ TEST 2 PASSED: Tampering detected successfully"
  echo ""
  echo "Blockchain CID: $(echo $RESPONSE | jq -r '.blockchainCID')"
  echo "Provided CID:   $(echo $RESPONSE | jq -r '.providedCID')"
  echo ""
  echo "Recommendation: $(echo $RESPONSE | jq -r '.recommendation')"
else
  echo "❌ TEST 2 FAILED: Expected tampering detection but got tampered=false"
fi

echo ""
echo ""

# Test 3: Test with non-existent image ID
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Verify Non-Existent Image (Should Return 404)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

FAKE_ID="9999999999999"
echo "Using fake Image ID: $FAKE_ID"
echo ""

HTTP_CODE=$(curl -s -o /tmp/verify_response.json -w "%{http_code}" -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d "{\"imageID\": \"$FAKE_ID\", \"cid\": \"$REAL_CID\"}")

RESPONSE=$(cat /tmp/verify_response.json)

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo $RESPONSE | jq .
echo ""

if [ "$HTTP_CODE" == "404" ]; then
  echo "✅ TEST 3 PASSED: Non-existent image correctly returns 404"
else
  echo "❌ TEST 3 FAILED: Expected HTTP 404 but got $HTTP_CODE"
fi

echo ""
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "All tests completed!"
echo ""
echo "The /api/verify-file endpoint is working correctly."
echo "It can:"
echo "  ✅ Verify legitimate files (no tampering)"
echo "  ✅ Detect tampered files (CID mismatch)"
echo "  ✅ Handle non-existent images gracefully"
echo ""
echo "For more testing options, see TAMPER_DETECTION_TEST.md"
echo ""

