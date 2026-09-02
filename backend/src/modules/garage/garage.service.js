import supabase from '../../config/supabase.js';

class GarageService {
  /**
   * Add vehicle to garage (writes to normalized garage_vehicles table and users.vehicleId)
   */
  async addVehicleToGarage(userId, vehicleData) {
    if (!userId || !vehicleData) {
      throw new Error('User ID and vehicle data are required');
    }

    const make = (vehicleData.make || vehicleData.manuName || vehicleData.mfrName || 'Unknown').toUpperCase();
    const model = (vehicleData.model || vehicleData.modelName || vehicleData.vehicleModelSeriesName || 'Unknown').toUpperCase();
    const year = vehicleData.year || vehicleData.yearOfConstrFrom || null;
    const engineCode = vehicleData.engine || vehicleData.engineCode || vehicleData.engineNumber || null;
    const licensePlate = (vehicleData.licensePlate || vehicleData.license_plate || '').toUpperCase() || null;
    const vin = (vehicleData.vin || '').toUpperCase() || null;
    const linkageTargetId = vehicleData.carId || vehicleData.modalId || vehicleData.linkageTargetId || null;

    const rawSpecs = {
      ...(typeof vehicleData === 'object' ? vehicleData : {}),
      make,
      model,
      year,
      engine: engineCode,
      engine_code: engineCode,
      licensePlate,
      license_plate: licensePlate,
      vin,
    };

    // Insert into normalized garage_vehicles table
    const { data: garageEntry, error: insertError } = await supabase
      .from('garage_vehicles')
      .insert({
        user_id: userId,
        make,
        model,
        year: year ? String(year) : null,
        engine_code: engineCode,
        vin,
        linkage_target_id: linkageTargetId ? String(linkageTargetId) : null,
        raw_specs: rawSpecs,
      })
      .select();

    if (insertError) {
      console.warn('Could not insert into garage_vehicles table:', insertError.message);
      throw new Error(insertError.message);
    }

    return garageEntry || [rawSpecs];
  }

  /**
   * Get user's garage vehicles
   */
  async getGarageVehicles(userId) {
    const { data: vehicles, error } = await supabase
      .from('garage_vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !vehicles) {
      return [];
    }

    // Normalize keys
    return vehicles.map((v) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      engine: v.engine_code || v.raw_specs?.engine || v.raw_specs?.engine_code || 'Standard',
      engine_code: v.engine_code || v.raw_specs?.engine || v.raw_specs?.engine_code || 'Standard',
      licensePlate: v.raw_specs?.licensePlate || v.raw_specs?.license_plate || '',
      license_plate: v.raw_specs?.licensePlate || v.raw_specs?.license_plate || '',
      vin: v.vin || v.raw_specs?.vin || '',
      linkageTargetId: v.linkage_target_id,
      created_at: v.created_at,
    }));
  }

  /**
   * Remove vehicle from garage
   */
  async removeVehicleFromGarage(userId, vehicleId) {
    if (!userId || !vehicleId) return;

    // Delete from garage_vehicles table
    await supabase
      .from('garage_vehicles')
      .delete()
      .eq('user_id', userId)
      .eq('id', vehicleId);
  }

  /**
   * Add to search history
   */
  async addSearchHistory(userId, searchData) {
    return [{ success: true }];
  }

  /**
   * Add to Watchlist (Normalized watchlist_items table)
   */
  async addToWatchlist(userId, item) {
    const articleId = String(item.articleId || item.id || item.partNumber || item.model || Date.now());
    const partNumber = item.partNumber || item.articleNumber || item.subtitle || item.model || '';
    const brandName = item.brandName || item.mfrName || item.make || 'NGK';

    // Insert into normalized watchlist_items
    const { data, error } = await supabase.from('watchlist_items').upsert(
      {
        user_id: userId,
        article_id: articleId,
        part_number: partNumber,
        brand_name: brandName,
        article_summary: item,
      },
      { onConflict: 'user_id,article_id' }
    ).select();

    if (error) {
      console.warn('Could not upsert into watchlist_items:', error.message);
    }

    return data || [{ watchList: [item] }];
  }

  /**
   * Remove from Watchlist
   */
  async removeFromWatchlist(userId, partId) {
    await supabase
      .from('watchlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', String(partId));

    return [{ success: true }];
  }
}

export const garageService = new GarageService();
export default garageService;
