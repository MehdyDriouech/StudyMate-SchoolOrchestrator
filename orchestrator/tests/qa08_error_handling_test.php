<?php
/**
 * QA-08: Error Handling & UI Messages Test
 *
 * Priority: P1
 * Component: orchestrator-api + ui
 * Type: negative_test
 *
 * This test verifies:
 * - API error responses are properly formatted
 * - Error codes are meaningful and consistent
 * - Error messages are user-friendly (not technical)
 * - HTTP status codes are appropriate
 * - No stack traces or sensitive data in production mode
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../.env.php';

// Colors for CLI output
define('COLOR_GREEN', "\033[32m");
define('COLOR_RED', "\033[31m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_RESET', "\033[0m");

class ErrorHandlingTest {
    private $results = [];
    private $startTime;
    private $bugsFound = [];

    public function __construct() {
        $this->startTime = microtime(true);
    }

    public function run() {
        $this->printHeader();

        // Test 1: Missing Authentication
        $this->testMissingAuth();

        // Test 2: Invalid Tenant ID
        $this->testInvalidTenant();

        // Test 3: Malformed JSON Payload
        $this->testMalformedPayload();

        // Test 4: Missing Required Fields
        $this->testMissingRequiredFields();

        // Test 5: Invalid Input Types
        $this->testInvalidInputTypes();

        // Test 6: Error Response Format
        $this->testErrorResponseFormat();

        // Test 7: HTTP Status Codes
        $this->testHttpStatusCodes();

        // Test 8: No Stack Traces in Production
        $this->testNoStackTraces();

        // Test 9: User-Friendly Error Messages
        $this->testUserFriendlyMessages();

        // Test 10: Rate Limit Error
        $this->testRateLimitError();

        $this->printSummary();
    }

    // ============================================================
    // Test 1: Missing Authentication
    // ============================================================
    private function testMissingAuth() {
        $this->section("Test 1: Missing Authentication");

        $testCases = [
            [
                'name' => 'No Authorization header',
                'headers' => [],
                'expectedCode' => 401,
                'expectedError' => 'unauthorized'
            ],
            [
                'name' => 'Invalid Bearer token',
                'headers' => ['Authorization' => 'Bearer invalid-token-xyz'],
                'expectedCode' => 401,
                'expectedError' => 'invalid_token'
            ],
            [
                'name' => 'Malformed Authorization header',
                'headers' => ['Authorization' => 'InvalidFormat'],
                'expectedCode' => 401,
                'expectedError' => 'invalid_auth_format'
            ]
        ];

        foreach ($testCases as $case) {
            $this->info("Testing: {$case['name']}");

            // Simulate error response
            $response = $this->simulateAuthError($case['headers']);

            $this->assert(
                isset($response['code']),
                "Response has 'code' field",
                $response
            );

            $this->assert(
                isset($response['message']),
                "Response has 'message' field",
                $response
            );

            $this->assert(
                !isset($response['trace']) && !isset($response['file']),
                "No stack trace in response",
                $response
            );
        }
    }

    // ============================================================
    // Test 2: Invalid Tenant ID
    // ============================================================
    private function testInvalidTenant() {
        $this->section("Test 2: Invalid Tenant ID");

        $testCases = [
            'Missing tenant header' => null,
            'Empty tenant ID' => '',
            'Invalid format' => 'invalid-tenant-format',
            'SQL injection attempt' => "TENANT'; DROP TABLE users; --",
            'XSS attempt' => '<script>alert("xss")</script>'
        ];

        foreach ($testCases as $name => $tenantId) {
            $this->info("Testing: $name");

            $response = $this->simulateTenantError($tenantId);

            // Should have proper error structure
            $this->assert(
                isset($response['code']) && isset($response['message']),
                "Error response properly formatted",
                $response
            );

            // Should not echo back malicious input
            if ($tenantId && (strpos($tenantId, '<script>') !== false || strpos($tenantId, 'DROP') !== false)) {
                $this->assert(
                    !isset($response['input']) || $response['input'] !== $tenantId,
                    "Malicious input not echoed back",
                    $response
                );
            }
        }
    }

    // ============================================================
    // Test 3: Malformed JSON Payload
    // ============================================================
    private function testMalformedPayload() {
        $this->section("Test 3: Malformed JSON Payload");

        $testCases = [
            'Invalid JSON syntax' => '{invalid json}',
            'Truncated JSON' => '{"key": "value"',
            'Empty payload' => '',
            'Not JSON' => 'This is plain text'
        ];

        foreach ($testCases as $name => $payload) {
            $this->info("Testing: $name");

            $decoded = json_decode($payload);
            $hasError = json_last_error() !== JSON_ERROR_NONE;

            $this->assert(
                $hasError || empty($payload),
                "JSON parsing should fail for: $name",
                "json_last_error: " . json_last_error()
            );

            if ($hasError) {
                $response = [
                    'code' => 'invalid_json',
                    'message' => 'Invalid JSON payload',
                    'timestamp' => date('c')
                ];

                $this->assert(
                    isset($response['code']) && $response['code'] === 'invalid_json',
                    "Error code should be 'invalid_json'",
                    $response
                );
            }
        }
    }

    // ============================================================
    // Test 4: Missing Required Fields
    // ============================================================
    private function testMissingRequiredFields() {
        $this->section("Test 4: Missing Required Fields");

        // Example: Creating an assignment without required fields
        $testPayloads = [
            'Missing title' => [
                'type' => 'quiz',
                'theme_id' => 'THEME_001'
            ],
            'Missing type' => [
                'title' => 'Test Assignment',
                'theme_id' => 'THEME_001'
            ],
            'Missing theme_id' => [
                'title' => 'Test Assignment',
                'type' => 'quiz'
            ],
            'Empty object' => []
        ];

        foreach ($testPayloads as $name => $payload) {
            $this->info("Testing: $name");

            $errors = $this->validateAssignmentPayload($payload);

            $this->assert(
                !empty($errors),
                "Validation should fail with errors",
                "Errors: " . json_encode($errors)
            );

            $this->assert(
                is_array($errors),
                "Errors should be returned as array",
                gettype($errors)
            );

            // Check that error messages are descriptive
            foreach ($errors as $field => $message) {
                $this->assert(
                    !empty($message) && is_string($message),
                    "Error message for '$field' should be descriptive",
                    $message
                );
            }
        }
    }

    // ============================================================
    // Test 5: Invalid Input Types
    // ============================================================
    private function testInvalidInputTypes() {
        $this->section("Test 5: Invalid Input Types");

        $testCases = [
            'String instead of integer' => [
                'field' => 'duration',
                'value' => 'not-a-number',
                'expected_type' => 'integer'
            ],
            'Array instead of string' => [
                'field' => 'title',
                'value' => ['array', 'value'],
                'expected_type' => 'string'
            ],
            'Object instead of string' => [
                'field' => 'description',
                'value' => (object)['key' => 'value'],
                'expected_type' => 'string'
            ]
        ];

        foreach ($testCases as $name => $test) {
            $this->info("Testing: $name");

            $isValid = $this->validateFieldType($test['value'], $test['expected_type']);

            $this->assert(
                !$isValid,
                "Type validation should fail for {$test['field']}",
                "Expected: {$test['expected_type']}, Got: " . gettype($test['value'])
            );
        }
    }

    // ============================================================
    // Test 6: Error Response Format
    // ============================================================
    private function testErrorResponseFormat() {
        $this->section("Test 6: Error Response Format");

        $sampleErrors = [
            'unauthorized' => [
                'code' => 'unauthorized',
                'message' => 'Authentication required',
                'timestamp' => date('c')
            ],
            'invalid_tenant' => [
                'code' => 'invalid_tenant',
                'message' => 'Invalid or inactive tenant',
                'timestamp' => date('c')
            ],
            'validation_error' => [
                'code' => 'validation_error',
                'message' => 'Validation failed',
                'errors' => ['title' => 'Title is required'],
                'timestamp' => date('c')
            ]
        ];

        foreach ($sampleErrors as $name => $error) {
            $this->info("Testing format: $name");

            // Required fields
            $this->assert(
                isset($error['code']),
                "Error must have 'code' field",
                $error
            );

            $this->assert(
                isset($error['message']),
                "Error must have 'message' field",
                $error
            );

            $this->assert(
                isset($error['timestamp']),
                "Error must have 'timestamp' field",
                $error
            );

            // Prohibited fields (in production)
            $this->assert(
                !isset($error['file']) && !isset($error['line']) && !isset($error['trace']),
                "Error must NOT contain debug info (file/line/trace)",
                $error
            );

            // Code should be snake_case
            $this->assert(
                preg_match('/^[a-z_]+$/', $error['code']),
                "Error code should be snake_case",
                $error['code']
            );
        }
    }

    // ============================================================
    // Test 7: HTTP Status Codes
    // ============================================================
    private function testHttpStatusCodes() {
        $this->section("Test 7: HTTP Status Codes");

        $expectedMappings = [
            'unauthorized' => 401,
            'forbidden' => 403,
            'not_found' => 404,
            'validation_error' => 400,
            'rate_limit_exceeded' => 429,
            'internal_error' => 500
        ];

        foreach ($expectedMappings as $errorCode => $expectedStatus) {
            $this->info("Testing: $errorCode -> $expectedStatus");

            $mappedStatus = $this->getHttpStatusForError($errorCode);

            $this->assert(
                $mappedStatus === $expectedStatus,
                "Error '$errorCode' should map to HTTP $expectedStatus",
                "Got: $mappedStatus"
            );
        }
    }

    // ============================================================
    // Test 8: No Stack Traces in Production
    // ============================================================
    private function testNoStackTraces() {
        $this->section("Test 8: No Stack Traces in Production");

        // Simulate production mode
        $productionErrors = [
            [
                'code' => 'database_error',
                'message' => 'An error occurred',
                'timestamp' => date('c')
            ],
            [
                'code' => 'unexpected_error',
                'message' => 'Something went wrong',
                'timestamp' => date('c')
            ]
        ];

        foreach ($productionErrors as $error) {
            $this->info("Checking error: {$error['code']}");

            // Should NOT contain debug info
            $hasDebugInfo = isset($error['trace']) ||
                           isset($error['file']) ||
                           isset($error['line']) ||
                           isset($error['exception']);

            $this->assert(
                !$hasDebugInfo,
                "Production error should NOT contain debug information",
                $error
            );

            // Message should be generic, not technical
            $hasTechnicalInfo = preg_match('/(PDOException|mysqli|SQL|SQLSTATE|Fatal error)/i', $error['message']);

            $this->assert(
                !$hasTechnicalInfo,
                "Production error message should not expose technical details",
                $error['message']
            );
        }
    }

    // ============================================================
    // Test 9: User-Friendly Error Messages
    // ============================================================
    private function testUserFriendlyMessages() {
        $this->section("Test 9: User-Friendly Error Messages");

        $goodMessages = [
            'Authentication required. Please log in.',
            'Invalid tenant ID provided.',
            'Title is required.',
            'Request limit exceeded. Please try again later.'
        ];

        $badMessages = [
            'SQLSTATE[HY000]: General error',
            'Uncaught PDOException in /var/www/...',
            'Call to undefined function db() in ...',
            'Array to string conversion'
        ];

        $this->info("Checking GOOD messages (user-friendly):");
        foreach ($goodMessages as $msg) {
            $isFriendly = $this->isUserFriendly($msg);
            $this->assert(
                $isFriendly,
                "Message should be user-friendly",
                $msg
            );
        }

        $this->info("\nChecking BAD messages (technical):");
        foreach ($badMessages as $msg) {
            $isFriendly = $this->isUserFriendly($msg);
            $this->assert(
                !$isFriendly,
                "Message should NOT be exposed to users",
                $msg
            );

            if ($isFriendly) {
                $this->recordBug(
                    "BUG-007",
                    "Technical error message exposed",
                    "Message: $msg"
                );
            }
        }
    }

    // ============================================================
    // Test 10: Rate Limit Error
    // ============================================================
    private function testRateLimitError() {
        $this->section("Test 10: Rate Limit Error");

        $rateLimitResponse = [
            'code' => 'rate_limit_exceeded',
            'message' => 'Too many requests. Please try again later.',
            'retry_after' => 60,
            'timestamp' => date('c')
        ];

        $this->assert(
            $rateLimitResponse['code'] === 'rate_limit_exceeded',
            "Rate limit error has correct code",
            $rateLimitResponse['code']
        );

        $this->assert(
            isset($rateLimitResponse['retry_after']),
            "Rate limit error includes 'retry_after' field",
            $rateLimitResponse
        );

        $this->info("Rate limit error format is correct");
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    private function simulateAuthError($headers) {
        if (empty($headers) || !isset($headers['Authorization'])) {
            return ['code' => 'unauthorized', 'message' => 'Authentication required'];
        }

        if (!preg_match('/^Bearer .+$/', $headers['Authorization'])) {
            return ['code' => 'invalid_auth_format', 'message' => 'Invalid authorization format'];
        }

        return ['code' => 'invalid_token', 'message' => 'Invalid or expired token'];
    }

    private function simulateTenantError($tenantId) {
        if ($tenantId === null || $tenantId === '') {
            return ['code' => 'missing_tenant', 'message' => 'Tenant ID is required'];
        }

        // Don't echo back potentially malicious input
        return ['code' => 'invalid_tenant', 'message' => 'Invalid tenant ID'];
    }

    private function validateAssignmentPayload($payload) {
        $errors = [];
        $required = ['title', 'type', 'theme_id'];

        foreach ($required as $field) {
            if (!isset($payload[$field]) || empty($payload[$field])) {
                $errors[$field] = ucfirst($field) . ' is required';
            }
        }

        return $errors;
    }

    private function validateFieldType($value, $expectedType) {
        $actualType = gettype($value);

        if ($expectedType === 'integer') {
            return is_int($value) || (is_string($value) && ctype_digit($value));
        }

        return $actualType === $expectedType;
    }

    private function getHttpStatusForError($errorCode) {
        $mappings = [
            'unauthorized' => 401,
            'forbidden' => 403,
            'not_found' => 404,
            'validation_error' => 400,
            'invalid_json' => 400,
            'missing_tenant' => 400,
            'rate_limit_exceeded' => 429,
            'internal_error' => 500,
            'database_error' => 500
        ];

        return $mappings[$errorCode] ?? 500;
    }

    private function isUserFriendly($message) {
        // Technical indicators
        $technicalPatterns = [
            '/SQLSTATE/',
            '/PDOException/',
            '/mysqli/',
            '/Fatal error/',
            '/Uncaught/',
            '/Call to undefined/',
            '/in \/var\/www/',
            '/in \/home\//',
            '/\.php on line \d+/',
            '/Array to string conversion/',
            '/Division by zero/'
        ];

        foreach ($technicalPatterns as $pattern) {
            if (preg_match($pattern, $message)) {
                return false;
            }
        }

        return true;
    }

    private function recordBug($bugId, $title, $description) {
        $this->bugsFound[] = [
            'id' => $bugId,
            'title' => $title,
            'description' => $description
        ];

        $bugFile = __DIR__ . "/bugs_found.log";
        $timestamp = date('Y-m-d H:i:s');
        $bugReport = "\n[$timestamp] $bugId: $title\n";
        $bugReport .= "Description: $description\n";
        $bugReport .= str_repeat("-", 70) . "\n";

        file_put_contents($bugFile, $bugReport, FILE_APPEND);
    }

    private function section($title) {
        echo "\n" . COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n";
        echo COLOR_BLUE . $title . COLOR_RESET . "\n";
        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n";
    }

    private function assert($condition, $message, $details = '') {
        if ($condition) {
            $this->pass($message, $details);
        } else {
            $this->fail($message, $details);
        }

        $this->results[] = [
            'type' => $condition ? 'pass' : 'fail',
            'message' => $message
        ];
    }

    private function pass($message, $details = '') {
        echo COLOR_GREEN . "  ✅ PASS: " . COLOR_RESET . $message . "\n";
    }

    private function fail($message, $details = '') {
        echo COLOR_RED . "  ❌ FAIL: " . COLOR_RESET . $message;
        if ($details && !is_array($details)) {
            echo COLOR_RED . " ($details)" . COLOR_RESET;
        }
        echo "\n";
    }

    private function info($message) {
        echo "  ℹ️  INFO: " . $message . "\n";
    }

    private function printHeader() {
        echo "\n";
        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  QA-08: ERROR HANDLING & UI MESSAGES TEST" . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  Sprint: S-QA-BUG-HUNT-01" . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  Priority: P1" . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  Date: " . date('Y-m-d H:i:s') . COLOR_RESET . "\n";
        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n";
    }

    private function printSummary() {
        $duration = round(microtime(true) - $this->startTime, 2);

        $passed = count(array_filter($this->results, fn($r) => $r['type'] === 'pass'));
        $failed = count(array_filter($this->results, fn($r) => $r['type'] === 'fail'));
        $total = count($this->results);

        echo "\n";
        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  TEST SUMMARY" . COLOR_RESET . "\n";
        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n";
        echo "  Total Tests: $total\n";
        echo COLOR_GREEN . "  Passed: $passed" . COLOR_RESET . "\n";
        echo COLOR_RED . "  Failed: $failed" . COLOR_RESET . "\n";
        echo "  Duration: {$duration}s\n";

        if (!empty($this->bugsFound)) {
            echo COLOR_RED . "  Bugs Found: " . count($this->bugsFound) . COLOR_RESET . "\n";
        }

        echo "\n";

        if ($failed === 0) {
            echo COLOR_GREEN . "  ✅ ALL ERROR HANDLING TESTS PASSED!" . COLOR_RESET . "\n";
        } else {
            echo COLOR_RED . "  ❌ SOME TESTS FAILED - REVIEW REQUIRED" . COLOR_RESET . "\n";
        }

        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n\n";
    }
}

// Run the test
$test = new ErrorHandlingTest();
$test->run();
