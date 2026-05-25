import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Store, Search, MapPin, Phone, ShieldCheck, ExternalLink, Loader2 } from 'lucide-react';
import { fetchDealersCatalog } from '../redux/adminSlice';

const Dealers = () => {
  const dispatch = useDispatch();
  const { catalogDealers, loading } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL'); // ALL, RESELLER, DISTRIBUTOR

  useEffect(() => {
    dispatch(fetchDealersCatalog());
  }, [dispatch]);

  // Extract dealers exactly as seen by resellers and distributors in the mobile app (TecDoc API)
  const extractedDealers = [];

  catalogDealers.forEach((brand, bIndex) => {
    if (brand.addressDetails) {
      const addresses = Array.isArray(brand.addressDetails) ? brand.addressDetails : [brand.addressDetails];
      addresses.forEach((addr, aIndex) => {
        extractedDealers.push({
          id: `${brand.mfrId || bIndex}-${aIndex}`,
          name: addr.name || brand.mfrName || addr.addressName || 'Unknown Dealer',
          address: addr.street || addr.street2 || 'Address not available',
          type: addr.addressType === 1 ? 'DISTRIBUTOR' : 'RESELLER',
          status: 'Open',
          zip: addr.zip || addr.zipCode || addr.mailbox || '',
          city: addr.city || addr.city2 || '',
          phone: addr.phone || '',
          logo: brand.dataSupplierLogo?.imageURL200 || null,
          source: 'TECDOC API'
        });
      });
    }
  });

  const filteredDealers = extractedDealers.filter((d) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (d.name || '').toLowerCase().includes(query) ||
                          (d.city || '').toLowerCase().includes(query) ||
                          (d.zip || '').toLowerCase().includes(query) ||
                          (d.address || '').toLowerCase().includes(query);
    const matchesType = selectedType === 'ALL' || d.type === selectedType;
    return matchesSearch && matchesType;
  });

  const types = ['ALL', 'RESELLER', 'DISTRIBUTOR'];

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-[#C6122E] rounded-2xl flex items-center justify-center shadow-inner border border-red-100">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-wide">TECALLIANCE DEALERS DIRECTORY</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
              Live global directory of authorized NGK Resellers and Distributors from TecDoc API
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
        {/* Search */}
        <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-2xl w-full md:w-96 border border-gray-200 focus-within:border-[#C6122E] focus-within:bg-white transition-all duration-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search dealers by name, city, zip code, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-gray-800 w-full placeholder:text-gray-400"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-6 py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition-all duration-200 ${
                selectedType === t
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Dealers Grid */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <Loader2 className="w-10 h-10 text-[#C6122E] animate-spin" />
          <span className="text-sm font-bold text-gray-400 tracking-wider">LOADING TECDOC DEALER DIRECTORY...</span>
        </div>
      ) : filteredDealers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDealers.map((dealer) => {
            const displayAddress = `${dealer.address} ${dealer.city ? `, ${dealer.city}` : ''} ${dealer.zip ? `- ${dealer.zip}` : ''}`;
            return (
              <div key={dealer.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group">
                <div className="space-y-4">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-3.5 py-1.5 rounded-xl font-black text-[11px] tracking-wider uppercase inline-flex items-center gap-1.5 ${
                      dealer.type === 'DISTRIBUTOR'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {dealer.type}
                    </span>

                    <span className="text-[11px] font-extrabold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg tracking-wider uppercase">
                      {dealer.source}
                    </span>
                  </div>

                  {/* Name & Logo */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {dealer.logo && (
                        <img src={dealer.logo} alt={dealer.name} className="w-12 h-8 object-contain" />
                      )}
                      <h3 className="text-lg font-black text-gray-900 group-hover:text-[#C6122E] transition-colors duration-200 leading-snug truncate flex-1">
                        {dealer.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                      <span>{dealer.city || 'City N/A'}</span>
                      <span>•</span>
                      <span>ZIP {dealer.zip || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Info Snippet */}
                  <div className="space-y-2 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{displayAddress}</span>
                    </div>
                    {dealer.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{dealer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <a
                  href={dealer.phone ? `tel:${dealer.phone}` : '#'}
                  onClick={(e) => !dealer.phone && e.preventDefault()}
                  className={`w-full mt-6 h-12 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                    dealer.phone
                      ? 'bg-gray-100 hover:bg-[#C6122E] hover:text-white text-gray-700 group-hover:shadow-md'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {dealer.phone ? 'CONTACT ENTERPRISE STORE' : 'PHONE NOT AVAILABLE'}
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-gray-200 shadow-sm text-gray-400">
          <Store className="w-12 h-12 stroke-1" />
          <span className="text-sm font-bold tracking-wider uppercase">No matching enterprise dealers found</span>
        </div>
      )}
    </div>
  );
};

export default Dealers;
