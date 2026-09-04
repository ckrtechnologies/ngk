import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  G,
  Line,
} from 'react-native-svg';

// 1. FIND PARTS 3D ICON - Precision Spark Plug + Optic Search Lens
export function FindParts3DIcon({ size = 32, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
      <Defs>
        <LinearGradient id="partsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#EF4444" />
          <Stop offset="100%" stopColor="#B91C1C" />
        </LinearGradient>
        <LinearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E2E8F0" />
          <Stop offset="100%" stopColor="#94A3B8" />
        </LinearGradient>
        <LinearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.2" />
        </LinearGradient>
      </Defs>

      {/* Spark Plug Ceramic Body (Ribbed) */}
      <Rect x="14" y="6" width="8" height="14" rx="2" fill="url(#metalGrad)" />
      <Line x1="12" y1="9" x2="24" y2="9" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="13" x2="24" y2="13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="12" y1="17" x2="24" y2="17" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />

      {/* Spark Plug Hex Nut */}
      <Path d="M12 20h12l2 4H10l2-4z" fill="#475569" />

      {/* Threaded Base & Ground Electrode */}
      <Rect x="15" y="24" width="6" height="8" fill="#334155" />
      <Line x1="14" y1="26" x2="22" y2="26" stroke="#94A3B8" strokeWidth="1" />
      <Line x1="14" y1="29" x2="22" y2="29" stroke="#94A3B8" strokeWidth="1" />
      <Path d="M18 32v3h-3" stroke="#F1F5F9" strokeWidth="1.5" strokeLinecap="round" />

      {/* High-Voltage Electric Spark Flash */}
      <Path
        d="M17 31l2-3-1.5-.5 2-2.5"
        stroke="#38BDF8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Magnifier Glass Bezel */}
      <Circle cx="29" cy="27" r="12" fill="url(#glassGrad)" stroke="url(#partsGrad)" strokeWidth="3.5" />
      <Circle cx="29" cy="27" r="9" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.6" />

      {/* Magnifier Reflection Glare */}
      <Path
        d="M23 23a7 7 0 0 1 7-4"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Magnifier Handle */}
      <Path
        d="M38 36l6 6"
        stroke="url(#partsGrad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Circle cx="44" cy="42" r="2" fill="#7F1D1D" />
    </Svg>
  );
}

// 2. MY GARAGE 3D ICON - Aerodynamic Sports Coupe / GT Vehicle
export function MyGarage3DIcon({ size = 32, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
      <Defs>
        <LinearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3B82F6" />
          <Stop offset="100%" stopColor="#1D4ED8" />
        </LinearGradient>
        <LinearGradient id="glassCarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#93C5FD" />
          <Stop offset="100%" stopColor="#1E3A8A" />
        </LinearGradient>
      </Defs>

      {/* Garage Platform Ground Shadow */}
      <Path
        d="M6 38h36"
        stroke="#93C5FD"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />

      {/* Main Car Silhouette Body */}
      <Path
        d="M8 28l3-7c1-2.5 3-4 6-4.5l14-1c3 0 5 1.5 6.5 4l4.5 8.5c2 1 3 2.5 3 5 0 2-1 3-3 3H7c-2 0-3-1-3-3 0-2.5 1.5-4 4-5z"
        fill="url(#carGrad)"
      />

      {/* Windshield & Cabin Glass */}
      <Path
        d="M17 19l-2 5h14l-2-5H17z"
        fill="url(#glassCarGrad)"
      />
      {/* Front Windshield Pillar */}
      <Path d="M26 19l3 5" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />

      {/* Xenon LED Headlights */}
      <Path d="M39 28l3 1v2l-3-1v-2z" fill="#FEF08A" />
      <Path d="M6 28l-2 1v2l2-1v-2z" fill="#EF4444" />

      {/* Wheels - Front & Rear Alloy Wheels */}
      <Circle cx="14" cy="34" r="5" fill="#0F172A" />
      <Circle cx="14" cy="34" r="2.5" fill="#E2E8F0" />
      <Circle cx="34" cy="34" r="5" fill="#0F172A" />
      <Circle cx="34" cy="34" r="2.5" fill="#E2E8F0" />

      {/* Speed Line Glow / Wing Mirror */}
      <Rect x="18" y="24" width="4" height="2" rx="1" fill="#FFFFFF" opacity="0.8" />
    </Svg>
  );
}

