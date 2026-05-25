import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Package, Info, Loader2, X, CheckCircle2, ChevronDown, Car, User, Triangle, Flag, Building2, Globe, Check, FileText } from 'lucide-react';
import { searchArticlesCatalog } from '../redux/adminSlice';
import { serviceJsonApi } from '../config/api';

const PartFinder = () => {
  const dispatch = useDispatch();
  const { catalogArticles, loading, error } = useSelector((state) => state.admin);

  // Tabs: 'Vehicle Finder' or 'Part Number'
  const [activeTab, setActiveTab] = useState('Vehicle Finder');

  // Vehicle Finder States
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedApp, setSelectedApp] = useState('Passenger');
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Data Caches
  const [manufacturersData, setManufacturersData] = useState([]);
  const [seriesData, setSeriesData] = useState([]);
  const [variantData, setVariantData] = useState([]);
  const [stepLoading, setStepLoading] = useState(''); // 'manufacturer', 'series', 'variant'

  // Dropdown Modal State
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownType, setDropdownType] = useState(''); // 'manufacturer', 'series', 'variant'

  // Part Number Search State
  const [partNumberQuery, setPartNumberQuery] = useState('');

  // Selected Article for Complete Specs Modal
  const [selectedArticle, setSelectedArticle] = useState(null);

  const applications = [
    { id: 'Passenger', label: 'Passenger', icon: Car, type: 'P' },
    { id: 'Motorcycle', label: 'Motorcycle', icon: User, type: 'M' },
    { id: 'Garden', label: 'Garden', icon: Triangle, type: 'P' },
    { id: 'Go Cart', label: 'Go Cart', icon: Flag, type: 'P' },
    { id: 'Construction', label: 'Construction', icon: Building2, type: 'O' },
    { id: 'Marine', label: 'Marine', icon: Globe, type: 'P' },
  ];

  // Fetch Manufacturers
  useEffect(() => {
    if (currentStep >= 2) {
      const fetchManufacturers = async () => {
        setStepLoading('manufacturer');
        const appType = applications.find((a) => a.id === selectedApp)?.type || 'P';
        try {
          const res = await fetch(serviceJsonApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': localStorage.getItem('apiKey') },
            body: JSON.stringify({
              getManufacturers: { country: "ZA", lang: "en", linkingTargetType: appType }
            })
          });
          const data = await res.json();
          if (data?.data?.array) {
            setManufacturersData(data.data.array.map((m) => ({ id: m.manuId, label: m.manuName })));
          }
        } catch (err) {
          console.error('Error fetching manufacturers:', err);
        }
        setStepLoading('');
      };
      fetchManufacturers();
    }
  }, [selectedApp, currentStep]);

  // Fetch Series
  useEffect(() => {
    if (currentStep >= 3 && selectedManufacturer) {
      const fetchSeries = async () => {
        setStepLoading('series');
        const appType = applications.find((a) => a.id === selectedApp)?.type || 'P';
        try {
          const res = await fetch(serviceJsonApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': localStorage.getItem('apiKey') },
            body: JSON.stringify({
              getModelSeries: { country: "ZA", lang: "en", manuId: selectedManufacturer.id, linkingTargetType: appType }
            })
          });
          const data = await res.json();
          if (data?.data?.array) {
            setSeriesData(data.data.array.map((s) => ({ id: s.modelId, label: s.modelname || s.name })));
          }
        } catch (err) {
          console.error('Error fetching series:', err);
        }
        setStepLoading('');
      };
      fetchSeries();
    }
  }, [selectedManufacturer, currentStep]);

  // Fetch Variants
  useEffect(() => {
    if (currentStep >= 4 && selectedSeries) {
      const fetchVariants = async () => {
        setStepLoading('variant');
        const appType = applications.find((a) => a.id === selectedApp)?.type || 'P';
        try {
          const res = await fetch(serviceJsonApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': localStorage.getItem('apiKey') },
            body: JSON.stringify({
              getVehicleIdsByCriteria: {
                carType: appType,
                countriesCarSelection: "ZA",
                lang: "en",
                manuId: selectedManufacturer.id,
                modId: selectedSeries.id
              }
            })
          });
          const data = await res.json();

          if (data?.data?.array?.length > 0) {
            const carIds = data.data.array.map((v) => v.carId);
            const detailsRes = await fetch(serviceJsonApi, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-api-key': localStorage.getItem('apiKey') },
              body: JSON.stringify({
                getVehicleByIds3: {
                  articleCountry: "ZA",
                  lang: "en",
                  carIds: { array: carIds },
                  countriesCarSelection: "ZA",
                  country: "ZA"
                }
              })
            });
            const detailsData = await detailsRes.json();
            if (detailsData?.data?.array) {
              setVariantData(detailsData.data.array.map((v) => {
                const details = v.vehicleDetails || {};
                const yearFrom = details.yearOfConstrFrom ? details.yearOfConstrFrom.toString().substring(0, 4) : '';
                const yearTo = details.yearOfConstrTo ? details.yearOfConstrTo.toString().substring(0, 4) : 'Present';
                const years = yearFrom ? `[${yearFrom} - ${yearTo}]` : '';
                const model = details.modelName || '';
                const type = details.typeName || '';
                const fuel = details.fuelType || '';
                const ccm = details.ccmTech ? `${details.ccmTech}cc` : '';
                const hp = details.powerHpTo ? `${details.powerHpTo}HP` : '';

                const label = `${model} ${type} ${years} ${fuel ? `(${fuel}${ccm ? `, ${ccm}` : ''}${hp ? `, ${hp}` : ''})` : ''}`.trim();
                return { id: v.carId, label: label, vehicle: details };
              }));
            } else {
              setVariantData([]);
            }
          } else {
            setVariantData([]);
          }
        } catch (err) {
          console.error('Error fetching variants:', err);
        }
        setStepLoading('');
      };
      fetchVariants();
    }
  }, [selectedSeries, currentStep]);

  const handleContinue = () => {
    if (activeTab === 'Vehicle Finder') {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else if (selectedVariant) {
        const appType = applications.find((a) => a.id === selectedApp)?.type || 'P';
        dispatch(searchArticlesCatalog({
          searchType: 'vehicle',
          query: { linkageTargetId: selectedVariant.id, linkageTargetType: appType }
        }));
      }
    } else {
      if (partNumberQuery.trim().length >= 3) {
        dispatch(searchArticlesCatalog({ searchType: 'number', query: partNumberQuery.trim() }));
      }
    }
  };

  const openDropdown = (type) => {
    setDropdownType(type);
    setShowDropdown(true);
  };

  const selectOption = (option) => {
    if (dropdownType === 'manufacturer') {
      setSelectedManufacturer(option);
      setSelectedSeries(null);
      setSelectedVariant(null);
    } else if (dropdownType === 'series') {
      setSelectedSeries(option);
      setSelectedVariant(null);
    } else {
      setSelectedVariant(option);
    }
    setShowDropdown(false);
  };

  const isContinueDisabled = () => {
    if (activeTab === 'Vehicle Finder') {
      return (currentStep === 2 && !selectedManufacturer) ||
             (currentStep === 3 && !selectedSeries) ||
             (currentStep === 4 && !selectedVariant);
    } else {
      return partNumberQuery.trim().length < 3;
    }
  };

  const getDirectImage = (art) => {
    if (art.dataSupplierLogo?.imageURL200) return art.dataSupplierLogo.imageURL200;
    if (art.images && art.images.length > 0) {
      return art.images[0].imageURL200 || art.images[0].imageURL400 || art.images[0].imageURL800;
    }
    return null;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-red-50 text-[#C6122E] rounded-2xl flex items-center justify-center shadow-inner border border-red-100">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-wide">ENTERPRISE PARTS FINDER</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
              Complete 4-Step Vehicle Application Setup or Direct Part Number Global Lookup
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center bg-gray-200/80 p-1.5 rounded-2xl max-w-md mx-auto border border-gray-200 shadow-inner">
        <button
          onClick={() => { setActiveTab('Vehicle Finder'); setCurrentStep(1); }}
          className={`flex-1 py-3.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all duration-200 ${
            activeTab === 'Vehicle Finder'
              ? 'bg-white text-gray-900 shadow-md shadow-gray-400/20'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Vehicle Finder
        </button>
        <button
          onClick={() => setActiveTab('Part Number')}
          className={`flex-1 py-3.5 rounded-xl font-black text-xs tracking-wider uppercase transition-all duration-200 ${
            activeTab === 'Part Number'
              ? 'bg-white text-gray-900 shadow-md shadow-gray-400/20'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Part Number
        </button>
      </div>

      {/* TAB 1: VEHICLE FINDER (4 STEPS) */}
      {activeTab === 'Vehicle Finder' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-8 animate-fade-in">
          {/* Step Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-wide">
                {currentStep === 1 && '1. Choose Application'}
                {currentStep === 2 && '2. Select Manufacturer'}
                {currentStep === 3 && '3. Series Selection'}
                {currentStep === 4 && '4. Variant Selection'}
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Configure vehicle linkage criteria</p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`w-10 h-10 rounded-2xl font-black text-xs transition-all duration-200 flex items-center justify-center ${
                    currentStep === step
                      ? 'bg-[#C6122E] text-white shadow-lg shadow-red-900/30 scale-110'
                      : currentStep > step
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  S{step}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1 CONTENT: APPLICATIONS */}
          {currentStep === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 animate-fade-in">
              {applications.map((app) => {
                const IconComponent = app.icon;
                const isSelected = selectedApp === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedApp(app.id);
                      setSelectedManufacturer(null);
                      setSelectedSeries(null);
                      setSelectedVariant(null);
                    }}
                    className={`h-36 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 border transition-all duration-200 relative group ${
                      isSelected
                        ? 'bg-red-50/50 border-[#C6122E] text-[#C6122E] shadow-lg shadow-red-100'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-[#C6122E] text-white p-1 rounded-full shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <IconComponent className={`w-8 h-8 transition-transform duration-200 group-hover:scale-110 ${isSelected ? 'text-[#C6122E]' : 'text-gray-500'}`} />
                    <span className="font-bold text-xs tracking-wider uppercase text-gray-800">{app.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2 CONTENT: MANUFACTURER */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <button
                onClick={() => openDropdown('manufacturer')}
                disabled={stepLoading === 'manufacturer'}
                className="w-full h-16 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl px-6 flex items-center justify-between font-black text-sm text-gray-800 transition-all duration-200 shadow-sm"
              >
                <span>{stepLoading === 'manufacturer' ? 'LOADING MANUFACTURERS...' : selectedManufacturer?.label || 'SELECT MANUFACTURER'}</span>
                <ChevronDown className="w-5 h-5 text-[#C6122E]" />
              </button>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Popular Makers</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {manufacturersData.slice(0, 12).map((item) => {
                    const isSelected = selectedManufacturer?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectOption(item)}
                        className={`h-28 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border transition-all duration-200 ${
                          isSelected ? 'bg-red-50/50 border-[#C6122E] text-[#C6122E] shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Car className={`w-7 h-7 ${isSelected ? 'text-[#C6122E]' : 'text-gray-400'}`} />
                        <span className="font-extrabold text-[11px] tracking-wider uppercase text-center line-clamp-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 CONTENT: SERIES */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              <button
                onClick={() => openDropdown('series')}
                disabled={stepLoading === 'series'}
                className="w-full h-16 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl px-6 flex items-center justify-between font-black text-sm text-gray-800 transition-all duration-200 shadow-sm"
              >
                <span>{stepLoading === 'series' ? 'LOADING SERIES...' : selectedSeries?.label || 'SELECT SERIES'}</span>
                <ChevronDown className="w-5 h-5 text-[#C6122E]" />
              </button>

              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-6 flex items-center gap-4 text-gray-600 shadow-sm">
                <Info className="w-6 h-6 text-[#C6122E] flex-shrink-0" />
                <span className="text-xs font-bold tracking-wider uppercase">Select the specific model series to unlock compatible vehicle variants.</span>
              </div>
            </div>
          )}

          {/* STEP 4 CONTENT: VARIANT */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              <button
                onClick={() => openDropdown('variant')}
                disabled={stepLoading === 'variant'}
                className="w-full h-16 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl px-6 flex items-center justify-between font-black text-sm text-gray-800 transition-all duration-200 shadow-sm"
              >
                <span className="truncate pr-4">{stepLoading === 'variant' ? 'LOADING VARIANTS...' : selectedVariant?.label || 'SELECT VARIANT'}</span>
                <ChevronDown className="w-5 h-5 text-[#C6122E] flex-shrink-0" />
              </button>

              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-6 flex items-center gap-4 text-gray-600 shadow-sm">
                <Info className="w-6 h-6 text-[#C6122E] flex-shrink-0" />
                <span className="text-xs font-bold tracking-wider uppercase">Complete variant selection to query the TecAlliance global parts catalog.</span>
              </div>
            </div>
          )}

          {/* Step Footer Continue Button */}
          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={isContinueDisabled()}
              className="h-14 px-10 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-red-900/30 transition-all duration-200 flex items-center gap-2"
            >
              {currentStep === 4 ? 'QUERY VERIFIED PARTS' : 'CONTINUE TO NEXT STEP'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PART NUMBER SEARCH */}
      {activeTab === 'Part Number' && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-wide">Global Lookup</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Search TecAlliance database directly by part or trade number</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-6">
            <div className="flex items-center gap-3 bg-gray-50 px-5 py-3.5 rounded-2xl border border-gray-200 focus-within:border-[#C6122E] focus-within:bg-white transition-all duration-200 shadow-sm">
              <Search className="w-5 h-5 text-[#C6122E]" />
              <input
                type="text"
                placeholder="e.g. BKR6EIX, U5018..."
                value={partNumberQuery}
                onChange={(e) => setPartNumberQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold text-gray-800 w-full uppercase placeholder:text-gray-400 placeholder:normal-case"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-6 flex items-center gap-4 text-gray-600 shadow-sm">
              <Info className="w-6 h-6 text-[#C6122E] flex-shrink-0" />
              <span className="text-xs font-bold tracking-wider uppercase">Search our global technical database with at least 3 characters.</span>
            </div>

            <button
              type="submit"
              disabled={isContinueDisabled() || loading}
              className="w-full h-14 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-red-900/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SEARCH GLOBAL DATABASE'}
            </button>
          </form>
        </div>
      )}

      {/* VERIFIED PARTS RESULTS GRID */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <Loader2 className="w-10 h-10 text-[#C6122E] animate-spin" />
          <span className="text-sm font-bold text-gray-400 tracking-wider">QUERYING TECALLIANCE GLOBAL DATABASE...</span>
        </div>
      ) : catalogArticles.length > 0 ? (
        <div className="space-y-6 animate-fade-in pt-8 border-t border-gray-200">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-wide">VERIFIED PARTS RESULTS</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
              Found {catalogArticles.length} matching products in TecAlliance global catalog
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogArticles.map((art) => {
              const imgUrl = getDirectImage(art);
              return (
                <div key={art.articleNumber || art.genericArticleId} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-200 group">
                  <div className="space-y-5">
                    {/* Image / Header */}
                    <div className="h-48 bg-gray-50 rounded-2xl p-4 flex items-center justify-center border border-gray-100 relative group-hover:border-red-100 transition-colors duration-200 overflow-hidden">
                      {imgUrl ? (
                        <img src={imgUrl} alt={art.genericArticleDescription} className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-16 h-16 text-gray-300 stroke-1" />
                      )}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-gray-200/80 px-3 py-1 rounded-xl font-extrabold text-[11px] text-gray-800 tracking-wider shadow-sm">
                        {art.mfrName || 'NGK'}
                      </span>
                    </div>

                    {/* Title & Numbers */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-extrabold text-[#C6122E] tracking-wider uppercase">{art.genericArticleDescription || 'Ignition Part'}</span>
                        <span className="text-xs font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">PN: {art.articleNumber}</span>
                      </div>
                      <h3 className="text-lg font-black text-gray-900 group-hover:text-[#C6122E] transition-colors duration-200 leading-snug">
                        {art.genericArticleDescription} {art.articleNumber ? `- ${art.articleNumber}` : ''}
                      </h3>
                    </div>

                    {/* Quick Specs Snippet */}
                    <div className="space-y-1.5 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-600">
                      {art.tradeNumbers && art.tradeNumbers.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Trade Numbers:</span>
                          <span className="font-bold text-gray-900">{art.tradeNumbers.join(', ')}</span>
                        </div>
                      )}
                      {art.articleCriteria && art.articleCriteria.slice(0, 2).map((crit, idx) => (
                        <div key={idx} className="flex items-center justify-between truncate">
                          <span className="text-gray-400 truncate">{crit.criteriaDescription}:</span>
                          <span className="font-bold text-gray-900 pl-2 truncate">{crit.formattedValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedArticle(art)}
                    className="w-full mt-6 h-12 bg-gray-100 hover:bg-[#C6122E] hover:text-white text-gray-700 rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    VIEW COMPLETE SPECS
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* DROPDOWN MODAL */}
      {showDropdown && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-xl max-h-[80vh] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 p-6 bg-gray-50/50">
              <h2 className="text-lg font-black text-gray-900 tracking-wide uppercase">SELECT {dropdownType}</h2>
              <button onClick={() => setShowDropdown(false)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 font-bold text-sm text-gray-700">
              {(dropdownType === 'manufacturer' ? manufacturersData : dropdownType === 'series' ? seriesData : variantData).map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectOption(item)}
                  className="w-full p-5 text-left hover:bg-red-50 hover:text-[#C6122E] transition-colors duration-150 flex items-center justify-between group"
                >
                  <span className="truncate pr-4">{item.label}</span>
                  <Check className="w-4 h-4 text-[#C6122E] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE COMPLETE SPECS MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden relative animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gray-900 text-white p-6 border-b border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C6122E] rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                  PN
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-wide">{selectedArticle.genericArticleDescription} - {selectedArticle.articleNumber}</h2>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">Manufacturer: {selectedArticle.mfrName || 'NGK Spark Plugs'}</p>
                </div>
              </div>

              <button onClick={() => setSelectedArticle(null)} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 2 Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
              {/* Left Column: Images & Overview */}
              <div className="lg:col-span-5 border-r border-gray-100 p-6 space-y-6 bg-gray-50/50">
                <div className="h-72 bg-white rounded-2xl p-4 border border-gray-200/80 flex items-center justify-center shadow-sm overflow-hidden">
                  {getDirectImage(selectedArticle) ? (
                    <img src={getDirectImage(selectedArticle)} alt="Part" className="w-full h-full object-contain" />
                  ) : (
                    <Package className="w-20 h-20 text-gray-300 stroke-1" />
                  )}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 space-y-3 shadow-sm font-semibold text-sm text-gray-700">
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-400 text-xs uppercase font-bold">Article Status</span>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs uppercase">
                      {selectedArticle.misc?.articleStatusDescription || 'Normal'}
                    </span>
                  </div>
                  {selectedArticle.tradeNumbers && selectedArticle.tradeNumbers.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-400 text-xs uppercase font-bold">Trade Numbers</span>
                      <span className="font-extrabold text-gray-900">{selectedArticle.tradeNumbers.join(', ')}</span>
                    </div>
                  )}
                  {selectedArticle.gtins && selectedArticle.gtins.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-gray-400 text-xs uppercase font-bold">EAN / GTIN</span>
                      <span className="font-extrabold text-gray-900">{selectedArticle.gtins[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Complete Technical Specs & OE Numbers */}
              <div className="lg:col-span-7 p-6 space-y-8 bg-white overflow-y-auto">
                {/* Technical Criteria */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C6122E]" /> Technical Specifications
                  </h3>
                  <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 divide-y divide-gray-200/60 overflow-hidden font-semibold text-sm">
                    {selectedArticle.articleCriteria && selectedArticle.articleCriteria.length > 0 ? (
                      selectedArticle.articleCriteria.map((crit, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-white transition-colors duration-150">
                          <span className="text-gray-500">{crit.criteriaDescription}</span>
                          <span className="font-extrabold text-gray-900 text-right">{crit.formattedValue}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-400 font-bold text-xs uppercase">No technical criteria available</div>
                    )}
                  </div>
                </div>

                {/* OE Numbers */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#C6122E]" /> Official OE Numbers (Original Equipment)
                  </h3>
                  <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 divide-y divide-gray-200/60 overflow-hidden font-semibold text-sm max-h-80 overflow-y-auto">
                    {selectedArticle.oemNumbers && selectedArticle.oemNumbers.length > 0 ? (
                      selectedArticle.oemNumbers.map((oe, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-white transition-colors duration-150">
                          <span className="text-gray-600 font-bold">{oe.mfrName}</span>
                          <span className="font-black text-[#C6122E] font-mono tracking-wider bg-red-50 border border-red-100 px-3 py-1 rounded-xl text-xs">{oe.articleNumber}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-400 font-bold text-xs uppercase">No OE numbers available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartFinder;
