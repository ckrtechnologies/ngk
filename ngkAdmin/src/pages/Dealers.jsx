import { useEffect, useState } from 'react';
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
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-brand-red rounded-xl flex items-center justify-center border border-rose-100/55 shadow-inner">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">TecAlliance Dealers Directory</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Live global directory of authorized NGK Resellers and Distributors from TecDoc API
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-premium">
        {/* Search */}
        <div className="flex items-center gap-3 bg-slate-100/50 px-4 py-2.5 rounded-xl w-full md:w-96 border border-slate-200/40 focus-within:border-brand-red focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-red/5 transition-all duration-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search dealers by name, city, zip code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-full placeholder:text-slate-400"
          />
        </div>

        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-4 py-2 rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all duration-200 ${
                selectedType === t
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100/80 text-slate-500 hover:bg-slate-200/80 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Dealers Grid */}
      {loading ? (
        <div className="h-80 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/60 shadow-premium">
          <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
          <span className="text-[10px] font-bold text-slate-400 tracking-widest">LOADING TECDOC DEALER DIRECTORY...</span>
        </div>
      ) : filteredDealers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDealers.map((dealer) => {
            const displayAddress = `${dealer.address} ${dealer.city ? `, ${dealer.city}` : ''} ${dealer.zip ? `- ${dealer.zip}` : ''}`;
            return (
              <div key={dealer.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-premium p-5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="space-y-4">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between gap-4">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[9px] tracking-wider uppercase inline-flex items-center gap-1.5 ${
                      dealer.type === 'DISTRIBUTOR'
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {dealer.type}
                    </span>

                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md tracking-wider uppercase">
                      {dealer.source}
                    </span>
                  </div>

                  {/* Name & Logo */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      {dealer.logo && (
                        <img src={dealer.logo} alt={dealer.name} className="w-10 h-7 object-contain bg-slate-50 rounded p-0.5 border border-slate-100" />
                      )}
                      <h3 className="text-md font-extrabold text-slate-900 group-hover:text-brand-red transition-colors duration-200 leading-snug truncate flex-1">
                        {dealer.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-450 mt-1">
                      <span>{dealer.city || 'City N/A'}</span>
                      <span className="text-slate-300">•</span>
                      <span>ZIP {dealer.zip || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Info Snippet */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-2.5 text-slate-550">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{displayAddress}</span>
                    </div>
                    {dealer.phone && (
                      <div className="flex items-center gap-2.5 text-slate-550">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{dealer.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <a
                  href={dealer.phone ? `tel:${dealer.phone}` : '#'}
                  onClick={(e) => !dealer.phone && e.preventDefault()}
                  className={`w-full mt-4 h-10 rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 border ${
                    dealer.phone
                      ? 'bg-slate-50 border-slate-200/80 hover:bg-brand-red hover:text-white hover:border-brand-red text-slate-700 shadow-sm'
                      : 'bg-slate-50/50 border-slate-150 text-slate-350 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {dealer.phone ? 'Contact Enterprise Store' : 'Phone Not Available'}
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-80 flex flex-col items-center justify-center gap-2.5 bg-white rounded-2xl border border-slate-200/60 shadow-premium text-slate-400">
          <Store className="w-10 h-10 stroke-1" />
          <span className="text-xs font-bold tracking-wider uppercase">No matching enterprise dealers found</span>
        </div>
      )}
    </div>
  );
};

export default Dealers;
