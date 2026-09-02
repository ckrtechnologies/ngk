import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Car,
  Bike,
  Truck,
  Wrench,
  CheckCircle2,
  ChevronDown,
  Layers,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  X,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import { searchArticlesCatalog } from '../redux/adminSlice';
import { serviceJsonApi } from '../config/api';
import { Modal } from '../components/common/Modal';
import { DataTable } from '../components/common/DataTable';

const applications = [
  { id: 'Passenger', label: 'Passenger Car', icon: Car, type: 'P' },
  { id: 'Motorcycle', label: 'Motorcycle', icon: Bike, type: 'M' },
  { id: 'Commercial', label: 'Commercial Vehicle', icon: Truck, type: 'O' },
];

const PartFinder = () => {
  const dispatch = useDispatch();
  const { catalogArticles, loading } = useSelector((state) => state.admin);

  const [searchMode, setSearchMode] = useState('vehicle'); // 'vehicle' or 'number'

  // Vehicle Finder State
  const [selectedApp, setSelectedApp] = useState('Passenger');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');

  // Dropdown Lists
  const [manufacturersList, setManufacturersList] = useState([]);
  const [seriesList, setSeriesList] = useState([]);
  const [variantsList, setVariantsList] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // Direct Part Number Search
  const [partNumberQuery, setPartNumberQuery] = useState('');

  // Selected Article Modal
  const [selectedArticle, setSelectedArticle] = useState(null);

  const appType = useMemo(
    () => applications.find((a) => a.id === selectedApp)?.type || 'P',
    [selectedApp]
  );

  // 1. Fetch Manufacturers when Application Type changes
  useEffect(() => {
    const fetchMfrs = async () => {
      setDropdownLoading(true);
      setSelectedManufacturer('');
      setSelectedSeries('');
      setSelectedVariant('');
      setSeriesList([]);
      setVariantsList([]);

      try {
        const res = await fetch(serviceJsonApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            getManufacturers: { country: 'ZA', lang: 'en', linkingTargetType: appType },
          }),
        });
        const data = await res.json();
        if (data?.data?.array) {
          setManufacturersList(data.data.array.map((m) => ({ id: m.manuId, name: m.manuName })));
        }
      } catch (err) {
        console.error('Error fetching manufacturers:', err);
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchMfrs();
  }, [appType]);

  // 2. Fetch Series when Manufacturer changes
  useEffect(() => {
    if (!selectedManufacturer) return;

    const fetchSeries = async () => {
      setDropdownLoading(true);
      setSelectedSeries('');
      setSelectedVariant('');
      setVariantsList([]);

      try {
        const res = await fetch(serviceJsonApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            getModelSeries: {
              country: 'ZA',
              lang: 'en',
              manuId: parseInt(selectedManufacturer, 10),
              linkingTargetType: appType,
            },
          }),
        });
        const data = await res.json();
        if (data?.data?.array) {
          setSeriesList(
            data.data.array.map((s) => ({ id: s.modelId, name: s.modelname || s.name }))
          );
        }
      } catch (err) {
        console.error('Error fetching model series:', err);
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchSeries();
  }, [selectedManufacturer, appType]);

  // 3. Fetch Variants when Series changes
  useEffect(() => {
    if (!selectedSeries || !selectedManufacturer) return;

    const fetchVariants = async () => {
      setDropdownLoading(true);
      setSelectedVariant('');

      try {
        const res = await fetch(serviceJsonApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            getVehicleIdsByCriteria: {
              carType: appType,
              countriesCarSelection: 'ZA',
              lang: 'en',
              manuId: parseInt(selectedManufacturer, 10),
              modId: parseInt(selectedSeries, 10),
            },
          }),
        });
        const data = await res.json();

        if (data?.data?.array && data.data.array.length > 0) {
          const carIds = data.data.array.map((v) => v.carId);
          const detailsRes = await fetch(serviceJsonApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              getVehicleByIds3: {
                articleCountry: 'ZA',
                lang: 'en',
                carIds: { array: carIds },
                countriesCarSelection: 'ZA',
                country: 'ZA',
              },
            }),
          });
          const detailsData = await detailsRes.json();
          if (detailsData?.data?.array) {
            setVariantsList(
              detailsData.data.array.map((v) => {
                const details = v.vehicleDetails || {};
                return {
                  id: details.carId || v.carId,
                  name: `${details.typeName || ''} (${details.powerHpFrom || ''} HP, ${details.cylinderCapacityCcm || ''} cc)`,
                  details,
                };
              })
            );
          }
        }
      } catch (err) {
        console.error('Error fetching vehicle variants:', err);
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchVariants();
  }, [selectedSeries, selectedManufacturer, appType]);

  // 4. Trigger Search by Vehicle
  const handleVehicleSearch = () => {
    if (!selectedVariant) return;
    dispatch(
      searchArticlesCatalog({
        searchType: 'vehicle',
        query: { linkageTargetId: selectedVariant, linkageTargetType: appType },
      })
    );
  };

  // 5. Trigger Search by Part Number
  const handlePartNumberSearch = (e) => {
    e?.preventDefault();
    if (!partNumberQuery.trim()) return;
    dispatch(
      searchArticlesCatalog({
        searchType: 'number',
        query: partNumberQuery.trim(),
      })
    );
  };

  // Formatted Articles
  const formattedArticles = useMemo(() => {
    const list = catalogArticles || [];
    return list.map((a, idx) => {
      const genericDesc =
        a.genericArticles && a.genericArticles.length > 0
          ? a.genericArticles[0].genericArticleDescription
          : a.genericArticleDescription;

      const title = genericDesc || a.mfrName || a.dataSupplierName || 'Automotive Component';
      const partNumber = a.articleNumber || a.directArticle?.articleNo || 'N/A';
      const brandName = a.mfrName || a.dataSupplierName || 'NGK';

      const specs = [];
      if (a.articleCriteria && Array.isArray(a.articleCriteria)) {
        a.articleCriteria.forEach((c) => {
          specs.push({ label: c.criteriaDescription, value: c.formattedValue || c.rawValue });
        });
      } else if (a.articleAttributes?.array) {
        a.articleAttributes.array.forEach((attr) => {
          specs.push({ label: attr.attrName, value: attr.attrValue });
        });
      }

      let imageUrl = null;
      if (a.images && a.images.length > 0) {
        imageUrl =
          a.images[0].imageURL800 ||
          a.images[0].imageURL400 ||
          a.images[0].imageURL100 ||
          a.images[0].docUrl;
      } else if (a.articleDocuments?.array && a.articleDocuments.array.length > 0) {
        imageUrl = a.articleDocuments.array[0].docUrl || null;
      }

      return {
        id: a.articleId || a.directArticle?.articleId || `art_${idx}`,
        articleNumber: partNumber,
        title,
        brandName,
        specs,
        imageUrl,
        raw: a,
      };
    });
  }, [catalogArticles]);

  const columns = [
    {
      key: 'articleNumber',
      label: 'Part Number',
      width: '24%',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xs">
            {row.brandName.charAt(0)}
          </div>
          <div>
            <span className="font-mono font-black text-xs text-slate-900 block leading-tight">
              {row.articleNumber}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{row.brandName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Component Category',
      width: '28%',
      render: (row) => (
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Wrench className="w-3 h-3 text-slate-400" />
          {row.title}
        </span>
      ),
    },
    {
      key: 'specs',
      label: 'Key Technical Specs',
      width: '32%',
      render: (row) => {
        const topSpecs = (row.specs || []).slice(0, 2);
        if (topSpecs.length === 0) {
          return <span className="text-[11px] text-slate-400 italic">OEM standard specs</span>;
        }
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {topSpecs.map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {s.label}: <strong className="text-slate-900">{s.value}</strong>
              </span>
            ))}
            {row.specs.length > 2 && (
              <span className="text-[10px] font-bold text-slate-400">+{row.specs.length - 2} more</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'action',
      label: 'Inspect',
      align: 'right',
      width: '16%',
      render: (row) => (
        <button
          onClick={() => setSelectedArticle(row)}
          className="h-7 px-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-md font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <FileText className="w-3 h-3" />
          <span>Full Specs</span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-5 max-w-[1600px] mx-auto space-y-4 font-sans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-brand-red flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              TecDoc Part Finder
            </h1>
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5 ml-9">
            Search verified OEM ignition, sensor, and mechanical replacement components via Pegasus 3.0.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setSearchMode('vehicle')}
            className={`px-3 py-1 rounded-md text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
              searchMode === 'vehicle' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vehicle Cascade
          </button>
          <button
            onClick={() => setSearchMode('number')}
            className={`px-3 py-1 rounded-md text-xs font-extrabold tracking-tight transition-all cursor-pointer ${
              searchMode === 'number' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Part Number
          </button>
        </div>
      </div>

      {/* Mode A: Vehicle Selector Cascade */}
      {searchMode === 'vehicle' ? (
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              1. Select Vehicle Application & Trim
            </span>
          </div>

          {/* Application Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {applications.map((app) => {
              const Icon = app.icon;
              const isSelected = selectedApp === app.id;
              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{app.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3 Step Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Manufacturer */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Manufacturer</label>
              <select
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
                disabled={dropdownLoading || manufacturersList.length === 0}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Choose Manufacturer --</option>
                {manufacturersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Series */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Model Series</label>
              <select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                disabled={!selectedManufacturer || seriesList.length === 0}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Choose Series --</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Variant / Trim */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Engine / Trim</label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                disabled={!selectedSeries || variantsList.length === 0}
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-red focus:outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="">-- Choose Engine / Trim --</option>
                {variantsList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleVehicleSearch}
              disabled={!selectedVariant || loading}
              className="h-9 px-4 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Find Verified Articles</span>
            </button>
          </div>
        </div>
      ) : (
        /* Mode B: Direct Part Number Search */
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handlePartNumberSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={partNumberQuery}
                onChange={(e) => setPartNumberQuery(e.target.value)}
                placeholder="Enter NGK or OEM part number (e.g. ILZKR7B-11, BKR6E, 94122)..."
                className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-brand-red focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!partNumberQuery.trim() || loading}
              className="h-10 px-5 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search Part</span>
            </button>
          </form>
        </div>
      )}

      {/* Results Table */}
      <DataTable
        columns={columns}
        data={formattedArticles}
        loading={loading}
        emptyMessage="No articles loaded. Select a vehicle or enter a part number to search."
        initialPageSize={25}
      />

      {/* Technical Specs Inspection Modal */}
      {selectedArticle && (
        <Modal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          title={`Technical Specifications: ${selectedArticle.articleNumber}`}
          subtitle={`${selectedArticle.brandName} • ${selectedArticle.title}`}
          icon={Wrench}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {/* Image Preview */}
            {selectedArticle.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.articleNumber}
                  className="max-h-48 object-contain"
                />
              </div>
            )}

            {/* Criteria Grid */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Factory Specifications & Properties
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedArticle.specs.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {s.label}
                    </span>
                    <span className="font-extrabold text-slate-900 block mt-0.5">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedArticle(null)}
                className="h-8.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close Specifications
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PartFinder;
