import supabase from '../../config/supabase.js';

class GarageService {
  /**
   * Add vehicle to garage (writes to normalized garage_vehicles table and users.vehicleId)
   */
  async addVehicleToGarage(userId, vehicleData) {
    if (!userId || !vehicleData) {
      throw new Error('User ID and vehicle data are required');
    }

    const make = vehicleData.make || vehicleData.manuName || vehicleData.mfrName || 'Unknown';
    const model = vehicleData.model || vehicleData.modelName || vehicleData.vehicleModelSeriesName || 'Unknown';
    const year = vehicleData.year || vehicleData.yearOfConstrFrom || null;
    const engineCode = vehicleData.engineCode || vehicleData.engineNumber || null;
    const vin = vehicleData.vin || null;
    const linkageTargetId = vehicleData.carId || vehicleData.modalId || vehicleData.linkageTargetId || null;

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
        raw_specs: vehicleData,
      })
      .select();

    if (insertError) {
      console.warn('Could not insert into garage_vehicles table:', insertError.message);
    }

    // Also update users.vehicleId array for backward compatibility
    const { data: user } = await supabase.from('users').select('*').eq('id', userId);
    if (user && user.length > 0) {
      const currentVehicles = user[0].vehicleId || [];
      const updatedVehicles = [...currentVehicles, vehicleData];
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ vehicleId: updatedVehicles })
        .eq('id', userId)
        .select();

      return updatedUser || user;
    }

    return garageEntry;
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

    if (error || !vehicles || vehicles.length === 0) {
      // Fallback to users.vehicleId
      const { data: user } = await supabase.from('users').select('vehicleId').eq('id', userId);
      return user?.[0]?.vehicleId || [];
    }

    return vehicles;
  }

  /**
   * Add to search history
   */
  async addSearchHistory(userId, searchData) {
    const { data: user } = await supabase.from('users').select('searchHistory').eq('id', userId);
    if (!user || user.length === 0) throw new Error('User not found');

    const currentHistory = user[0].searchHistory || [];
    const updatedHistory = [...currentHistory, searchData];

    const { data: updatedUser } = await supabase
      .from('users')
      .update({ searchHistory: updatedHistory })
      .eq('id', userId)
      .select();

    return updatedUser;
  }

  /**
   * Add to Watchlist (Normalized watchlist_items table + users.watchList array)
   */
  async addToWatchlist(userId, item) {
    const articleId = String(item.articleId || item.id || item.partNumber || Date.now());
    const partNumber = item.partNumber || item.articleNumber || item.subtitle || '';
    const brandName = item.brandName || item.mfrName || 'NGK';

    // Insert into normalized watchlist_items
    await supabase.from('watchlist_items').upsert(
      {
        user_id: userId,
        article_id: articleId,
        part_number: partNumber,
        brand_name: brandName,
        article_summary: item,
      },
      { onConflict: 'user_id,article_id' }
    );

    // Update users.watchList for backward compatibility
    const { data: user } = await supabase.from('users').select('watchList').eq('id', userId);
    if (user && user.length > 0) {
      const currentWatchList = user[0].watchList || [];
      const updatedWatchList = [...currentWatchList, item];
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ watchList: updatedWatchList })
        .eq('id', userId)
        .select();

      return updatedUser || user;
    }

    return [{ watchList: [item] }];
  }

  /**
   * Remove from Watchlist
   */
  async removeFromWatchlist(userId, partId) {
    // Delete from normalized watchlist_items table
    await supabase
      .from('watchlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', String(partId));

    // Update users.watchList array
    const { data: user } = await supabase.from('users').select('*').eq('id', userId);
    if (!user || user.length === 0) throw new Error('User not found');

    const currentWatchList = user[0].watchList || [];
    const updatedWatchList = currentWatchList.filter(
      (item) => String(item.id) !== String(partId) && String(item.articleId) !== String(partId)
    );

    await supabase.from('users').update({ watchList: updatedWatchList }).eq('id', userId);

    return [{ ...user[0], watchList: updatedWatchList }];
  }
}

export const garageService = new GarageService();
export default garageService;
