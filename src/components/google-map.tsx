"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap as GoogleMapApi, LoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import Link from 'next/link';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const libraries: "places"[] = ["places"];

interface GoogleMapProps {
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  initialCenter?: { lat: number; lng: number };
  height?: string;
  tutors?: any[]; // For find-tutor page
  isDraggable?: boolean;
}

export function GoogleMap({ onLocationChange, initialCenter, height = '400px', tutors, isDraggable = false }: GoogleMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState(initialCenter || { lat: 30.3753, lng: 69.3451 });
  const [activeTutor, setActiveTutor] = useState<any | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  useEffect(() => {
    if (initialCenter) {
      setMarkerPosition(initialCenter);
    } else {
        // Try to get user's current location if no initial center is provided
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newPos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setMarkerPosition(newPos);
                    map?.panTo(newPos);
                    if(onLocationChange) onLocationChange(newPos);
                },
                () => {
                    toast({ variant: 'destructive', title: 'Could not get your location.' });
                }
            );
        }
    }
  }, [initialCenter, map, onLocationChange, toast]);

  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoading(false);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && onLocationChange) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(newPos);
      onLocationChange(newPos);
    }
  };
  
  if (!googleMapsApiKey) {
    return <div className="flex items-center justify-center h-full bg-destructive/10 text-destructive">Google Maps API Key is missing.</div>;
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    if (firstName) return firstName.charAt(0);
    return 'T';
  };

  return (
    <div style={{ height }} className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
       <LoadScript googleMapsApiKey={googleMapsApiKey} libraries={libraries}>
        <GoogleMapApi
          mapContainerStyle={mapContainerStyle}
          center={markerPosition}
          zoom={tutors ? 10 : 13}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
          options={{
             streetViewControl: false,
             mapTypeControl: false,
          }}
        >
          {tutors ? (
             tutors.map(tutor => (
                tutor.location?.latitude && (
                    <MarkerF 
                        key={tutor.id} 
                        position={{ lat: tutor.location.latitude, lng: tutor.location.longitude }}
                        onClick={() => setActiveTutor(tutor)}
                    />
                )
             ))
          ) : (
            <MarkerF
                position={markerPosition}
                draggable={isDraggable}
                onDragEnd={onMarkerDragEnd}
            />
          )}

          {activeTutor && (
            <InfoWindowF
                position={{ lat: activeTutor.location.latitude, lng: activeTutor.location.longitude }}
                onCloseClick={() => setActiveTutor(null)}
            >
                <Card className="border-none shadow-none w-64">
                    <CardHeader className="p-2 flex-row items-center gap-3">
                         <Avatar>
                            <AvatarImage src={activeTutor.profileImageUrl}/>
                            <AvatarFallback>{getInitials(activeTutor.firstName, activeTutor.lastName)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-md">{activeTutor.firstName} {activeTutor.lastName}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 text-sm">
                        <p className="font-bold text-primary">PKR {activeTutor.hourlyPricing}/hr</p>
                        <Button asChild size="sm" className="w-full mt-2 rounded-lg">
                            <Link href={`/tutor/${activeTutor.id}`}>View Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
            </InfoWindowF>
          )}

        </GoogleMapApi>
      </LoadScript>
    </div>
  );
}
