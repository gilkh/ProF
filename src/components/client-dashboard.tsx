

'use client';

import { ServiceCard } from './service-card';
import { OfferCard } from './offer-card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, ListFilter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState, useMemo } from 'react';
import type { ServiceOrOffer, Service, Offer, ServiceCategory, ServiceInclusions, Location } from '@/lib/types';
import { getServicesAndOffers } from '@/lib/services';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { locations } from '@/lib/types';


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


export function ClientDashboard() {
  const [allItems, setAllItems] = useState<ServiceOrOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'All Categories'>('All Categories');
  const [selectedLocation, setSelectedLocation] = useState<Location | 'All Locations'>('All Locations');
  const [activeFilters, setActiveFilters] = useState<Partial<ServiceInclusions>>({});
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

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
  
  const filteredItems = useMemo(() => {
    return allItems
      .filter(item => 
        selectedCategory === 'All Categories' || item.category === selectedCategory
      )
      .filter(item =>
        selectedLocation === 'All Locations' || item.location === selectedLocation
      )
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
    setSelectedLocation(value as Location | 'All Locations');
  };

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


  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-lg border-primary/20">
        <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Explore Event Services</CardTitle>
            <CardDescription>Find the perfect professional for your event.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for 'Catering', 'Photography', etc." 
                className="pl-12 h-12 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-[220px] h-12 text-base">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-full sm:w-[220px] h-12 text-base">
                    <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All Locations">All Locations</SelectItem>
                    {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <AdvancedFilterDialog />
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
