export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  category: string;
  active: boolean;
  popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  total_price: number;
  total_duration_minutes: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  booking_services?: BookingService[];
}

export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  price: number;
  created_at: string;
  service?: Service;
}

export interface Review {
  id: string;
  customer_name: string;
  customer_identifier: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  id: string;
  date: string;
  time_slot: string;
  status: 'available' | 'blocked' | 'booked';
  booking_id?: string;
  blocked_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkingHours {
  id: string;
  day_of_week: number;
  is_open: boolean;
  open_time?: string;
  close_time?: string;
  break_start?: string;
  break_end?: string;
  slot_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface Salon {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  opening_hours?: any;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DefaultSchedule {
  open_time: string;
  close_time: string;
  slot_duration: number;
  break_start?: string;
  break_end?: string;
}

class LocalDatabase {
  private storageKey = 'therapyCenter_';

  private getItem<T>(key: string): T[] {
    const data = localStorage.getItem(this.storageKey + key);
    return data ? JSON.parse(data) : [];
  }

  private setItem<T>(key: string, data: T[]): void {
    localStorage.setItem(this.storageKey + key, JSON.stringify(data));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  initializeData(): void {
    if (!this.getItem('salon').length) {
      const salon: Salon = {
        id: this.generateId(),
        name: 'Centro Terapêutico',
        description: 'Seu espaço de bem-estar e saúde',
        address: 'Rua Principal, 123',
        phone: '(69) 99283-9458',
        email: 'contato@centroterapeutico.com',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.setItem('salon', [salon]);
    }

    if (!this.getItem<Service>('services').length) {
      const defaultServices: Omit<Service, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          name: 'Massagem Relaxante',
          description: 'Massagem terapêutica para alívio de tensões',
          price: 120,
          duration_minutes: 60,
          category: 'Massoterapia',
          active: true,
          popular: true
        },
        {
          name: 'Reflexologia',
          description: 'Técnica de massagem nos pés',
          price: 80,
          duration_minutes: 45,
          category: 'Massoterapia',
          active: true,
          popular: false
        },
        {
          name: 'Acupuntura',
          description: 'Tratamento com agulhas',
          price: 150,
          duration_minutes: 60,
          category: 'Medicina Chinesa',
          active: true,
          popular: true
        }
      ];

      const services = defaultServices.map(service => ({
        ...service,
        id: this.generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      this.setItem('services', services);
    }

    if (!this.getItem<WorkingHours>('workingHours').length) {
      const workingHours: WorkingHours[] = [];
      for (let day = 0; day <= 6; day++) {
        workingHours.push({
          id: this.generateId(),
          day_of_week: day,
          is_open: day === 0 ? false : true,
          open_time: '08:00',
          close_time: '18:00',
          break_start: '12:00',
          break_end: '13:00',
          slot_duration: 30,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      this.setItem('workingHours', workingHours);
    }
  }

  getSalon(): Salon | null {
    const salons = this.getItem<Salon>('salon');
    return salons[0] || null;
  }

  getServices(): Service[] {
    return this.getItem<Service>('services').filter(s => s.active);
  }

  createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Service {
    const services = this.getItem<Service>('services');
    const newService: Service = {
      ...service,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    services.push(newService);
    this.setItem('services', services);
    return newService;
  }

  updateService(id: string, updates: Partial<Service>): Service | null {
    const services = this.getItem<Service>('services');
    const index = services.findIndex(s => s.id === id);
    if (index === -1) return null;

    services[index] = {
      ...services[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.setItem('services', services);
    return services[index];
  }

  deleteService(id: string): void {
    const services = this.getItem<Service>('services');
    const filtered = services.filter(s => s.id !== id);
    this.setItem('services', filtered);
  }

  findOrCreateCustomer(customerData: { name: string; phone: string; email?: string }): Customer {
    const customers = this.getItem<Customer>('customers');
    const existing = customers.find(c => c.phone === customerData.phone);

    if (existing) return existing;

    const newCustomer: Customer = {
      ...customerData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    customers.push(newCustomer);
    this.setItem('customers', customers);
    return newCustomer;
  }

  createBooking(bookingData: {
    customer: { name: string; phone: string; email?: string };
    date: string;
    time: string;
    services: string[];
    notes?: string;
  }): Booking {
    const customer = this.findOrCreateCustomer(bookingData.customer);
    const services = this.getItem<Service>('services').filter(s =>
      bookingData.services.includes(s.id)
    );

    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);

    const booking: Booking = {
      id: this.generateId(),
      customer_id: customer.id,
      booking_date: bookingData.date,
      booking_time: bookingData.time,
      status: 'confirmed',
      total_price: totalPrice,
      total_duration_minutes: totalDuration,
      notes: bookingData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer: customer
    };

    const bookings = this.getItem<Booking>('bookings');
    bookings.push(booking);
    this.setItem('bookings', bookings);

    const bookingServices = services.map(service => ({
      id: this.generateId(),
      booking_id: booking.id,
      service_id: service.id,
      price: service.price,
      created_at: new Date().toISOString(),
      service: service
    }));

    booking.booking_services = bookingServices;

    const slot = this.findSlot(bookingData.date, bookingData.time);
    if (slot) {
      this.updateSlot(slot.id, { status: 'booked', booking_id: booking.id });
    }

    return booking;
  }

  getBookings(date?: string): Booking[] {
    let bookings = this.getItem<Booking>('bookings');
    const customers = this.getItem<Customer>('customers');
    const services = this.getItem<Service>('services');

    bookings = bookings.map(booking => {
      const customer = customers.find(c => c.id === booking.customer_id);
      const bookingServices = this.getItem<BookingService>('bookingServices')
        .filter(bs => bs.booking_id === booking.id)
        .map(bs => ({
          ...bs,
          service: services.find(s => s.id === bs.service_id)
        }));

      return {
        ...booking,
        customer,
        booking_services: bookingServices
      };
    });

    if (date) {
      bookings = bookings.filter(b => b.booking_date === date);
    }

    return bookings.sort((a, b) => {
      const dateCompare = a.booking_date.localeCompare(b.booking_date);
      if (dateCompare !== 0) return dateCompare;
      return a.booking_time.localeCompare(b.booking_time);
    });
  }

  updateBookingStatus(bookingId: string, status: Booking['status']): Booking | null {
    const bookings = this.getItem<Booking>('bookings');
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) return null;

    bookings[index].status = status;
    bookings[index].updated_at = new Date().toISOString();

    if (status === 'completed' || status === 'no_show') {
      const slots = this.getItem<Slot>('slots');
      const slot = slots.find(s => s.booking_id === bookingId);
      if (slot) {
        this.updateSlot(slot.id, { status: 'available', booking_id: undefined });
      }
    }

    this.setItem('bookings', bookings);
    return bookings[index];
  }

  getAvailableSlots(date: string): Slot[] {
    return this.getItem<Slot>('slots')
      .filter(s => s.date === date && s.status === 'available')
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }

  getAllSlots(date: string): Slot[] {
    return this.getItem<Slot>('slots')
      .filter(s => s.date === date)
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
  }

  findSlot(date: string, time: string): Slot | null {
    const slots = this.getItem<Slot>('slots');
    return slots.find(s => s.date === date && s.time_slot === time) || null;
  }

  updateSlot(id: string, updates: Partial<Slot>): void {
    const slots = this.getItem<Slot>('slots');
    const index = slots.findIndex(s => s.id === id);
    if (index !== -1) {
      slots[index] = { ...slots[index], ...updates, updated_at: new Date().toISOString() };
      this.setItem('slots', slots);
    }
  }

  saveBlockedSlots(date: string, timeSlots: string[], reason: string): void {
    const slots = this.getItem<Slot>('slots');

    timeSlots.forEach(time => {
      const existing = slots.findIndex(s => s.date === date && s.time_slot === time);
      const slot: Slot = {
        id: existing >= 0 ? slots[existing].id : this.generateId(),
        date,
        time_slot: time,
        status: 'blocked',
        blocked_reason: reason,
        created_at: existing >= 0 ? slots[existing].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existing >= 0) {
        slots[existing] = slot;
      } else {
        slots.push(slot);
      }
    });

    this.setItem('slots', slots);
  }

  getDefaultSchedule(): DefaultSchedule {
    const workingHours = this.getItem<WorkingHours>('workingHours');
    const monday = workingHours.find(w => w.day_of_week === 1);

    return {
      open_time: monday?.open_time || '08:00',
      close_time: monday?.close_time || '18:00',
      slot_duration: monday?.slot_duration || 30,
      break_start: monday?.break_start,
      break_end: monday?.break_end
    };
  }

  saveDefaultSchedule(schedule: DefaultSchedule): void {
    const workingHours = this.getItem<WorkingHours>('workingHours');

    for (let day = 0; day <= 6; day++) {
      const index = workingHours.findIndex(w => w.day_of_week === day);
      const data: WorkingHours = {
        id: index >= 0 ? workingHours[index].id : this.generateId(),
        day_of_week: day,
        is_open: day === 0 ? false : true,
        open_time: schedule.open_time,
        close_time: schedule.close_time,
        break_start: schedule.break_start,
        break_end: schedule.break_end,
        slot_duration: schedule.slot_duration,
        created_at: index >= 0 ? workingHours[index].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (index >= 0) {
        workingHours[index] = data;
      } else {
        workingHours.push(data);
      }
    }

    this.setItem('workingHours', workingHours);
  }

  generateSlots(startDate: string, endDate: string): void {
    const schedule = this.getDefaultSchedule();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const slots = this.getItem<Slot>('slots');

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      if (d.getDay() === 0) continue;

      const [openHour, openMin] = schedule.open_time.split(':').map(Number);
      const [closeHour, closeMin] = schedule.close_time.split(':').map(Number);

      let currentHour = openHour;
      let currentMin = openMin;

      while (
        currentHour < closeHour ||
        (currentHour === closeHour && currentMin < closeMin)
      ) {
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

        const isDuringBreak = schedule.break_start && schedule.break_end &&
          timeStr >= schedule.break_start && timeStr < schedule.break_end;

        if (!isDuringBreak) {
          const exists = slots.find(s => s.date === dateStr && s.time_slot === timeStr);
          if (!exists) {
            slots.push({
              id: this.generateId(),
              date: dateStr,
              time_slot: timeStr,
              status: 'available',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        currentMin += schedule.slot_duration;
        if (currentMin >= 60) {
          currentHour += Math.floor(currentMin / 60);
          currentMin = currentMin % 60;
        }
      }
    }

    this.setItem('slots', slots);
  }

  deleteAllSlots(): void {
    const slots = this.getItem<Slot>('slots');
    const filtered = slots.filter(s => s.status === 'booked');
    this.setItem('slots', filtered);
  }

  getReviews(): Review[] {
    return this.getItem<Review>('reviews')
      .filter(r => r.approved)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getAllReviews(): Review[] {
    return this.getItem<Review>('reviews')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createReview(reviewData: {
    customer_name: string;
    rating: number;
    comment: string;
  }): Review {
    const reviews = this.getItem<Review>('reviews');
    const customerIdentifier = reviewData.customer_name.toLowerCase().replace(/\s+/g, '');

    const newReview: Review = {
      ...reviewData,
      id: this.generateId(),
      customer_identifier: customerIdentifier,
      approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    reviews.push(newReview);
    this.setItem('reviews', reviews);
    return newReview;
  }

  approveReview(reviewId: string): void {
    const reviews = this.getItem<Review>('reviews');
    const index = reviews.findIndex(r => r.id === reviewId);
    if (index !== -1) {
      reviews[index].approved = true;
      reviews[index].updated_at = new Date().toISOString();
      this.setItem('reviews', reviews);
    }
  }

  deleteReview(reviewId: string): void {
    const reviews = this.getItem<Review>('reviews');
    const filtered = reviews.filter(r => r.id !== reviewId);
    this.setItem('reviews', filtered);
  }
}

export const db = new LocalDatabase();
db.initializeData();
