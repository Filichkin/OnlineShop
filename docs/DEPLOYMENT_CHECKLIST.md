# Deployment Checklist - Security Fixes

## Pre-Deployment Steps

### 1. Environment Setup
- [ ] Copy `infra/.env.example` to `infra/.env`
- [ ] Generate strong SECRET (32+ characters): `openssl rand -hex 32`
- [ ] Set strong POSTGRES_PASSWORD (12+ characters)
- [ ] Set strong FIRST_SUPERUSER_PASSWORD
- [ ] Verify `.env` is in `.gitignore` and NOT committed to git

### 2. Dependencies
- [ ] Install python-magic: `cd backend && uv sync` or `pip install python-magic>=0.4.27`
- [ ] For macOS: `brew install libmagic` (if needed)
- [ ] For Ubuntu/Debian: `sudo apt-get install libmagic1` (if needed)
- [ ] For Windows: python-magic-bin is used automatically

### 3. Code Review
- [ ] Review all changes in `CHANGES_SUMMARY.md`
- [ ] Review detailed fixes in `SECURITY_FIXES.md`
- [ ] Verify all modified files are correct

---

## Testing Checklist

### 1. Secret Validation Tests
```bash
cd backend

# This should FAIL (secret too short)
echo "Testing weak secret..."
SECRET=weak python -m app.main
# Expected: ValueError about SECRET length

# This should SUCCEED (strong secret)
echo "Testing strong secret..."
SECRET=$(openssl rand -hex 32) python -m app.main
# Expected: App starts successfully
```

### 2. File Upload Security Tests
```bash
# Test 1: File size limit (should reject > 5MB)
dd if=/dev/zero of=/tmp/large_file.jpg bs=1M count=6
curl -X POST -F "image=@/tmp/large_file.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/categories/
# Expected: HTTP 413 Payload Too Large

# Test 2: MIME type validation (should reject non-images)
curl -X POST -F "image=@README.md" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/categories/
# Expected: HTTP 400 Invalid file type

# Test 3: Empty file (should reject < 100 bytes)
touch /tmp/empty.jpg
curl -X POST -F "image=@/tmp/empty.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/categories/
# Expected: HTTP 400 File too small
```

### 3. SQL Injection Protection Tests
```bash
# Test wildcard escaping
curl "http://localhost:8000/api/v1/products?search=%25%25"
# Expected: Returns results matching literal "%%", not all products

curl "http://localhost:8000/api/v1/products?search=__"
# Expected: Returns results matching literal "__", not all two-char names
```

### 4. Input Validation Tests
```bash
# Test 1: Invalid price range
curl "http://localhost:8000/api/v1/products?min_price=1000&max_price=500"
# Expected: HTTP 400 min_price cannot be greater than max_price

# Test 2: Excessive pagination limit
curl "http://localhost:8000/api/v1/products?limit=10000"
# Expected: HTTP 422 Validation error (limit must be <= 1000)

# Test 3: Oversized search string
curl "http://localhost:8000/api/v1/products?search=$(python3 -c 'print("A"*300)')"
# Expected: HTTP 422 Validation error (max 200 characters)

# Test 4: Price out of bounds
curl -X POST -F "name=Test" -F "price=9999999" -F "image=@test.jpg" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/categories/1/products/
# Expected: HTTP 422 Validation error (price <= 1000000)
```

### 5. Transaction Rollback Tests
```bash
# Test: Create product with invalid data after images uploaded
# This tests that images are cleaned up when DB operation fails
# (Requires manual testing or automated test suite)
```

---

## Deployment Steps

### Development Environment

1. **Update Environment Variables**
   ```bash
   cd /path/to/OnlineShop
   cp infra/.env.example infra/.env
   # Edit infra/.env with strong values
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   uv sync  # or pip install -e .
   ```

3. **Restart Services**
   ```bash
   # If using Docker
   docker-compose down
   docker-compose up -d

   # If running locally
   # Stop and restart your FastAPI application
   ```

4. **Verify Application Starts**
   ```bash
   # Check logs for any errors
   docker-compose logs -f backend
   # OR
   tail -f logs/backend.log
   ```

5. **Run Test Suite**
   ```bash
   cd backend
   pytest tests/  # if you have tests
   ```

### Production Environment

1. **Backup Current System**
   - [ ] Backup database
   - [ ] Backup uploaded files
   - [ ] Backup current code
   - [ ] Document current configuration

2. **Prepare Environment**
   - [ ] Use secrets manager (AWS Secrets Manager, Vault, etc.)
   - [ ] Generate production-grade secrets (32+ chars, cryptographically secure)
   - [ ] Update environment variables in deployment system
   - [ ] DO NOT commit `.env` files to repository

3. **Deploy Code**
   - [ ] Deploy to staging first
   - [ ] Run full test suite on staging
   - [ ] Verify all endpoints work correctly
   - [ ] Check error logs for any issues

