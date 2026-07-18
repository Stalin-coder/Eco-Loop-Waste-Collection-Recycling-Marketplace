import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Phone, MapPin, Clock, Package, User, Loader2, X, LocateFixed, ZoomIn, ZoomOut } from 'lucide-react';
import { WASTE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const pickupIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 56" width="40" height="56"><path d="M20 0C9 0 0 9 0 20c0 15 20 36 20 36s20-21 20-36C40 9 31 0 20 0z" fill="#16a34a" stroke="white" stroke-width="2"/><circle cx="20" cy="18" r="8" fill="white"/><text x="20" y="22" text-anchor="middle" font-size="14" fill="#16a34a">📦</text></svg>`),
  iconSize: [40, 56],
  iconAnchor: [20, 56],
  popupAnchor: [0, -56],
});

const collectorIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44"><circle cx="22" cy="22" r="20" fill="#2563eb" stroke="white" stroke-width="3"/><text x="22" y="28" text-anchor="middle" font-size="20" fill="white">🚛</text></svg>`),
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});


function MapController({ pickupCoords, collectorCoords }: { pickupCoords: [number, number] | null; collectorCoords: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (pickupCoords && collectorCoords) {
      const bounds = L.latLngBounds([pickupCoords, collectorCoords]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (pickupCoords) {
      map.flyTo(pickupCoords, 15, { duration: 1.5 });
    }
  }, [pickupCoords, collectorCoords, map]);

  return null;
}

async function fetchOSRMRoute(from: [number, number], to: [number, number]): Promise<{ coords: [number, number][]; distance: number; duration: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.[0]) {
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
      return { coords, distance: route.distance / 1000, duration: route.duration / 60 };
    }
    return null;
  } catch {
    return null;
  }
}

function getDistanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLon = (b[1] - a[1]) * Math.PI / 180;
  const lat1 = a[0] * Math.PI / 180;
  const lat2 = b[0] * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

interface PickupNavigationMapProps {
  job: any;
  householdProfile?: { name: string; phone: string | null; area: string | null } | null;
  onClose: () => void;
}

