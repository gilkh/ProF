

'use client';

import { ServiceCard } from './service-card';
import { OfferCard } from './offer-card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, ListFilter, Plus, Map, MapPin, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState, useMemo } from 'react';
import type { ServiceOrOffer, Service, Offer, ServiceCategory, ServiceInclusions, LocationGeneral, Location, EventType } from '@/lib/types';
import { getServicesAndOffers } from '@/lib/services';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { locations, eventTypes } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { updateUserSettings, getUserSettings } from '@/lib/services';



const categories: (ServiceCategory | 'All Categories')[] = ['All Categories', 'Venues', 'Catering & Sweets', 'Entertainment', 'Lighting & Sound', 'Photography & Videography', 'Decoration', 'Beauty & Grooming', 'Transportation', 'Invitations & Printables', 'Rentals & Furniture', 'Security and Crowd Control'];

const INCLUSIONS_MAP: Record<ServiceCategory, { key: keyof ServiceInclusions, label: string, icon: React.ElementType }[]> = {
    'Venues': [
        { key: 'hasParking', label: 'Parking Available', icon: X },
        { key: 'hasValet', label: 'Valet Service', icon: X },
        { key: 'hasOnSiteCatering', label: 'On-site Catering', icon: X },
        { key: 'isOutdoors', label: 'Outdoor Space', icon: X },
        { key: 'hasPool', label: 'Pool Area', icon: X },
    ],
    'Catering & Sweets': [
        { key: 'offersTastings', label: 'Offers Tastings', icon: X },
        { key: 'servesAlcohol', label: 'Serves Alcohol', icon: X },
        { key: 'hasVeganOptions', label: 'Vegan Options', icon: X },
        { key: 'hasGlutenFreeOptions', label: 'Gluten-Free Options', icon: X },
    ],
    'Entertainment': [
        { key: 'providesOwnSoundSystem', label: 'Includes Sound System', icon: X },
        { key: 'providesOwnLighting', label: 'Includes Lighting', icon: X },
    ],
    'Photography & Videography': [
        { key: 'offersDroneFootage', label: 'Drone Footage', icon: X },
        { key: 'offersSameDayEdit', label: 'Same-day Edit', icon: X },
    ],
    'Decoration': [
        { key: 'providesSetup', label: 'Includes Setup', icon: X },
        { key: 'providesCleanup', label: 'Includes Cleanup', icon: X },
    ],
    'Beauty & Grooming': [
        { key: 'travelsToClient', label: 'Travels to Client', icon: X },
        { key: 'offersTrials', label: 'Offers Trials', icon: X },
    ],
    'Lighting & Sound': [],
    'Transportation': [],
    'Invitations & Printables': [],
    'Rentals & Furniture': [],
    'Security and Crowd Control': [],
}


