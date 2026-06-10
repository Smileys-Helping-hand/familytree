# Comprehensive API Testing Script for Family Tree Application

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Family Tree Application - Comprehensive API Testing Suite    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api"
$testResults = @{
    passed = 0
    failed = 0
    errors = @()
}

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method,
        [string]$endpoint,
        [object]$body = $null,
        [string]$token = $null,
        [int]$expectedStatus = 200
    )

    $url = "$baseUrl$endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }

    try {
        $params = @{
            Uri         = $url
            Method      = $method
            Headers     = $headers
            TimeoutSec  = 10
        }

        if ($body) {
            $params["Body"] = $body | ConvertTo-Json
        }

        $response = Invoke-WebRequest @params -ErrorAction SilentlyContinue

        if ($response.StatusCode -eq $expectedStatus) {
            Write-Host "✓ $name" -ForegroundColor Green
            $script:testResults.passed++
            return $response.Content | ConvertFrom-Json
        }
        else {
            Write-Host "✗ $name (Expected $expectedStatus, got $($response.StatusCode))" -ForegroundColor Red
            $script:testResults.failed++
        }
    }
    catch {
        Write-Host "✗ $name (Error: $($_.Exception.Message))" -ForegroundColor Red
        $script:testResults.failed++
    }

    return $null
}

# Test 1: Health Check
Write-Host "┌─ Health & Status Checks" -ForegroundColor Yellow
$healthResponse = Test-Endpoint -name "Health Check" -method "GET" -endpoint "/health" -expectedStatus 200
$healthStartup = Test-Endpoint -name "Startup Status" -method "GET" -endpoint "/health/startup"
Write-Host ""

# Test 2: Authentication
Write-Host "┌─ Authentication Endpoints" -ForegroundColor Yellow

# Generate unique email for test
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testEmail = "test_$timestamp@familytree.test"

$registerPayload = @{
    name     = "Test Family Member"
    email    = $testEmail
    password = "TestPassword123!"
}

$registerResponse = Test-Endpoint -name "User Registration" -method "POST" -endpoint "/auth/register" -body $registerPayload -expectedStatus 201

$token = $null
if ($registerResponse -and $registerResponse.data.token) {
    $token = $registerResponse.data.token
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
}

Write-Host ""

# Test 3: Family Management
Write-Host "┌─ Family Management" -ForegroundColor Yellow

if ($token) {
    $familyPayload = @{
        name        = "Test Family"
        description = "A test family for comprehensive testing"
    }

    $familyResponse = Test-Endpoint -name "Create Family" -method "POST" -endpoint "/families" -body $familyPayload -token $token -expectedStatus 201

    $familyId = $null
    if ($familyResponse -and $familyResponse.data.family.id) {
        $familyId = $familyResponse.data.family.id
        Write-Host "  Family ID: $familyId" -ForegroundColor Gray

        # Get all families
        Test-Endpoint -name "Get All Families" -method "GET" -endpoint "/families" -token $token -expectedStatus 200 | Out-Null

        # Get single family
        Test-Endpoint -name "Get Family Details" -method "GET" -endpoint "/families/$familyId" -token $token -expectedStatus 200 | Out-Null

        # Update family
        $updatePayload = @{
            description = "Updated test family description"
        }
        Test-Endpoint -name "Update Family" -method "PUT" -endpoint "/families/$familyId" -body $updatePayload -token $token -expectedStatus 200 | Out-Null
    }
}

Write-Host ""

# Test 4: Member Management
Write-Host "┌─ Family Member Management" -ForegroundColor Yellow

if ($token -and $familyId) {
    $memberPayload = @{
        familyId   = $familyId
        firstName  = "John"
        lastName   = "Doe"
        gender     = "male"
        birthDate  = "1990-01-15"
    }

    $memberResponse = Test-Endpoint -name "Add Family Member" -method "POST" -endpoint "/members" -body $memberPayload -token $token -expectedStatus 201

    $memberId = $null
    if ($memberResponse -and $memberResponse.data.member.id) {
        $memberId = $memberResponse.data.member.id
        Write-Host "  Member ID: $memberId" -ForegroundColor Gray

        # Get members for family
        Test-Endpoint -name "Get Family Members" -method "GET" -endpoint "/members/family/$familyId" -token $token -expectedStatus 200 | Out-Null

        # Get member details
        Test-Endpoint -name "Get Member Details" -method "GET" -endpoint "/members/$memberId" -token $token -expectedStatus 200 | Out-Null

        # Update member
        $updateMemberPayload = @{
            firstName = "John"
            lastName  = "Smith"
            bio       = "Updated bio for testing"
        }
        Test-Endpoint -name "Update Member" -method "PUT" -endpoint "/members/$memberId" -body $updateMemberPayload -token $token -expectedStatus 200 | Out-Null
    }
}

