import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Footer from './components/Footer';
import ReviewsSection from './components/ReviewsSection';
import { Calendar, ShoppingCart, X, User } from 'lucide-react';
import { supabase, getServices, getSalonByUserId, type Salon, type Service } from './lib/supabase';

/** Avatar circular reutilizável com fallback para iniciais */
interface AvatarCircleProps {
  src?: string;
  alt: string;
  initials: string; // usado no fallback
}
const AvatarCircle: React.FC<AvatarCircleProps> = ({ src, alt, initials }) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    // Fallback (sem imagem ou erro no carregamento)
    return (
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 shadow-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-clinic-400 to-clinic-500">
        <span className="text-white text-2xl md:text-3xl font-bold">{initials}</span>
      </div>
    );
  }

  return (
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 shadow-lg overflow-hidden relative ring-2 ring-white">
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover object-top"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
};

// Team Member Card Component (mantido; usa AvatarCircle quando desejar)
interface TeamMemberCardProps {
  name: string;
  role: string;
  initials: string;
  description: string;
  photoSrc?: string;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ name, role, initials, description, photoSrc }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Trunca a descrição em ~80 caracteres
  const truncatedDescription = description.length > 80 
    ? description.substring(0, 80) + '...' 
    : description;

  return (
    <div className="bg-gradient-to-br from-white to-clinic-50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 border border-clinic-100">
      <div className="text-center mb-4">
        <AvatarCircle src={photoSrc} alt={`${name} - ${role}`} initials={initials} />
        <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{name}</h4>
        <p className="text-sm text-clinic-600 font-medium">{role}</p>
      </div>
      
      <div className="text-gray-600 text-sm md:text-base leading-relaxed text-center">
        <p className="mb-3">
          {isExpanded ? description : truncatedDescription}
        </p>
        
        {description.length > 80 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-clinic-600 hover:text-clinic-700 font-medium text-sm transition-colors duration-300 flex items-center mx-auto space-x-1"
          >
            <span>{isExpanded ? 'Ver menos' : 'Ver mais'}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

function App() {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [ambienteIndex, setAmbienteIndex] = useState(0);
  const [equipeIndex, setEquipeIndex] = useState(0);
  const equipeMembers = [
    {
      src: '/AndreSilva.png',
      name: 'André Silva',
      role: 'Terapeuta Holístico',
      initials: 'AS',
      bio: 'Com um olhar atento e sensível, busca sempre compreender o que vai além das palavras. Sua presença transmite calma, acolhimento e confiança, conduzindo cada pessoa a se reconectar com sua própria essência e encontrar novos caminhos para o equilíbrio e bem-estar.',
    },
    {
      src: '/RafaelFalco.png',
      name: 'Rafael Falco',
      role: 'Terapeuta Holístico',
      initials: 'RF',
      bio: 'De forma precisa e dedicada, combina firmeza e delicadeza para trazer alívio e leveza. Seu cuidado é pautado na atenção aos detalhes e na verdadeira escuta, criando um espaço onde corpo e mente encontram harmonia.',
    },
    {
      src: '/LuGoncalves.png',
      name: 'Luciana Gonçalves',
      role: 'Terapeuta Energética',
      initials: 'LG',
      bio: 'Com energia leve e transformadora, conduz processos que despertam clareza e abrem novas possibilidades. Seu toque sutil inspira confiança e ajuda cada pessoa a liberar bloqueios internos, permitindo que a vida flua de forma mais leve e consciente.',
    },
  ];
  const ambientePhotos = [
    { src: '/AAbalcao.jpg', alt: 'Recepção' },
    { src: '/AAchegada.jpg', alt: 'Sala de Espera' },
    { src: '/AAmassagem.jpg', alt: 'Sala de Massagem' },
    { src: '/AAsofa.jpg', alt: 'Área de Relaxamento' },
  ];

  // Auto-play carrosséis
  useEffect(() => {
    const t = setInterval(() => setAmbienteIndex(i => (i + 1) % ambientePhotos.length), 4000);
    return () => clearInterval(t);
  }, [ambientePhotos.length]);

  useEffect(() => {
    const t = setInterval(() => setEquipeIndex(i => (i + 1) % equipeMembers.length), 5000);
    return () => clearInterval(t);
  }, [equipeMembers.length]);

  // Dados da clínica (fallback quando não há dados do banco)
  const clinicData = {
    name: 'Centro Terapêutico Bem-Estar',
    phone: '(69) 99283-9458',
    email: 'centroobemestar@gmail.com',
    address: 'Avenida Curitiba, nº 3886, Jardim das Oliveiras, Vilhena – Rondônia',
    instagram: 'https://instagram.com/centroterapeuticoo',
    facebook: 'https://www.facebook.com/share/1Dr82JT5NV/',
    description: 'Cuidando da sua saúde mental e física com carinho e profissionalismo. Oferecemos terapias holísticas e tratamentos personalizados para seu bem-estar integral.'
  };

  useEffect(() => {
    loadInitialData();
    
    // Set up Google Maps initialization
    // @ts-ignore
    window.initializeGoogleMap = initializeGoogleMap;
    
    // If Google Maps is already loaded, initialize immediately
    // @ts-ignore
    if (window.google && window.google.maps) {
      setTimeout(initializeGoogleMap, 1000);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('=== CARREGANDO DADOS INICIAIS ===');

      const { data: servicesData, error: servicesError } = await getServices();
      console.log('Serviços carregados do Supabase:', servicesData, servicesError);

      if (servicesData && !servicesError) {
        setServices(servicesData);
        console.log('Serviços definidos no estado:', servicesData.length);
      } else {
        console.warn('Nenhum serviço encontrado ou erro:', servicesError);
        setServices([]);
      }

      const { data: salonsData, error: salonsError } = await supabase
        .from('salons')
        .select('*')
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      console.log('Salon data from Supabase:', salonsData, salonsError);

      if (salonsData && !salonsError) {
        setSalon(salonsData);
      } else {
        console.warn('No salon found, using default data');
        setSalon({
          id: crypto.randomUUID(),
          name: clinicData.name,
          description: clinicData.description,
          address: clinicData.address,
          phone: clinicData.phone,
          email: clinicData.email,
          instagram: clinicData.instagram,
          facebook: clinicData.facebook,
          opening_hours: {
            monday: { open: '08:00', close: '20:00' },
            tuesday: { open: '08:00', close: '20:00' },
            wednesday: { open: '08:00', close: '20:00' },
            thursday: { open: '08:00', close: '20:00' },
            friday: { open: '08:00', close: '20:00' },
            saturday: { open: '08:00', close: '20:00' },
            sunday: { open: '08:00', close: '20:00' }
          },
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Salon);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setServices([]);
      setSalon({
        id: crypto.randomUUID(),
        name: clinicData.name,
        description: clinicData.description,
        address: clinicData.address,
        phone: clinicData.phone,
        email: clinicData.email,
        instagram: clinicData.instagram,
        facebook: clinicData.facebook,
        opening_hours: {
          monday: { open: '08:00', close: '20:00' },
          tuesday: { open: '08:00', close: '20:00' },
          wednesday: { open: '08:00', close: '20:00' },
          thursday: { open: '08:00', close: '20:00' },
          friday: { open: '08:00', close: '20:00' },
          saturday: { open: '08:00', close: '20:00' },
          sunday: { open: '08:00', close: '20:00' }
        },
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Salon);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleMap = () => {
    const mapElement = document.getElementById('google-map');
    // @ts-ignore
    if (!mapElement || !window.google || !window.google.maps) {
      console.log('Google Maps não carregado ainda ou elemento não encontrado');
      return;
    }

    console.log('Inicializando Google Maps...');

    // Coordenadas mais precisas de Vilhena, RO
    const clinicLocation = { lat: -12.729139, lng: -60.136111 };

    try {
      // @ts-ignore
      const map = new window.google.maps.Map(mapElement, {
        zoom: 15,
        center: clinicLocation,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      console.log('Mapa criado com sucesso');

      // Marcador personalizado
      // @ts-ignore
      const marker = new window.google.maps.Marker({
        position: clinicLocation,
        map: map,
        title: 'Centro Terapêutico Bem-Estar',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="4"/>
              <path d="M20 10C16.6863 10 14 12.6863 14 16C14 20.5 20 30 20 30S26 20.5 26 16C26 12.6863 23.3137 10 20 10ZM20 18.5C18.6193 18.5 17.5 17.3807 17.5 16C17.5 14.6193 18.6193 13.5 20 13.5C21.3807 13.5 22.5 14.6193 22.5 16C22.5 17.3807 21.3807 18.5 20 18.5Z" fill="white"/>
            </svg>
          `),
          // @ts-ignore
          scaledSize: new window.google.maps.Size(40, 40),
          // @ts-ignore
          anchor: new window.google.maps.Point(20, 40)
        }
      });

      console.log('Marcador criado com sucesso');

      // Info window com informações da clínica
      // @ts-ignore
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">
              Centro Terapêutico Bem-Estar
            </h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              Avenida Curitiba, nº 3886<br>
              Jardim das Oliveiras, Vilhena - RO
            </p>
            <p style="margin: 0 0 8px 0; color: #3b82f6; font-size: 14px;">
              📱 (69) 99283-9458
            </p>
            <p style="margin: 0; color: #059669; font-size: 12px; font-weight: 500;">
              ✅ Atendimento com hora marcada
            </p>
          </div>
        `
      });

      // Abrir info window ao clicar no marcador
      // @ts-ignore
      marker.addListener('click', () => {
        // @ts-ignore
        infoWindow.open(map, marker);
      });

      // Abrir automaticamente após 2 segundos
      setTimeout(() => {
        // @ts-ignore
        infoWindow.open(map, marker);
      }, 2000);

      console.log('Google Maps inicializado completamente');
    } catch (error) {
      console.error('Erro ao inicializar Google Maps:', error);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedServices(prev => {
      const isAlreadySelected = prev.find(s => s.id === service.id);
      if (isAlreadySelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleScheduleClick = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartBooking = () => {
    setShowBookingForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToServices = () => {
    setShowBookingForm(false);
    setSelectedServices([]);
    setTimeout(() => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLoginSuccess = async () => {
    setShowLogin(false);
    setIsAuthenticated(true);
    setShowAdminDashboard(true);

    // Load authenticated user's salon
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userSalon } = await getSalonByUserId(user.id);
        if (userSalon) {
          setSalon(userSalon);
        }
      }
    } catch (error) {
      console.error('Error loading salon after login:', error);
    }

    await loadInitialData();
  };

  const handleProfileClick = () => {
    setShowLogin(true);
  };

  const handleBackToSite = () => {
    setShowLogin(false);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const getTotalPrice = () => {
    return parseFloat(selectedServices.reduce((total, service) => {
      const price = (service.promotion_active && service.promotion_price)
        ? service.promotion_price
        : service.price;
      return total + price;
    }, 0).toFixed(2));
  };

  const getOriginalTotalPrice = () => {
    return parseFloat(selectedServices.reduce((total, service) => total + service.price, 0).toFixed(2));
  };

  const hasAnyPromotion = () => {
    return selectedServices.some(service => service.promotion_active && service.promotion_price);
  };

  const getTotalDuration = () => {
    const totalMinutes = selectedServices.reduce((total, service) => {
      return total + service.duration_minutes;
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <LoginForm 
        onLoginSuccess={handleLoginSuccess}
        onBack={handleBackToSite}
      />
    );
  }


  if (showAdminDashboard && isAuthenticated) {
    return (
      <div>
        <div className="bg-white border-b px-4 py-2">
          <button
            onClick={() => setShowAdminDashboard(false)}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Voltar ao Site
          </button>
        </div>
        <AdminDashboard 
          salon={salon} 
          onLogout={() => {
            setIsAuthenticated(false);
            setShowAdminDashboard(false);
            setShowLogin(false);
            loadInitialData(); // Reload to reset to public view
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header salon={salon} onLoginClick={handleProfileClick} />
      
      {!showBookingForm ? (
        <>
          <Hero onScheduleClick={handleScheduleClick} salon={salon} />
          
          <div id="services">
            <Services 
              services={services}
              onServiceSelect={handleServiceSelect}
              selectedServices={selectedServices}
            />
          </div>

          {/* About Us Section */}
          <section className="py-12 md:py-20 bg-gradient-to-br from-clinic-50 via-white to-clinic-100 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 md:-top-40 md:-right-40 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-br from-clinic-200/30 to-clinic-300/30 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 md:-bottom-40 md:-left-40 w-40 h-40 md:w-80 md:h-80 bg-gradient-to-tr from-clinic-300/30 to-clinic-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 md:mb-16 relative z-10">
                <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg border border-white/20 mb-4 md:mb-6">
                  <span className="text-clinic-500 font-semibold">✨ Conheça Nossa História</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
                  Sobre Nós
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
                  {salon?.description || 'Cuidando da sua beleza com carinho, profissionalismo e tecnologia de ponta'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center mb-12 md:mb-20 relative z-10">
                <div className="space-y-6 md:space-y-8">
                  {/* Nossa História */}
                  <div className="relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border-l-4 border-clinic-500 hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center mb-5">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-clinic-400 to-clinic-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4 shadow-md">
                        <span className="text-white text-lg md:text-2xl">🏪</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold tracking-widest text-clinic-400 uppercase">Sobre nós</p>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">Nossa História</h3>
                      </div>
                    </div>
                    <p className="text-gray-500 mb-3 leading-relaxed text-sm md:text-base">
                      {salon?.name ? `O ${salon.name} nasceu` : 'Nossa clínica nasceu'} do sonho de criar um espaço
                      onde cada pessoa se sinta acolhida e cuidada. Nos tornamos referência em terapias holísticas e bem-estar.
                    </p>
                    <p className="text-gray-500 leading-relaxed text-sm md:text-base">
                      Com uma equipe de terapeutas altamente qualificados e apaixonados pelo que fazem,
                      oferecemos terapias personalizadas que promovem o equilíbrio e bem-estar integral.
                    </p>
                    <div className="mt-5 flex gap-3">
                      <span className="text-xs bg-clinic-50 text-clinic-600 font-semibold px-3 py-1 rounded-full border border-clinic-100">Holístico</span>
                      <span className="text-xs bg-clinic-50 text-clinic-600 font-semibold px-3 py-1 rounded-full border border-clinic-100">Humanizado</span>
                      <span className="text-xs bg-clinic-50 text-clinic-600 font-semibold px-3 py-1 rounded-full border border-clinic-100">Personalizado</span>
                    </div>
                  </div>

                  {/* Nossa Missão */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-clinic-600 via-clinic-500 to-clinic-400 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-500">
                    {/* Círculo decorativo */}
                    <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
                    <div className="relative">
                      <div className="flex items-center mb-4">
                        <div className="w-9 h-9 md:w-11 md:h-11 bg-white/20 rounded-xl flex items-center justify-center mr-3 shadow-inner">
                          <span className="text-lg md:text-2xl">🎯</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold tracking-widest text-white/60 uppercase">Propósito</p>
                          <h4 className="font-bold text-lg md:text-xl leading-tight">Nossa Missão</h4>
                        </div>
                      </div>
                      <p className="text-white/85 text-sm md:text-base leading-relaxed">
                        Proporcionar experiências únicas de cura e bem-estar, utilizando técnicas terapêuticas holísticas
                        e abordagens integradas, sempre com atendimento humanizado e personalizado.
                      </p>
                      <div className="mt-5 h-px bg-white/20" />
                      <p className="mt-4 text-white/70 text-xs font-medium tracking-wide">
                        ✦ Corpo · Mente · Espírito
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border border-white/20">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4">
                        <span className="text-white text-lg md:text-2xl">📸</span>
                      </div>
                      <h3 className="text-lg md:text-2xl font-bold text-gray-900">Nosso Ambiente</h3>
                    </div>

                    {/* Carrossel com slide real */}
                    <div className="relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg bg-black">
                      {/* Strip deslizante */}
                      <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${ambienteIndex * 100}%)` }}
                      >
                        {ambientePhotos.map((photo, i) => (
                          <div key={i} className="w-full flex-shrink-0" style={{ height: '28rem' }}>
                            <img
                              src={encodeURI(photo.src)}
                              alt={`Centro Terapêutico Bem-Estar - ${photo.alt}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Overlay escuro nas bordas */}
                      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 12%, transparent 88%, rgba(0,0,0,0.15) 100%)' }} />

                      {/* Label */}
                      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
                        <span className="bg-black/60 text-white text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide">
                          {ambientePhotos[ambienteIndex].alt}
                        </span>
                      </div>

                      {/* Botões prev/next */}
                      <button
                        onClick={() => setAmbienteIndex((ambienteIndex - 1 + ambientePhotos.length) % ambientePhotos.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-clinic-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110 text-2xl font-bold"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setAmbienteIndex((ambienteIndex + 1) % ambientePhotos.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-clinic-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110 text-2xl font-bold"
                      >
                        ›
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                        {ambientePhotos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setAmbienteIndex(i)}
                            className={`h-2 rounded-full transition-all duration-300 ${i === ambienteIndex ? 'bg-white w-5' : 'bg-white/40 w-2'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-2xl border border-white/20 mb-8 md:mb-12 relative z-10">
                <div className="text-center mb-8 md:mb-12">
                  <div className="flex items-center justify-center mb-4 md:mb-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4">
                      <span className="text-white text-lg md:text-2xl">👥</span>
                    </div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Nossa Equipe</h3>
                  </div>
                  <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                    Conheça os profissionais dedicados que cuidam do seu bem-estar com expertise e carinho
                  </p>
                </div>

                {/* Carrossel da equipe */}
                <div className="relative overflow-hidden">
                  {/* Strip deslizante */}
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${equipeIndex * 100}%)` }}
                  >
                    {equipeMembers.map((member, i) => (
                      <div key={i} className="w-full flex-shrink-0 px-2">
                        <div className="bg-gradient-to-br from-white to-clinic-50 rounded-2xl p-8 md:p-12 shadow-lg border border-clinic-100 flex flex-col items-center text-center max-w-2xl mx-auto">
                          <AvatarCircle
                            src={encodeURI(member.src)}
                            alt={`${member.name} - ${member.role}`}
                            initials={member.initials}
                          />
                          <h4 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">{member.name}</h4>
                          <p className="text-sm text-clinic-600 font-semibold mb-5">{member.role}</p>
                          <p className="text-gray-500 text-sm md:text-base leading-relaxed">{member.bio}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botões prev/next */}
                  <button
                    onClick={() => setEquipeIndex((equipeIndex - 1 + equipeMembers.length) % equipeMembers.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-clinic-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110 text-2xl font-bold"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setEquipeIndex((equipeIndex + 1) % equipeMembers.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-clinic-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all hover:scale-110 text-2xl font-bold"
                  >
                    ›
                  </button>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-6">
                  {equipeMembers.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setEquipeIndex(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${i === equipeIndex ? 'bg-clinic-500 w-5' : 'bg-clinic-200 w-2'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Gisliane Silva - Psicóloga */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-2xl border border-white/20 mb-8 md:mb-12 relative z-10 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Foto lado esquerdo */}
                  <div className="w-full md:w-64 lg:w-80 flex-shrink-0 bg-gradient-to-br from-clinic-400 to-clinic-600 flex items-center justify-center min-h-48 md:min-h-full">
                    <img
                      src={encodeURI('/Gih.png')}
                      alt="Gisliane Silva - Psicóloga"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        const parent = el.parentElement;
                        if (parent) {
                          const fallback = document.createElement('span');
                          fallback.className = 'text-white text-5xl font-bold';
                          fallback.textContent = 'GS';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>

                  {/* Conteúdo lado direito */}
                  <div className="flex-1 p-6 md:p-10">
                    <p className="text-xs font-semibold tracking-widest text-clinic-500 uppercase mb-2">Psicóloga · CRP</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Gisliane Silva</h3>
                    <p className="text-clinic-500 font-medium mb-5">Gih</p>

                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                      A Terapia Psicológica com Gisliane Silva é um espaço seguro e acolhedor para o cuidado com a saúde emocional.
                      Com especialização em Saúde da Família e Comunidade, o atendimento é realizado de forma humanizada, utilizando
                      a abordagem da Terapia Cognitivo-Comportamental (TCC), auxiliando no desenvolvimento do autoconhecimento, no
                      manejo de emoções e na construção de pensamentos mais equilibrados.
                    </p>
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
                      Os atendimentos são voltados para crianças, adolescentes e adultos, podendo ser realizados de forma
                      presencial ou online, conforme a sua necessidade. Um cuidado profissional dedicado a promover bem-estar,
                      qualidade de vida e equilíbrio mental.
                    </p>

                    {/* Preço + botão */}
                    <div className="flex items-center gap-5">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through">De: R$ 250</span>
                        <span className="text-xl font-bold text-red-600">R$ 180</span>
                      </div>
                      <button
                        onClick={() => {
                          const message = `Olá! Gostaria de agendar uma consulta de Psicologia com a Gisliane Silva (Gih).\n\n*Serviço:* Terapia Psicológica – TCC\n*Valor:* R$ 180,00\n\nAguardo a confirmação, por favor.`;
                          window.open(`https://wa.me/5569992839458?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-clinic-500 to-clinic-600 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:from-clinic-600 hover:to-clinic-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        <Calendar className="w-4 h-4" />
                        Agendar via WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização */}
              {salon?.address && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-2xl border border-white/20 relative z-10">
                  {/* Cabeçalho igual aos outros cards */}
                  <div className="flex items-center mb-8 md:mb-10">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4 shadow-md">
                      <span className="text-white text-lg md:text-2xl">📍</span>
                    </div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Nossa Localização</h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-stretch">
                    {/* Info */}
                    <div className="space-y-4">
                      <a
                        href="https://www.bing.com/maps?&cp=-12.729423~-60.136305&lvl=19.010952&pi=0&tstt0=Avenida%20Curitiba%2C%20Jardim%20das%20Oliveiras%2C%20Vilhena%20-%20RO%2C%2076983-462&tsts0=%2526ty%253D18%2526q%253DAvenida%252520Curitiba%25252C%252520Jardim%252520das%252520Oliveiras%25252C%252520Vilhena%252520-%252520RO%25252C%25252076983-462%2526mb%253D-12.726048~-60.14093~-12.732379~-60.130287%2526cardbg%253D%252523F98745%2526dt%253D1754528400000&ftst=0&ftics=False&v=2&sV=2&form=S00027"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-4 p-4 md:p-5 bg-gradient-to-r from-clinic-50 to-clinic-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 group border border-clinic-100"
                      >
                        <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white text-lg">📍</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Endereço</p>
                          <p className="text-clinic-700 font-medium text-sm md:text-base leading-snug">
                            {salon?.address || clinicData.address}
                          </p>
                          <p className="text-xs text-clinic-500 mt-1.5 group-hover:text-clinic-700 transition-colors">Clique para abrir no mapa →</p>
                        </div>
                      </a>

                      {(salon?.phone || clinicData.phone) && (
                        <a
                          href="https://wa.me/5569992839458"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-4 p-4 md:p-5 bg-gradient-to-r from-clinic-50 to-clinic-100 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 group border border-clinic-100"
                        >
                          <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-clinic-400 to-clinic-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-white text-lg">📱</span>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm md:text-base mb-0.5">Telefone</p>
                            <p className="text-clinic-700 font-medium text-sm md:text-base flex items-center gap-2">
                              {salon?.phone || clinicData.phone}
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">WhatsApp</span>
                            </p>
                            <p className="text-xs text-clinic-500 mt-1.5 group-hover:text-clinic-700 transition-colors">Clique para abrir no WhatsApp →</p>
                          </div>
                        </a>
                      )}
                    </div>

                    {/* Google Maps */}
                    <div className="rounded-2xl overflow-hidden shadow-lg border border-clinic-100">
                      <div
                        id="google-map"
                        className="w-full h-64 lg:h-full min-h-64 bg-clinic-50 flex items-center justify-center"
                      >
                        <div className="text-center text-clinic-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-clinic-500 border-t-transparent mx-auto mb-2"></div>
                          <p className="text-sm">Carregando mapa...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <ReviewsSection salon={salon} />

          {/* Floating Action Button */}
          {selectedServices.length > 0 && (
            <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
              <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl border border-gray-100 p-3 md:p-4 mb-3 md:mb-4 max-w-xs md:max-w-sm animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center text-sm md:text-base">
                    <ShoppingCart className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-clinic-500" />
                    Serviços Selecionados
                  </h4>
                  <span className="bg-clinic-100 text-clinic-600 text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded-full font-medium">
                    {selectedServices.length}
                  </span>
                </div>
                
                <div className="space-y-1 md:space-y-2 mb-3 md:mb-4 max-h-24 md:max-h-32 overflow-y-auto">
                  {selectedServices.map(service => (
                    <div key={service.id} className="flex items-center justify-between bg-gray-50 rounded-md md:rounded-lg p-1.5 md:p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{service.name}</p>
                        {service.promotion_active && service.promotion_price ? (
                          <div className="flex flex-col">
                            <p className="text-xs text-gray-400 line-through">R$ {service.price}</p>
                            <p className="text-xs text-red-600 font-semibold">R$ {service.promotion_price}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">R$ {service.price}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeService(service.id)}
                        className="ml-1 md:ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-2 md:pt-3 mb-3 md:mb-4">
                  {hasAnyPromotion() && (
                    <div className="flex justify-between text-xs md:text-sm mb-1">
                      <span className="text-gray-400 line-through">Total:</span>
                      <span className="text-gray-400 line-through">R$ {getOriginalTotalPrice()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">{hasAnyPromotion() ? 'Total com promoção:' : 'Total:'}</span>
                    <span className={`font-bold ${hasAnyPromotion() ? 'text-red-600' : 'text-green-600'}`}>R$ {getTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium text-gray-900">{getTotalDuration()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const servicesText = selectedServices.map(s => `• ${s.name}`).join('\n');
                    const totalPriceBRL = getTotalPrice().toFixed(2).replace('.', ',');
                    const message =
`Olá! Gostaria de agendar um horário no Centro Terapêutico Bem-Estar.
*Serviços desejados:*

${servicesText}

*Tempo estimado:* ${getTotalDuration()}
*Com o valor estimado em:* R$ ${totalPriceBRL}

Aguardo a confirmação, por favor.`;

                    const whatsappUrl = `https://wa.me/5569992839458?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-clinic-500 to-clinic-600 text-white py-2 md:py-3 rounded-lg md:rounded-xl font-semibold text-sm md:text-base hover:from-clinic-600 hover:to-clinic-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                  Agendar via WhatsApp
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        selectedServices.length > 0 && (
          <BookingForm 
            selectedServices={selectedServices}
            onBack={handleBackToServices}
            salon={salon}
          />
        )
      )}
      
      <Footer salon={salon} />
    </div>
  );
}

export default App;
