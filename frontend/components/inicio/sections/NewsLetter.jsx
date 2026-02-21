import { Button, Input, InputGroup } from "@heroui/react";
import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";

export default function NewsLetter() {

  return (
    <div className="w-screen -mx-[calc((100vw-100%)/2)] py-16 bg-linear-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Patrón de puntos */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          ¡No te pierdas ninguna oferta!
        </h2>

        <p className="text-gray-200 mb-8">
          Suscribíte a nuestro newsletter y recibí descuentos exclusivos directo a tu mail.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <InputGroup>
            <InputGroup.Prefix>
              <FaEnvelope className="size-4 text-muted" />
            </InputGroup.Prefix>
            <InputGroup.Input className="w-full max-w-80" placeholder="nombre@email.com" />
          </InputGroup>
          <Button>
            Suscribirse
          </Button>
        </div>
      </div>
    </div>
  );
}