import type { BlogAuthor } from '../models/author.interface';

/**
 * Datos mock de autores para el blog
 * Incluye avatares de alta calidad de Unsplash y biografías realistas
 */
export const AUTHORS_MOCK: BlogAuthor[] = [
  {
    id: 'autor-1',
    name: 'María García López',
    slug: 'maria-garcia-lopez',
    email: 'maria.garcia@techblog.com',
    bio: 'Desarrolladora Full Stack con más de 8 años de experiencia en tecnologías web. Especialista en Angular, React y Node.js. Passionate about clean code and user experience.',
    avatar:
      'https://images.unsplash.com/photo-1494790108755-2616c40ca10d?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://mariagarcia.dev',
      twitter: 'https://twitter.com/mariagarcia_dev',
      linkedin: 'https://linkedin.com/in/mariagarcia-dev',
      github: 'https://github.com/mariagarcia',
    },
    isActive: true,
    joinedAt: new Date('2022-01-15'),
  },
  {
    id: 'autor-2',
    name: 'Carlos Rodríguez Martín',
    slug: 'carlos-rodriguez-martin',
    email: 'carlos.rodriguez@techblog.com',
    bio: 'Arquitecto de Software y consultor en transformación digital. Expert en microservicios, cloud computing y DevOps. Mentor de desarrolladores junior.',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://carlosrodriguez.tech',
      twitter: 'https://twitter.com/carlos_dev',
      linkedin: 'https://linkedin.com/in/carlosrodriguez-architect',
      github: 'https://github.com/carlosrodriguez',
    },
    isActive: true,
    joinedAt: new Date('2021-09-10'),
  },
  {
    id: 'autor-3',
    name: 'Ana Fernández Silva',
    slug: 'ana-fernandez-silva',
    email: 'ana.fernandez@techblog.com',
    bio: 'UX/UI Designer y Frontend Developer. Especializada en design systems y accessibility. Apasionada por crear experiencias digitales inclusivas y funcionales.',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://anafernandez.design',
      twitter: 'https://twitter.com/ana_ux_design',
      linkedin: 'https://linkedin.com/in/anafernandez-uxui',
      instagram: 'https://instagram.com/ana_designs',
    },
    isActive: true,
    joinedAt: new Date('2022-03-22'),
  },
  {
    id: 'autor-4',
    name: 'David López Herrera',
    slug: 'david-lopez-herrera',
    email: 'david.lopez@techblog.com',
    bio: 'Data Scientist y Machine Learning Engineer. PhD en Inteligencia Artificial. Especialista en análisis predictivo y algoritmos de recomendación.',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://davidlopez.ai',
      twitter: 'https://twitter.com/david_ml_expert',
      linkedin: 'https://linkedin.com/in/davidlopez-datascience',
      github: 'https://github.com/davidlopez-ai',
    },
    isActive: true,
    joinedAt: new Date('2021-11-08'),
  },
  {
    id: 'autor-5',
    name: 'Laura Sánchez Ruiz',
    slug: 'laura-sanchez-ruiz',
    email: 'laura.sanchez@techblog.com',
    bio: 'Cybersecurity Specialist y Ethical Hacker. CISSP certified. Especializada en pentesting y security awareness. Educadora en seguridad informática.',
    avatar:
      'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://laurasanchez.security',
      twitter: 'https://twitter.com/laura_cybersec',
      linkedin: 'https://linkedin.com/in/laurasanchez-security',
    },
    isActive: true,
    joinedAt: new Date('2022-05-12'),
  },
  {
    id: 'autor-6',
    name: 'Roberto Morales Castro',
    slug: 'roberto-morales-castro',
    email: 'roberto.morales@techblog.com',
    bio: 'DevOps Engineer y Cloud Architect. AWS & Azure certified. Especialista en CI/CD, Kubernetes y Infrastructure as Code. Automation enthusiast.',
    avatar:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://robertomorales.cloud',
      twitter: 'https://twitter.com/roberto_devops',
      linkedin: 'https://linkedin.com/in/robertomorales-devops',
      github: 'https://github.com/robertomorales',
    },
    isActive: true,
    joinedAt: new Date('2021-07-20'),
  },
  {
    id: 'autor-7',
    name: 'Carmen Jiménez Vega',
    slug: 'carmen-jimenez-vega',
    email: 'carmen.jimenez@techblog.com',
    bio: 'Product Manager y Agile Coach. Scrum Master certified. Especializada en metodologías ágiles y gestión de productos digitales. Speaker internacional.',
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://carmenjimenez.pm',
      twitter: 'https://twitter.com/carmen_agile_pm',
      linkedin: 'https://linkedin.com/in/carmenjimenez-productmanager',
    },
    isActive: true,
    joinedAt: new Date('2022-02-14'),
  },
  {
    id: 'autor-8',
    name: 'Alejandro Torres Díaz',
    slug: 'alejandro-torres-diaz',
    email: 'alejandro.torres@techblog.com',
    bio: 'Blockchain Developer y Smart Contracts specialist. Ethereum & Solidity expert. Founder de startup fintech. Evangelista de Web3 y DeFi.',
    avatar:
      'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=400&h=400&fit=crop&crop=face&auto=format',
    socialLinks: {
      website: 'https://alejandrotorres.blockchain',
      twitter: 'https://twitter.com/alejandro_web3',
      linkedin: 'https://linkedin.com/in/alejandrotorres-blockchain',
      github: 'https://github.com/alejandrotorres',
    },
    isActive: true,
    joinedAt: new Date('2022-08-01'),
  },
];

/**
 * Función para obtener un autor por ID
 */
export function getAuthorById(id: string): BlogAuthor | undefined {
  return AUTHORS_MOCK.find((author) => author.id === id);
}

/**
 * Función para obtener un autor por slug
 */
export function getAuthorBySlug(slug: string): BlogAuthor | undefined {
  return AUTHORS_MOCK.find((author) => author.slug === slug);
}

/**
 * Función para obtener autores activos
 */
export function getActiveAuthors(): BlogAuthor[] {
  return AUTHORS_MOCK.filter((author) => author.isActive);
}

/**
 * Función para obtener un autor aleatorio
 */
export function getRandomAuthor(): BlogAuthor {
  const randomIndex = Math.floor(Math.random() * AUTHORS_MOCK.length);
  return AUTHORS_MOCK[randomIndex];
}

/**
 * Función para buscar autores por término
 */
export function searchAuthors(term: string): BlogAuthor[] {
  const lowercaseTerm = term.toLowerCase();
  return AUTHORS_MOCK.filter(
    (author) =>
      author.name.toLowerCase().includes(lowercaseTerm) ||
      author.bio.toLowerCase().includes(lowercaseTerm) ||
      author.email.toLowerCase().includes(lowercaseTerm)
  );
}