Write-Host ""

# Test 5: API Ingestion/Import
Write-Host "┌─ Data Import & Sync (New Features)" -ForegroundColor Yellow

if ($token -and $familyId) {
    $importPayload = @{
        familyId = $familyId
        contacts = @(
            @{
                firstName = "Jane"
                lastName  = "Doe"
                gender    = "female"
                birthDate = "1992-05-20"
                bio       = "Imported contact"
            },
            @{
                firstName = "Robert"
                lastName  = "Doe"
                gender    = "male"
                birthDate = "1965-03-10"
                occupation = "Engineer"
            }
        )
        source = "test-import"
    }

    $importResponse = Test-Endpoint -name "Import Contacts" -method "POST" -endpoint "/import/contacts" -body $importPayload -token $token -expectedStatus 200

    if ($importResponse -and $importResponse.data) {
        Write-Host "  Imported: $($importResponse.data.summary.imported) | Duplicates: $($importResponse.data.summary.duplicates) | Errors: $($importResponse.data.summary.errors)" -ForegroundColor Gray
    }

    # Check import status
    Test-Endpoint -name "Check Import Status" -method "GET" -endpoint "/import/status/$familyId" -token $token -expectedStatus 200 | Out-Null
}

Write-Host ""

# Test 6: Events
Write-Host "┌─ Events & Calendar" -ForegroundColor Yellow

if ($token -and $familyId) {
    $eventPayload = @{
        familyId    = $familyId
        title       = "Family Reunion"
        description = "Annual family gathering"
        type        = "event"
        date        = ((Get-Date).AddMonths(1)).ToString("yyyy-MM-dd")
    }

    $eventResponse = Test-Endpoint -name "Create Event" -method "POST" -endpoint "/events" -body $eventPayload -token $token -expectedStatus 201

    # Get family events
    Test-Endpoint -name "Get Family Events" -method "GET" -endpoint "/events/family/$familyId" -token $token -expectedStatus 200 | Out-Null
}

Write-Host ""

# Test 7: Activity Feed
Write-Host "┌─ Activity & Notifications" -ForegroundColor Yellow

if ($token) {
    Test-Endpoint -name "Get Activity Feed" -method "GET" -endpoint "/activity" -token $token -expectedStatus 200 | Out-Null
}

Write-Host ""

# Test 8: Rate Limiting
Write-Host "┌─ Rate Limiting Verification" -ForegroundColor Yellow

# Test that auth endpoints have stricter limits
$loginPayload = @{
    email    = $testEmail
    password = "TestPassword123!"
}

# Try multiple rapid auth requests
$rateLimitHit = $false
for ($i = 0; $i -lt 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body ($loginPayload | ConvertTo-Json) `
            -TimeoutSec 5 `
            -ErrorAction SilentlyContinue

        if ($response.StatusCode -eq 429) {
            $rateLimitHit = $true
            break
        }
    } catch {
        if ($_.Exception.Message -like "*429*") {
            $rateLimitHit = $true
            break
        }
    }
}

if ($rateLimitHit) {
    Write-Host "✓ Rate Limiting is Active (Good!)" -ForegroundColor Green
    $testResults.passed++
}
else {
    Write-Host "⚠ Rate Limiting not detected in rapid requests" -ForegroundColor Yellow
}

Write-Host ""

# Final Summary
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Test Results Summary" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Passed: $($testResults.passed)" -ForegroundColor Green
Write-Host "✗ Failed: $($testResults.failed)" -ForegroundColor Red
Write-Host ""

if ($testResults.failed -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Yellow
    $testResults.errors | ForEach-Object {
        Write-Host "  - $($_.test): $($_.error)" -ForegroundColor Red
    }
}

$successRate = if ($testResults.passed + $testResults.failed -gt 0) {
    [math]::Round(($testResults.passed / ($testResults.passed + $testResults.failed)) * 100)
} else {
    0
}

Write-Host ""
Write-Host "Overall Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "✓ API Testing Complete!" -ForegroundColor Cyan
