#!/usr/bin/env node

/**
 * Performance Testing Script
 * 
 * This script tests the performance improvements and provides detailed reports.
 * 
 * Usage: node test-performance.js
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend-url.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-frontend-url.vercel.app';

async function testEndpoint(url, description)
{
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 URL: ${url}`);

    const startTime = Date.now();

    try
    {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Performance-Test/1.0'
            }
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.ok)
        {
            const data = await response.text();
            console.log(`✅ Success! Response time: ${responseTime}ms`);
            console.log(`📊 Status: ${response.status}`);
            console.log(`📦 Response size: ${data.length} characters`);

            // Check for performance headers
            const cacheControl = response.headers.get('Cache-Control');
            const queryTime = response.headers.get('X-Query-Time');

            if (cacheControl)
            {
                console.log(`🗄️  Cache-Control: ${cacheControl}`);
            }
            if (queryTime)
            {
                console.log(`⏱️  Database query time: ${queryTime}`);
            }

            return { success: true, responseTime, status: response.status };
        } else
        {
            console.log(`❌ Failed! Status: ${response.status}, Time: ${responseTime}ms`);
            return { success: false, responseTime, status: response.status };
        }
    } catch (error)
    {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        console.log(`💥 Error after ${responseTime}ms: ${error.message}`);
        return { success: false, responseTime, error: error.message };
    }
}

async function testColdStart()
{
    console.log('\n🧊 Testing Cold Start Scenario');
    console.log('This simulates what happens when your server has been idle...\n');

    const tests = [
        {
            url: `${BACKEND_URL}/health`,
            description: 'Health Check Endpoint'
        },
        {
            url: `${BACKEND_URL}/api/locations`,
            description: 'Locations API (Map Data)'
        },
        {
            url: `${BACKEND_URL}/api/profile/me`,
            description: 'Auth Status Check'
        }
    ];

    const results = [];

    for (const test of tests)
    {
        const result = await testEndpoint(test.url, test.description);
        results.push({ ...test, ...result });

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
}

async function analyzeResults(results)
{
    console.log('\n📊 Performance Analysis');
    console.log('='.repeat(50));

    const successfulTests = results.filter(r => r.success);
    const failedTests = results.filter(r => !r.success);

    console.log(`✅ Successful requests: ${successfulTests.length}/${results.length}`);
    console.log(`❌ Failed requests: ${failedTests.length}/${results.length}`);

    if (successfulTests.length > 0)
    {
        const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
        const maxResponseTime = Math.max(...successfulTests.map(r => r.responseTime));
        const minResponseTime = Math.min(...successfulTests.map(r => r.responseTime));

        console.log(`\n⏱️  Response Time Analysis:`);
        console.log(`   Average: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`   Fastest: ${minResponseTime}ms`);
        console.log(`   Slowest: ${maxResponseTime}ms`);

        // Performance assessment
        console.log(`\n🎯 Performance Assessment:`);
        if (avgResponseTime < 1000)
        {
            console.log(`   🚀 EXCELLENT: Server is warm and responding quickly!`);
        } else if (avgResponseTime < 5000)
        {
            console.log(`   ⚡ GOOD: Normal response times, server is active`);
        } else if (avgResponseTime < 15000)
        {
            console.log(`   🐌 SLOW: Server might be warming up from cold start`);
        } else
        {
            console.log(`   ❄️  COLD START: Server was likely sleeping, this is expected for the first request`);
        }
    }

    if (failedTests.length > 0)
    {
        console.log(`\n❌ Failed Tests:`);
        failedTests.forEach(test =>
        {
            console.log(`   - ${test.description}: ${test.error || `Status ${test.status}`}`);
        });
    }
}

async function testUserExperience()
{
    console.log('\n👤 User Experience Test');
    console.log('Testing the actual user-facing endpoints...\n');

    // Test the frontend health
    try
    {
        console.log(`🌐 Testing frontend accessibility: ${FRONTEND_URL}`);
        const frontendResponse = await fetch(FRONTEND_URL);
        if (frontendResponse.ok)
        {
            console.log(`✅ Frontend is accessible`);
        } else
        {
            console.log(`❌ Frontend returned status: ${frontendResponse.status}`);
        }
    } catch (error)
    {
        console.log(`❌ Frontend test failed: ${error.message}`);
    }

    // Test API endpoints that the frontend actually calls
    const apiTests = await testColdStart();
    return apiTests;
}

async function main()
{
    console.log('🎯 ZCamp Performance Testing Tool');
    console.log('==================================');
    console.log(`Backend URL: ${BACKEND_URL}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
    console.log(`Test Time: ${new Date().toISOString()}\n`);

    try
    {
        // Run the main performance test
        const results = await testUserExperience();

        // Analyze and report results
        await analyzeResults(results);

        // Recommendations
        console.log('\n💡 Recommendations:');
        const avgTime = results.filter(r => r.success).reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.success).length;

        if (avgTime > 10000)
        {
            console.log('   - Your server experienced a cold start. This should improve with the keep-alive mechanism.');
            console.log('   - Make sure GitHub Actions is set up and running every 10 minutes.');
            console.log('   - Consider upgrading to a paid Render plan to eliminate cold starts completely.');
        } else if (avgTime > 2000)
        {
            console.log('   - Response times are acceptable but could be improved.');
            console.log('   - Database queries might benefit from additional indexing.');
            console.log('   - Consider implementing client-side caching.');
        } else
        {
            console.log('   - 🎉 Excellent performance! Your optimizations are working well.');
            console.log('   - Keep monitoring to ensure consistent performance.');
        }

        console.log('\n🔄 Next Steps:');
        console.log('   1. Run this test multiple times throughout the day');
        console.log('   2. Check if GitHub Actions keep-alive is working');
        console.log('   3. Monitor user feedback on loading times');

    } catch (error)
    {
        console.error('💥 Test failed:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () =>
{
    console.log('\n👋 Test interrupted by user');
    process.exit(0);
});

// Run the test
main().catch(error =>
{
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
