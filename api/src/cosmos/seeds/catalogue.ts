import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { getCosmosClient, DB_NAME } from '../client.js';
import { mergeSeedDoc } from '../seed-merge.js';
import type { ServiceCategory } from '../../schemas/service-category.js';
import type { Service } from '../../schemas/service.js';

const NOW = new Date().toISOString();
const SYSTEM = 'seed-script';

export const CATEGORIES: ServiceCategory[] = [
  { id: 'ac-repair', name: 'AC Repair', nameHi: 'एसी मरम्मत', heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fac-repair.jpg', sortOrder: 1, isActive: true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
  { id: 'water-pump', name: 'Water Pump / Borewell', nameHi: 'वाटर पंप / बोरवेल', heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fwater-pump.jpg', sortOrder: 2, isActive: true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
  { id: 'plumbing', name: 'Plumbing', nameHi: 'प्लंबिंग', heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fplumbing.jpg', sortOrder: 3, isActive: true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
  { id: 'electrical', name: 'Electrical', nameHi: 'इलेक्ट्रिकल', heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Felectrical.jpg', sortOrder: 4, isActive: true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
  { id: 'water-purifier', name: 'RO / Water Purifier', nameHi: 'आरओ / वाटर प्यूरीफायर', heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/categories%2Fwater-purifier.jpg', sortOrder: 5, isActive: true, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
  // 2026-09-12: isActive:false — tests/scripts/seed-technicians.test.ts enforces a
  // >=2-online-technician launch gate per active category/service, and no technician
  // can hold an appliance-repair skill until technician-app ships ServiceCatalogue.kt
  // self-select.
  // 2026-09-12 (E22-S02): heroImageUrl corrected from the dead `homeservices-mvp`
  // bucket (never existed — see docs/superpowers/plans/2026-09-12-e22-s02-catalogue-categories.md)
  // to the real `homeservices-prod-001.firebasestorage.app` bucket, with the
  // required `?alt=media` suffix Firebase Storage needs to serve raw image bytes
  // instead of JSON object metadata.
  { id: 'appliance-repair', name: 'Appliance Repair', nameHi: 'उपकरण मरम्मत', heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/categories%2Fappliance-repair.jpg?alt=media', sortOrder: 6, isActive: false, updatedBy: SYSTEM, createdAt: NOW, updatedAt: NOW },
];

export const SERVICES: Service[] = [
  // AC Repair
  {
    id: 'ac-deep-clean',
    categoryId: 'ac-repair',
    name: 'AC Deep Clean',
    nameHi: 'एसी डीप क्लीन',
    shortDescription: 'Chemical wash, gas check, filter clean — everything included.',
    shortDescriptionHi: 'केमिकल वॉश, गैस चेक, फिल्टर सफाई — सब कुछ शामिल।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fac-deep-clean.jpg',
    basePrice: 99900,
    commissionBps: 2250,
    durationMinutes: 90,
    includes: ['Chemical wash of coils and filter', 'Gas pressure check', 'Full function test run', 'Drain pipe cleaning'],
    faq: [{ question: 'How often should I get this done?', answer: 'Every 3 months for optimal efficiency.' }, { question: 'Is gas refill included?', answer: 'No — gas refill is an add-on if pressure is low.' }],
    addOns: [{ id: 'gas-refill', name: 'Gas Refill', price: 149900, triggerCondition: 'if gas pressure is below recommended threshold' }],
    photoStages: [{ id: 'before-unit', label: 'AC unit before service', required: true }, { id: 'filter-condition', label: 'Filter condition', required: true }, { id: 'after-unit', label: 'AC unit after service', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'ac-deep-clean-window',
    categoryId: 'ac-repair',
    name: 'AC Deep Clean (Window)',
    nameHi: 'विंडो एसी डीप क्लीन',
    shortDescription: 'Chemical wash and full service for window air conditioners.',
    shortDescriptionHi: 'विंडो एसी की केमिकल वॉश और पूरी सर्विस।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fac-deep-clean-window.jpg',
    basePrice: 69900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Chemical wash of coils and filter', 'Drain cleaning', 'Cooling performance check'],
    faq: [{ question: 'Is this different from split AC service?', answer: 'Yes — window units are serviced in place and take less time.' }],
    addOns: [],
    photoStages: [
      { id: 'before-unit', label: 'Window AC before service', required: true },
      { id: 'after-unit', label: 'Window AC after service', required: true },
    ],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'ac-gas-refill',
    categoryId: 'ac-repair',
    name: 'AC Gas Refill',
    nameHi: 'एसी गैस रीफिल',
    shortDescription: 'Full gas recharge when cooling performance drops.',
    shortDescriptionHi: 'जब कूलिंग कमजोर हो, तब फुल गैस रीचार्ज।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fac-gas-refill.jpg',
    basePrice: 149900,
    commissionBps: 2250,
    durationMinutes: 45,
    includes: ['Gas pressure check', 'Top-up to manufacturer spec', 'Leak test post-refill'],
    faq: [{ question: 'How do I know I need a refill?', answer: 'AC cools poorly, takes long to reach target temp, or ice forms on the unit.' }],
    addOns: [],
    photoStages: [{ id: 'pressure-gauge', label: 'Pressure gauge reading before', required: true }, { id: 'after-refill', label: 'Gauge after refill', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'ac-installation',
    categoryId: 'ac-repair',
    name: 'AC Installation',
    nameHi: 'एसी इंस्टॉलेशन',
    shortDescription: 'Professional split AC installation with copper piping.',
    shortDescriptionHi: 'तांबे की पाइप के साथ प्रोफेशनल स्प्लिट एसी इंस्टॉलेशन।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fac-installation.jpg',
    basePrice: 149900,
    commissionBps: 2000,
    durationMinutes: 180,
    includes: ['Indoor + outdoor unit mounting', 'Copper pipe (up to 3 m)', 'Electrical connection', 'Test run + cooling verification'],
    faq: [{ question: 'Is copper pipe beyond 3m extra?', answer: 'Yes — extra copper pipe beyond 3 m is charged per metre as an add-on; the rate is shown before you confirm.' }],
    addOns: [{ id: 'extra-pipe', name: 'Extra copper pipe', price: 25000, triggerCondition: 'per metre beyond 3 m' }],
    photoStages: [{ id: 'before-wall', label: 'Wall before drilling', required: true }, { id: 'after-install', label: 'Completed installation', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Water Pump / Borewell
  {
    id: 'water-pump-repair',
    categoryId: 'water-pump',
    name: 'Water Pump Repair',
    nameHi: 'वाटर पंप मरम्मत',
    shortDescription: 'Surface + submersible pump troubleshooting and repair — everything included.',
    shortDescriptionHi: 'सरफेस + सबमर्सिबल पंप की जाँच और मरम्मत — सब कुछ शामिल।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fwater-pump-repair.jpg',
    basePrice: 49900,
    commissionBps: 2250,
    durationMinutes: 90,
    includes: ['On-site diagnosis', 'Capacitor / starter / impeller replacement (parts extra)', 'Test run + flow verification'],
    faq: [{ question: 'Are spare parts included?', answer: 'No — parts are billed separately at MRP.' }],
    addOns: [{ id: 'pump-rewinding', name: 'Motor rewinding', price: 250000, triggerCondition: 'if motor windings are burnt' }],
    photoStages: [{ id: 'pump-before', label: 'Pump unit before service', required: true }, { id: 'pump-after', label: 'Pump unit after service', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'borewell-servicing',
    categoryId: 'water-pump',
    name: 'Borewell Servicing',
    nameHi: 'बोरवेल सर्विसिंग',
    shortDescription: 'Borewell flushing, pump retrieval, and servicing.',
    shortDescriptionHi: 'बोरवेल पंप सर्विसिंग और रिप्लेसमेंट।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fborewell-servicing.jpg',
    basePrice: 99900,
    commissionBps: 2250,
    durationMinutes: 240,
    includes: ['Pump retrieval', 'Borewell flushing', 'Pump cleaning', 'Re-installation', 'Flow + pressure test'],
    faq: [{ question: 'How deep does this cover?', answer: 'Up to 200 ft. Below that, additional charges apply.' }],
    addOns: [{ id: 'extra-depth', name: 'Extra depth beyond 200 ft', price: 500, triggerCondition: 'per foot beyond 200 ft' }],
    photoStages: [{ id: 'borewell-before', label: 'Borewell access before', required: true }, { id: 'pump-pulled', label: 'Pump after retrieval', required: true }, { id: 'borewell-after', label: 'Borewell sealed after service', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Plumbing
  {
    id: 'plumbing-leak-fix',
    categoryId: 'plumbing',
    name: 'Leak Fix',
    nameHi: 'लीक मरम्मत',
    shortDescription: 'Stop leaking pipes, taps, or joints — fast.',
    shortDescriptionHi: 'लीक का सटीक पता लगाकर रिपेयर।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fplumbing-leak-fix.jpg',
    basePrice: 39900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Leak location + diagnosis', 'Pipe joint sealing', 'Test after repair'],
    faq: [{ question: 'Are spare parts included?', answer: 'Basic sealant included. Replacement pipe fittings charged at cost.' }],
    addOns: [{ id: 'replacement-fitting', name: 'Replacement fitting', price: 15000, triggerCondition: 'if existing fitting is damaged beyond repair' }],
    photoStages: [{ id: 'leak-location', label: 'Leak point before fix', required: true }, { id: 'after-fix', label: 'After repair', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'plumbing-tap-install',
    categoryId: 'plumbing',
    name: 'Tap / Faucet Installation',
    nameHi: 'नल / फॉसेट इंस्टॉलेशन',
    shortDescription: 'Install or replace any tap or faucet.',
    shortDescriptionHi: 'ब्रांडेड नल / फॉसेट का इंस्टॉलेशन।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fplumbing-tap-install.jpg',
    basePrice: 59900,
    commissionBps: 2250,
    durationMinutes: 45,
    includes: ['Old tap removal', 'New tap fitting + sealing', 'Flow test'],
    faq: [],
    addOns: [],
    photoStages: [{ id: 'before-tap', label: 'Tap before install', required: true }, { id: 'after-tap', label: 'Tap installed', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'plumbing-pipe-repair',
    categoryId: 'plumbing',
    name: 'Pipe Repair',
    nameHi: 'पाइप मरम्मत',
    shortDescription: 'Cracked or burst pipe repair — wall break-open if needed.',
    shortDescriptionHi: 'टूटी या लीक पाइप की मरम्मत।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fplumbing-pipe-repair.jpg',
    basePrice: 79900,
    commissionBps: 2250,
    durationMinutes: 90,
    includes: ['Pipe inspection + damage assessment', 'Section replacement', 'Leak test'],
    faq: [{ question: 'Is wall repair included?', answer: 'No — wall plastering is a separate service.' }],
    addOns: [{ id: 'wall-plaster', name: 'Wall patching (per sq ft)', price: 20000, triggerCondition: 'if wall break-open is required' }],
    photoStages: [{ id: 'before-pipe', label: 'Damaged pipe', required: true }, { id: 'after-pipe', label: 'Repaired section', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Electrical
  {
    id: 'electrical-fan-install',
    categoryId: 'electrical',
    name: 'Ceiling Fan Installation',
    nameHi: 'सीलिंग फैन इंस्टॉलेशन',
    shortDescription: 'Safe, secure ceiling fan installation by a licensed electrician.',
    shortDescriptionHi: 'नया सीलिंग फैन इंस्टॉल या रिप्लेसमेंट।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Felectrical-fan-install.jpg',
    basePrice: 24900,
    commissionBps: 2250,
    durationMinutes: 45,
    includes: ['Fan mounting on hook / canopy', 'Wiring to existing point', 'Test run'],
    faq: [{ question: 'Is new wiring included?', answer: 'No — if a new point is needed, that is a separate wiring charge.' }],
    addOns: [],
    photoStages: [{ id: 'before-ceiling', label: 'Ceiling point before', required: false }, { id: 'fan-installed', label: 'Fan installed', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'electrical-switchboard-fix',
    categoryId: 'electrical',
    name: 'Switchboard Repair',
    nameHi: 'स्विचबोर्ड मरम्मत',
    shortDescription: 'Fix faulty switches, sockets, or MCBs.',
    shortDescriptionHi: 'स्विचबोर्ड और सॉकेट की मरम्मत।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Felectrical-switchboard-fix.jpg',
    basePrice: 29900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Fault diagnosis', 'Switch / socket replacement (up to 3 points)', 'Earthing check'],
    faq: [],
    addOns: [{ id: 'extra-point', name: 'Extra point repair', price: 10000, triggerCondition: 'per point beyond 3' }],
    photoStages: [{ id: 'faulty-board', label: 'Faulty switchboard', required: true }, { id: 'repaired-board', label: 'After repair', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'electrical-wiring',
    categoryId: 'electrical',
    name: 'New Point Wiring',
    nameHi: 'नई पॉइंट वायरिंग',
    shortDescription: 'Add a new electrical point — socket, switch, or light.',
    shortDescriptionHi: 'नए लाइट / पंखा पॉइंट के लिए वायरिंग।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Felectrical-wiring.jpg',
    basePrice: 99900,
    commissionBps: 2250,
    durationMinutes: 120,
    includes: ['Conduit + wiring (up to 5 m)', 'New socket / switch fitting', 'MCB protection check'],
    faq: [{ question: 'Is concealed wiring possible?', answer: 'Yes — wall chasing + plastering is an add-on.' }],
    addOns: [{ id: 'wall-chasing', name: 'Wall chasing + plaster', price: 30000, triggerCondition: 'per metre of concealed wiring' }],
    photoStages: [{ id: 'before-wall', label: 'Wall before wiring', required: false }, { id: 'completed-point', label: 'New point completed', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // RO / Water Purifier
  {
    id: 'ro-installation',
    categoryId: 'water-purifier',
    name: 'RO Installation',
    nameHi: 'आरओ इंस्टॉलेशन',
    shortDescription: 'New RO water purifier installation with TDS check.',
    shortDescriptionHi: 'आरओ / वाटर प्यूरीफायर का सेटअप।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fro-installation.jpg',
    basePrice: 39900,
    commissionBps: 2250,
    durationMinutes: 90,
    includes: ['Wall mounting', 'Inlet + outlet plumbing', 'TDS measurement before/after', 'Test run + flow verification'],
    faq: [{ question: 'Is the RO unit included?', answer: 'No — bring your own. We install whatever brand you provide.' }],
    addOns: [{ id: 'extra-piping', name: 'Extra inlet/outlet piping', price: 25000, triggerCondition: 'per metre beyond 2 m' }],
    photoStages: [{ id: 'ro-before-wall', label: 'Wall before installation', required: true }, { id: 'ro-after-install', label: 'Completed installation with TDS reading', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'ro-service-amc',
    categoryId: 'water-purifier',
    name: 'RO Service / Filter Change',
    nameHi: 'आरओ सर्विस / फिल्टर बदलाव',
    shortDescription: 'Quarterly RO service — filter change, sanitisation, TDS check.',
    shortDescriptionHi: 'फिल्टर बदलाव और मेंबरेन रिप्लेसमेंट।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-mvp/o/services%2Fro-service-amc.jpg',
    basePrice: 39900,
    commissionBps: 2250,
    durationMinutes: 45,
    includes: ['Sediment filter change', 'Carbon filter change', 'RO membrane cleaning (if not due for replacement)', 'Sanitisation', 'TDS measurement before/after'],
    faq: [{ question: 'How often should I service?', answer: 'Every 3 months for optimal performance.' }, { question: 'Is membrane replacement included?', answer: 'No — only cleaning. Replacement is a separate add-on every 24 months.' }],
    addOns: [{ id: 'membrane-replacement', name: 'RO membrane replacement', price: 150000, triggerCondition: 'if TDS reduction efficiency drops below 85%' }],
    photoStages: [{ id: 'ro-before-service', label: 'RO unit before service', required: true }, { id: 'old-filters', label: 'Old filters removed', required: true }, { id: 'ro-after-service', label: 'Unit after service with new TDS reading', required: true }],
    isActive: true,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  // Appliance Repair — added 2026-09-12, prices are placeholder defaults pending
  // owner review (editable anytime via admin-web Catalogue). heroImageUrl fields
  // reuse existing live services%2F images as placeholders — no dedicated photos
  // shot yet. isActive:false — see the category comment above.
  {
    id: 'appliance-fridge-repair',
    categoryId: 'appliance-repair',
    name: 'Fridge Repair',
    nameHi: 'फ्रिज मरम्मत',
    shortDescription: 'Diagnosis and repair for cooling, compressor, or noise issues.',
    shortDescriptionHi: 'कूलिंग, कंप्रेसर या आवाज़ की समस्या की जांच और मरम्मत।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-fridge-repair.jpg?alt=media',
    basePrice: 49900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Cooling + compressor diagnosis', 'Basic repair', 'Test run after repair'],
    faq: [{ question: 'Is gas top-up included?', answer: 'No — gas top-up is a separate add-on if the compressor tests low on pressure.' }],
    addOns: [{ id: 'gas-topup', name: 'Refrigerant gas top-up', price: 60000, triggerCondition: 'if compressor pressure test is below spec' }],
    photoStages: [{ id: 'fridge-before', label: 'Fridge before repair', required: true }, { id: 'fridge-after', label: 'After repair', required: true }],
    isActive: false,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'appliance-cooler-service',
    categoryId: 'appliance-repair',
    name: 'Cooler Service',
    nameHi: 'कूलर सर्विस',
    shortDescription: 'Pump, motor, and cooling pad service for air coolers.',
    shortDescriptionHi: 'एयर कूलर के पंप, मोटर और कूलिंग पैड की सर्विस।',
    // E22-S02: no free-license photo of an Indian desert/room air cooler exists on
    // Pexels or Unsplash's non-paid tiers (searched both) — reuses the category's
    // generic appliance-service photo rather than an unrelated one. Real cooler
    // photography is a candidate for the Task 7 backlog item.
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-cooler-service.jpg?alt=media',
    basePrice: 49900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Pump + motor check', 'Cooling pad cleaning', 'Test run'],
    faq: [],
    addOns: [{ id: 'pad-replacement', name: 'Cooling pad replacement', price: 40000, triggerCondition: 'if pads are worn beyond cleaning' }],
    photoStages: [{ id: 'cooler-before', label: 'Cooler before service', required: true }, { id: 'cooler-after', label: 'After service', required: true }],
    isActive: false,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'appliance-washing-machine-repair',
    categoryId: 'appliance-repair',
    name: 'Washing Machine Repair',
    nameHi: 'वाशिंग मशीन मरम्मत',
    shortDescription: 'Diagnosis and repair for motor, drum, or drainage issues.',
    shortDescriptionHi: 'मोटर, ड्रम या ड्रेनेज की समस्या की जांच और मरम्मत।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-washing-machine-repair.jpg?alt=media',
    basePrice: 49900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Motor + drum diagnosis', 'Basic repair', 'Test cycle run'],
    faq: [],
    addOns: [{ id: 'spare-part', name: 'Replacement part (belt/bearing/etc.)', price: 50000, triggerCondition: 'if a worn part needs replacing' }],
    photoStages: [{ id: 'wm-before', label: 'Machine before repair', required: true }, { id: 'wm-after', label: 'After repair', required: true }],
    isActive: false,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'electrical-camera-installation',
    categoryId: 'electrical',
    name: 'CCTV Camera Installation',
    nameHi: 'सीसीटीवी कैमरा इंस्टॉलेशन',
    shortDescription: 'Mount, wire, and set up a CCTV camera with mobile app access.',
    shortDescriptionHi: 'सीसीटीवी कैमरा लगाना, वायरिंग और मोबाइल ऐप सेटअप।',
    // E22-S02: PR #346 pointed this at the borrowed services%2Felectrical-switchboard-fix.jpg
    // path. Corrected to its own object.
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Felectrical-camera-installation.jpg?alt=media',
    basePrice: 79900,
    commissionBps: 2250,
    durationMinutes: 90,
    includes: ['Camera mounting', 'Wiring to power + DVR/NVR', 'Mobile app setup + live test'],
    faq: [{ question: 'Is the camera itself included?', answer: 'No — bring your own. We install whatever camera/DVR you provide.' }],
    addOns: [{ id: 'extra-camera', name: 'Additional camera on same visit', price: 59900, triggerCondition: 'per extra camera installed in the same visit' }],
    photoStages: [{ id: 'camera-before', label: 'Mounting point before installation', required: true }, { id: 'camera-after', label: 'Installed + live feed test', required: true }],
    isActive: false,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'appliance-inverter-service',
    categoryId: 'appliance-repair',
    name: 'Inverter Install & Service',
    nameHi: 'इन्वर्टर इंस्टॉलेशन और सर्विस',
    shortDescription: 'Installation, battery check, and servicing for home inverters and UPS units.',
    shortDescriptionHi: 'घरेलू इन्वर्टर और यूपीएस की इंस्टॉलेशन, बैटरी जांच और सर्विसिंग।',
    heroImageUrl: 'https://firebasestorage.googleapis.com/v0/b/homeservices-prod-001.firebasestorage.app/o/services%2Fappliance-inverter-service.jpg?alt=media',
    basePrice: 49900,
    commissionBps: 2250,
    durationMinutes: 60,
    includes: ['Inverter + battery inspection', 'Wiring and connection check', 'Test run under load'],
    faq: [{ question: 'Is a new battery included?', answer: 'No — a replacement battery is a separate add-on if the existing one fails the load test.' }],
    addOns: [{ id: 'battery-replacement', name: 'Battery replacement', price: 350000, triggerCondition: 'if the existing battery fails the load test' }],
    photoStages: [{ id: 'inverter-before', label: 'Inverter/battery before service', required: true }, { id: 'inverter-after', label: 'After service', required: true }],
    isActive: false,
    updatedBy: SYSTEM,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

// Categories + services dropped during the 2026-05-01 Ayodhya pivot. The seed
// must deactivate (not just leave alone) any of these that already exist in
// Cosmos from prior Bengaluru-era seeding, otherwise the public catalogue
// continues to surface them as bookable.
export const DROPPED_CATEGORY_IDS = ['deep-cleaning', 'pest-control'] as const;
export const DROPPED_SERVICES: ReadonlyArray<{ id: string; categoryId: string }> = [
  { id: 'deep-clean-1bhk', categoryId: 'deep-cleaning' },
  { id: 'deep-clean-2bhk', categoryId: 'deep-cleaning' },
  { id: 'deep-clean-3bhk', categoryId: 'deep-cleaning' },
  { id: 'pest-cockroach', categoryId: 'pest-control' },
  { id: 'pest-bed-bugs', categoryId: 'pest-control' },
  { id: 'pest-full-home', categoryId: 'pest-control' },
];

async function seed(): Promise<void> {
  const db = getCosmosClient().database(DB_NAME);

  // Ensure containers exist (idempotent)
  await db.containers.createIfNotExists({ id: 'service_categories', partitionKey: '/id', defaultTtl: -1 });
  await db.containers.createIfNotExists({ id: 'services', partitionKey: '/categoryId' });

  const catContainer = db.container('service_categories');
  const svcContainer = db.container('services');

  console.log('Seeding service_categories...');
  for (const cat of CATEGORIES) {
    // E22-S01: the seed owns catalogue CONTENT (names, copy, hero image, sort
    // order). It does not own activation — the owner toggles that from the
    // dashboard, and a blind upsert of `isActive` would silently switch a
    // category the owner had turned off back on at every deploy.
    const existing = await catContainer.item(cat.id, cat.id).read<ServiceCategory>()
      .then((r) => r.resource)
      .catch((err: unknown) => {
        if ((err as { code?: number }).code === 404) return undefined;
        throw err;
      });

    await catContainer.items.upsert(mergeSeedDoc(cat, existing));
    console.log(`  upserted: ${cat.id}${existing ? '' : ' (new)'}`);
  }

  console.log('Deactivating dropped categories (if present)...');
  for (const droppedId of DROPPED_CATEGORY_IDS) {
    try {
      const { resource } = await catContainer.item(droppedId, droppedId).read<ServiceCategory>();
      if (resource && resource.isActive !== false) {
        await catContainer.items.upsert({ ...resource, isActive: false, updatedBy: SYSTEM, updatedAt: NOW });
        console.log(`  deactivated category: ${droppedId}`);
      }
    } catch (err) {
      // 404 on a fresh DB is expected; surface anything else
      if ((err as { code?: number }).code !== 404) throw err;
    }
  }

  console.log('Seeding services...');
  for (const svc of SERVICES) {
    // E22-S01: the seed owns catalogue CONTENT (names, copy, price, includes,
    // photoStages). It does not own activation — the owner toggles that from the
    // dashboard, and a blind upsert of `isActive` would silently switch a service
    // the owner had turned off back on at every deploy.
    const existing = await svcContainer.item(svc.id, svc.categoryId).read<Service>()
      .then((r) => r.resource)
      .catch((err: unknown) => {
        if ((err as { code?: number }).code === 404) return undefined;
        throw err;
      });

    await svcContainer.items.upsert(mergeSeedDoc(svc, existing));
    console.log(`  upserted: ${svc.id}${existing ? '' : ' (new)'}`);
  }

  console.log('Deactivating dropped services (if present)...');
  for (const dropped of DROPPED_SERVICES) {
    try {
      const { resource } = await svcContainer.item(dropped.id, dropped.categoryId).read<Service>();
      if (resource && resource.isActive !== false) {
        await svcContainer.items.upsert({ ...resource, isActive: false, updatedBy: SYSTEM, updatedAt: NOW });
        console.log(`  deactivated service: ${dropped.id}`);
      }
    } catch (err) {
      if ((err as { code?: number }).code !== 404) throw err;
    }
  }

  console.log(`Done. ${CATEGORIES.length} categories, ${SERVICES.length} services. Dropped categories/services deactivated where present.`);
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  seed().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
