# Browser Debugging Checklist

## Quick Reference Guide for Cart Items Not Displaying

### Before You Start

1. ✅ Backend is running: `http://localhost:8000/docs`
2. ✅ Frontend is running: `http://localhost:5173`
3. ✅ Backend test passed (run `./test_cart_debug.sh`)

---

## Step-by-Step Browser Debugging

### STEP 1: Open Browser DevTools

**Chrome:** F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
**Firefox:** F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
**Safari:** Cmd+Option+C (Mac, enable Developer menu first)

---

### STEP 2: Navigate to Cart Page

Go to: `http://localhost:5173/cart`

**Watch the Console tab** - logs will appear immediately

---

### STEP 3: Console Tab - Check Logs

Look for these sections in order:

#### A. Component Mount
```
========== CART COMPONENT MOUNTED ==========
```

**What to check:**
- [ ] `Current URL` shows `http://localhost:5173/cart`
- [ ] `Document cookies` shows cookies (may be empty)
- [ ] `Session cookie found?` = `true` or `false`
- [ ] If false: **Record this as potential issue**

#### B. API Call
```
========== CART API: getCart() CALLED ==========
```

**What to check:**
- [ ] `API URL` shows `http://localhost:8000/cart/`
- [ ] `Response status` = `200`
- [ ] `Response ok` = `true`
- [ ] If status is not 200: **Record the actual status code**

#### C. Raw JSON Response
```
========== RAW JSON RESPONSE ==========
```

**Critical checks:**
- [ ] `Type of data` = `object`
- [ ] `Has items?` = `true`
- [ ] `Items is array?` = `true`
- [ ] `Items length` = number > 0
- [ ] `First item` shows object with product data

**If Items length = 0:**
- ❌ **Cart is empty** - Add items first or check backend

**If Has items? = false:**
- ❌ **Response structure is wrong** - Compare with backend curl response

#### D. Component Data Reception
```
========== DATA RECEIVED IN COMPONENT ==========
```

**What to check:**
- [ ] Data matches Raw JSON Response exactly
- [ ] `Has items property?` = `true`
- [ ] `data.items length` = same as API response

**If data is different:**
- ❌ **Data transformation issue** - Something is modifying the response

#### E. State Update
```
========== CART DATA STATE CHANGED ==========
```

**What to check:**
- [ ] `cartData` is not null
- [ ] `Has items?` = `true`
- [ ] `items length` matches received data

**If cartData is null:**
- ❌ **State update failed** - React state issue

**If items length is 0 but data had items:**
- ❌ **State corruption** - Data lost during setState

#### F. Render Decision
```
========== RENDER DECISION ==========
```

**Critical check:**
- [ ] `cartData?.items.length` = number > 0
- [ ] `isEmpty` = `false`
- [ ] `Will render` = `CART ITEMS`

**If isEmpty = true but items exist:**
- ❌ **Logic bug found** - This is the smoking gun!

**If Will render = EMPTY CART but items exist:**
- ❌ **Conditional logic is wrong**

---

### STEP 4: Network Tab - Verify Request

1. Click **Network** tab
2. Filter by **XHR** or **Fetch**
3. Find request to `cart/`
4. Click on it

#### Request Headers
**What to check:**
- [ ] Request URL: `http://localhost:8000/cart/`
- [ ] Request Method: `GET`
- [ ] Status Code: `200`

**Check for Cookie header:**
```
Cookie: session_id=xxxxxxxxxx
```
- [ ] Cookie header exists
- [ ] Contains `session_id`

**If Cookie header is missing:**
- ❌ **Cookie not being sent** - Check Application tab

#### Response Headers
**What to check:**
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```
- [ ] Both headers present
- [ ] Origin matches frontend URL

**If CORS headers missing:**
- ❌ **CORS misconfiguration** - Check backend CORS settings

#### Response Preview
**What to check:**
- [ ] Shows cart object with items array
- [ ] Items array has elements
- [ ] Each item has product object

**Copy the response and compare with backend curl test**

---

### STEP 5: Application Tab - Check Cookies

**Chrome/Edge:**
1. Click **Application** tab
2. Expand **Cookies**
3. Click `http://localhost:5173`

**Firefox:**
1. Click **Storage** tab
2. Expand **Cookies**
3. Click `http://localhost:5173`

**Safari:**
1. Click **Storage** tab
2. Click **Cookies**

#### Cookie Details to Check

Look for `session_id` cookie:

| Property | Expected | Your Value | Status |
|----------|----------|------------|--------|
| Name | `session_id` | | ☐ |
| Value | (string) | | ☐ |
| Domain | `localhost` | | ☐ |
| Path | `/` | | ☐ |
| Expires | (future date) | | ☐ |
| Size | > 0 | | ☐ |
| HttpOnly | ✓ or ✗ | | ☐ |
| Secure | ✗ | | ☐ |
| SameSite | Lax/Strict/None | | ☐ |

**If session_id cookie is missing:**
- ❌ **Cookie not set** - Check if you've added items to cart
- Try adding item from product page first
- Check backend cookie settings

**If Domain is wrong:**
- ❌ **Cookie domain mismatch** - Backend setting issue

**If Expired:**
- ❌ **Cookie expired** - Try clearing and refreshing

---

### STEP 6: Visual Check

#### If Cart Shows "Empty Cart" Message

But console shows items exist:

**Possible causes:**
1. Render condition logic is wrong (check RENDER DECISION logs)
2. CSS hiding the items (use Inspect Element)
3. JavaScript error preventing render (check Console for errors)

#### If Cart Shows Loading Forever

**Possible causes:**
1. `isLoading` state stuck as true
2. API call never completing
3. Error not being caught

#### If Cart Shows Nothing (Blank)

**Possible causes:**
1. React component not rendering at all
2. Route not matching
3. Fatal JavaScript error (check Console)

---

## Quick Diagnostic Table

| Symptom | Where to Look | Likely Cause |
|---------|---------------|--------------|
| "Session cookie found? false" | Console: Component Mount | No cart session created yet |
| "Response status: 404" | Console: API Call | Wrong API endpoint or backend down |
| "Response status: 500" | Console: API Call | Backend error - check backend logs |
| "Items length: 0" | Console: Raw JSON | Cart is actually empty in database |
| "Has items? false" | Console: Raw JSON | Response structure mismatch |
| Data different in Component vs API | Console: Compare sections | Data transformation bug |
| "isEmpty: true" but items exist | Console: Render Decision | Logic bug in conditional |
| No Cookie header in Network request | Network: Request Headers | Cookie not being sent - check SameSite |
| No session_id in Application tab | Application: Cookies | Cookie never created - add item first |
| Cart shows empty but logs show items | Visual + Console | Render logic bug - found it! |

---

## What to Report

After checking all steps, provide:

1. **Screenshot of Console tab** showing all log sections
2. **Screenshot of Network tab** showing:
   - Request headers (especially Cookie)
   - Response headers (especially CORS)
   - Response preview
3. **Screenshot of Application > Cookies** showing session_id cookie details
4. **Copy-paste of console output** (select all, copy)
5. **Specific point where data differs** (e.g., "API shows 4 items but component receives 0")

---

## Expected Working Output

When everything works, you should see:

**Console:**
```
========== CART COMPONENT MOUNTED ==========
Session cookie found? true
========== CART API: getCart() CALLED ==========
Response status: 200
========== RAW JSON RESPONSE ==========
Items length: 4
========== DATA RECEIVED IN COMPONENT ==========
data.items length: 4
========== CART DATA STATE CHANGED ==========
items length: 4
========== RENDER DECISION ==========
isEmpty: false
Will render: CART ITEMS
```

**Network:**
- Status: 200 OK
- Cookie header present with session_id
- Response shows items array with data

**Application/Cookies:**
- session_id cookie present and valid

**Visual:**
- Cart page shows list of items
- Each item shows image, name, price, quantity controls

---

## Common Issues Quick Fix

### Issue: No session cookie
**Fix:** Navigate to a product page and click "Add to Cart" - this creates the session

### Issue: Cookie not sent in request
**Fix:** Make sure frontend URL is exactly `http://localhost:5173` (not 127.0.0.1)

### Issue: CORS error
**Fix:** Restart backend after checking CORS settings in `backend/app/main.py`

### Issue: Items in API but not in component
**Fix:** Check if React strict mode is causing double renders - this is the data transformation bug we're looking for

### Issue: Items in component but not rendered
**Fix:** Check RENDER DECISION logs - this is the conditional logic bug

---

## Need More Help?

If you've checked everything and still can't find the issue:

1. Copy ALL console output to a file
2. Take screenshots of Network and Cookies tabs
3. Run `./test_cart_debug.sh` and save output
4. Compare backend response with frontend API response
5. Identify the **exact step** where data becomes incorrect

The logs are now comprehensive enough to pinpoint the exact failure point.
