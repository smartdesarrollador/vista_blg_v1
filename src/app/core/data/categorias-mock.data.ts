import type { BlogCategory } from '../models/categoria.interface';

/**
 * Datos mock de categorías para el blog
 * Incluye categorías principales y subcategorías con colores e iconos
 */
export const CATEGORIES_MOCK: BlogCategory[] = [
  // Categorías principales
  {
    id: 'categoria-1',
    name: 'Desarrollo Web',
    slug: 'desarrollo-web',
    description:
      'Todo sobre desarrollo frontend, backend y full-stack. Frameworks, libraries y mejores prácticas.',
    color: '#3B82F6',
    icon: 'code',
    parentId: undefined,
    parent: undefined,
    children: [],
    postsCount: 45,
    isActive: true,
    order: 1,
    seo: {
      metaTitle: 'Desarrollo Web - Tutoriales y Guías',
      metaDescription:
        'Aprende desarrollo web con nuestros tutoriales sobre Angular, React, Node.js y más tecnologías modernas.',
      keywords: [
        'desarrollo web',
        'frontend',
        'backend',
        'javascript',
        'typescript',
        'angular',
        'react',
      ],
      canonicalUrl: '/blog/categoria/desarrollo-web',
      noIndex: false,
    },
  },
  {
    id: 'categoria-2',
    name: 'Inteligencia Artificial',
    slug: 'inteligencia-artificial',
    description:
      'Machine Learning, Deep Learning, IA generativa y aplicaciones prácticas de la inteligencia artificial.',
    color: '#8B5CF6',
    icon: 'brain',
    parentId: undefined,
    parent: undefined,
    children: [],
    postsCount: 32,
    isActive: true,
    order: 2,
    seo: {
      metaTitle: 'Inteligencia Artificial - Guías y Tutoriales',
      metaDescription:
        'Descubre el mundo de la IA, machine learning y deep learning con ejemplos prácticos y casos de uso.',
      keywords: [
        'inteligencia artificial',
        'machine learning',
        'deep learning',
        'ia',
        'python',
        'tensorflow',
      ],
      canonicalUrl: '/blog/categoria/inteligencia-artificial',
      noIndex: false,
    },
  },
  {
    id: 'categoria-3',
    name: 'DevOps & Cloud',
    slug: 'devops-cloud',
    description:
      'Automatización, CI/CD, contenedores, Kubernetes y servicios en la nube.',
    color: '#10B981',
    icon: 'cloud',
    parentId: undefined,
    parent: undefined,
    children: [],
    postsCount: 28,
    isActive: true,
    order: 3,
    seo: {
      metaTitle: 'DevOps y Cloud Computing - Guías Prácticas',
      metaDescription:
        'Aprende DevOps, CI/CD, Docker, Kubernetes y servicios cloud con tutoriales paso a paso.',
      keywords: [
        'devops',
        'cloud computing',
        'kubernetes',
        'docker',
        'ci/cd',
        'aws',
        'azure',
      ],
      canonicalUrl: '/blog/categoria/devops-cloud',
      noIndex: false,
    },
  },
  {
    id: 'categoria-4',
    name: 'Ciberseguridad',
    slug: 'ciberseguridad',
    description:
      'Seguridad informática, ethical hacking, protección de datos y buenas prácticas de seguridad.',
    color: '#EF4444',
    icon: 'shield',
    parentId: undefined,
    parent: undefined,
    children: [],
    postsCount: 21,
    isActive: true,
    order: 4,
    seo: {
      metaTitle: 'Ciberseguridad - Tutoriales y Mejores Prácticas',
      metaDescription:
        'Aprende sobre seguridad informática, ethical hacking y protección de sistemas con expertos.',
      keywords: [
        'ciberseguridad',
        'ethical hacking',
        'seguridad informatica',
        'pentesting',
        'vulnerabilidades',
      ],
      canonicalUrl: '/blog/categoria/ciberseguridad',
      noIndex: false,
    },
  },
  {
    id: 'categoria-5',
    name: 'UX/UI Design',
    slug: 'ux-ui-design',
    description:
      'Diseño de experiencia de usuario, interfaces, design systems y usabilidad.',
    color: '#F59E0B',
    icon: 'palette',
    parentId: undefined,
    parent: undefined,
    children: [],
    postsCount: 38,
    isActive: true,
    order: 5,
    seo: {
      metaTitle: 'UX/UI Design - Guías de Diseño',
      metaDescription:
        'Mejora tus habilidades de diseño UX/UI con tutoriales sobre Figma, principios de diseño y usabilidad.',
      keywords: [
        'ux design',
        'ui design',
        'figma',
        'design systems',
        'usabilidad',
        'prototipado',
      ],
      canonicalUrl: '/blog/categoria/ux-ui-design',
      noIndex: false,
    },
  },
  {
    id: 'categoria-6',
    name: 'Blockchain & Web3',
    slug: 'blockchain-web3',
    description:
      'Blockchain, criptomonedas, DeFi, NFTs y el futuro de la web descentralizada.',
    color: '#6366F1',
    icon: 'cube',
    parentId: undefined,
    parent: undefined,
    children: [],
    postsCount: 19,
    isActive: true,
    order: 6,
    seo: {
      metaTitle: 'Blockchain y Web3 - Guía Completa',
      metaDescription:
        'Explora el mundo de blockchain, Web3, DeFi y criptomonedas con tutoriales y análisis.',
      keywords: [
        'blockchain',
        'web3',
        'criptomonedas',
        'defi',
        'nft',
        'ethereum',
        'smart contracts',
      ],
      canonicalUrl: '/blog/categoria/blockchain-web3',
      noIndex: false,
    },
  },

  // Subcategorías de Desarrollo Web
  {
    id: 'categoria-7',
    name: 'Frontend',
    slug: 'frontend',
    description:
      'Desarrollo frontend con Angular, React, Vue y tecnologías modernas.',
    color: '#3B82F6',
    icon: 'monitor',
    parentId: 'categoria-1',
    parent: undefined,
    children: [],
    postsCount: 25,
    isActive: true,
    order: 1,
    seo: {
      metaTitle: 'Desarrollo Frontend - Angular, React, Vue',
      metaDescription:
        'Tutoriales de desarrollo frontend con los frameworks más populares y tecnologías modernas.',
      keywords: [
        'frontend',
        'angular',
        'react',
        'vue',
        'javascript',
        'typescript',
        'html',
        'css',
      ],
      canonicalUrl: '/blog/categoria/frontend',
      noIndex: false,
    },
  },
  {
    id: 'categoria-8',
    name: 'Backend',
    slug: 'backend',
    description:
      'Desarrollo backend con Node.js, Python, Java y bases de datos.',
    color: '#059669',
    icon: 'server',
    parentId: 'categoria-1',
    parent: undefined,
    children: [],
    postsCount: 20,
    isActive: true,
    order: 2,
    seo: {
      metaTitle: 'Desarrollo Backend - Node.js, Python, Java',
      metaDescription:
        'Aprende desarrollo backend con tutoriales de APIs, bases de datos y arquitectura de software.',
      keywords: [
        'backend',
        'nodejs',
        'python',
        'java',
        'api',
        'base de datos',
        'arquitectura',
      ],
      canonicalUrl: '/blog/categoria/backend',
      noIndex: false,
    },
  },

  // Subcategorías de Inteligencia Artificial
  {
    id: 'categoria-9',
    name: 'Machine Learning',
    slug: 'machine-learning',
    description: 'Algoritmos de ML, modelos predictivos y análisis de datos.',
    color: '#8B5CF6',
    icon: 'chart-bar',
    parentId: 'categoria-2',
    parent: undefined,
    children: [],
    postsCount: 18,
    isActive: true,
    order: 1,
    seo: {
      metaTitle: 'Machine Learning - Algoritmos y Modelos',
      metaDescription:
        'Domina machine learning con tutoriales prácticos sobre algoritmos, modelos y análisis de datos.',
      keywords: [
        'machine learning',
        'algoritmos',
        'modelos predictivos',
        'python',
        'scikit-learn',
        'pandas',
      ],
      canonicalUrl: '/blog/categoria/machine-learning',
      noIndex: false,
    },
  },
  {
    id: 'categoria-10',
    name: 'Deep Learning',
    slug: 'deep-learning',
    description:
      'Redes neuronales, CNN, RNN y frameworks como TensorFlow y PyTorch.',
    color: '#7C3AED',
    icon: 'layers',
    parentId: 'categoria-2',
    parent: undefined,
    children: [],
    postsCount: 14,
    isActive: true,
    order: 2,
    seo: {
      metaTitle: 'Deep Learning - Redes Neuronales',
      metaDescription:
        'Aprende deep learning con tutoriales sobre redes neuronales, CNN, RNN y frameworks modernos.',
      keywords: [
        'deep learning',
        'redes neuronales',
        'cnn',
        'rnn',
        'tensorflow',
        'pytorch',
      ],
      canonicalUrl: '/blog/categoria/deep-learning',
      noIndex: false,
    },
  },
];

