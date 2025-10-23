// Seed stations to Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample stations data for Ho Chi Minh City
const stations = [
  {
    name: 'Central Mall Charging Hub',
    address: '123 Nguyen Hue, District 1',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    zip_code: '700000',
    lat: 10.7769,
    lng: 106.7009,
    total_spots: 8,
    available_spots: 6,
    power_kw: 150,
    connector_type: 'CCS, CHAdeMO, Type2',
    price_per_kwh: 0.35,
    rating: 4.8,
    amenities: ['WiFi', 'Restroom', 'Cafe', 'Shopping'],
    operating_hours: '24/7',
    phone: '+84 28 3829 5000',
    network: 'ChargeTech',
    status: 'active'
  },
  {
    name: 'Airport Express Station',
    address: '456 Tan Son Nhat Airport, Tan Binh District',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    zip_code: '700000',
    lat: 10.8231,
    lng: 106.6297,
    total_spots: 12,
    available_spots: 9,
    power_kw: 350,
    connector_type: 'CCS, CHAdeMO',
    price_per_kwh: 0.42,
    rating: 4.9,
    amenities: ['WiFi', 'Restroom', 'Cafe', 'Lounge', 'Duty Free'],
    operating_hours: '24/7',
    phone: '+84 28 3848 5000',
    network: 'ChargeTech',
    status: 'active'
  },
  {
    name: 'Tech Park Station',
    address: '789 Quang Trung Software City, District 12',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    zip_code: '700000',
    lat: 10.8506,
    lng: 106.6200,
    total_spots: 6,
    available_spots: 4,
    power_kw: 150,
    connector_type: 'CCS, Type2',
    price_per_kwh: 0.32,
    rating: 4.6,
    amenities: ['WiFi', 'Parking', 'Cafe'],
    operating_hours: '6:00 AM - 10:00 PM',
    phone: '+84 28 3715 5000',
    network: 'ChargeTech',
    status: 'active'
  },
  {
    name: 'University Hub',
    address: '321 Linh Trung, Thu Duc City',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    zip_code: '700000',
    lat: 10.8700,
    lng: 106.8030,
    total_spots: 10,
    available_spots: 7,
    power_kw: 150,
    connector_type: 'CCS, CHAdeMO, Type2',
    price_per_kwh: 0.30,
    rating: 4.7,
    amenities: ['WiFi', 'Restroom', 'Study Area', 'Food Court'],
    operating_hours: '24/7',
    phone: '+84 28 3724 5000',
    network: 'ChargeTech',
    status: 'active'
  },
  {
    name: 'Highway Service Center',
    address: '555 National Highway 1A, Binh Chanh District',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    zip_code: '700000',
    lat: 10.7500,
    lng: 106.6000,
    total_spots: 4,
    available_spots: 3,
    power_kw: 150,
    connector_type: 'CCS, CHAdeMO',
    price_per_kwh: 0.38,
    rating: 4.5,
    amenities: ['Restroom', 'Convenience Store', 'Parking'],
    operating_hours: '24/7',
    phone: '+84 28 3750 5000',
    network: 'ChargeTech',
    status: 'active'
  },
  {
    name: 'Landmark 81 Premium Station',
    address: '720A Dien Bien Phu, Binh Thanh District',
    city: 'Ho Chi Minh City',
    state: 'Ho Chi Minh',
    zip_code: '700000',
    lat: 10.7943,
    lng: 106.7212,
    total_spots: 15,
    available_spots: 11,
    power_kw: 350,
    connector_type: 'CCS, Tesla, CHAdeMO',
    price_per_kwh: 0.45,
    rating: 4.9,
    amenities: ['WiFi', 'Restroom', 'Valet', 'Lounge', 'Fine Dining'],
    operating_hours: '24/7',
    phone: '+84 28 3636 8888',
    network: 'ChargeTech Premium',
    status: 'active'
  }
];

async function seedStations() {
  try {
    console.log('🌱 Starting to seed stations...');

    // Try to select all existing stations
    const { data: existingStations, error: checkError } = await supabase
      .from('stations')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking stations table:', checkError);
      console.log('💡 Please create the stations table in Supabase with the following columns:');
      console.log('   - name (text)');
      console.log('   - address (text)');
      console.log('   - city (text)');
      console.log('   - state (text)');
      console.log('   - zip_code (text)');
      console.log('   - lat (numeric)');
      console.log('   - lng (numeric)');
      console.log('   - total_spots (integer)');
      console.log('   - available_spots (integer)');
      console.log('   - power_kw (integer)');
      console.log('   - connector_type (text)');
      console.log('   - price_per_kwh (numeric)');
      console.log('   - rating (numeric)');
      console.log('   - amenities (text[] or jsonb)');
      console.log('   - operating_hours (text)');
      console.log('   - phone (text)');
      console.log('   - network (text)');
      console.log('   - status (text)');
      console.log('\n⚠️  Or the table may not exist yet.');
      process.exit(1);
    }

    console.log(`📝 Inserting ${stations.length} stations...`);
    const { data, error } = await supabase
      .from('stations')
      .insert(stations)
      .select();

    if (error) {
      console.error('❌ Error inserting stations:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data.length} stations!`);
    console.log('📍 Stations:');
    data.forEach((station, index) => {
      console.log(`   ${index + 1}. ${station.name} (${station.available_spots}/${station.total_spots} available)`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedStations();
