import bcrypt from 'bcrypt';
import supabase from '../src/config/supabase.js';

const DEMO_USERS = [
  {
    name: 'System Admin',
    email: 'admin@ngk.com',
    password: 'admin',
    role: 'admin',
    address: 'NGK Head Office, Johannesburg',
    phone: '+27 11 000 0001',
  },
  {
    name: 'Demo Distributor SA',
    email: 'distributor@ngk.com',
    password: 'password123',
    role: 'distributor',
    address: '10 Logistics Way, Midrand, Johannesburg, 1685',
    phone: '+27 11 123 4567',
    dealer: {
      companyName: 'NGK Regional Distributor SA',
      city: 'Johannesburg',
      postalCode: '1685',
      lat: -25.9983,
      lon: 28.1263,
    },
  },
  {
    name: 'AutoParts Direct Sandton',
    email: 'reseller@ngk.com',
    password: 'password123',
    role: 'reseller',
    address: '45 Main Road, Sandton, Johannesburg, 2196',
    phone: '+27 11 987 6543',
    dealer: {
      companyName: 'AutoParts Direct Sandton',
      city: 'Sandton',
      postalCode: '2196',
      lat: -26.1076,
      lon: 28.0567,
    },
  },
  {
    name: 'Cape Auto Spares',
    email: 'capespares@ngk.com',
    password: 'password123',
    role: 'reseller',
    address: '12 Voortrekker Rd, Bellville, Cape Town, 7530',
    phone: '+27 21 555 1234',
    dealer: {
      companyName: 'Cape Auto Spares',
      city: 'Cape Town',
      postalCode: '7530',
      lat: -33.8998,
      lon: 18.6288,
    },
  },
  {
    name: 'Durban Spark & Ignition',
    email: 'durbanspark@ngk.com',
    password: 'password123',
    role: 'reseller',
    address: '88 Umgeni Road, Stamford Hill, Durban, 4001',
    phone: '+27 31 333 4567',
    dealer: {
      companyName: 'Durban Spark & Ignition',
      city: 'Durban',
      postalCode: '4001',
      lat: -29.8384,
      lon: 31.0218,
    },
  },
  {
    name: 'John Vehicle Owner',
    email: 'owner@ngk.com',
    password: 'password123',
    role: 'owner',
    address: '22 Park Street, Pretoria, 0002',
    phone: '+27 12 444 5678',
  },
];

async function seed() {
  console.log('='.repeat(70));
  console.log('🌱 SEEDING NGK2 DATABASE USERS, ROLES & DEALERS');
  console.log('='.repeat(70));

  for (const user of DEMO_USERS) {
    console.log(`Processing: ${user.email} (${user.role})...`);
    const cleanEmail = user.email.toLowerCase().trim();
    const { data: existing } = await supabase.from('users').select('id, email').eq('email', cleanEmail);

    const passwordHash = await bcrypt.hash(user.password, 10);
    let userId = null;

    if (existing && existing.length > 0) {
      userId = existing[0].id;
      console.log(`  Updating password_hash for existing user ${cleanEmail}...`);
      await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          name: user.name,
          role: user.role,
          address: user.address,
          phone: user.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else {
      console.log(`  Inserting new user ${cleanEmail}...`);
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: user.name,
          email: cleanEmail,
          password_hash: passwordHash,
          role: user.role,
          address: user.address,
          phone: user.phone,
        })
        .select('id, email')
        .single();

      if (error) {
        console.error(`  ❌ Failed to create user ${cleanEmail}:`, error.message);
        continue;
      }
      userId = data.id;
      console.log(`  ✅ Created user: ${cleanEmail}`);
    }

    // Seed Dealer record if reseller or distributor
    if (user.dealer && userId) {
      const d = user.dealer;
      console.log(`  Updating dealer directory entry for ${user.name}...`);
      const { data: existingDealer } = await supabase.from('dealers').select('id').eq('user_id', userId);

      if (existingDealer && existingDealer.length > 0) {
        await supabase
          .from('dealers')
          .update({
            company_name: d.companyName,
            street_address: user.address,
            city: d.city,
            postal_code: d.postalCode,
            latitude: d.lat,
            longitude: d.lon,
            phone: user.phone,
            contact_email: cleanEmail,
          })
          .eq('user_id', userId);
      } else {
        await supabase.from('dealers').insert({
          user_id: userId,
          company_name: d.companyName,
          street_address: user.address,
          city: d.city,
          postal_code: d.postalCode,
          latitude: d.lat,
          longitude: d.lon,
          phone: user.phone,
          contact_email: cleanEmail,
        });
      }
      console.log(`  📍 Dealer location indexed: ${d.companyName} (${d.city})`);
    }
  }

  console.log('\n🎉 Database seeding finished successfully on VPS Supabase!');
}

seed().catch(console.error);
