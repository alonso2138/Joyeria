
import { images } from '../utils/images';

export const brandingConfig = {
  tenantId: 'example-tryon',
  brandName: "",
  brandSubtitle: "Esta pagina se personaliza con tu marca",
  primaryColor: "#D4AF37", // gold
  secondaryColor: "#111111", // dark grey/black
  accentColor: "#FFFFFF", // white
  backgroundGradient: "linear-gradient(135deg, #050509, #1C1C24)",
  fontFamily: "'Playfair Display', serif",
  logoLightUrl: images.logos.light,
  logoDarkUrl: images.logos.dark,
  hero: {
    title: "Joyas que cuentan tu historia",
    subtitle: "Descubre cÃ³mo brillan en tu piel antes de entrar en la tienda.",
    ctaExplore: "Explorar colecciÃ³n",
    ctaTryOn: "Probar joyas en tu piel"
  },
  footer: {
    address: "Calle de Serrano 4, 28001 Madrid, EspaÃ±a",
    phone: "+34 912 345 678",
    email: "contacto@joyeriaaurora.com",
    instagram: "https://instagram.com/joyeriaaurora",
    facebook: "https://facebook.com/joyeriaaurora",
    twitter: "https://twitter.com/joyeriaaurora",
  }
};
