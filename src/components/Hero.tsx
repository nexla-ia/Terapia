import { Sparkles, Clock, Star, Calendar } from 'lucide-react';
import type { Salon } from '../lib/localDatabase';

interface HeroProps {
  onScheduleClick: () => void;
  salon: Salon | null;
}

const Hero = ({ onScheduleClick, salon }: HeroProps) => {
  return (
    <section className="bg-gradient-to-br from-clinic-50 via-white to-clinic-100 py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Stars badge */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-1 bg-white px-5 py-2.5 rounded-full shadow-md border border-gray-100">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-gray-600 font-medium text-sm">Excelência em atendimento</span>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight px-2">
            {salon?.name ? `Bem-vindo ao ${salon.name}` : 'Cuide do seu bem-estar com nossos especialistas.'}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-clinic-500 to-clinic-700">
              Agende online!
            </span>
          </h2>

          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed px-4">
            {salon?.description || 'Escolha a terapia ideal, confira os horários disponíveis e garanta seu atendimento sem sair de casa.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 px-4">
            <button
              onClick={onScheduleClick}
              className="bg-gradient-to-r from-clinic-500 to-clinic-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:from-clinic-600 hover:to-clinic-700 hover:shadow-xl hover:shadow-clinic-500/20 flex items-center justify-center w-full sm:w-auto"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Agendar Agora
            </button>
            <div className="flex items-center space-x-2 text-gray-500">
              <Clock className="w-5 h-5 text-clinic-400" />
              <span>Resposta imediata</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto px-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-white border border-clinic-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Calendar className="w-6 h-6 text-clinic-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Agenda Online</h3>
              <p className="text-gray-500 text-sm">Veja horários disponíveis em tempo real</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white border border-clinic-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Sparkles className="w-6 h-6 text-clinic-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Terapeutas Qualificados</h3>
              <p className="text-gray-500 text-sm">Profissionais experientes e especializados</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white border border-clinic-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Star className="w-6 h-6 text-clinic-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">Bem-Estar Garantido</h3>
              <p className="text-gray-500 text-sm">Clientes satisfeitos recomendam nossas terapias</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
