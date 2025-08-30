import type { BlogPost } from '../models/blog.interface';
import { AUTHORS_MOCK, getRandomAuthor } from './authors-mock.data';
import { CATEGORIES_MOCK, getRandomCategories } from './categorias-mock.data';

/**
 * Función helper para generar contenido HTML realista
 */
function generateHtmlContent(title: string, topic: string): string {
  const introductions = [
    `<p>En el mundo del desarrollo moderno, ${topic.toLowerCase()} se ha convertido en una habilidad fundamental para cualquier desarrollador.</p>`,
    `<p>Si estás buscando mejorar tus habilidades en ${topic.toLowerCase()}, has llegado al lugar correcto.</p>`,
    `<p>En esta guía completa, exploraremos todo lo que necesitas saber sobre ${topic.toLowerCase()}.</p>`,
    `<p>Desde conceptos básicos hasta técnicas avanzadas, ${topic.toLowerCase()} ofrece infinitas posibilidades.</p>`,
  ];

  const middleContent = [
    '<h2>¿Por qué es importante?</h2><p>La importancia de dominar esta tecnología radica en su amplia adopción en la industria y su capacidad para resolver problemas complejos de manera eficiente.</p>',
    '<h2>Conceptos fundamentales</h2><p>Antes de sumergirnos en los aspectos más avanzados, es crucial entender los fundamentos que hacen posible esta tecnología.</p>',
    '<h2>Mejores prácticas</h2><p>A lo largo de los años, la comunidad ha desarrollado un conjunto de mejores prácticas que todo desarrollador debería conocer y aplicar.</p>',
    '<h2>Casos de uso prácticos</h2><p>Veamos algunos ejemplos reales de cómo esta tecnología está siendo utilizada en proyectos de producción.</p>',
  ];

  const codeExample = `
    <h3>Ejemplo práctico</h3>
    <pre><code class="language-javascript">
// Ejemplo de implementación
function ejemplo() {
  console.log('¡Hola mundo desde ${topic}!');
  return true;
}
    </code></pre>
    <p>Este ejemplo muestra una implementación básica que puedes usar como punto de partida.</p>
  `;

  const conclusion =
    '<h2>Conclusión</h2><p>Como hemos visto, esta tecnología ofrece grandes beneficios y oportunidades. Con práctica y dedicación, podrás dominar estos conceptos y aplicarlos en tus proyectos.</p>';

  const randomIntro =
    introductions[Math.floor(Math.random() * introductions.length)];
  const randomMiddle =
    middleContent[Math.floor(Math.random() * middleContent.length)];

  return `${randomIntro}${randomMiddle}${codeExample}${conclusion}`;
}

/**
 * Función helper para calcular tiempo de lectura
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Datos mock de posts del blog
 * Incluye contenido variado, imágenes de Unsplash y metadata SEO completa
 */