// 3. TECH ENQUIRY 3D ICON - Diagnostic Telemetry Scanner & Chat Bubble
export function TechEnquiry3DIcon({ size = 32, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
      <Defs>
        <LinearGradient id="enqGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
      </Defs>

      {/* Main Dialogue Speech Bubble */}
      <Path
        d="M8 12a6 6 0 0 1 6-6h20a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H18l-8 6v-6a6 6 0 0 1-2-4.5V12z"
        fill="url(#enqGrad)"
      />

      {/* Diagnostic Waveform Telemetry Display Screen */}
      <Rect x="14" y="12" width="20" height="12" rx="3" fill="#064E3B" />

      {/* Real-time Oscilloscope Signal Wave */}
      <Path
        d="M16 18h2l2-3 2 6 2-4 2 2h4"
        stroke="#6EE7B7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Status LED Indicator */}
      <Circle cx="31" cy="15" r="1.5" fill="#34D399" />

      {/* Gold Precision Wrench Badge Overlay */}
      <G transform="translate(26, 24)">
        <Circle cx="9" cy="9" r="9" fill="#047857" stroke="#FFFFFF" strokeWidth="1.5" />
        <Path
          d="M6 13l4-4M10 7a2 2 0 1 0-2 2l-3 3a1 1 0 0 0 1.4 1.4l3-3a2 2 0 0 0 2-2z"
          stroke="#FBBF24"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

// 4. DEALER LOCATOR 3D ICON - Geo Pin + Authorized Storefront Canopy
export function DealerLocator3DIcon({ size = 32, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" {...props}>
      <Defs>
        <LinearGradient id="dealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </LinearGradient>
      </Defs>

      {/* Concentric Base Ground Radar Wave */}
      <Circle cx="24" cy="41" r="10" stroke="#FDE68A" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
      <Circle cx="24" cy="41" r="4" fill="#B45309" opacity="0.3" />

      {/* Main 3D Teardrop Pin */}
      <Path
        d="M24 5c-7.7 0-14 6.3-14 14 0 10.5 14 23 14 23s14-12.5 14-23c0-7.7-6.3-14-14-14z"
        fill="url(#dealGrad)"
      />

      {/* Inner White Target Stage */}
      <Circle cx="24" cy="18" r="8.5" fill="#FFFFFF" />

      {/* Authorized Dealership Storefront Façade */}
      <Path
        d="M19 14h10l1 3H18l1-3z"
        fill="#D97706"
      />
      {/* Store Columns */}
      <Rect x="19" y="17" width="2" height="4" fill="#78350F" />
      <Rect x="23" y="17" width="2" height="4" fill="#78350F" />
      <Rect x="27" y="17" width="2" height="4" fill="#78350F" />
      {/* Base Floor */}
      <Rect x="18" y="21" width="12" height="1.5" rx="0.5" fill="#D97706" />
    </Svg>
  );
}

// 5. GENUINE GUARANTEE 3D SEAL ICON
export function GenuineGuarantee3DIcon({ size = 26, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...props}>
      <Defs>
        <LinearGradient id="guarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#C6122E" />
          <Stop offset="100%" stopColor="#880B1F" />
        </LinearGradient>
      </Defs>
      {/* Golden Outer Shield Rim */}
      <Path
        d="M16 2.5l11 4.5v8.5c0 8-5 13-11 14.5C10 28.5 5 23.5 5 15.5V7l11-4.5z"
        fill="#FBBF24"
      />
      {/* Inner Red Core Shield */}
      <Path
        d="M16 4.5l9 3.8v7.2c0 6.8-4.2 11-9 12.3-4.8-1.3-9-5.5-9-12.3V8.3l9-3.8z"
        fill="url(#guarGrad)"
      />
      {/* Crisp White Checkmark */}
      <Path
        d="M11 15.5l3.5 3.5 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 6. TICKER USP ICONS

// Live Radar Beacon
export function TickerLiveRadarIcon({ size = 18, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="12" cy="12" r="10" fill="#FEE2E2" />
      <Circle cx="12" cy="12" r="6.5" fill="#FECACA" />
      <Circle cx="12" cy="12" r="3.5" fill="#C6122E" />
    </Svg>
  );
}

// TecDoc Catalog Icon
export function TickerCatalogIcon({ size = 18, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="4" y="5" width="16" height="14" rx="2" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
      <Line x1="7" y1="9" x2="17" y2="9" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="7" y1="13" x2="14" y2="13" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// 360° Showroom 3D Icon
export function Ticker360Icon({ size = 18, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx="12" cy="12" r="9" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="3 2" />
      <Circle cx="12" cy="12" r="4.5" fill="#EDE9FE" stroke="#6D28D9" strokeWidth="1.5" />
      <Path d="M19 12l-2-2m2 2l-2 2" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// Dealer Beacon Icon
export function TickerDealerIcon({ size = 18, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 3a6 6 0 0 0-6 6c0 4.5 6 11 6 11s6-6.5 6-11a6 6 0 0 0-6-6z"
        fill="#FEF3C7"
        stroke="#D97706"
        strokeWidth="1.5"
      />
      <Circle cx="12" cy="9" r="2" fill="#B45309" />
    </Svg>
  );
}

// Tech Quotes Icon
export function TickerQuoteIcon({ size = 18, ...props }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="4" y="4" width="16" height="13" rx="3" fill="#D1FAE5" stroke="#059669" strokeWidth="1.5" />
      <Path d="M8 17l-1 3 3-1" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 9h8M8 12h5" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}
