const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bpoc_db'
});

async function checkMarketingSpecialist() {
  try {
    console.log('🔍 Looking for Marketing Specialist job...');
    
    // Check all jobs with 'marketing' in the title
    const marketingJobs = await pool.query(`
      SELECT id, job_title, status, created_at, company_id
      FROM job_requests 
      WHERE LOWER(job_title) LIKE '%marketing%'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${marketingJobs.rows.length} marketing-related jobs:`);
    marketingJobs.rows.forEach((job, i) => {
      console.log(`${i + 1}. ID: ${job.id}, Title: ${job.job_title}, Status: ${job.status}, Created: ${job.created_at}`);
    });
    
    // Check if any marketing jobs are in processed_job_requests
    const processedMarketing = await pool.query(`
      SELECT p.id, p.job_title, p.status, p.created_at, p.company_id
      FROM processed_job_requests p
      WHERE LOWER(p.job_title) LIKE '%marketing%'
      ORDER BY p.created_at DESC
    `);
    
    console.log(`\nFound ${processedMarketing.rows.length} processed marketing jobs:`);
    processedMarketing.rows.forEach((job, i) => {
      console.log(`${i + 1}. ID: ${job.id}, Title: ${job.job_title}, Status: ${job.status}, Created: ${job.created_at}`);
    });
    
    // Check all statuses in job_requests
    console.log('\n📊 All statuses in job_requests:');
    const allStatuses = await pool.query('SELECT status, COUNT(*) as count FROM job_requests GROUP BY status ORDER BY count DESC');
    allStatuses.rows.forEach(row => {
      console.log(`- ${row.status}: ${row.count} records`);
    });
    
    // Check what the admin API would return
    console.log('\n🔍 What admin API would return (status <> processed):');
    const adminJobs = await pool.query(`
      SELECT id, job_title, status, created_at
      FROM job_requests 
      WHERE status <> 'processed'
      ORDER BY created_at DESC
    `);
    console.log(`Found ${adminJobs.rows.length} jobs that would show in admin:`);
    adminJobs.rows.forEach((job, i) => {
      console.log(`${i + 1}. ID: ${job.id}, Title: ${job.job_title}, Status: ${job.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMarketingSpecialist();
