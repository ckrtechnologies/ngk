import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Store,
  Building2,
  Search,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Navigation,
  Globe,
  Loader2,
} from 'lucide-react';
import { fetchDealersCatalog } from '../redux/adminSlice';
import { StatusBadge, RoleBadge } from '../components/common/Badge';
import { FilterBar } from '../components/common/FilterBar';
import { DataTable } from '../components/common/DataTable';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const Dealers = () => {
  const dispatch = useDispatch();
  const { catalogDealers, loading } = useSelector((state) => state.admin);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');

  useEffect(() => {
    dispatch(fetchDealersCatalog());
  }, [dispatch]);

  // Extract and normalize dealers from backend / TecAlliance format
  const normalizedDealers = useMemo(() => {
    const list = catalogDealers || [];
    const extracted = [];

    list.forEach((item, bIndex) => {
      // Format A: Direct database dealer record
      if (item.company_name || item.companyName || item.street_address || item.streetAddress) {
        extracted.push({
          id: item.id || `dealer_${bIndex}`,
          name: item.company_name || item.companyName || item.name || 'NGK Dealer',
          address: item.street_address || item.streetAddress || item.address || 'Address not available',
          city: item.city || 'Johannesburg',
          postalCode: item.postal_code || item.postalCode || '',
          type: (item.role || 'reseller').toUpperCase(),
          phone: item.phone || '',
          email: item.contact_email || item.email || '',
          lat: item.latitude || item.lat || null,
          lon: item.longitude || item.lon || null,
        });
        return;
      }

      // Format B: TecDoc brand address details
      if (item.addressDetails) {
        const addresses = Array.isArray(item.addressDetails)
          ? item.addressDetails
          : [item.addressDetails];

        addresses.forEach((addr, aIndex) => {
          extracted.push({
            id: `${item.mfrId || bIndex}-${aIndex}`,
            name: addr.name || item.mfrName || addr.addressName || 'Authorized Dealer',
            address: addr.street || addr.street2 || 'Address not available',
            city: addr.city || addr.city2 || 'South Africa',
            postalCode: addr.zip || addr.zipCode || addr.mailbox || '',
            type: addr.addressType === 1 ? 'DISTRIBUTOR' : 'RESELLER',
            phone: addr.phone || '',
            email: addr.email || '',
            lat: addr.lat || null,
            lon: addr.lon || null,
          });
        });
      }
    });

    return extracted;
  }, [catalogDealers]);

  // Metric KPIs
  const metrics = useMemo(() => {
    return {
      total: normalizedDealers.length,
      reseller: normalizedDealers.filter((d) => d.type === 'RESELLER').length,
      distributor: normalizedDealers.filter((d) => d.type === 'DISTRIBUTOR').length,
    };
  }, [normalizedDealers]);

  const facets = [
    { id: 'ALL', label: 'All Locations', count: metrics.total },
    { id: 'RESELLER', label: 'Reseller Stores', count: metrics.reseller },
    { id: 'DISTRIBUTOR', label: 'Regional Distributors', count: metrics.distributor },
  ];

  // Filter & Sort
  const filteredDealers = useMemo(() => {
    let result = normalizedDealers.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.postalCode.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q);

      const matchesType = selectedType === 'ALL' || d.type === selectedType;
      return matchesSearch && matchesType;
    });

    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'city_asc') {
        return a.city.localeCompare(b.city);
      }
      return 0;
    });

    return result;
  }, [normalizedDealers, searchQuery, selectedType, sortBy]);

  const columns = [
    {
      key: 'name',
      label: 'Dealer / Outlet Name',
      width: '28%',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-slate-900 truncate">{row.name}</div>
            <div className="text-[10px] font-bold text-slate-400">
              {row.postalCode ? `Postal Code: ${row.postalCode}` : 'Verified Partner'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Partner Tier',
      width: '14%',
      render: (row) => <RoleBadge role={row.type} />,
    },
    {
      key: 'city',
      label: 'City / Region',
      width: '18%',
      render: (row) => (
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-slate-400" />
          {row.city}
        </span>
      ),
    },
    {
      key: 'address',
      label: 'Street Address',
      width: '24%',
      render: (row) => (
        <span className="text-xs text-slate-600 truncate block" title={row.address}>
          {row.address}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone Contact',
      width: '16%',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-slate-400" />
          {row.phone || <span className="text-slate-400 italic font-normal">N/A</span>}
        </span>
      ),
    },
  ];

  // Export Handlers
  const handleExportCSV = () => {
    const headers = ['Dealer Name', 'Partner Tier', 'City', 'Street Address', 'Postal Code', 'Phone'];
    const rows = filteredDealers.map((d) => [
      d.name || '',
      d.type || '',
      d.city || '',
      d.address || '',
      d.postalCode || '',
      d.phone || '',
    ]);
    exportToCSV(`ngk_dealers_export_${Date.now()}.csv`, headers, rows);
  };

  const handleExportPDF = () => {
    const headers = ['Dealer Name', 'Partner Tier', 'City', 'Street Address', 'Postal Code', 'Phone'];
    const rows = filteredDealers.map((d) => [
      d.name || '',
      d.type || '',
      d.city || '',
      d.address || '',
      d.postalCode || '',
      d.phone || '',
    ]);
    exportToPDF(`ngk_dealers_export_${Date.now()}.pdf`, 'NGK Authorized Dealers & Resellers Directory', headers, rows);
  };

  return (
    <div className="p-5 max-w-[1600px] mx-auto space-y-4 font-sans select-none">
      {/* Header & KPI */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Dealers & Resellers Directory
            </h1>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5 ml-9">
            Authorized regional distributors and approved point-of-sale reseller outlets across South Africa.
          </p>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Outlets</span>
            <span className="text-xs font-black text-slate-900">{metrics.total}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Resellers</span>
            <span className="text-xs font-black text-emerald-900">{metrics.reseller}</span>
          </div>
          <div className="px-3 py-1.5 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Distributors</span>
            <span className="text-xs font-black text-amber-900">{metrics.distributor}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter dealers by name, city, address, zip code..."
        facets={facets}
        activeFacet={selectedType}
        onFacetSelect={setSelectedType}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { id: 'name_asc', label: 'Name (A-Z)' },
          { id: 'name_desc', label: 'Name (Z-A)' },
          { id: 'city_asc', label: 'City (A-Z)' },
        ]}
        totalResults={filteredDealers.length}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onClearAll={() => {
          setSearchQuery('');
          setSelectedType('ALL');
          setSortBy('name_asc');
        }}
      />

      {/* High-Density Compact Table */}
      <DataTable
        columns={columns}
        data={filteredDealers}
        loading={loading}
        emptyMessage="No dealers match the selected search criteria."
        initialPageSize={25}
      />
    </div>
  );
};

export default Dealers;
