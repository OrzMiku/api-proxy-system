/**
 * Test script for API proxy functionality
 * Run with: pnpm tsx scripts/test-proxy.ts
 */

// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const API_BASE_URL = 'http://localhost:3004'

// Test API keys from seed data
const GLOBAL_API_KEY = 'apx_0Hf9VBSt7RYehg2bRFdXHKXrJYN9Cy5Zpeko67DO'
const PRODUCTION_API_KEY = 'apx_L9DfAHaj-_qzZusURw-2lz6RCuho4x6iOcMoNKBC'

interface TestResult {
  name: string
  success: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

async function runTest(name: string, testFn: () => Promise<void>) {
  console.log(`\n🧪 Running test: ${name}`)
  try {
    await testFn()
    results.push({ name, success: true })
    console.log(`   ✓ PASSED`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    results.push({ name, success: false, error: errorMessage })
    console.log(`   ✗ FAILED: ${errorMessage}`)
  }
}

async function testProxyEndpoint(
  groupSlug: string,
  apiKey: string,
  shouldSucceed: boolean
): Promise<void> {
  const url = `${API_BASE_URL}/api/proxy/${groupSlug}/test`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()

  if (shouldSucceed) {
    // For testing, we expect the provider endpoints to fail (they're fake URLs)
    // But the proxy should attempt to forward the request
    if (response.status === 500 && data.error === 'Proxy request failed') {
      console.log(`   → Proxy attempted to forward request (expected behavior for fake providers)`)
      return // This is expected
    }

    if (!response.ok) {
      throw new Error(`Expected success but got ${response.status}: ${JSON.stringify(data)}`)
    }
  } else {
    if (response.ok) {
      throw new Error(`Expected failure but request succeeded`)
    }
  }

  console.log(`   → Status: ${response.status}`)
  console.log(`   → Response:`, JSON.stringify(data, null, 2))
}

async function main() {
  console.log('🚀 Starting API Proxy Tests\n')
  console.log('=' .repeat(60))

  // Test 1: Valid request with global API key to production group
  await runTest('Global API key → Production group', async () => {
    await testProxyEndpoint('production', GLOBAL_API_KEY, true)
  })

  // Test 2: Valid request with global API key to development group
  await runTest('Global API key → Development group', async () => {
    await testProxyEndpoint('development', GLOBAL_API_KEY, true)
  })

  // Test 3: Valid request with production-only API key to production group
  await runTest('Production API key → Production group', async () => {
    await testProxyEndpoint('production', PRODUCTION_API_KEY, true)
  })

  // Test 4: Invalid request with production-only API key to development group (should fail)
  await runTest('Production API key → Development group (should fail)', async () => {
    await testProxyEndpoint('development', PRODUCTION_API_KEY, false)
  })

  // Test 5: Request with invalid API key (should fail)
  await runTest('Invalid API key (should fail)', async () => {
    const url = `${API_BASE_URL}/api/proxy/production/test`
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Bearer invalid_key_12345',
      },
    })

    if (response.status !== 401) {
      throw new Error(`Expected 401 but got ${response.status}`)
    }

    const data = await response.json()
    console.log(`   → Status: ${response.status}`)
    console.log(`   → Error: ${data.error}`)
  })

  // Test 6: Request without API key (should fail)
  await runTest('No API key (should fail)', async () => {
    const url = `${API_BASE_URL}/api/proxy/production/test`
    const response = await fetch(url)

    if (response.status !== 401) {
      throw new Error(`Expected 401 but got ${response.status}`)
    }

    const data = await response.json()
    console.log(`   → Status: ${response.status}`)
    console.log(`   → Error: ${data.error}`)
  })

  // Test 7: Request to non-existent group (should fail)
  await runTest('Non-existent group (should fail)', async () => {
    const url = `${API_BASE_URL}/api/proxy/nonexistent/test`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GLOBAL_API_KEY}`,
      },
    })

    if (response.status === 200) {
      throw new Error('Expected failure for non-existent group')
    }

    console.log(`   → Status: ${response.status}`)
  })

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Test Summary:\n')

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`✓ Passed: ${passed}`)
  console.log(`✗ Failed: ${failed}`)
  console.log(`Total: ${results.length}\n`)

  if (failed > 0) {
    console.log('Failed tests:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
  }

  console.log('\n✨ Tests completed!')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('\n❌ Test execution failed:', error)
  process.exit(1)
})
