import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Jewelry from '../models/Jewelry';
import User from '../models/User';
// FIX: Import the `process` object to provide correct TypeScript types for process.argv and process.exit.
import process from 'process';

dotenv.config();

// --- MOCKED DATABASE & STATE ---
const mockJewelryData = [
  {
    id: '1',
    slug: 'anillo-solitario-diamante-eternity',
    name: 'Anillo Solitario "Eternity"',
    description: 'Un clásico atemporal, este anillo solitario de platino presenta un diamante de corte brillante de 1.5 quilates, engastado para maximizar su fuego y resplandor. Perfecto para una propuesta inolvidable.',
    price: 12500,
    currency: 'EUR',
    category: 'Anillo',
    imageUrl: 'https://picsum.photos/id/10/800/800',
    overlayAssetUrl: '/assets/overlays/ring1.png',
    hashtags: ['diamante', 'platino', 'compromiso', 'lujo'],
    sku: 'AUR-R-001',
    isFeatured: true,
  },
  {
    id: '2',
    slug: 'collar-cascada-zafiros-celestiales',
    name: 'Collar "Cascada Celestial"',
    description: 'Este exquisito collar de oro blanco de 18k presenta una cascada de zafiros azules y diamantes, evocando una noche estrellada. Una pieza central que no pasará desapercibida.',
    price: 21800,
    currency: 'EUR',
    category: 'Collar',
    imageUrl: 'https://picsum.photos/id/20/800/800',
    overlayAssetUrl: '/assets/overlays/necklace1.png',
    hashtags: ['zafiro', 'oro blanco', 'gala', 'diamantes'],
    sku: 'AUR-N-001',
    isFeatured: true,
  },
  {
    id: '3',
    slug: 'pulsera-rio-de-esmeraldas',
    name: 'Pulsera "Río de Esmeraldas"',
    description: 'Una pulsera de oro amarillo de 18k con una hilera de esmeraldas colombianas de talla ovalada, intercaladas con brillantes diamantes. Lujo y color en tu muñeca.',
    price: 18600,
    currency: 'EUR',
    category: 'Pulsera',
    imageUrl: 'https://picsum.photos/id/30/800/800',
    overlayAssetUrl: '/assets/overlays/bracelet1.png',
    hashtags: ['esmeralda', 'oro amarillo', 'brazalete', 'color'],
    sku: 'AUR-B-001',
    isFeatured: false,
  },
  {
    id: '4',
    slug: 'pendientes-lagrimas-de-luna',
    name: 'Pendientes "Lágrimas de Luna"',
    description: 'Pendientes colgantes de platino con perlas de Akoya y un halo de diamantes. Su movimiento sutil y su brillo etéreo los hacen perfectos para cualquier ocasión especial.',
    price: 8900,
    currency: 'EUR',
    category: 'Pendiente',
    imageUrl: 'https://picsum.photos/id/40/800/800',
    overlayAssetUrl: '/assets/overlays/earring1.png',
    hashtags: ['perlas', 'platino', 'boda', 'elegancia'],
    sku: 'AUR-E-001',
    isFeatured: true,
  },
  {
    id: '5',
    slug: 'reloj-cronografo-aurora-tempus',
    name: 'Reloj "Aurora Tempus"',
    description: 'El cronógrafo insignia de nuestra casa. Caja de acero inoxidable, esfera azul profundo y movimiento automático suizo. Un símbolo de precisión y estilo para el hombre moderno.',
    price: 9750,
    currency: 'EUR',
    category: 'Reloj',
    imageUrl: 'https://picsum.photos/id/50/800/800',
    overlayAssetUrl: '/assets/overlays/watch1.png',
    hashtags: ['reloj', 'acero', 'suizo', 'cronógrafo'],
    sku: 'AUR-W-001',
    isFeatured: false,
  },
];


const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('MONGO_URI not defined in .env file');
            process.exit(1);
        }
        await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected for Seeding`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        } else {
            console.error('An unknown error occurred during DB connection');
        }
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();
        
        await Jewelry.deleteMany();
        await User.deleteMany();

        await Jewelry.insertMany(mockJewelryData);

        await User.create({
            email: 'admin@aurora.com',
            password: 'password123',
        });

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        
        await Jewelry.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
