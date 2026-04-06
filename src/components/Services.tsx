import React, { useState } from 'react';
import { Clock, CheckCircle, Sparkles } from 'lucide-react';

interface ServiceCardProps {
  service: any;
  isSelected: boolean;
  onSelect: (service: any) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(service)}
      className={`relative bg-white rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden flex flex-col ${
        isSelected
          ? 'ring-2 ring-clinic-500 shadow-xl shadow-clinic-500/10'
          : 'border border-gray-100 shadow-sm hover:shadow-lg hover:border-clinic-200 hover:-translate-y-0.5'
      }`}
    >
      {/* Faixa colorida no topo */}
      <div className={`h-1 w-full ${isSelected ? 'bg-gradient-to-r from-clinic-400 to-clinic-600' : 'bg-gray-100'}`} />

      {/* Badge Popular */}
      {service.popular && (
        <div className="absolute top-4 right-4">
          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Popular
          </span>
        </div>
      )}

      {/* Check quando selecionado */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-clinic-500 rounded-full flex items-center justify-center shadow-md">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="p-5 md:p-6 flex flex-col flex-1">
        {/* Categoria */}
        <span className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">
          {service.category}
        </span>

        {/* Nome */}
        <h4 className="text-lg font-bold text-gray-900 mb-3 pr-16">{service.name}</h4>

        {/* Descrição */}
        {service.description && (
          <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
            {service.description}
          </p>
        )}

        {/* Preço + duração */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-50 mt-auto">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Valor</p>
            <span className="text-2xl font-bold text-gray-900">R$ {service.price}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-sm pb-0.5">
            <Clock className="w-4 h-4" />
            <span>{service.duration_minutes}min</span>
          </div>
        </div>

        {/* Botão */}
        <button
          className={`w-full mt-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            isSelected
              ? 'bg-clinic-500 text-white shadow-md shadow-clinic-500/20'
              : 'bg-gray-50 text-gray-600 hover:bg-clinic-50 hover:text-clinic-600 border border-gray-100'
          }`}
        >
          {isSelected ? '✓ Selecionado' : 'Selecionar'}
        </button>
      </div>
    </div>
  );
};

const Services = ({ services, onServiceSelect, selectedServices }) => {
  const categories = [...new Set(services.map((s: any) => s.category))];
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s: any) => s.category === selectedCategory);

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Nossas Terapias
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Escolha entre nossa ampla gama de terapias realizadas por profissionais experientes e qualificados
          </p>
        </div>

        {/* Filtros de categoria */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-clinic-500 text-white shadow-md shadow-clinic-500/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas as Terapias
            </button>
            {categories.map((category: any) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-clinic-500 text-white shadow-md shadow-clinic-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Grid de serviços */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service: any) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={!!selectedServices.find((s: any) => s.id === service.id)}
              onSelect={onServiceSelect}
            />
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhuma terapia encontrada
            </h3>
            <p className="text-gray-500 text-sm">
              Não há terapias disponíveis na categoria "{selectedCategory}".
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Services;