4. **Production Deployment**
   - [ ] Deploy during maintenance window
   - [ ] Apply database migrations if any
   - [ ] Restart application services
   - [ ] Monitor error logs closely
   - [ ] Verify file uploads work correctly
   - [ ] Test key user flows

5. **Post-Deployment**
   - [ ] Monitor application performance
   - [ ] Check connection pool metrics
   - [ ] Verify no file upload errors
   - [ ] Monitor disk space (uploaded files)
   - [ ] Set up alerts for security events

---

## Verification Checklist

After deployment, verify:

### Application Startup
- [ ] Application starts without errors
- [ ] No validation errors for secrets
- [ ] Database connection pool initializes
- [ ] All endpoints are accessible

### File Upload Security
- [ ] Can upload valid images (JPG, PNG, etc.)
- [ ] Cannot upload files > 5MB
- [ ] Cannot upload non-image files
- [ ] Cannot upload empty files
- [ ] Filenames are UUID-based (no user input)
- [ ] Files saved in correct directories

### API Security
- [ ] SQL injection protection working (search doesn't break)
- [ ] Pagination limits enforced (max 1000)
- [ ] Price validation working
- [ ] Search string length limits enforced

### Database
- [ ] Connection pool working
- [ ] No connection timeout errors
- [ ] Transactions rollback on errors
- [ ] No orphaned files after failed operations

### Error Handling
- [ ] File cleanup works on errors
- [ ] Database rollback works on errors
- [ ] Error messages are informative but not revealing
- [ ] HTTP status codes are correct

---

## Rollback Plan

If issues are encountered:

### Immediate Rollback Steps
1. **Stop new deployment**
   ```bash
   # Revert to previous code version
   git checkout <previous-commit-hash>
   ```

2. **Restore previous .env**
   ```bash
   # Use backed up environment variables
   cp infra/.env.backup infra/.env
   ```

3. **Restart services**
   ```bash
   docker-compose restart
   # or your deployment command
   ```

4. **Verify rollback successful**
   - Check application starts
   - Test key functionality
   - Monitor error logs

### Issues and Solutions

#### Issue: "SECRET must be at least 32 characters"
**Solution:** Generate new secret: `openssl rand -hex 32`

#### Issue: "ModuleNotFoundError: No module named 'magic'"
**Solution:**
```bash
pip install python-magic
# macOS: brew install libmagic
# Ubuntu: sudo apt-get install libmagic1
```

#### Issue: File uploads failing with MIME type errors
**Solution:**
- Verify libmagic is installed
- Check python-magic version >= 0.4.27
- Test with known good image file

#### Issue: Database connection pool exhausted
**Solution:**
- Increase `DB_POOL_SIZE` in constants.py
- Increase `DB_MAX_OVERFLOW`
- Check for connection leaks

#### Issue: Too many files in upload directory
**Solution:**
- Implement file cleanup job
- Consider moving to object storage (S3, GCS)
- Set up monitoring for disk space

---

## Monitoring Setup

### Metrics to Monitor

1. **File Uploads**
   - Upload success rate
   - Upload failure reasons (size, type, etc.)
   - Disk space usage
   - Upload duration

2. **Database**
   - Connection pool usage
   - Connection timeout errors
   - Query performance
   - Rollback frequency

3. **Security Events**
   - Failed file validations
   - SQL injection attempts (malformed search queries)
   - Invalid input rejections
   - Authentication failures

4. **Performance**
   - API response times
   - Database query times
   - File upload times
   - Error rates

### Logging

Ensure these events are logged:
- [ ] File upload attempts (success/failure)
- [ ] File validation failures
- [ ] Database rollback events
- [ ] Input validation failures
- [ ] Security violations

---

## Success Criteria

Deployment is successful when:

- [x] All security vulnerabilities are fixed
- [ ] Application starts without errors
- [ ] All endpoints respond correctly
- [ ] File uploads work with valid files
- [ ] File uploads fail gracefully with invalid files
- [ ] Database operations complete successfully
- [ ] No security vulnerabilities in logs
- [ ] Performance is acceptable
- [ ] Error rates are within acceptable limits

---

## Support Contacts

If you encounter issues:

1. Check `SECURITY_FIXES.md` for detailed explanations
2. Review `CHANGES_SUMMARY.md` for specific changes
3. Check inline code comments
4. Review error logs for specific error messages
5. Test individual components in isolation

---

## Additional Resources

- **Security Fixes Documentation:** `SECURITY_FIXES.md`
- **Changes Summary:** `CHANGES_SUMMARY.md`
- **Environment Template:** `infra/.env.example`
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **SQLAlchemy Documentation:** https://docs.sqlalchemy.org/
- **python-magic Documentation:** https://github.com/ahupp/python-magic

---

**Last Updated:** 2025-10-24
**Version:** 1.0
**Status:** All Critical Security Vulnerabilities Fixed ✅
