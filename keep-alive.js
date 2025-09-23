#!/usr/bin/env node

/**
 * Server Keep-Alive Script for Render.com
 * 
 * This script pings your backend server every 10 minutes to prevent it from going to sleep.
 * Run this on a separate service (like GitHub Actions, Vercel Cron, or your local machine).
 * 
 * Usage:
 * 1. Set your backend URL as an environment variable: BACKEND_URL
 * 2. Run: node keep-alive.js
 * 
 * Or run directly with URL:
 * BACKEND_URL=https://your-backend-url.onrender.com node keep-alive.js
 */

const BACKEND_URL = process.env.BACKEND_URL || 'https://your-backend-url.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

async function pingServer()
{
    try
    {
        console.log(`[${new Date().toISOString()}] Pinging server: ${BACKEND_URL}/health`);

        const response = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            headers: {
                'User-Agent': 'KeepAlive/1.0'
            }
        });

        if (response.ok)
        {
            const data = await response.json();
            console.log(`✅ Server is alive! Uptime: ${Math.round(data.uptime)}s`);
        } else
        {
            console.log(`⚠️ Server responded with status: ${response.status}`);
        }
    } catch (error)
    {
        console.error(`❌ Failed to ping server:`, error.message);
    }
}

async function startKeepAlive()
{
    console.log(`🚀 Starting keep-alive service for: ${BACKEND_URL}`);
    console.log(`⏰ Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`);

    // Initial ping
    await pingServer();

    // Set up interval
    setInterval(pingServer, PING_INTERVAL);

    console.log('🎯 Keep-alive service is running...');
}

// Handle graceful shutdown
process.on('SIGINT', () =>
{
    console.log('\n👋 Shutting down keep-alive service...');
    process.exit(0);
});

process.on('SIGTERM', () =>
{
    console.log('\n👋 Shutting down keep-alive service...');
    process.exit(0);
});

// Start the service
startKeepAlive().catch(error =>
{
    console.error('💥 Failed to start keep-alive service:', error);
    process.exit(1);
});