export default function PickupNavigationMap({ job, householdProfile, onClose }: PickupNavigationMapProps) {
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [collectorCoords, setCollectorCoords] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeEta, setRouteEta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Geocode pickup address
  useEffect(() => {
    const geocodeAddress = async () => {
      const address = `${job.pickup_address}, ${job.area || ''}, ${job.city || ''}, India`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setPickupCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          const cityRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent((job.city || 'Hyderabad') + ', India')}&limit=1`
          );
          const cityData = await cityRes.json();
          if (cityData && cityData.length > 0) {
            setPickupCoords([parseFloat(cityData[0].lat), parseFloat(cityData[0].lon)]);
          } else {
            setGeoError(true);
          }
        }
      } catch {
        setGeoError(true);
      }
      setLoading(false);
    };
    geocodeAddress();
  }, [job]);

  // Track collector's live location
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setCollectorCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch OSRM route when both coords available
  useEffect(() => {
    if (!pickupCoords || !collectorCoords) return;
    let cancelled = false;
    fetchOSRMRoute(collectorCoords, pickupCoords).then((result) => {
      if (cancelled) return;
      if (result) {
        setRouteCoords(result.coords);
        setRouteDistance(result.distance);
        setRouteEta(Math.ceil(result.duration));
      } else {
        // Fallback to straight line
        setRouteCoords([collectorCoords, pickupCoords]);
        const d = getDistanceKm(collectorCoords, pickupCoords);
        setRouteDistance(d);
        setRouteEta(Math.ceil(d * 3));
      }
    });
    return () => { cancelled = true; };
  }, [pickupCoords, collectorCoords]);

  const distance = routeDistance;
  const etaMinutes = routeEta;

  const recenterMap = () => {
    if (!mapRef.current) return;
    if (pickupCoords && collectorCoords) {
      mapRef.current.fitBounds(L.latLngBounds([pickupCoords, collectorCoords]), { padding: [50, 50] });
    } else if (pickupCoords) {
      mapRef.current.flyTo(pickupCoords, 15);
    }
  };

  const mapCenter: [number, number] = pickupCoords || [17.385, 78.4867];

  return (
    <Card className="overflow-hidden border-2 border-primary/30 shadow-lg">
      {/* Navigation Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            <span className="font-bold text-lg">Pickup Navigation</span>
          </div>
          <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 text-sm opacity-90 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {STATUS_LABELS[job.status] || job.status}
          </Badge>
          <span>{WASTE_LABELS[job.waste_type] || job.waste_type} · {job.estimated_weight} kg</span>
          {distance !== null && (
            <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground">
              📍 {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`} away
            </Badge>
          )}
          {etaMinutes !== null && (
            <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground">
              ⏱ ~{etaMinutes} min
            </Badge>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="h-[350px] sm:h-[400px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading map...</span>
            </div>
          </div>
        ) : geoError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center space-y-3 p-6">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Couldn't locate address on map</p>
              <p className="text-xs text-muted-foreground">{job.pickup_address}, {job.area}, {job.city}</p>
            </div>
          </div>
        ) : (
          <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController pickupCoords={pickupCoords} collectorCoords={collectorCoords} />

              {pickupCoords && (
                <Marker position={pickupCoords} icon={pickupIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-bold">📦 Pickup Location</p>
                      <p>{job.pickup_address}</p>
                      {householdProfile && <p className="text-xs mt-1">👤 {householdProfile.name}</p>}
                      <p className="text-xs mt-1">{WASTE_LABELS[job.waste_type]} · {job.estimated_weight} kg</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {collectorCoords && (
                <Marker position={collectorCoords} icon={collectorIcon}>
                  <Popup>
                    <p className="font-bold text-sm">🚛 You are here</p>
                  </Popup>
                </Marker>
              )}

              {/* Route line between collector and pickup */}
              {routeCoords.length > 1 && (
                <Polyline
                  positions={routeCoords}
                  pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }}
                />
              )}
            </MapContainer>

            {/* Map controls overlay */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
              <Button size="icon" variant="secondary" className="h-9 w-9 shadow-md" onClick={recenterMap}>
                <LocateFixed className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-9 w-9 shadow-md"
                onClick={() => mapRef.current?.zoomIn()}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-9 w-9 shadow-md"
                onClick={() => mapRef.current?.zoomOut()}>
                <ZoomOut className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Pickup Details - Bottom card */}
      <CardContent className="p-4 space-y-3">
        {/* Address */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase font-medium">Pickup Address</p>
            <p className="text-sm font-medium">{job.pickup_address}</p>
            {job.area && <p className="text-xs text-muted-foreground">{job.area}, {job.city}</p>}
          </div>
        </div>

        {/* Household Info */}
        {householdProfile && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase font-medium">Customer</p>
              <p className="text-sm font-medium">{householdProfile.name}</p>
              {householdProfile.phone && (
                <a href={`tel:${householdProfile.phone}`} className="text-xs text-primary flex items-center gap-1 mt-0.5 font-medium">
                  <Phone className="w-3 h-3" /> {householdProfile.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Preferred Time */}
        {job.preferred_time && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-medium">Preferred Time</p>
              <p className="text-sm font-medium">{new Date(job.preferred_time).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Waste Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">Waste Details</p>
            <p className="text-sm font-medium">{WASTE_LABELS[job.waste_type]} · {job.estimated_weight} kg</p>
          </div>
        </div>

        {/* ETA & Distance summary */}
        {distance !== null && (
          <div className="flex gap-4 p-3 rounded-lg bg-accent/50 text-sm">
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">Distance</p>
              <p className="font-bold text-primary">{distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}</p>
            </div>
            <div className="flex-1 text-center border-l">
              <p className="text-xs text-muted-foreground">ETA</p>
              <p className="font-bold text-primary">~{etaMinutes} min</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
