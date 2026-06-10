Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Family Tree Application - API Testing" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api"
$passed = 0
$failed = 0

Write-Host "Testing Health & Status Endpoints..." -ForegroundColor Yellow
try {
  $health = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
  if ($health.StatusCode -eq 200) {
    Write-Host "  OK - Health Check" -ForegroundColor Green
    $passed++
  }
} catch {
  Write-Host "  FAIL - Health Check" -ForegroundColor Red
  $failed++
}

Write-Host ""
Write-Host "Testing Authentication Endpoints..." -ForegroundColor Yellow

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$testEmail = "test_$timestamp@familytree.local"

try {
  $registerBody = @{
    name = "Test User"
    email = $testEmail
    password = "TestPassword123!"
  } | ConvertTo-Json

  $register = Invoke-WebRequest -Uri "$baseUrl/auth/register" `
    -Method POST `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $registerBody `
    -TimeoutSec 5 `
    -ErrorAction SilentlyContinue

  if ($register.StatusCode -eq 201) {
    Write-Host "  OK - User Registration" -ForegroundColor Green
    $passed++

    $registerData = $register.Content | ConvertFrom-Json
    $token = $registerData.data.token
  } else {
    Write-Host "  FAIL - User Registration (Status: $($register.StatusCode))" -ForegroundColor Red
    $failed++
  }
} catch {
  Write-Host "  FAIL - User Registration: $($_.Exception.Message)" -ForegroundColor Red
  $failed++
}

Write-Host ""
Write-Host "Testing Family Management..." -ForegroundColor Yellow

if ($token) {
  try {
    $familyBody = @{
      name = "Test Family"
      description = "A test family for API testing"
    } | ConvertTo-Json

    $family = Invoke-WebRequest -Uri "$baseUrl/families" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
      -Body $familyBody `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue

    if ($family.StatusCode -eq 201) {
      Write-Host "  OK - Create Family" -ForegroundColor Green
      $passed++

      $familyData = $family.Content | ConvertFrom-Json
      $familyId = $familyData.data.family.id
    } else {
      Write-Host "  FAIL - Create Family (Status: $($family.StatusCode))" -ForegroundColor Red
      $failed++
    }
  } catch {
    Write-Host "  FAIL - Create Family: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
  }

  try {
    $families = Invoke-WebRequest -Uri "$baseUrl/families" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $token" } `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue

    if ($families.StatusCode -eq 200) {
      Write-Host "  OK - Get All Families" -ForegroundColor Green
      $passed++
    }
  } catch {
    Write-Host "  FAIL - Get All Families" -ForegroundColor Red
    $failed++
  }
}

Write-Host ""
Write-Host "Testing Member Management..." -ForegroundColor Yellow

if ($token -and $familyId) {
  try {
    $memberBody = @{
      familyId = $familyId
      firstName = "John"
      lastName = "Doe"
      gender = "male"
      birthDate = "1990-01-15"
    } | ConvertTo-Json

    $member = Invoke-WebRequest -Uri "$baseUrl/members" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
      -Body $memberBody `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue

    if ($member.StatusCode -eq 201) {
      Write-Host "  OK - Add Family Member" -ForegroundColor Green
      $passed++
    }
  } catch {
    Write-Host "  FAIL - Add Family Member" -ForegroundColor Red
    $failed++
  }

  try {
    $members = Invoke-WebRequest -Uri "$baseUrl/members/family/$familyId" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $token" } `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue

    if ($members.StatusCode -eq 200) {
      Write-Host "  OK - Get Family Members" -ForegroundColor Green
      $passed++
    }
  } catch {
    Write-Host "  FAIL - Get Family Members" -ForegroundColor Red
    $failed++
  }
}

Write-Host ""
Write-Host "Testing New Import/Sync Endpoints..." -ForegroundColor Yellow

if ($token -and $familyId) {
  try {
    $importBody = @{
      familyId = $familyId
      contacts = @(
        @{ firstName = "Jane"; lastName = "Doe"; gender = "female"; birthDate = "1992-05-20" }
        @{ firstName = "Robert"; lastName = "Doe"; gender = "male"; birthDate = "1965-03-10" }
      )
      source = "test-import"
    } | ConvertTo-Json

    $import = Invoke-WebRequest -Uri "$baseUrl/import/contacts" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
      -Body $importBody `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue

    if ($import.StatusCode -eq 200) {
      Write-Host "  OK - Import Contacts" -ForegroundColor Green
      $passed++
    }
  } catch {
    Write-Host "  FAIL - Import Contacts: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
  }

  try {
    $status = Invoke-WebRequest -Uri "$baseUrl/import/status/$familyId" `
      -Method GET `
      -Headers @{ "Authorization" = "Bearer $token" } `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue

    if ($status.StatusCode -eq 200) {
      Write-Host "  OK - Check Import Status" -ForegroundColor Green
      $passed++
    }
  } catch {
    Write-Host "  FAIL - Check Import Status" -ForegroundColor Red
    $failed++
  }
}

Write-Host ""
Write-Host "Testing Events..." -ForegroundColor Yellow

if ($token -and $familyId) {
  try {
    $eventDate = ((Get-Date).AddMonths(1)).ToString("yyyy-MM-dd")
    $eventBody = @{
      familyId = $familyId
      title = "Family Reunion"
      type = "event"
      date = $eventDate
    } | ConvertTo-Json

    $eventResponse = Invoke-WebRequest -Uri "$baseUrl/events" `
      -Method POST `
      -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $token" } `
      -Body $eventBody `
      -TimeoutSec 5 `
      -ErrorAction SilentlyContinue

    if ($eventResponse.StatusCode -eq 201) {
      Write-Host "  OK - Create Event" -ForegroundColor Green
      $passed++
    }
  } catch {
    Write-Host "  FAIL - Create Event: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
  }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$total = $passed + $failed
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100) } else { 0 }

Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $percentage%" -ForegroundColor $(if ($percentage -ge 80) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "API Testing Complete!" -ForegroundColor Cyan
Write-Host ""
