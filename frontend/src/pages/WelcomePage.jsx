import { Link } from 'react-router-dom';
import { Gavel, ArrowLeft } from 'lucide-react';
import { FutureLuckLogo } from '@/components/FutureLuckLogo';

export default function WelcomePage() {
  return (
    <div className="min-h-screen fl-gradient-blue text-white flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden">
      <Link
        to="/"
        className="self-start inline-flex items-center gap-1.5 text-blue-100 hover:text-white text-sm font-bold z-10"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </Link>
      {/* Decorative golden arcs */}
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full border-4 border-[#FFD200]/30 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full border-2 border-white/10 pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center text-center mt-6">
        <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-[#FFD200] flex items-center justify-center mb-5 shadow-xl">
          <Gavel className="w-12 h-12 text-[#FFD200]" />
        </div>

        <FutureLuckLogo size="lg" />
        <p className="text-sm font-semibold text-blue-100 mt-3 tracking-wide">
          Achete • Participe • Gagne • Encaisse
        </p>

        <h1 className="text-3xl font-extrabold mt-8 leading-tight">
          Votre chance,
          <br />
          notre priorité.
        </h1>

        <div className="w-48 h-1 rounded-full fl-gradient-gold mt-5 opacity-90" />
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4 mt-10">
        <Link
          to="/register"
          className="w-full fl-gradient-gold text-[#001B6B] font-extrabold text-lg py-3.5 rounded-full text-center shadow-lg hover:brightness-95 transition"
        >
          Créer un compte
        </Link>
        <Link
          to="/login"
          className="w-full bg-white text-[#0033B3] font-extrabold text-lg py-3.5 rounded-full text-center shadow-lg hover:bg-blue-50 transition"
        >
          Se connecter
        </Link>
      </div>

      <p className="text-sm italic text-blue-100/90 mt-8">Votre chance. Notre priorité.</p>
    </div>
  );
}
