const { initDatabase } = require('../src/lib/database');
const { SharePointService } = require('../src/services/sharepoint.service');
const { DocumentIndexer } = require('../src/services/document-indexer');

async function setup() {
  console.log('🚀 KYC Manager Setup\n');

  // Initialize database
  console.log('📊 Initializing database...');
  initDatabase();
  console.log('✅ Database initialized\n');

  // Test SharePoint connection
  console.log('🔗 Testing SharePoint connection...');
  try {
    const sharepoint = new SharePointService(
      process.env.SHAREPOINT_TENANT_ID,
      process.env.SHAREPOINT_CLIENT_ID,
      process.env.SHAREPOINT_CLIENT_SECRET,
      process.env.SHAREPOINT_SITE_URL
    );
    
    await sharepoint.initialize();
    console.log('✅ SharePoint connected successfully\n');

    // Index documents
    console.log('📄 Indexing documents from SharePoint...');
    const indexer = new DocumentIndexer(sharepoint);
    const expired = await indexer.indexAllDocuments();
    
    if (expired.length > 0) {
      console.log(`\n⚠️  Found ${expired.length} expired documents:`);
      expired.forEach(doc => {
        console.log(`   - ${doc.filename} (expired: ${doc.expiry_date})`);
      });
    }
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Run "npm run dev" to start the application');
    console.log('   2. Open http://localhost:3000 in your browser');
    console.log('   3. Configure email settings in the dashboard\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nPlease check your environment variables and try again.');
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run setup
setup().catch(console.error); 