export const BLOG_POSTS_MOCK: BlogPost[] = [
  // Posts de Desarrollo Web
  {
    id: 'post-1',
    title: 'Guía Completa de Angular 18: Novedades y Mejores Prácticas',
    slug: 'guia-completa-angular-18-novedades-mejores-practicas',
    content: generateHtmlContent('Angular 18', 'Angular 18'),
    excerpt:
      'Descubre todas las novedades de Angular 18, desde las nuevas funcionalidades hasta las mejores prácticas para desarrollo moderno.',
    featuredImage:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Código Angular en pantalla de computadora',
    status: 'published',
    authorId: 'autor-1',
    author: AUTHORS_MOCK[0],
    categoryIds: ['categoria-1', 'categoria-7'],
    categories: [CATEGORIES_MOCK[0], CATEGORIES_MOCK[6]],
    tags: ['angular', 'frontend', 'typescript', 'desarrollo web', 'framework'],
    readingTime: 8,
    views: 2847,
    likes: 156,
    commentsCount: 23,
    allowComments: true,
    featured: true,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    seo: {
      metaDescription:
        'Guía completa de Angular 18 con todas las novedades, características y mejores prácticas para desarrollo moderno de aplicaciones web.',
      keywords: [
        'angular 18',
        'angular tutorial',
        'frontend development',
        'typescript',
        'web development',
      ],
      noIndex: false,
      noFollow: false,
      ogTitle: 'Angular 18: Guía Completa con Novedades y Mejores Prácticas',
      ogDescription:
        'Aprende todo sobre Angular 18: nuevas características, mejoras de rendimiento y mejores prácticas.',
      ogImage:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&auto=format',
      twitterCard: 'summary_large_image',
      twitterTitle: 'Guía Completa de Angular 18',
      twitterDescription:
        'Descubre las novedades y mejores prácticas de Angular 18',
      twitterImage:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop&auto=format',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: [
        'facebook',
        'twitter',
        'linkedin',
        'whatsapp',
        'copy-link',
      ],
      shareText: 'Descubre las novedades de Angular 18',
      suggestedHashtags: ['Angular18', 'Frontend', 'WebDev', 'TypeScript'],
    },
  },

  {
    id: 'post-2',
    title: 'Machine Learning con Python: De Principiante a Experto',
    slug: 'machine-learning-python-principiante-experto',
    content: generateHtmlContent(
      'Machine Learning',
      'Machine Learning con Python'
    ),
    excerpt:
      'Aprende Machine Learning desde cero con Python. Guía paso a paso con ejemplos prácticos y proyectos reales.',
    featuredImage:
      'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Algoritmos de machine learning visualizados',
    status: 'published',
    authorId: 'autor-4',
    author: AUTHORS_MOCK[3],
    categoryIds: ['categoria-2', 'categoria-9'],
    categories: [CATEGORIES_MOCK[1], CATEGORIES_MOCK[8]],
    tags: [
      'machine learning',
      'python',
      'inteligencia artificial',
      'data science',
      'algoritmos',
    ],
    readingTime: 12,
    views: 3421,
    likes: 287,
    commentsCount: 45,
    allowComments: true,
    featured: true,
    createdAt: new Date('2024-01-10T14:30:00Z'),
    updatedAt: new Date('2024-01-10T14:30:00Z'),
    publishedAt: new Date('2024-01-10T14:30:00Z'),
    seo: {
      metaDescription:
        'Curso completo de Machine Learning con Python desde principiante hasta experto. Incluye ejemplos prácticos y proyectos reales.',
      keywords: [
        'machine learning',
        'python tutorial',
        'data science',
        'artificial intelligence',
        'sklearn',
      ],
      noIndex: false,
      noFollow: false,
      ogTitle: 'Machine Learning con Python: Curso Completo',
      ogDescription:
        'Domina Machine Learning con Python desde cero hasta nivel experto',
      ogImage:
        'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=1200&h=630&fit=crop&auto=format',
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Aprende Machine Learning con Python desde cero',
      suggestedHashtags: ['MachineLearning', 'Python', 'DataScience', 'AI'],
    },
  },

  {
    id: 'post-3',
    title: 'Docker y Kubernetes: Guía Práctica para DevOps',
    slug: 'docker-kubernetes-guia-practica-devops',
    content: generateHtmlContent(
      'Docker y Kubernetes',
      'containerización y orquestación'
    ),
    excerpt:
      'Domina Docker y Kubernetes con esta guía práctica. Desde contenedores básicos hasta orquestación avanzada.',
    featuredImage:
      'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Containers y orquestación en la nube',
    status: 'published',
    authorId: 'autor-6',
    author: AUTHORS_MOCK[5],
    categoryIds: ['categoria-3'],
    categories: [CATEGORIES_MOCK[2]],
    tags: ['docker', 'kubernetes', 'devops', 'containers', 'cloud'],
    readingTime: 15,
    views: 2156,
    likes: 198,
    commentsCount: 34,
    allowComments: true,
    featured: false,
    createdAt: new Date('2024-01-08T09:15:00Z'),
    updatedAt: new Date('2024-01-08T09:15:00Z'),
    publishedAt: new Date('2024-01-08T09:15:00Z'),
    seo: {
      metaDescription:
        'Guía práctica de Docker y Kubernetes para DevOps. Aprende containerización y orquestación con ejemplos reales.',
      keywords: [
        'docker tutorial',
        'kubernetes guide',
        'devops',
        'containers',
        'microservices',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Domina Docker y Kubernetes con esta guía práctica',
      suggestedHashtags: ['Docker', 'Kubernetes', 'DevOps', 'Cloud'],
    },
  },

  {
    id: 'post-4',
    title: 'Ciberseguridad en 2024: Tendencias y Mejores Prácticas',
    slug: 'ciberseguridad-2024-tendencias-mejores-practicas',
    content: generateHtmlContent('Ciberseguridad', 'ciberseguridad moderna'),
    excerpt:
      'Análisis completo de las tendencias en ciberseguridad para 2024 y las mejores prácticas para proteger tu organización.',
    featuredImage:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Seguridad digital y protección de datos',
    status: 'published',
    authorId: 'autor-5',
    author: AUTHORS_MOCK[4],
    categoryIds: ['categoria-4'],
    categories: [CATEGORIES_MOCK[3]],
    tags: [
      'ciberseguridad',
      'security',
      'ethical hacking',
      'pentesting',
      'vulnerabilidades',
    ],
    readingTime: 10,
    views: 1876,
    likes: 134,
    commentsCount: 28,
    allowComments: true,
    featured: false,
    createdAt: new Date('2024-01-05T16:45:00Z'),
    updatedAt: new Date('2024-01-05T16:45:00Z'),
    publishedAt: new Date('2024-01-05T16:45:00Z'),
    seo: {
      metaDescription:
        'Descubre las tendencias de ciberseguridad en 2024 y las mejores prácticas para proteger tu organización de amenazas.',
      keywords: [
        'ciberseguridad 2024',
        'security trends',
        'cyber threats',
        'data protection',
        'ethical hacking',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Tendencias de ciberseguridad en 2024',
      suggestedHashtags: [
        'Cybersecurity',
        'InfoSec',
        'DataProtection',
        'Security',
      ],
    },
  },

  {
    id: 'post-5',
    title: 'Design Systems en Figma: Creando Consistencia Visual',
    slug: 'design-systems-figma-consistencia-visual',
    content: generateHtmlContent('Design Systems', 'design systems modernos'),
    excerpt:
      'Aprende a crear design systems efectivos en Figma para mantener consistencia visual en tus proyectos de diseño.',
    featuredImage:
      'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Diseño de interfaces y sistemas de diseño',
    status: 'published',
    authorId: 'autor-3',
    author: AUTHORS_MOCK[2],
    categoryIds: ['categoria-5'],
    categories: [CATEGORIES_MOCK[4]],
    tags: ['design systems', 'figma', 'ux design', 'ui design', 'prototyping'],
    readingTime: 7,
    views: 1543,
    likes: 89,
    commentsCount: 16,
    allowComments: true,
    featured: false,
    createdAt: new Date('2024-01-03T11:20:00Z'),
    updatedAt: new Date('2024-01-03T11:20:00Z'),
    publishedAt: new Date('2024-01-03T11:20:00Z'),
    seo: {
      metaDescription:
        'Guía completa para crear design systems en Figma. Aprende a mantener consistencia visual en tus proyectos de diseño.',
      keywords: [
        'design systems',
        'figma tutorial',
        'ui ux design',
        'design consistency',
        'prototyping',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Crea design systems efectivos en Figma',
      suggestedHashtags: ['DesignSystems', 'Figma', 'UXDesign', 'UIDesign'],
    },
  },

  {
    id: 'post-6',
    title: 'Blockchain para Desarrolladores: Smart Contracts con Solidity',
    slug: 'blockchain-desarrolladores-smart-contracts-solidity',
    content: generateHtmlContent('Blockchain', 'desarrollo blockchain'),
    excerpt:
      'Introducción práctica al desarrollo blockchain. Aprende a crear smart contracts con Solidity desde cero.',
    featuredImage:
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Blockchain y criptomonedas tecnología',
    status: 'published',
    authorId: 'autor-8',
    author: AUTHORS_MOCK[7],
    categoryIds: ['categoria-6'],
    categories: [CATEGORIES_MOCK[5]],
    tags: ['blockchain', 'smart contracts', 'solidity', 'ethereum', 'web3'],
    readingTime: 13,
    views: 967,
    likes: 72,
    commentsCount: 19,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-12-28T13:30:00Z'),
    updatedAt: new Date('2023-12-28T13:30:00Z'),
    publishedAt: new Date('2023-12-28T13:30:00Z'),
    seo: {
      metaDescription:
        'Aprende desarrollo blockchain y smart contracts con Solidity. Guía práctica para desarrolladores desde cero.',
      keywords: [
        'blockchain development',
        'smart contracts',
        'solidity tutorial',
        'ethereum',
        'web3 development',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Aprende desarrollo blockchain con Solidity',
      suggestedHashtags: ['Blockchain', 'Solidity', 'Web3', 'SmartContracts'],
    },
  },

  // Continúo agregando más posts variados...
  {
    id: 'post-7',
    title: 'Node.js y Express: Construyendo APIs RESTful Escalables',
    slug: 'nodejs-express-apis-restful-escalables',
    content: generateHtmlContent(
      'Node.js y Express',
      'desarrollo backend moderno'
    ),
    excerpt:
      'Domina el desarrollo backend con Node.js y Express. Construye APIs RESTful robustas y escalables.',
    featuredImage:
      'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Código Node.js en editor de texto',
    status: 'published',
    authorId: 'autor-2',
    author: AUTHORS_MOCK[1],
    categoryIds: ['categoria-1', 'categoria-8'],
    categories: [CATEGORIES_MOCK[0], CATEGORIES_MOCK[7]],
    tags: ['nodejs', 'express', 'backend', 'api rest', 'javascript'],
    readingTime: 11,
    views: 2234,
    likes: 167,
    commentsCount: 31,
    allowComments: true,
    featured: true,
    createdAt: new Date('2023-12-25T08:15:00Z'),
    updatedAt: new Date('2023-12-25T08:15:00Z'),
    publishedAt: new Date('2023-12-25T08:15:00Z'),
    seo: {
      metaDescription:
        'Guía completa de Node.js y Express para crear APIs RESTful escalables. Tutorial paso a paso con mejores prácticas.',
      keywords: [
        'nodejs tutorial',
        'express js',
        'rest api',
        'backend development',
        'javascript server',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Construye APIs escalables con Node.js y Express',
      suggestedHashtags: ['NodeJS', 'Express', 'Backend', 'API'],
    },
  },

  {
    id: 'post-8',
    title: 'TensorFlow 2.0: Deep Learning para Principiantes',
    slug: 'tensorflow-deep-learning-principiantes',
    content: generateHtmlContent('TensorFlow', 'deep learning'),
    excerpt:
      'Inicia tu journey en deep learning con TensorFlow 2.0. Tutorial completo desde conceptos básicos hasta tu primera red neuronal.',
    featuredImage:
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Visualización de redes neuronales',
    status: 'published',
    authorId: 'autor-4',
    author: AUTHORS_MOCK[3],
    categoryIds: ['categoria-2', 'categoria-10'],
    categories: [CATEGORIES_MOCK[1], CATEGORIES_MOCK[9]],
    tags: ['tensorflow', 'deep learning', 'neural networks', 'python', 'ai'],
    readingTime: 14,
    views: 1876,
    likes: 145,
    commentsCount: 26,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-12-20T15:45:00Z'),
    updatedAt: new Date('2023-12-20T15:45:00Z'),
    publishedAt: new Date('2023-12-20T15:45:00Z'),
    seo: {
      metaDescription:
        'Aprende deep learning con TensorFlow 2.0 desde cero. Tutorial completo para principiantes con ejemplos prácticos.',
      keywords: [
        'tensorflow tutorial',
        'deep learning',
        'neural networks',
        'ai tutorial',
        'machine learning python',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Aprende Deep Learning con TensorFlow 2.0',
      suggestedHashtags: [
        'TensorFlow',
        'DeepLearning',
        'AI',
        'MachineLearning',
      ],
    },
  },

  {
    id: 'post-9',
    title: 'React vs Angular: Comparativa Completa 2024',
    slug: 'react-vs-angular-comparativa-2024',
    content: generateHtmlContent(
      'React vs Angular',
      'comparación de frameworks'
    ),
    excerpt:
      'Análisis detallado de React vs Angular en 2024. Performance, ecosistema, curva de aprendizaje y casos de uso.',
    featuredImage:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Comparación entre React y Angular',
    status: 'published',
    authorId: 'autor-1',
    author: AUTHORS_MOCK[0],
    categoryIds: ['categoria-1', 'categoria-7'],
    categories: [CATEGORIES_MOCK[0], CATEGORIES_MOCK[6]],
    tags: ['react', 'angular', 'frontend', 'frameworks', 'comparación'],
    readingTime: 9,
    views: 3245,
    likes: 234,
    commentsCount: 67,
    allowComments: true,
    featured: true,
    createdAt: new Date('2023-12-15T12:00:00Z'),
    updatedAt: new Date('2023-12-15T12:00:00Z'),
    publishedAt: new Date('2023-12-15T12:00:00Z'),
    seo: {
      metaDescription:
        'Comparativa completa entre React y Angular en 2024. Análisis de performance, ecosistema y casos de uso.',
      keywords: [
        'react vs angular',
        'frontend frameworks',
        'javascript frameworks',
        'web development',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'React vs Angular: ¿Cuál elegir en 2024?',
      suggestedHashtags: ['React', 'Angular', 'Frontend', 'WebDev'],
    },
  },

  {
    id: 'post-10',
    title: 'AWS Lambda: Serverless Computing en la Práctica',
    slug: 'aws-lambda-serverless-computing-practica',
    content: generateHtmlContent('AWS Lambda', 'computación serverless'),
    excerpt:
      'Domina AWS Lambda y el paradigma serverless. Desde funciones básicas hasta arquitecturas complejas.',
    featuredImage:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Computación en la nube y serverless',
    status: 'published',
    authorId: 'autor-6',
    author: AUTHORS_MOCK[5],
    categoryIds: ['categoria-3'],
    categories: [CATEGORIES_MOCK[2]],
    tags: ['aws', 'lambda', 'serverless', 'cloud computing', 'microservices'],
    readingTime: 12,
    views: 1567,
    likes: 98,
    commentsCount: 22,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-12-10T14:30:00Z'),
    updatedAt: new Date('2023-12-10T14:30:00Z'),
    publishedAt: new Date('2023-12-10T14:30:00Z'),
    seo: {
      metaDescription:
        'Guía práctica de AWS Lambda y serverless computing. Aprende a crear funciones escalables en la nube.',
      keywords: [
        'aws lambda',
        'serverless',
        'cloud computing',
        'aws tutorial',
        'microservices',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Aprende serverless computing con AWS Lambda',
      suggestedHashtags: ['AWS', 'Serverless', 'Cloud', 'Lambda'],
    },
  },

  {
    id: 'post-11',
    title: 'Penetration Testing: Metodología OWASP',
    slug: 'penetration-testing-metodologia-owasp',
    content: generateHtmlContent('Penetration Testing', 'ethical hacking'),
    excerpt:
      'Guía completa de penetration testing siguiendo la metodología OWASP. Herramientas y técnicas para ethical hackers.',
    featuredImage:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Hacking ético y pruebas de penetración',
    status: 'published',
    authorId: 'autor-5',
    author: AUTHORS_MOCK[4],
    categoryIds: ['categoria-4'],
    categories: [CATEGORIES_MOCK[3]],
    tags: [
      'pentesting',
      'owasp',
      'ethical hacking',
      'cybersecurity',
      'vulnerabilities',
    ],
    readingTime: 16,
    views: 1234,
    likes: 87,
    commentsCount: 15,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-12-05T10:15:00Z'),
    updatedAt: new Date('2023-12-05T10:15:00Z'),
    publishedAt: new Date('2023-12-05T10:15:00Z'),
    seo: {
      metaDescription:
        'Aprende penetration testing con metodología OWASP. Guía completa para ethical hackers y profesionales de seguridad.',
      keywords: [
        'penetration testing',
        'owasp',
        'ethical hacking',
        'cybersecurity testing',
        'security audit',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Metodología OWASP para penetration testing',
      suggestedHashtags: [
        'PenTesting',
        'OWASP',
        'EthicalHacking',
        'CyberSecurity',
      ],
    },
  },

  {
    id: 'post-12',
    title: 'Diseño Centrado en el Usuario: Proceso UX Completo',
    slug: 'diseno-centrado-usuario-proceso-ux-completo',
    content: generateHtmlContent('Diseño UX', 'experiencia de usuario'),
    excerpt:
      'Proceso completo de diseño centrado en el usuario. Research, prototipado, testing y iteración.',
    featuredImage:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Proceso de diseño UX y prototipado',
    status: 'published',
    authorId: 'autor-3',
    author: AUTHORS_MOCK[2],
    categoryIds: ['categoria-5'],
    categories: [CATEGORIES_MOCK[4]],
    tags: [
      'ux design',
      'user research',
      'prototyping',
      'usability testing',
      'design thinking',
    ],
    readingTime: 11,
    views: 2106,
    likes: 158,
    commentsCount: 29,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-12-01T09:30:00Z'),
    updatedAt: new Date('2023-12-01T09:30:00Z'),
    publishedAt: new Date('2023-12-01T09:30:00Z'),
    seo: {
      metaDescription:
        'Proceso completo de diseño UX centrado en el usuario. Research, prototipado, testing y mejores prácticas.',
      keywords: [
        'ux design',
        'user centered design',
        'user research',
        'prototyping',
        'usability testing',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Proceso completo de diseño UX centrado en el usuario',
      suggestedHashtags: [
        'UXDesign',
        'UserResearch',
        'DesignThinking',
        'Prototyping',
      ],
    },
  },

  {
    id: 'post-13',
    title: 'NFTs y Metaverso: El Futuro de los Activos Digitales',
    slug: 'nfts-metaverso-futuro-activos-digitales',
    content: generateHtmlContent('NFTs y Metaverso', 'activos digitales'),
    excerpt:
      'Explora el mundo de los NFTs y el metaverso. Tecnología, casos de uso y oportunidades en el futuro digital.',
    featuredImage:
      'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'NFTs y realidad virtual metaverso',
    status: 'published',
    authorId: 'autor-8',
    author: AUTHORS_MOCK[7],
    categoryIds: ['categoria-6'],
    categories: [CATEGORIES_MOCK[5]],
    tags: [
      'nft',
      'metaverso',
      'blockchain',
      'digital assets',
      'virtual reality',
    ],
    readingTime: 8,
    views: 876,
    likes: 54,
    commentsCount: 12,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-11-28T16:20:00Z'),
    updatedAt: new Date('2023-11-28T16:20:00Z'),
    publishedAt: new Date('2023-11-28T16:20:00Z'),
    seo: {
      metaDescription:
        'Descubre el futuro de los NFTs y el metaverso. Tecnología blockchain, casos de uso y oportunidades digitales.',
      keywords: [
        'nft',
        'metaverse',
        'digital assets',
        'blockchain',
        'virtual reality',
        'web3',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'El futuro de los NFTs y el metaverso',
      suggestedHashtags: ['NFT', 'Metaverse', 'Blockchain', 'DigitalAssets'],
    },
  },

  {
    id: 'post-14',
    title: 'Vue.js 3: Composition API y Mejores Prácticas',
    slug: 'vuejs-3-composition-api-mejores-practicas',
    content: generateHtmlContent('Vue.js 3', 'desarrollo frontend moderno'),
    excerpt:
      'Domina Vue.js 3 y su Composition API. Nuevas características, performance y arquitectura de componentes.',
    featuredImage:
      'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Desarrollo con Vue.js framework',
    status: 'published',
    authorId: 'autor-1',
    author: AUTHORS_MOCK[0],
    categoryIds: ['categoria-1', 'categoria-7'],
    categories: [CATEGORIES_MOCK[0], CATEGORIES_MOCK[6]],
    tags: ['vuejs', 'composition api', 'frontend', 'javascript', 'reactive'],
    readingTime: 10,
    views: 1654,
    likes: 112,
    commentsCount: 18,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-11-25T11:45:00Z'),
    updatedAt: new Date('2023-11-25T11:45:00Z'),
    publishedAt: new Date('2023-11-25T11:45:00Z'),
    seo: {
      metaDescription:
        'Aprende Vue.js 3 y su Composition API. Guía completa con mejores prácticas y ejemplos avanzados.',
      keywords: [
        'vuejs 3',
        'composition api',
        'vue tutorial',
        'frontend framework',
        'reactive programming',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Domina Vue.js 3 y su Composition API',
      suggestedHashtags: ['VueJS', 'CompositionAPI', 'Frontend', 'JavaScript'],
    },
  },

  {
    id: 'post-15',
    title: 'Python para Data Science: Pandas y NumPy Avanzado',
    slug: 'python-data-science-pandas-numpy-avanzado',
    content: generateHtmlContent('Python Data Science', 'análisis de datos'),
    excerpt:
      'Técnicas avanzadas de análisis de datos con Pandas y NumPy. Optimización, visualización y machine learning.',
    featuredImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Análisis de datos con Python',
    status: 'published',
    authorId: 'autor-4',
    author: AUTHORS_MOCK[3],
    categoryIds: ['categoria-2', 'categoria-9'],
    categories: [CATEGORIES_MOCK[1], CATEGORIES_MOCK[8]],
    tags: ['python', 'pandas', 'numpy', 'data science', 'analytics'],
    readingTime: 13,
    views: 2387,
    likes: 189,
    commentsCount: 35,
    allowComments: true,
    featured: true,
    createdAt: new Date('2023-11-20T13:10:00Z'),
    updatedAt: new Date('2023-11-20T13:10:00Z'),
    publishedAt: new Date('2023-11-20T13:10:00Z'),
    seo: {
      metaDescription:
        'Técnicas avanzadas de Data Science con Python. Domina Pandas y NumPy para análisis de datos profesional.',
      keywords: [
        'python data science',
        'pandas tutorial',
        'numpy',
        'data analysis',
        'python analytics',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Técnicas avanzadas de Data Science con Python',
      suggestedHashtags: ['Python', 'DataScience', 'Pandas', 'Analytics'],
    },
  },

  {
    id: 'post-16',
    title: 'GraphQL vs REST: Arquitectura de APIs Moderna',
    slug: 'graphql-vs-rest-arquitectura-apis-moderna',
    content: generateHtmlContent('GraphQL vs REST', 'arquitectura de APIs'),
    excerpt:
      'Comparativa entre GraphQL y REST. Cuándo usar cada uno, ventajas, desventajas y casos de uso prácticos.',
    featuredImage:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'APIs y arquitectura de software',
    status: 'published',
    authorId: 'autor-2',
    author: AUTHORS_MOCK[1],
    categoryIds: ['categoria-1', 'categoria-8'],
    categories: [CATEGORIES_MOCK[0], CATEGORIES_MOCK[7]],
    tags: ['graphql', 'rest api', 'api design', 'backend', 'architecture'],
    readingTime: 9,
    views: 1789,
    likes: 134,
    commentsCount: 24,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-11-15T15:25:00Z'),
    updatedAt: new Date('2023-11-15T15:25:00Z'),
    publishedAt: new Date('2023-11-15T15:25:00Z'),
    seo: {
      metaDescription:
        'GraphQL vs REST: comparativa completa. Ventajas, desventajas y cuándo usar cada arquitectura de APIs.',
      keywords: [
        'graphql vs rest',
        'api architecture',
        'graphql tutorial',
        'rest api design',
        'backend development',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'GraphQL vs REST: ¿Cuál elegir para tu API?',
      suggestedHashtags: ['GraphQL', 'REST', 'API', 'Backend'],
    },
  },

  {
    id: 'post-17',
    title: 'Metodologías Ágiles: Scrum vs Kanban en 2024',
    slug: 'metodologias-agiles-scrum-kanban-2024',
    content: generateHtmlContent('Metodologías Ágiles', 'gestión de proyectos'),
    excerpt:
      'Comparación práctica entre Scrum y Kanban. Implementación, herramientas y casos de éxito en equipos de desarrollo.',
    featuredImage:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Metodologías ágiles y gestión de proyectos',
    status: 'published',
    authorId: 'autor-7',
    author: AUTHORS_MOCK[6],
    categoryIds: ['categoria-1'],
    categories: [CATEGORIES_MOCK[0]],
    tags: ['scrum', 'kanban', 'agile', 'project management', 'team management'],
    readingTime: 7,
    views: 1456,
    likes: 98,
    commentsCount: 20,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-11-10T08:40:00Z'),
    updatedAt: new Date('2023-11-10T08:40:00Z'),
    publishedAt: new Date('2023-11-10T08:40:00Z'),
    seo: {
      metaDescription:
        'Scrum vs Kanban: comparativa de metodologías ágiles. Implementación práctica y casos de éxito en 2024.',
      keywords: [
        'scrum vs kanban',
        'agile methodologies',
        'project management',
        'scrum guide',
        'kanban board',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Scrum vs Kanban: ¿Cuál es mejor para tu equipo?',
      suggestedHashtags: ['Scrum', 'Kanban', 'Agile', 'ProjectManagement'],
    },
  },

  {
    id: 'post-18',
    title: 'Microservicios con Spring Boot: Arquitectura Escalable',
    slug: 'microservicios-spring-boot-arquitectura-escalable',
    content: generateHtmlContent(
      'Microservicios',
      'arquitectura de microservicios'
    ),
    excerpt:
      'Construye arquitecturas de microservicios robustas con Spring Boot. Patrones, comunicación y despliegue.',
    featuredImage:
      'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Arquitectura de microservicios',
    status: 'published',
    authorId: 'autor-2',
    author: AUTHORS_MOCK[1],
    categoryIds: ['categoria-1', 'categoria-8'],
    categories: [CATEGORIES_MOCK[0], CATEGORIES_MOCK[7]],
    tags: [
      'microservices',
      'spring boot',
      'java',
      'architecture',
      'scalability',
    ],
    readingTime: 14,
    views: 1123,
    likes: 76,
    commentsCount: 16,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-11-05T12:15:00Z'),
    updatedAt: new Date('2023-11-05T12:15:00Z'),
    publishedAt: new Date('2023-11-05T12:15:00Z'),
    seo: {
      metaDescription:
        'Arquitectura de microservicios con Spring Boot. Patrones, comunicación entre servicios y escalabilidad.',
      keywords: [
        'microservices',
        'spring boot',
        'java microservices',
        'distributed systems',
        'scalable architecture',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Arquitectura de microservicios con Spring Boot',
      suggestedHashtags: [
        'Microservices',
        'SpringBoot',
        'Java',
        'Architecture',
      ],
    },
  },

  {
    id: 'post-19',
    title: 'CSS Grid y Flexbox: Layout Moderno para Web',
    slug: 'css-grid-flexbox-layout-moderno-web',
    content: generateHtmlContent('CSS Grid y Flexbox', 'layout web moderno'),
    excerpt:
      'Domina CSS Grid y Flexbox para crear layouts responsive modernos. Técnicas avanzadas y casos de uso prácticos.',
    featuredImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Desarrollo CSS y layouts web',
    status: 'published',
    authorId: 'autor-3',
    author: AUTHORS_MOCK[2],
    categoryIds: ['categoria-1', 'categoria-7'],
    categories: [CATEGORIES_MOCK[0], CATEGORIES_MOCK[6]],
    tags: ['css grid', 'flexbox', 'css', 'responsive design', 'web layout'],
    readingTime: 8,
    views: 2654,
    likes: 201,
    commentsCount: 42,
    allowComments: true,
    featured: false,
    createdAt: new Date('2023-11-01T10:30:00Z'),
    updatedAt: new Date('2023-11-01T10:30:00Z'),
    publishedAt: new Date('2023-11-01T10:30:00Z'),
    seo: {
      metaDescription:
        'Guía completa de CSS Grid y Flexbox. Aprende a crear layouts responsive modernos con técnicas avanzadas.',
      keywords: [
        'css grid',
        'flexbox',
        'css layout',
        'responsive design',
        'web development',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'Domina CSS Grid y Flexbox para layouts modernos',
      suggestedHashtags: ['CSS', 'Grid', 'Flexbox', 'WebDev'],
    },
  },

  {
    id: 'post-20',
    title: 'Inteligencia Artificial Generativa: GPT y el Futuro del Desarrollo',
    slug: 'ia-generativa-gpt-futuro-desarrollo',
    content: generateHtmlContent(
      'IA Generativa',
      'inteligencia artificial generativa'
    ),
    excerpt:
      'Explora el impacto de la IA generativa en el desarrollo de software. GPT, Copilot y herramientas de programación asistida.',
    featuredImage:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop&auto=format',
    featuredImageAlt: 'Inteligencia artificial generativa',
    status: 'published',
    authorId: 'autor-4',
    author: AUTHORS_MOCK[3],
    categoryIds: ['categoria-2'],
    categories: [CATEGORIES_MOCK[1]],
    tags: [
      'ai generativa',
      'gpt',
      'copilot',
      'inteligencia artificial',
      'programming ai',
    ],
    readingTime: 11,
    views: 3876,
    likes: 312,
    commentsCount: 58,
    allowComments: true,
    featured: true,
    createdAt: new Date('2023-10-28T14:00:00Z'),
    updatedAt: new Date('2023-10-28T14:00:00Z'),
    publishedAt: new Date('2023-10-28T14:00:00Z'),
    seo: {
      metaDescription:
        'El impacto de la IA generativa en el desarrollo. GPT, GitHub Copilot y el futuro de la programación asistida.',
      keywords: [
        'ai generativa',
        'gpt',
        'github copilot',
        'ai programming',
        'artificial intelligence',
      ],
      noIndex: false,
      noFollow: false,
      twitterCard: 'summary_large_image',
    },
    social: {
      allowSharing: true,
      enabledPlatforms: ['facebook', 'twitter', 'linkedin', 'copy-link'],
      shareText: 'El futuro del desarrollo con IA generativa',
      suggestedHashtags: ['AI', 'GPT', 'Copilot', 'Programming'],
    },
  },
];

/**
 * Función para obtener un post por ID
 */
export function getPostById(id: string): BlogPost | undefined {
  return BLOG_POSTS_MOCK.find((post) => post.id === id);
}

/**
 * Función para obtener un post por slug
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS_MOCK.find((post) => post.slug === slug);
}

/**
 * Función para obtener posts publicados
 */
export function getPublishedPosts(): BlogPost[] {
  return BLOG_POSTS_MOCK.filter((post) => post.status === 'published');
}

/**
 * Función para obtener posts destacados
 */
export function getFeaturedPosts(): BlogPost[] {
  return BLOG_POSTS_MOCK.filter(
    (post) => post.featured && post.status === 'published'
  );
}

/**
 * Función para obtener posts por categoría
 */
export function getPostsByCategory(categoryId: string): BlogPost[] {
  return BLOG_POSTS_MOCK.filter(
    (post) =>
      post.categoryIds.includes(categoryId) && post.status === 'published'
  );
}

/**
 * Función para obtener posts por autor
 */
export function getPostsByAuthor(authorId: string): BlogPost[] {
  return BLOG_POSTS_MOCK.filter(
    (post) => post.authorId === authorId && post.status === 'published'
  );
}

/**
 * Función para buscar posts
 */
export function searchPosts(term: string): BlogPost[] {
  const lowercaseTerm = term.toLowerCase();
  return BLOG_POSTS_MOCK.filter(
    (post) =>
      post.status === 'published' &&
      (post.title.toLowerCase().includes(lowercaseTerm) ||
        post.excerpt.toLowerCase().includes(lowercaseTerm) ||
        post.tags.some((tag) => tag.toLowerCase().includes(lowercaseTerm)))
  );
}

/**
 * Función para obtener posts relacionados
 */
export function getRelatedPosts(postId: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostById(postId);
  if (!currentPost) return [];

  const related = BLOG_POSTS_MOCK.filter(
    (post) =>
      post.id !== postId &&
      post.status === 'published' &&
      (post.categoryIds.some((cat) => currentPost.categoryIds.includes(cat)) ||
        post.tags.some((tag) => currentPost.tags.includes(tag)))
  );

  return related.slice(0, limit);
}

/**
 * Función para obtener posts más populares
 */
export function getPopularPosts(limit: number = 5): BlogPost[] {
  return [...BLOG_POSTS_MOCK]
    .filter((post) => post.status === 'published')
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

/**
 * Función para obtener posts recientes
 */
export function getRecentPosts(limit: number = 5): BlogPost[] {
  return [...BLOG_POSTS_MOCK]
    .filter((post) => post.status === 'published')
    .sort(
      (a, b) =>
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
    )
    .slice(0, limit);
}
