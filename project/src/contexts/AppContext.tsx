import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getServices, getBookings, supabase, type Service, type Booking, type Salon } from '../lib/supabase';

interface AppContextType {
  services: Service[];
  bookings: Booking[];
  salon: Salon | null;
  addBooking: (booking: any) => void;
  loadServices: () => void;
  loadBookings: () => void;
  loadSalon: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);

  const loadServices = async () => {
    try {
      const { data, error } = await getServices();
      if (data && !error) {
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: salon } = await supabase
        .from('salons')
        .select('id')
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (salon) {
        const { data, error } = await getBookings(salon.id);
        if (data && !error) {
          setBookings(data);
        }
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadSalon = async () => {
    try {
      const { data } = await supabase
        .from('salons')
        .select('*')
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (data) {
        setSalon(data);
      }
    } catch (error) {
      console.error('Error loading salon:', error);
    }
  };

  const addBooking = async (bookingData: any) => {
    console.warn('addBooking from AppContext is deprecated. Use createBooking from supabase.ts instead.');
  };

  useEffect(() => {
    loadServices();
    loadBookings();
    loadSalon();
  }, []);

  const value: AppContextType = {
    services,
    bookings,
    salon,
    addBooking,
    loadServices,
    loadBookings,
    loadSalon
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};