# Bug Report - Sprint S-QA-BUG-HUNT-01
**Date**: 2025-11-13
**Tester**: Claude QA Agent
**Sprint**: Bug Hunt & Stabilisation Orchestrator / Ergo-Mate

---

## BUG-006: Type Error in setCorsHeaders() Function
**Severity**: P1 (Critical)
**Component**: orchestrator-api-core
**Status**: Open
**Priority**: Must Fix Before Production

### Description
The `setCorsHeaders()` function in `orchestrator/lib/util.php` line 150 uses `in_array()` with `CORS_ALLOWED_ORIGINS` constant as the second parameter, but this constant is defined as a string (e.g., `'*'`) rather than an array. This causes a PHP TypeError.

### Steps to Reproduce
1. Call any API endpoint that uses `setCorsHeaders()` (e.g., `/api/health`)
2. The function attempts to execute `in_array($origin, CORS_ALLOWED_ORIGINS)`
3. PHP throws: `in_array(): Argument #2 ($haystack) must be of type array, string given`

### Expected Behavior
- `CORS_ALLOWED_ORIGINS` should be parsed as an array
- Function should properly validate origins against allowed list
- No fatal errors should occur

### Actual Behavior
- Fatal PHP error on every API call that uses `setCorsHeaders()`
- All API endpoints become unusable
- Application crashes on health check

### Root Cause
**File**: `orchestrator/.env.php:59`
```php
define('CORS_ALLOWED_ORIGINS', getenv('CORS_ORIGINS') ?: '*');
```
This defines CORS_ALLOWED_ORIGINS as a STRING, not an ARRAY.

**File**: `orchestrator/lib/util.php:150`
```php
if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
```
This code expects CORS_ALLOWED_ORIGINS to be an ARRAY.

### Proposed Fix
**Option 1**: Parse CORS_ALLOWED_ORIGINS as an array in .env.php
```php
define('CORS_ALLOWED_ORIGINS', explode(',', getenv('CORS_ORIGINS') ?: '*'));
```

**Option 2**: Handle string case in setCorsHeaders()
```php
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = is_array(CORS_ALLOWED_ORIGINS)
        ? CORS_ALLOWED_ORIGINS
        : explode(',', CORS_ALLOWED_ORIGINS);

    if (CORS_ALLOWED_ORIGINS === '*' || in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: " . (CORS_ALLOWED_ORIGINS === '*' ? '*' : $origin));
    }
    // ... rest of function
}
```

### Impact
- **Blocking**: YES - All API endpoints are unusable
- **Security Impact**: NO
- **Data Loss Risk**: NO
- **Workaround Available**: NO

### Environment
- PHP Version: 8.4.14
- Environment: Development
- OS: Linux 4.4.0

### Related Files
- `orchestrator/.env.php` (line 59)
- `orchestrator/lib/util.php` (line 150)
- All API endpoints that call `setCorsHeaders()`

---

## BUG-001: Database Connection Failure (Environment Issue)
**Severity**: P0 (Blocker)
**Component**: orchestrator-database
**Status**: Open - Environment Configuration
**Priority**: Configuration Required

### Description
Database connection fails with error: `SQLSTATE[HY000] [2002] No such file or directory`

### Steps to Reproduce
1. Run smoke test
2. Attempt to connect to database
3. Connection fails

### Expected Behavior
- Database should be accessible
- Connection should succeed
- Schema should be initialized

### Actual Behavior
- PDO throws connection error
- No database available

### Root Cause
This is an **environment configuration issue**, not a code bug:
- MySQL/MariaDB server is not running or not installed
- Database credentials may be incorrect
- Socket file may be missing or misconfigured

### Proposed Fix
**For Development Environment**:
1. Install MySQL/MariaDB server
2. Start the database service
3. Create database: `studymate_orchestrator`
4. Run schema: `mysql -u root studymate_orchestrator < orchestrator/sql/schema.sql`
5. Run seeds: `mysql -u root studymate_orchestrator < orchestrator/sql/seeds.sql`

