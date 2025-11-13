<?php
/**
 * QA-01: Smoke Test - Global Orchestrator & Ergo-Mate
 *
 * Priority: P0 (Critical)
 * Risk: High
 *
 * This script tests:
 * - PHP environment and configuration
 * - Database connectivity
 * - Health endpoints
 * - Basic API endpoints
 * - Authentication flow
 * - Data availability
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Colors for CLI output
define('COLOR_GREEN', "\033[32m");
define('COLOR_RED', "\033[31m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_RESET', "\033[0m");

class SmokeTest {
    private $results = [];
    private $startTime;
    private $bugCount = 0;

    public function __construct() {
        $this->startTime = microtime(true);
    }

    public function run() {
        $this->printHeader();

        // Test 1: Environment Check
        $this->testEnvironment();

        // Test 2: Configuration Check
        $this->testConfiguration();

        // Test 3: Database Connectivity
        $this->testDatabase();

        // Test 4: File System Permissions
        $this->testFileSystem();

        // Test 5: Required Directories
        $this->testDirectories();

        // Test 6: Schema Validation
        $this->testDatabaseSchema();

        // Test 7: Test Data Availability
        $this->testDataAvailability();

        // Test 8: API Health Endpoint
        $this->testHealthEndpoint();

        // Test 9: Authentication
        $this->testAuthentication();

        // Test 10: Critical Endpoints
        $this->testCriticalEndpoints();

        $this->printSummary();
    }

    // ============================================================
    // Test 1: Environment Check
    // ============================================================
    private function testEnvironment() {
        $this->section("Test 1: Environment Check");

        // PHP Version
        $phpVersion = phpversion();
        $this->assert(
            version_compare($phpVersion, '8.0.0', '>='),
            "PHP version >= 8.0.0",
            "Current: $phpVersion"
        );

        // Required Extensions
        $requiredExtensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
        foreach ($requiredExtensions as $ext) {
            $this->assert(
                extension_loaded($ext),
                "Extension '$ext' loaded",
                extension_loaded($ext) ? "Loaded" : "Missing"
            );
        }

        // Memory Limit
        $memoryLimit = ini_get('memory_limit');
        $this->info("Memory Limit: $memoryLimit");

        // Max Execution Time
        $maxExecTime = ini_get('max_execution_time');
        $this->info("Max Execution Time: {$maxExecTime}s");
    }

    // ============================================================
    // Test 2: Configuration Check
    // ============================================================
    private function testConfiguration() {
        $this->section("Test 2: Configuration Check");

        $envFile = __DIR__ . '/../.env.php';

        $this->assert(
            file_exists($envFile),
            ".env.php file exists",
            file_exists($envFile) ? "Found" : "Missing"
        );

        if (file_exists($envFile)) {
            require_once $envFile;

            // Check critical constants
            $constants = ['DB_HOST', 'DB_NAME', 'DB_USER', 'JWT_SECRET'];
            foreach ($constants as $const) {
                $this->assert(
                    defined($const),
                    "Constant '$const' defined",
                    defined($const) ? "Defined" : "Missing"
                );
            }

            // Check JWT_SECRET is changed from default
            if (defined('JWT_SECRET')) {
                $isDefault = JWT_SECRET === 'change-me-in-production-to-a-secure-random-string';
                if ($isDefault) {
                    $this->warning("JWT_SECRET is still using default value - MUST be changed in production!");
                } else {
                    $this->pass("JWT_SECRET has been customized");
                }
            }

            // Check APP_ENV
            if (defined('APP_ENV')) {
                $this->info("APP_ENV: " . APP_ENV);
            }
        }
    }

    // ============================================================
    // Test 3: Database Connectivity
    // ============================================================
    private function testDatabase() {
        $this->section("Test 3: Database Connectivity");

        if (!defined('DB_HOST')) {
            $this->fail("Database configuration not loaded");
            return;
        }

        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            $this->pass("Database connection successful");
            $this->info("Database: " . DB_NAME);

            // Test query
            $stmt = $pdo->query("SELECT VERSION() as version");
            $result = $stmt->fetch();
            $this->info("MySQL Version: " . $result['version']);

            return $pdo;

        } catch (PDOException $e) {
            $this->fail("Database connection failed: " . $e->getMessage());
            $this->recordBug('BUG-001', 'Database Connection Failure', $e->getMessage());
            return null;
        }
    }

    // ============================================================
    // Test 4: File System Permissions
    // ============================================================
    private function testFileSystem() {
        $this->section("Test 4: File System Permissions");

        $baseDir = dirname(__DIR__);

        // Check write permissions on critical directories
        $writableDirs = [
            $baseDir . '/../logs',
            $baseDir . '/uploads',
        ];

        foreach ($writableDirs as $dir) {
            if (file_exists($dir)) {
                $writable = is_writable($dir);
                $this->assert(
                    $writable,
                    "Directory writable: " . basename($dir),
                    $writable ? "Writable" : "Not writable"
                );
            } else {
                $this->warning("Directory does not exist: " . basename($dir));
            }
        }
    }

    // ============================================================
    // Test 5: Required Directories
    // ============================================================
    private function testDirectories() {
        $this->section("Test 5: Required Directories");

        $baseDir = dirname(__DIR__);
        $requiredDirs = [
            'api',
            'lib',
            'services',
            'sql',
            'tests'
        ];

        foreach ($requiredDirs as $dir) {
            $path = $baseDir . '/' . $dir;
            $this->assert(
                file_exists($path) && is_dir($path),
                "Directory exists: $dir",
                file_exists($path) ? "Found" : "Missing"
            );
        }
    }

    // ============================================================
    // Test 6: Database Schema
    // ============================================================
    private function testDatabaseSchema() {
        $this->section("Test 6: Database Schema Validation");

        if (!defined('DB_HOST')) {
            $this->skip("Database configuration not available");
            return;
        }

        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // Check required tables
            $requiredTables = [
                'tenants',
                'users',
                'students',
                'classes',
                'themes',
                'assignments',
                'stats'
            ];

            $stmt = $pdo->query("SHOW TABLES");
            $existingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($requiredTables as $table) {
                $exists = in_array($table, $existingTables);
                $this->assert(
                    $exists,
                    "Table '$table' exists",
                    $exists ? "Found" : "Missing"
                );

                if (!$exists) {
                    $this->recordBug('BUG-002', "Missing table: $table", "Required table '$table' not found in database");
                }
            }

            $this->info("Total tables found: " . count($existingTables));

        } catch (PDOException $e) {
            $this->fail("Schema validation failed: " . $e->getMessage());
        }
    }

    // ============================================================
    // Test 7: Test Data Availability
    // ============================================================
    private function testDataAvailability() {
        $this->section("Test 7: Test Data Availability");

        if (!defined('DB_HOST')) {
            $this->skip("Database configuration not available");
            return;
        }

        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // Check for test tenants
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'");
            $result = $stmt->fetch();
            $tenantCount = $result['count'];

            $this->assert(
                $tenantCount > 0,
                "Active tenants exist",
                "Found: $tenantCount tenant(s)"
            );

            if ($tenantCount === 0) {
                $this->warning("No active tenants found. Run seeds.sql to populate test data.");
            }

            // Check for test users
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
            $result = $stmt->fetch();
            $userCount = $result['count'];

            $this->info("Active users: $userCount");

            // Check for test classes
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM classes WHERE status = 'active'");
            $result = $stmt->fetch();
            $classCount = $result['count'];

            $this->info("Active classes: $classCount");

        } catch (PDOException $e) {
            $this->fail("Data availability check failed: " . $e->getMessage());
        }
    }

    // ============================================================
    // Test 8: API Health Endpoint
    // ============================================================
    private function testHealthEndpoint() {
        $this->section("Test 8: API Health Endpoint");

        $healthFile = dirname(__DIR__) . '/api/health.php';

        $this->assert(
            file_exists($healthFile),
            "Health endpoint file exists",
            file_exists($healthFile) ? "Found" : "Missing"
        );

        if (file_exists($healthFile)) {
            // Simulate calling health endpoint
            ob_start();
            try {
                $_SERVER['REQUEST_METHOD'] = 'GET';
                include $healthFile;
                $output = ob_get_clean();

                $this->pass("Health endpoint executed without errors");

                // Try to parse JSON response
                $response = json_decode($output, true);
                if ($response && isset($response['status'])) {
                    $this->assert(
                        $response['status'] === 'ok',
                        "Health status is 'ok'",
                        "Status: " . $response['status']
                    );
                }

            } catch (Exception $e) {
                ob_end_clean();
                $this->fail("Health endpoint error: " . $e->getMessage());
                $this->recordBug('BUG-003', 'Health Endpoint Failure', $e->getMessage());
            }
        }
    }

    // ============================================================
    // Test 9: Authentication
    // ============================================================
    private function testAuthentication() {
        $this->section("Test 9: Authentication");

        $authFile = dirname(__DIR__) . '/lib/auth.php';

        $this->assert(
            file_exists($authFile),
            "Auth library exists",
            file_exists($authFile) ? "Found" : "Missing"
        );

        if (defined('JWT_SECRET')) {
            $this->pass("JWT_SECRET is configured");
        } else {
            $this->fail("JWT_SECRET is not configured");
            $this->recordBug('BUG-004', 'Missing JWT_SECRET', 'JWT_SECRET constant not defined');
        }

        // Check API keys
        if (isset($GLOBALS['API_KEYS'])) {
            $keyCount = count($GLOBALS['API_KEYS']);
            $this->info("API keys configured: $keyCount");
        } else {
            $this->warning("No API keys configured in \$GLOBALS['API_KEYS']");
        }
    }

    // ============================================================
    // Test 10: Critical Endpoints
    // ============================================================
    private function testCriticalEndpoints() {
        $this->section("Test 10: Critical Endpoints");

        $criticalEndpoints = [
            'api/health.php' => 'Health Check',
            'api/students.php' => 'Students API',
            'api/assignments.php' => 'Assignments API',
            'api/themes.php' => 'Themes API',
            'api/catalog.php' => 'Catalog API',
            'api/analytics/kpis.php' => 'Analytics KPIs',
        ];

        $baseDir = dirname(__DIR__);

        foreach ($criticalEndpoints as $endpoint => $name) {
            $path = $baseDir . '/' . $endpoint;
            $exists = file_exists($path);

            $this->assert(
                $exists,
                "$name endpoint exists",
                $exists ? "Found" : "Missing at $endpoint"
            );

            if (!$exists) {
                $this->recordBug('BUG-005', "Missing endpoint: $name", "File not found: $endpoint");
            }
        }
    }

    // ============================================================
    // Helper Methods
    // ============================================================

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
            'message' => $message,
            'details' => $details
        ];
    }

    private function pass($message, $details = '') {
        echo COLOR_GREEN . "  ✅ PASS: " . COLOR_RESET . $message;
        if ($details) {
            echo COLOR_GREEN . " ($details)" . COLOR_RESET;
        }
        echo "\n";
    }

    private function fail($message, $details = '') {
        echo COLOR_RED . "  ❌ FAIL: " . COLOR_RESET . $message;
        if ($details) {
            echo COLOR_RED . " ($details)" . COLOR_RESET;
        }
        echo "\n";
    }

    private function warning($message) {
        echo COLOR_YELLOW . "  ⚠️  WARN: " . COLOR_RESET . $message . "\n";
    }

    private function info($message) {
        echo "  ℹ️  INFO: " . $message . "\n";
    }

    private function skip($message) {
        echo COLOR_YELLOW . "  ⏭️  SKIP: " . COLOR_RESET . $message . "\n";
    }

    private function recordBug($bugId, $title, $description) {
        $this->bugCount++;
        $bugFile = __DIR__ . "/bugs_found.log";
        $timestamp = date('Y-m-d H:i:s');
        $bugReport = "\n[$timestamp] $bugId: $title\n";
        $bugReport .= "Description: $description\n";
        $bugReport .= str_repeat("-", 70) . "\n";

        file_put_contents($bugFile, $bugReport, FILE_APPEND);
    }

    private function printHeader() {
        echo "\n";
        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  QA-01: SMOKE TEST - Orchestrator & Ergo-Mate" . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  Sprint: S-QA-BUG-HUNT-01" . COLOR_RESET . "\n";
        echo COLOR_BLUE . "  Priority: P0 (Critical)" . COLOR_RESET . "\n";
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

        if ($this->bugCount > 0) {
            echo COLOR_RED . "  Bugs Found: {$this->bugCount}" . COLOR_RESET . "\n";
            echo "  Bug report: " . __DIR__ . "/bugs_found.log\n";
        }

        echo "\n";

        if ($failed === 0) {
            echo COLOR_GREEN . "  ✅ ALL SMOKE TESTS PASSED!" . COLOR_RESET . "\n";
        } else {
            echo COLOR_RED . "  ❌ SOME TESTS FAILED - REVIEW REQUIRED" . COLOR_RESET . "\n";
        }

        echo COLOR_BLUE . str_repeat("=", 70) . COLOR_RESET . "\n\n";
    }
}

// Run the smoke test
$test = new SmokeTest();
$test->run();
