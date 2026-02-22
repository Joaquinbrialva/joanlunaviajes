'use client';

import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { MdLocationOn, MdPhone, MdEmail } from "react-icons/md";

export default function Footer() {
  return (
    <footer className="w-screen -mx-[calc((100vw-100%)/2)] bg-white dark:bg-gradient-to-b dark:from-slate-700 dark:to-slate-800">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Logo y Descripción */}
          <div className="text-slate-800 dark:text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✈️</span>
              <h3 className="text-xl font-bold">Joanluna Viajes</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
              Agencia de viajes premium dedicada a crear experiencias únicas y memorables alrededor del mundo. Tu viaje comienza con nosotros.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-600 hover:bg-slate-500 flex items-center justify-center text-white transition-colors">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-600 hover:bg-slate-500 flex items-center justify-center text-white transition-colors">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-600 hover:bg-slate-500 flex items-center justify-center text-white transition-colors">
                <FaTwitter size={18} />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div className="text-white">
            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Navegación</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">Inicio</a></li>
              <li><a href="#" className="text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">Destinos</a></li>
              <li><a href="#" className="text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">Ofertas Especiales</a></li>
              <li><a href="#" className="text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">Blog de Viajes</a></li>
              <li><a href="#" className="text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="text-slate-800 dark:text-white">
            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MdLocationOn className="text-orange-400 shrink-0 mt-1" size={18} />
                <p className="text-sm text-slate-700 dark:text-gray-300">Av. Corrientes 2174 Local 192, C1045 Cdad. Autónoma de Buenos Aires<br />Buenos Aires, Argentina</p>
              </div>
              <div className="flex items-center gap-2">
                <MdPhone className="text-orange-400 shrink-0" size={18} />
                <a href="tel:+541123345678" className="text-sm text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">+54 11 2334-5678</a>
              </div>
              <div className="flex items-center gap-2">
                <MdEmail className="text-orange-400 shrink-0" size={18} />
                <a href="mailto:contacto@joanlunaviajes.com" className="text-sm text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition-colors">contacto@joanlunaviajes.com</a>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="text-slate-800 dark:text-white">
            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Ubicación</h4>
            <div className="rounded-lg overflow-hidden border-4 border-gray-600 h-40">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                title="Ubicación"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.968343282597!2d-58.397764800000004!3d-34.604962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccaeb00b32c33%3A0x7398571e0444cb83!2sJOANLUNA!5e0!3m2!1ses-419!2sar!4v1771713850183!5m2!1ses-419!2sar"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-300 dark:border-gray-600 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-sm text-slate-700 dark:text-gray-400">
          <p>© 2025 Joan Luna Viajes. Todos los derechos reservados.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">Política de Privacidad</a>
            <a href="#" className="text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">Términos y Condiciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