**For Production Environment**:
1. Ensure database server is accessible
2. Verify DB_HOST, DB_NAME, DB_USER, DB_PASS in `.env.php`
3. Test connection manually: `php -r "new PDO('mysql:host=localhost;dbname=studymate_orchestrator', 'root', '');"`

### Impact
- **Blocking**: YES - Cannot test any database-dependent functionality
- **Security Impact**: NO
- **Data Loss Risk**: NO
- **Workaround Available**: NO (must configure database)

### Notes
This is marked as P0 but is an **environmental prerequisite**, not a code bug. All other tests depending on database will fail until this is resolved.

---

## BUG-002: JWT_SECRET Using Default Value
**Severity**: P0 (Security Critical)
**Component**: orchestrator-security
**Status**: Open
**Priority**: Must Fix Before Production

### Description
JWT_SECRET is still using the default value `'change-me-in-production-to-a-secure-random-string'` which is a critical security vulnerability.

### Steps to Reproduce
1. Check `.env.php` configuration
2. Verify JWT_SECRET value
3. Value matches default

### Expected Behavior
- JWT_SECRET should be a cryptographically secure random string
- Minimum 256 bits (64 hex characters)
- Unique per environment

### Actual Behavior
- JWT_SECRET uses predictable default value
- Same value across all installations
- Tokens can be forged

### Security Impact
**CRITICAL**: Attackers can:
- Forge valid JWT tokens
- Impersonate any user
- Bypass authentication completely
- Gain unauthorized access to all tenant data

### Proposed Fix
Generate a secure random JWT_SECRET:

```bash
php -r "echo bin2hex(random_bytes(32));"
```

Update `.env.php`:
```php
define('JWT_SECRET', '4a7d1ed414474e4033ac29ccb8653d9b0c1a4e5f8e0c4f7c8a9f0b1c2d3e4f5a');
```

### Impact
- **Blocking**: YES for production
- **Security Impact**: CRITICAL
- **Data Loss Risk**: NO
- **Workaround Available**: NO

---

## Additional Findings

### WARN-001: File System Check
**Status**: Advisory
**Component**: orchestrator-filesystem

**Finding**: Smoke test passed for file system permissions, all critical directories are writable.

**Directories Checked**:
- ✅ `/logs` - Writable
- ✅ `/uploads` - Writable

### PASS-001: PHP Environment
**Status**: Pass
**Component**: environment

**Findings**:
- ✅ PHP 8.4.14 installed
- ✅ All required extensions present (PDO, PDO_MySQL, JSON, mbstring)
- ✅ Memory limit: Unlimited
- ✅ Max execution time: Unlimited (CLI)

### PASS-002: Directory Structure
**Status**: Pass
**Component**: orchestrator-structure

**Findings**:
- ✅ All required directories exist
- ✅ All critical endpoints files present
- ✅ Configuration file exists

---

## Test Statistics

### QA-01: Smoke Test Results
**Status**: ⚠️ Partially Complete (blocked by database)

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Environment | 6 | 0 | 6 |
| Configuration | 4 | 0 | 4 |
| Database | 0 | 3 | 3 |
| File System | 2 | 0 | 2 |
| Directories | 5 | 0 | 5 |
| Endpoints | 1 | 1 | 2 |
| **Total** | **18** | **4** | **22** |

### Critical Bugs Summary
| Bug ID | Severity | Component | Status | Blocking |
|--------|----------|-----------|--------|----------|
| BUG-006 | P1 | CORS Handler | Open | YES |
| BUG-001 | P0 | Database | Environment | YES |
| BUG-002 | P0 | Security | Open | YES (Prod) |

---

## Recommendations

### Immediate Actions Required
1. **FIX BUG-006** (P1): Fix setCorsHeaders() type error - All APIs blocked
2. **CONFIGURE BUG-001** (P0): Set up database environment
3. **FIX BUG-002** (P0): Generate secure JWT_SECRET before any production deployment

### Next Steps
1. Fix BUG-006 to unblock API testing
2. Configure database to continue smoke test
3. Proceed with QA-02 (Multi-tenant isolation) after smoke test completion
4. Generate secure secrets for production environment

---

**Report Generated**: 2025-11-13 13:22:26
**Next Update**: After BUG-006 fix and database configuration
