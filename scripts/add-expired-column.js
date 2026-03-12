/**
 * Add 'expired' column to offres table and mark expired offers
 * Usage: npx dotenvx run -f .env.local -- node scripts/add-expired-column.js
 */
const { createClient } = require('@supabase/supabase-js');

async function main() {
  console.log('🚀 Adding expired column to offres table...\n');

  // Initialize Supabase client with service role
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // 1. Check if column already exists by fetching one offer and checking its keys
    console.log('🔍 Checking if expired column exists...');
    const { data: sampleOffre, error: sampleError } = await supabase
      .from('offres')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ Error checking table structure:', sampleError);
      process.exit(1);
    }

    const columnExists = sampleOffre && 'expired' in sampleOffre;

    if (columnExists) {
      console.log('✅ Column "expired" already exists');
    } else {
      console.log('📝 Column "expired" does not exist. Adding it...');
      
      // Use RPC to execute SQL commands
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE offres ADD COLUMN expired BOOLEAN DEFAULT FALSE'
      });

      if (alterError) {
        console.log('\n⚠️  Could not add column via RPC. You need to run this SQL manually:');
        console.log('ALTER TABLE offres ADD COLUMN expired BOOLEAN DEFAULT FALSE;');
        console.log('\nThen re-run this script to mark expired offers.\n');
        
        // Don't exit, continue to mark expired offers if column exists
        const { data: checkAgain } = await supabase
          .from('offres')
          .select('*')
          .limit(1)
          .single();
        
        if (!checkAgain || !('expired' in checkAgain)) {
          console.log('❌ Column still missing. Please add it manually and re-run.');
          process.exit(1);
        }
      } else {
        console.log('✅ Column "expired" added successfully');
      }
    }

    // 2. Mark expired offers (date_limite < today)
    console.log('\n📅 Marking expired offers...');
    
    const today = '2026-03-12'; // Using the date from the task
    
    const { count, error: updateError } = await supabase
      .from('offres')
      .update({ expired: true })
      .lt('date_limite', today)
      .not('date_limite', 'is', null)
      .neq('expired', true); // Only update those not already marked as expired

    if (updateError) {
      console.error('❌ Error marking expired offers:', updateError);
      process.exit(1);
    }

    console.log(`✅ Marked ${count || 0} offers as expired (date_limite < ${today})`);

    // 3. Show summary
    const { count: totalOffers } = await supabase
      .from('offres')
      .select('*', { count: 'exact', head: true });

    const { count: expiredOffers } = await supabase
      .from('offres')
      .select('*', { count: 'exact', head: true })
      .eq('expired', true);

    console.log('\n' + '='.repeat(50));
    console.log('📋 RAPPORT FINAL');
    console.log('='.repeat(50));
    console.log(`Total offers in database  : ${totalOffers || 0}`);
    console.log(`Expired offers            : ${expiredOffers || 0}`);
    console.log(`Active offers             : ${(totalOffers || 0) - (expiredOffers || 0)}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();