export function ClientDashboard({ initialCategory, initialEventType }: { initialCategory?: string; initialEventType?: string }) {
  const { userId } = useAuth();
  const [allItems, setAllItems] = useState<ServiceOrOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'All Categories'>('All Categories');
  const [selectedLocation, setSelectedLocation] = useState<LocationGeneral | 'All Locations'>('All Locations');
  const [selectedEventType, setSelectedEventType] = useState<EventType | 'All Event Types'>('All Event Types');
  const [activeFilters, setActiveFilters] = useState<Partial<ServiceInclusions>>({});
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<Array<{ label: string; type: 'region' | 'gps'; region?: Location; district?: string; city?: string; coords?: { lat: number; lon: number } }>>([]);
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false);
  const [newRegion, setNewRegion] = useState<Location | ''>('');
  const [newDistrict, setNewDistrict] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('');
  const [savedSelection, setSavedSelection] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function loadItems() {
        setIsLoading(true);
        try {
            // Only fetch approved items
            const items = await getServicesAndOffers(undefined, { includePending: false });
            setAllItems(items);
        } catch (error) {
            console.error("Failed to load services and offers", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadItems();
  }, [])

  useEffect(() => {
    async function loadSavedLocations() {
      if (!userId) return;
      try {
        const settings = await getUserSettings(userId);
        const locs = (settings as any)?.savedLocations || [];
        setSavedLocations(Array.isArray(locs) ? locs : []);
      } catch (e) {
        // ignore
      }
    }
    loadSavedLocations();
  }, [userId]);

  const DISTRICTS_BY_REGION: Record<Location, string[]> = {
    Beirut: ['Beirut'],
    'Mount Lebanon': ['Metn', 'Keserwan', 'Baabda', 'Chouf', 'Aley'],
    'North Lebanon': ['Tripoli', 'Zgharta', 'Batroun', 'Koura', 'Bcharre'],
    'South Lebanon': ['Sidon', 'Tyre', 'Jezzine'],
    Nabatieh: ['Nabatieh', 'Bint Jbeil', 'Marjayoun', 'Hasbaya'],
    Beqaa: ['Zahle', 'West Beqaa', 'Rashaya'],
    'Baalbek-Hermel': ['Baalbek', 'Hermel'],
    Akkar: ['Akkar'],
  };

  const CITIES_BY_DISTRICT: Record<string, string[]> = {
    Metn: ['Dbayeh', 'Antelias', 'Jal el Dib', 'Bikfaya'],
    Keserwan: ['Jounieh', 'Ghazir', 'Bouar'],
    Baabda: ['Hazmieh', 'Baabda', 'Hadath'],
    Chouf: ['Deir el Qamar', 'Barouk', 'Beiteddine'],
    Aley: ['Aley', 'Bhamdoun', 'Choueifat'],
    Beirut: ['Achrafieh', 'Hamra', 'Verdun', 'Ain Mreisseh', 'Downtown'],
    Tripoli: ['Tripoli'],
    Zgharta: ['Ehden', 'Zgharta'],
    Batroun: ['Batroun'],
    Koura: ['Amioun'],
    Bcharre: ['Bcharre'],
    Sidon: ['Sidon'],
    Tyre: ['Tyre'],
    Jezzine: ['Jezzine'],
    Nabatieh: ['Nabatieh'],
    'Bint Jbeil': ['Bint Jbeil'],
    Marjayoun: ['Marjayoun'],
    Hasbaya: ['Hasbaya'],
    Zahle: ['Zahle'],
    'West Beqaa': ['Joub Jannine'],
    Rashaya: ['Rashaya'],
    Baalbek: ['Baalbek'],
    Hermel: ['Hermel'],
    Akkar: ['Halba', 'Qoubaiyat'],
  };

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory as ServiceCategory | 'All Categories');
    }
    if (initialEventType) {
      setSelectedEventType(initialEventType as EventType | 'All Event Types');
    }
  }, [initialCategory, initialEventType])
  
  const filteredItems = useMemo(() => {
    return allItems
      .filter(item => 
        selectedCategory === 'All Categories' || item.category === selectedCategory
      )
      .filter(item => {
        if (selectedLocation === 'All Locations') return true;
        if (selectedLocation === ('Lebanon' as any)) return true;
        return item.location === selectedLocation;
      })
      .filter(item => {
        if (!savedSelection || !savedSelection.startsWith('saved:')) return true;
        const idx = parseInt(savedSelection.split(':')[1]);
        const loc = savedLocations[idx];
        if (loc?.type === 'gps' && loc.coords && item.coords) {
          const toRad = (v: number) => (v * Math.PI) / 180;
          const R = 6371;
          const dLat = toRad(item.coords.lat - loc.coords.lat);
          const dLon = toRad(item.coords.lon - loc.coords.lon);
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(loc.coords.lat)) * Math.cos(toRad(item.coords.lat)) * Math.sin(dLon / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c;
          return d <= 30;
        }
        return true;
      })
      .filter(item => {
        if (selectedEventType === 'All Event Types') return true;
        if (item.eventTypes === 'any') return true;
        if (Array.isArray(item.eventTypes)) {
          return item.eventTypes.includes(selectedEventType);
        }
        return false;
      })
      .filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => {
        return Object.entries(activeFilters).every(([filterKey, filterValue]) => {
          if (!filterValue) return true; // if filter is toggled off, don't filter by it
          return item.inclusions?.[filterKey as keyof ServiceInclusions] === true;
        });
      });
  }, [allItems, searchTerm, selectedCategory, selectedLocation, activeFilters]);

  const services = filteredItems.filter(item => item.type === 'service') as Service[];
  const offers = filteredItems.filter(item => item.type === 'offer') as Offer[];

  const handleCategoryChange = (value: string) => {
    // Reset filters when category changes
    setActiveFilters({});
    setSelectedCategory(value as ServiceCategory | 'All Categories');
  };
  
  const handleLocationChange = (value: string) => {
    setSelectedLocation(value as LocationGeneral | 'All Locations');
  };

  const handleEventTypeChange = (value: string) => {
    setSelectedEventType(value as EventType | 'All Event Types');
  };

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function nearestRegionForCoords(lat: number, lon: number): Location {
    const centers: Record<Location, { lat: number; lon: number }> = {
      Beirut: { lat: 33.8938, lon: 35.5018 },
      'Mount Lebanon': { lat: 33.965, lon: 35.617 },
      'North Lebanon': { lat: 34.436, lon: 35.836 },
      'South Lebanon': { lat: 33.562, lon: 35.378 },
      Nabatieh: { lat: 33.368, lon: 35.485 },
      Beqaa: { lat: 33.846, lon: 35.901 },
      'Baalbek-Hermel': { lat: 34.005, lon: 36.218 },
      Akkar: { lat: 34.592, lon: 36.079 },
    };
    let best: { region: Location; dist: number } | null = null;
    (Object.keys(centers) as Location[]).forEach((region) => {
      const d = haversine(lat, lon, centers[region].lat, centers[region].lon);
      if (!best || d < best.dist) best = { region, dist: d };
    });
    return best!.region;
  }

  async function addCurrentLocation() {
    if (!navigator.geolocation || !userId) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const region = nearestRegionForCoords(lat, lon);
        const place = await getPlaceParts(lat, lon);
        const entry = { label: 'My Location', type: 'gps' as const, coords: { lat, lon }, region, district: place.district, city: place.city };
        const next = mergeSavedLocations(savedLocations, entry);
        setSavedLocations(next);
        await updateUserSettings(userId, { savedLocations: next } as any);
        setSelectedLocation(region);
        setSavedSelection('use_current');
      },
      (err) => {
        // if denied, open dialog for manual add
        setIsAddLocationDialogOpen(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function mergeSavedLocations(list: typeof savedLocations, entry: typeof savedLocations[number]) {
    const exists = list.some((l) => l.type === entry.type && (entry.type === 'region' ? l.region === entry.region : l.label === entry.label));
    if (exists) return list;
    return [...list, entry];
  }

  async function addRegionLocation(region: Location) {
    if (!userId) return;
    const entry = { label: region, type: 'region' as const, region, city: newCity || undefined };
    const next = mergeSavedLocations(savedLocations, entry);
    setSavedLocations(next);
    await updateUserSettings(userId, { savedLocations: next } as any);
    setSelectedLocation(region);
    setNewRegion('');
    setNewCity('');
    setIsAddLocationDialogOpen(false);
    setSavedSelection(`saved:${next.length - 1}`);
  }

  function handleSavedSelection(value: string) {
    setSavedSelection(value);
    if (value.startsWith('saved:')) {
      const idx = parseInt(value.split(':')[1]);
      const loc = savedLocations[idx];
      if (loc?.region) setSelectedLocation(loc.region);
    } else if (value === 'lebanon') {
      setSelectedLocation('Lebanon' as any);
    } else if (value === 'use_current') {
      addCurrentLocation();
    } else if (value === 'add_new') {
      setIsAddLocationDialogOpen(true);
    }
  }

  async function removeSavedLocation(index: number) {
    if (!userId) return;
    const next = savedLocations.filter((_, i) => i !== index);
    setSavedLocations(next);
    await updateUserSettings(userId, { savedLocations: next } as any);
    if (savedSelection === `saved:${index}`) {
      setSavedSelection(undefined);
      setSelectedLocation('All Locations');
    }
  }

  const handleApplyFilters = (newFilters: Partial<ServiceInclusions>) => {
    setActiveFilters(newFilters);
    setIsFilterDialogOpen(false);
  }
  
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;


  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
    </div>
  );

  function AdvancedFilterDialog() {
    const [localFilters, setLocalFilters] = useState(activeFilters);

    const inclusionsForCategory = selectedCategory !== 'All Categories' ? INCLUSIONS_MAP[selectedCategory] : [];

    const handleToggle = (key: keyof ServiceInclusions, checked: boolean) => {
        setLocalFilters(prev => ({...prev, [key]: checked}))
    }

    return (
        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-12 text-base shrink-0">
                    <ListFilter className="mr-2 h-5 w-5" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge className="ml-2 bg-primary text-primary-foreground">{activeFilterCount}</Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Advanced Filters</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {selectedCategory === 'All Categories' ? (
                        <p className="text-muted-foreground text-center">Please select a category first to see available filters.</p>
                    ) : inclusionsForCategory.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                            {inclusionsForCategory.map(inclusion => (
                                <div key={inclusion.key} className="flex items-center justify-between">
                                    <Label htmlFor={inclusion.key} className="flex items-center gap-2 text-base">
                                        <inclusion.icon className="h-5 w-5 text-muted-foreground" />
                                        {inclusion.label}
                                    </Label>
                                    <Switch
                                        id={inclusion.key}
                                        checked={!!localFilters[inclusion.key as keyof ServiceInclusions]}
                                        onCheckedChange={(checked) => handleToggle(inclusion.key as keyof ServiceInclusions, checked)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center">No specific filters available for this category.</p>
                    )}
                </div>
                <DialogFooter>
                     <Button variant="ghost" onClick={() => { setLocalFilters({}); setActiveFilters({})}}>Clear All</Button>
                     <Button onClick={() => handleApplyFilters(localFilters)}>Apply Filters</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
  }

  function SavedLocationsSelect() {
    return (
      <div className="w-full sm:w-[300px]">
        <Select value={savedSelection} onValueChange={handleSavedSelection}>
          <SelectTrigger className="glass-control h-12 text-base">
            <SelectValue placeholder="Select a location" className="glass-text" />
          </SelectTrigger>
          <SelectContent className="glass-panel-solid">
            <SelectItem value="lebanon">
              <span className="inline-flex items-center gap-2"><Map className="h-4 w-4" /> Lebanon</span>
            </SelectItem>
            {savedLocations.map((loc, idx) => (
              <SelectItem key={idx} value={`saved:${idx}`}>
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">
                    {[loc.type !== 'gps' ? loc.label : undefined, loc.region, loc.district, loc.city].filter(Boolean).join(' · ')}
                  </span>
                  <button
                    type="button"
                    className="ml-auto inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted"
                    onClick={(e) => { e.stopPropagation(); removeSavedLocation(idx); }}
                    aria-label="Remove saved location"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="use_current">{savedSelection === 'use_current' ? 'Using current location' : 'Use my current location'}</SelectItem>
            <SelectItem value="add_new">Add new location…</SelectItem>
          </SelectContent>
        </Select>
        {savedSelection && (() => {
          let loc: typeof savedLocations[number] | undefined;
          if (savedSelection.startsWith('saved:')) {
            const idx = parseInt(savedSelection.split(':')[1]);
            loc = savedLocations[idx];
          } else if (savedSelection === 'use_current') {
            for (let i = savedLocations.length - 1; i >= 0; i--) {
              if (savedLocations[i]?.type === 'gps') { loc = savedLocations[i]; break; }
            }
          }
          if (!loc) return null;
          return (
            <div className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>
                {
                  [
                    savedSelection === 'use_current' ? 'Using current location' : (loc.type !== 'gps' ? loc.label : undefined),
                    loc.region,
                    loc.district,
                    loc.city
                  ].filter(Boolean).join(' · ')
                }
              </span>
            </div>
          );
        })()}
        <Dialog open={isAddLocationDialogOpen} onOpenChange={setIsAddLocationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Choose a region</Label>
              <Select value={newRegion} onValueChange={(v) => setNewRegion(v as Location)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Choose a district (optional)</Label>
              <Select value={newDistrict} onValueChange={(v) => setNewDistrict(v)} disabled={!newRegion || DISTRICTS_BY_REGION[newRegion as Location].length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a district" />
                </SelectTrigger>
                <SelectContent>
                  {(newRegion ? DISTRICTS_BY_REGION[newRegion as Location] : []).map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Choose a city (optional)</Label>
              <Select value={newCity} onValueChange={(v) => setNewCity(v)} disabled={!newDistrict || (CITIES_BY_DISTRICT[newDistrict] || []).length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {(newDistrict ? CITIES_BY_DISTRICT[newDistrict] : []).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddLocationDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => newRegion && addRegionLocation(newRegion as Location)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }


  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SavedLocationsSelect />
      </div>
      <Card className="glass-panel overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Explore Event Services</CardTitle>
            <CardDescription>Find the perfect professional for your event.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 items-center">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="glass-control w-full h-12 text-base">
                <SelectValue placeholder="Category" className="glass-text" />
              </SelectTrigger>
              <SelectContent className="glass-panel-solid">
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEventType} onValueChange={handleEventTypeChange}>
              <SelectTrigger className="glass-control w-full h-12 text-base">
                <SelectValue placeholder="Event type" className="glass-text" />
              </SelectTrigger>
              <SelectContent className="glass-panel-solid">
                <SelectItem value="All Event Types">All Event Types</SelectItem>
                {eventTypes.map((eventType) => (
                  <SelectItem key={eventType} value={eventType}>{eventType}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
          <TabsTrigger value="offers">Offers ({offers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
            {isLoading ? renderSkeletons() : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) =>
                    item.type === 'service' ? (
                        <ServiceCard key={item.id} service={item} role="client" />
                    ) : (
                        <OfferCard key={item.id} offer={item} role="client" />
                    )
                    )}
                </div>
            )}
        </TabsContent>
         <TabsContent value="services">
             {isLoading ? renderSkeletons() : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {services.map((service) => (
                        <ServiceCard key={service.id} service={service} role="client" />
                    ))}
                </div>
            )}
        </TabsContent>
        <TabsContent value="offers">
            {isLoading ? renderSkeletons() : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {offers.map((offer) => (
                        <OfferCard key={offer.id} offer={offer} role="client" />
                    ))}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
  async function getPlaceParts(lat: number, lon: number): Promise<{ state?: string; district?: string; city?: string }> {
    try {
      const res = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      return data || {};
    } catch {
      return {};
    }
  }
  const LOCATION_DETAILS: Record<Location | 'Lebanon', string[]> = {
    Lebanon: [],
    Beirut: ['Achrafieh', 'Hamra', 'Verdun', 'Downtown', 'Ain Mreisseh'],
    'Mount Lebanon': ['Metn', 'Keserwan', 'Baabda', 'Chouf', 'Aley'],
    'North Lebanon': ['Tripoli', 'Zgharta', 'Batroun', 'Koura', 'Bcharre'],
    'South Lebanon': ['Sidon', 'Tyre', 'Jezzine'],
    Nabatieh: ['Nabatieh', 'Bint Jbeil', 'Marjayoun', 'Hasbaya'],
    Beqaa: ['Zahle', 'West Beqaa', 'Rashaya'],
    'Baalbek-Hermel': ['Baalbek', 'Hermel'],
    Akkar: ['Halba', 'Qoubaiyat', 'Tripoli North'],
  };
