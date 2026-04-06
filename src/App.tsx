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
import { Calendar, ShoppingCart, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
        className="absolute inset-0 w-full h-full object-cover object-center"
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

  const [gihImgError, setGihImgError] = useState(false);

  // Carousel state
  const [envIndex, setEnvIndex] = useState(0);
  const [envPaused, setEnvPaused] = useState(false);
  const [teamIndex, setTeamIndex] = useState(0);
  const [teamPaused, setTeamPaused] = useState(false);

  const ENV_PHOTOS = [
    { src: '/20250814_130228[1].jpg', alt: 'Centro Terapêutico Bem-Estar - Ambiente interno', label: 'Ambiente Principal' },
    { src: '/20250814_130359[1].jpg', alt: 'Centro Terapêutico Bem-Estar - Espaço Terapêutico', label: 'Espaço Terapêutico' },
    { src: '/20250814_130448[1].jpg', alt: 'Centro Terapêutico Bem-Estar - Sala de Terapia', label: 'Sala de Terapia' },
    { src: '/20250814_130127[1].jpg', alt: 'Centro Terapêutico Bem-Estar - Área de Acolhimento', label: 'Área de Acolhimento' },
  ];

  const TEAM_MEMBERS = [
    {
      name: 'André Silva',
      role: 'Terapeuta Holístico',
      initials: 'AS',
      photo: '/AndréSilva.png',
      description: 'Com um olhar atento e sensível, busca sempre compreender o que vai além das palavras. Sua presença transmite calma, acolhimento e confiança, conduzindo cada pessoa a se reconectar com sua própria essência e encontrar novos caminhos para o equilíbrio e bem-estar.',
    },
    {
      name: 'Rafael Falco',
      role: 'Massoterapeuta',
      initials: 'RF',
      photo: '/RafaelFalco.png',
      description: 'De forma precisa e dedicada, combina firmeza e delicadeza para trazer alívio e leveza. Seu cuidado é pautado na atenção aos detalhes e na verdadeira escuta, criando um espaço onde corpo e mente encontram harmonia.',
    },
    {
      name: 'Lu Gonçalves',
      role: 'Terapeuta Energética',
      initials: 'LG',
      photo: '/LuGonçalves.png',
      description: 'Com energia leve e transformadora, conduz processos que despertam clareza e abrem novas possibilidades. Seu toque sutil inspira confiança e ajuda cada pessoa a liberar bloqueios internos, permitindo que a vida flua de forma mais leve e consciente.',
    },
  ];

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

  // Carousel auto-advance
  useEffect(() => {
    if (envPaused) return;
    const t = setInterval(() => setEnvIndex(i => (i + 1) % ENV_PHOTOS.length), 4000);
    return () => clearInterval(t);
  }, [envPaused, ENV_PHOTOS.length]);

  useEffect(() => {
    if (teamPaused) return;
    const t = setInterval(() => setTeamIndex(i => (i + 1) % TEAM_MEMBERS.length), 5000);
    return () => clearInterval(t);
  }, [teamPaused, TEAM_MEMBERS.length]);

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
    return parseFloat(selectedServices.reduce((total, service) => total + service.price, 0).toFixed(2));
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
          <section className="py-16 md:py-24 bg-gray-50">

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="text-center mb-14">
                <span className="text-clinic-600 font-medium text-sm uppercase tracking-widest">✨ Conheça Nossa História</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-3 mb-4">
                  Sobre Nós
                </h2>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                  {salon?.description || 'Cuidando da sua beleza com carinho, profissionalismo e tecnologia de ponta'}
                </p>
              </div>

              {/* História + Missão */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-14">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Nossa História</h3>
                  <p className="text-gray-500 mb-4 leading-relaxed">
                    {salon?.name ? `O ${salon.name} nasceu` : 'Nossa clínica nasceu'} do sonho de criar um espaço
                    onde cada pessoa se sinta acolhida e cuidada. Nos tornamos referência em terapias holísticas e bem-estar.
                  </p>
                  <p className="text-gray-500 leading-relaxed">
                    Com uma equipe de terapeutas altamente qualificados e apaixonados pelo que fazem,
                    oferecemos terapias personalizadas que promovem o equilíbrio e bem-estar integral.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-clinic-500 to-clinic-600 rounded-2xl p-8 text-white shadow-md">
                  <h4 className="font-bold text-xl mb-4">Nossa Missão</h4>
                  <p className="text-clinic-100 leading-relaxed">
                    Proporcionar experiências únicas de cura e bem-estar, utilizando técnicas terapêuticas holísticas
                    e abordagens integradas, sempre com atendimento humanizado e personalizado.
                  </p>
                </div>
              </div>

              {/* Nosso Ambiente — Carrossel */}
              <div className="mb-14">
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Nosso Ambiente</h3>

                <div
                  className="relative rounded-2xl overflow-hidden shadow-xl h-72 sm:h-96 md:h-[480px]"
                  onMouseEnter={() => setEnvPaused(true)}
                  onMouseLeave={() => setEnvPaused(false)}
                >
                  {ENV_PHOTOS.map((photo, i) => (
                    <div
                      key={i}
                      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${i === envIndex ? 'opacity-100' : 'opacity-0'}`}
                    >
                      {/* Fundo borrado — cobre todo o container */}
                      <img
                        src={photo.src}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl brightness-50 opacity-90"
                      />
                      {/* Foto principal centralizada */}
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="relative z-10 max-w-full max-h-full object-contain rounded-lg"
                        style={{ filter: 'drop-shadow(0 4px 32px rgba(0,0,0,0.5))' }}
                      />
                      {/* Label */}
                      <div className="absolute bottom-4 left-5 z-20">
                        <span className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                          {photo.label}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setEnvIndex(i => (i - 1 + ENV_PHOTOS.length) % ENV_PHOTOS.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 border border-white/30"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>

                  <button
                    onClick={() => setEnvIndex(i => (i + 1) % ENV_PHOTOS.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200 border border-white/30"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>

                  <div className="absolute bottom-4 right-5 z-30 flex items-center space-x-1.5">
                    {ENV_PHOTOS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setEnvIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === envIndex ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`}
                        aria-label={`Foto ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Nossa Equipe — Carrossel */}
              <div className="mb-14">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Nossa Equipe</h3>
                  <p className="text-gray-500 max-w-xl mx-auto">
                    Conheça os profissionais dedicados que cuidam do seu bem-estar com expertise e carinho
                  </p>
                </div>

                <div
                  className="relative px-10 md:px-14"
                  onMouseEnter={() => setTeamPaused(true)}
                  onMouseLeave={() => setTeamPaused(false)}
                >
                  <div className="overflow-hidden rounded-2xl">
                    <div
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${teamIndex * 100}%)` }}
                    >
                      {TEAM_MEMBERS.map((member, i) => (
                        <div key={i} className="w-full flex-shrink-0">
                          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm max-w-lg mx-auto">
                            <div className="text-center">
                              <AvatarCircle
                                src={encodeURI(member.photo)}
                                alt={`${member.name} - ${member.role}`}
                                initials={member.initials}
                              />
                              <h4 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h4>
                              <p className="text-sm text-clinic-600 font-medium mb-5">{member.role}</p>
                              <p className="text-gray-500 leading-relaxed">{member.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setTeamIndex(i => (i - 1 + TEAM_MEMBERS.length) % TEAM_MEMBERS.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:border-clinic-300 transition-all duration-200"
                    aria-label="Membro anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>

                  <button
                    onClick={() => setTeamIndex(i => (i + 1) % TEAM_MEMBERS.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:border-clinic-300 transition-all duration-200"
                    aria-label="Próximo membro"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>

                  <div className="flex justify-center space-x-2 mt-6">
                    {TEAM_MEMBERS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTeamIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === teamIndex ? 'bg-clinic-500 w-6' : 'bg-gray-300 w-1.5'}`}
                        aria-label={`Ver ${TEAM_MEMBERS[i].name}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Gisliane Silva — Psicóloga */}
              <div className="mb-14">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Foto */}
                    <div className="relative min-h-[300px] md:min-h-0">
                      {gihImgError ? (
                        <div className="w-full h-72 md:h-full min-h-[300px] bg-gradient-to-br from-clinic-400 to-clinic-600 flex items-center justify-center">
                          <span className="text-white text-6xl font-bold opacity-60">GS</span>
                        </div>
                      ) : (
                        <img
                          src="/Gih.png"
                          alt="Gisliane Silva - Psicóloga"
                          className="w-full h-72 md:h-full object-cover object-top"
                          onError={() => setGihImgError(true)}
                        />
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <span className="text-clinic-600 font-medium text-xs uppercase tracking-widest mb-3">
                        Psicóloga · CRP
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                        Gisliane Silva
                      </h3>
                      <p className="text-clinic-500 font-medium mb-6">Gih</p>

                      <div className="space-y-4 text-gray-500 leading-relaxed">
                        <p>
                          A Terapia Psicológica com Gisliane Silva é um espaço seguro e acolhedor para o cuidado com a saúde emocional. Com especialização em Saúde da Família e Comunidade, o atendimento é realizado de forma humanizada, utilizando a abordagem da Terapia Cognitivo-Comportamental (TCC), auxiliando no desenvolvimento do autoconhecimento, no manejo de emoções e na construção de pensamentos mais equilibrados.
                        </p>
                        <p>
                          Os atendimentos são voltados para crianças, adolescentes e adultos, podendo ser realizados de forma presencial ou online, conforme a sua necessidade. Um cuidado profissional dedicado a promover bem-estar, qualidade de vida e equilíbrio mental.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-8">
                        {['Saúde da Família', 'TCC', 'Crianças & Adolescentes', 'Online & Presencial'].map(tag => (
                          <span
                            key={tag}
                            className="text-xs bg-clinic-50 text-clinic-700 border border-clinic-100 px-3 py-1 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização */}
              {salon?.address && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Nossa Localização</h3>

                      <div className="space-y-4">
                        <a
                          href="https://www.bing.com/maps?&cp=-12.729423~-60.136305&lvl=19.010952&pi=0&tstt0=Avenida%20Curitiba%2C%20Jardim%20das%20Oliveiras%2C%20Vilhena%20-%20RO%2C%2076983-462&tsts0=%2526ty%253D18%2526q%253DAvenida%252520Curitiba%25252C%252520Jardim%252520das%252520Oliveiras%25252C%252520Vilhena%252520-%252520RO%25252C%25252076983-462%2526mb%253D-12.726048~-60.14093~-12.732379~-60.130287%2526cardbg%253D%252523F98745%2526dt%253D1754528400000&ftst=0&ftics=False&v=2&sV=2&form=S00027"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start space-x-4 p-4 bg-gray-50 hover:bg-clinic-50 rounded-xl transition-colors duration-200 group"
                        >
                          <div className="w-10 h-10 bg-clinic-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-sm">📍</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Endereço</p>
                            <p className="text-clinic-600 group-hover:text-clinic-700 text-sm mt-0.5 transition-colors">
                              {salon?.address || clinicData.address}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Clique para abrir no mapa</p>
                          </div>
                        </a>

                        {(salon?.phone || clinicData.phone) && (
                          <a
                            href="https://wa.me/5569992839458"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start space-x-4 p-4 bg-gray-50 hover:bg-clinic-50 rounded-xl transition-colors duration-200 group"
                          >
                            <div className="w-10 h-10 bg-clinic-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-sm">📱</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Telefone</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-clinic-600 group-hover:text-clinic-700 text-sm transition-colors">
                                  {salon?.phone || clinicData.phone}
                                </p>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">WhatsApp</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">Clique para abrir no WhatsApp</p>
                            </div>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                      <div
                        id="google-map"
                        className="w-full h-64 md:h-80 flex items-center justify-center"
                      >
                        <div className="text-center text-gray-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-clinic-500 mx-auto mb-2"></div>
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
                        <p className="text-xs text-gray-500">R$ {service.price}</p>
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
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-green-600">R$ {getTotalPrice()}</span>
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