/**
 * Función para obtener una categoría por ID
 */
export function getCategoryById(id: string): BlogCategory | undefined {
  return CATEGORIES_MOCK.find((category) => category.id === id);
}

/**
 * Función para obtener una categoría por slug
 */
export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return CATEGORIES_MOCK.find((category) => category.slug === slug);
}

/**
 * Función para obtener categorías principales (sin padre)
 */
export function getMainCategories(): BlogCategory[] {
  return CATEGORIES_MOCK.filter((category) => !category.parentId);
}

/**
 * Función para obtener subcategorías de una categoría padre
 */
export function getSubcategories(parentId: string): BlogCategory[] {
  return CATEGORIES_MOCK.filter((category) => category.parentId === parentId);
}

/**
 * Función para obtener categorías activas
 */
export function getActiveCategories(): BlogCategory[] {
  return CATEGORIES_MOCK.filter((category) => category.isActive);
}

/**
 * Función para obtener una categoría aleatoria
 */
export function getRandomCategory(): BlogCategory {
  const randomIndex = Math.floor(Math.random() * CATEGORIES_MOCK.length);
  return CATEGORIES_MOCK[randomIndex];
}

/**
 * Función para obtener múltiples categorías aleatorias
 */
export function getRandomCategories(count: number): BlogCategory[] {
  const shuffled = [...CATEGORIES_MOCK].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Función para buscar categorías por término
 */
export function searchCategories(term: string): BlogCategory[] {
  const lowercaseTerm = term.toLowerCase();
  return CATEGORIES_MOCK.filter(
    (category) =>
      category.name.toLowerCase().includes(lowercaseTerm) ||
      category.description.toLowerCase().includes(lowercaseTerm) ||
      category.seo.keywords.some((keyword) => keyword.includes(lowercaseTerm))
  );
}

/**
 * Función para obtener categorías ordenadas por número de posts
 */
export function getCategoriesByPopularity(): BlogCategory[] {
  return [...CATEGORIES_MOCK]
    .filter((category) => category.isActive)
    .sort((a, b) => b.postsCount - a.postsCount);
}

/**
 * Función para construir árbol jerárquico de categorías
 */
export function buildCategoryTree(): BlogCategory[] {
  const mainCategories = getMainCategories();

  return mainCategories.map((category) => ({
    ...category,
    children: getSubcategories(category.id).map((subcat) => ({
      ...subcat,
      parent: category,
    })),
  }));
}
