import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';

// ZERO-TRUST: Leitura segura de variáveis de ambiente injetadas via Vite / GitHub Secrets
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Verifica se as credenciais do Firebase foram devidamente fornecidas
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'SUA_API_KEY_AQUI' &&
  !firebaseConfig.apiKey.includes('undefined')
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.error('[Firebase] Erro ao inicializar SDK:', err);
  }
}

// -------------------------------------------------------------
// SEED INICIAL PARA MODO DEMO / LOCALSTORAGE (QUANDO SEM FIREBASE)
// -------------------------------------------------------------
const INITIAL_DEMO_FUNNEL = {
  id: 'funil-demo-alta-conversao',
  slug: 'consultoria-vip',
  status: 'active',
  createdAt: new Date().toISOString(),
  design: {
    headline: 'Descubra se o seu perfil está apto para nossa Mentoria VIP de Negócios',
    subtitle: 'Responda a 3 perguntas rápidas para avaliarmos seu momento e direcionarmos ao time correto.',
    footerText: '🔒 Seus dados estão 100% protegidos sob a LGPD. Não enviamos spam.',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    primaryColor: '#0047FF',
    backgroundColor: '#0F172A',
    textColor: '#FFFFFF',
    whatsappPhone: '5511999999999',
    buttonText: 'Concluir e Falar no WhatsApp'
  },
  questions: [
    {
      id: 'q1',
      title: 'Qual é o faturamento mensal aproximado da sua empresa hoje?',
      subtitle: 'Isso nos ajuda a entender o porte ideal da solução.',
      type: 'single_choice',
      required: true,
      options: [
        { id: 'opt_1_1', text: 'Abaixo de R$ 10.000 / mês', isQualified: false },
        { id: 'opt_1_2', text: 'De R$ 10.000 a R$ 50.000 / mês', isQualified: true },
        { id: 'opt_1_3', text: 'Acima de R$ 50.000 / mês', isQualified: true }
      ]
    },
    {
      id: 'q2',
      title: 'Você possui orçamento imediato disponível para investimento em tráfego e vendas?',
      subtitle: 'Procuramos parceiros prontos para escalar nas próximas 2 semanas.',
      type: 'single_choice',
      required: true,
      options: [
        { id: 'opt_2_1', text: 'Sim, tenho orçamento e decisão imediata', isQualified: true },
        { id: 'opt_2_2', text: 'Apenas pesquisando opções futuras', isQualified: false }
      ]
    },
    {
      id: 'q3',
      title: 'Qual é o seu nome completo e o site/Instagram do seu negócio?',
      subtitle: 'Para nosso especialista analisar antes da conversa.',
      type: 'short_text',
      required: true,
      placeholder: 'Ex: João Silva - @meunegocio'
    }
  ],
  disqualification: {
    title: 'Agradecemos o seu interesse!',
    message: 'Neste momento, nosso programa VIP é desenhado exclusivamente para empresas em estágio de escala com orçamento ativo. Disponibilizamos conteúdos gratuitos em nosso blog para apoiar seu crescimento inicial.'
  },
  tracking: {
    pixelId: '',
    webhookUrl: ''
  },
  whatsapp: {
    introText: 'Olá! Finalizei a aplicação para a Mentoria VIP:',
    outroText: 'Tenho interesse em agendar a sessão estratégica com o consultor sênior.'
  }
};

const STORAGE_KEYS = {
  FORMS: 'ag_funnels_forms_v1',
  USERS: 'ag_funnels_auth_users_v1',
  ANALYTICS: 'ag_funnels_analytics_v1',
  CURRENT_USER: 'ag_funnels_mock_user_v1',
  SUBMISSIONS: 'ag_funnels_submissions_v1'
};

// Submissões de exemplo para demonstração inicial da planilha
const INITIAL_DEMO_SUBMISSIONS = [
  {
    id: 'sub_demo_1',
    formId: 'funil-demo-alta-conversao',
    formTitle: 'Consultoria VIP',
    status: 'qualified',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    answers: [
      { question: 'Qual é o faturamento mensal aproximado da sua empresa hoje?', answer: 'Acima de R$ 50.000 / mês' },
      { question: 'Você possui orçamento imediato disponível para investimento em tráfego e vendas?', answer: 'Sim, tenho orçamento e decisão imediata' },
      { question: 'Qual é o seu nome completo e o site/Instagram do seu negócio?', answer: 'Eduardo Ramos - @eduardo.ramos' }
    ],
    tracking: {
      utm_source: 'meta_ads',
      utm_campaign: 'campanha_black_escala',
      utm_medium: 'stories',
      utm_content: 'video_criativo_01',
      fbclid: 'fb.1.1711203920.AbCdEf123'
    }
  },
  {
    id: 'sub_demo_2',
    formId: 'funil-demo-alta-conversao',
    formTitle: 'Consultoria VIP',
    status: 'qualified',
    submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    answers: [
      { question: 'Qual é o faturamento mensal aproximado da sua empresa hoje?', answer: 'De R$ 10.000 a R$ 50.000 / mês' },
      { question: 'Você possui orçamento imediato disponível para investimento em tráfego e vendas?', answer: 'Sim, tenho orçamento e decisão imediata' },
      { question: 'Qual é o seu nome completo e o site/Instagram do seu negócio?', answer: 'Mariana Costa - @maricosta.moda' }
    ],
    tracking: {
      utm_source: 'instagram',
      utm_campaign: 'feed_organico',
      utm_medium: 'bio_link',
      fbclid: ''
    }
  },
  {
    id: 'sub_demo_3',
    formId: 'funil-demo-alta-conversao',
    formTitle: 'Consultoria VIP',
    status: 'disqualified',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    answers: [
      { question: 'Qual é o faturamento mensal aproximado da sua empresa hoje?', answer: 'Abaixo de R$ 10.000 / mês' }
    ],
    tracking: {
      utm_source: 'google',
      utm_campaign: 'pesquisa_direta'
    }
  }
];

function getLocalItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }
}

// -------------------------------------------------------------
// AUTENTICAÇÃO
// -------------------------------------------------------------

export function subscribeToAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = await checkIsAdmin(user.email);
        callback({ ...user, isAdmin });
      } else {
        callback(null);
      }
    });
  } else {
    // Modo Demonstração Local
    const mockUser = getLocalItem(STORAGE_KEYS.CURRENT_USER, null);
    callback(mockUser);
    return () => {};
  }
}

export async function loginWithGoogle() {
  if (isFirebaseConfigured && auth && googleProvider) {
    const result = await signInWithPopup(auth, googleProvider);
    const isAdmin = await checkIsAdmin(result.user.email);
    if (!isAdmin) {
      await firebaseSignOut(auth);
      throw new Error(`Acesso negado: O e-mail ${result.user.email} não está na lista de administradores autorizados.`);
    }
    return { ...result.user, isAdmin: true };
  } else {
    // Simulação no modo demo
    const emailPrompt = window.prompt(
      'Modo Demonstração (Sem Firebase configurado ainda).\nDigite o e-mail de admin para simular o login:', 
      'admin@empresa.com'
    );
    if (!emailPrompt) return null;
    const mock = {
      uid: 'demo_user_123',
      email: emailPrompt.trim().toLowerCase(),
      displayName: 'Administrador Demo',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      emailVerified: true,
      isAdmin: true
    };
    setLocalItem(STORAGE_KEYS.CURRENT_USER, mock);
    // Assegura que o email está na lista autorizada
    const users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    if (!users.includes(mock.email)) {
      users.push(mock.email);
      setLocalItem(STORAGE_KEYS.USERS, users);
    }
    return mock;
  }
}

export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await firebaseSignOut(auth);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export async function checkIsAdmin(email) {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'authorized_users', cleanEmail);
      const snap = await getDoc(docRef);
      return snap.exists();
    } catch (err) {
      console.warn('Erro ao verificar permissão admin:', err);
      return false;
    }
  } else {
    const users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    return users.includes(cleanEmail);
  }
}

export async function getAuthorizedUsers() {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'authorized_users'));
    return snap.docs.map(d => ({
      email: d.id,
      addedAt: d.data().addedAt || null,
      addedBy: d.data().addedBy || null
    }));
  } else {
    const users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    return users.map(u => ({
      email: u,
      addedAt: new Date().toISOString(),
      addedBy: 'Sistema Local'
    }));
  }
}

export async function addAuthorizedUser(email, currentUserEmail = 'admin') {
  if (!email) throw new Error('E-mail obrigatório');
  const cleanEmail = email.toLowerCase().trim();

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'authorized_users', cleanEmail), {
      addedAt: serverTimestamp(),
      addedBy: currentUserEmail
    });
  } else {
    const users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    if (!users.includes(cleanEmail)) {
      users.push(cleanEmail);
      setLocalItem(STORAGE_KEYS.USERS, users);
    }
  }
  return true;
}

export async function removeAuthorizedUser(email, currentLoggedEmail) {
  if (!email) throw new Error('E-mail obrigatório');
  const cleanEmail = email.toLowerCase().trim();

  // Trava de segurança: impede auto-exclusão
  if (cleanEmail === (currentLoggedEmail || '').toLowerCase().trim()) {
    throw new Error('Operação bloqueada: Você não pode remover seu próprio e-mail da lista de administradores.');
  }

  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'authorized_users', cleanEmail));
  } else {
    let users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    users = users.filter(u => u !== cleanEmail);
    setLocalItem(STORAGE_KEYS.USERS, users);
  }
  return true;
}

// -------------------------------------------------------------
// GESTÃO DE FORMULÁRIOS / FUNIS
// -------------------------------------------------------------

export async function getFunnels() {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'public_forms'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } else {
    return getLocalItem(STORAGE_KEYS.FORMS, [INITIAL_DEMO_FUNNEL]);
  }
}

export async function getFunnelBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();

  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'public_forms'), where('slug', '==', cleanSlug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } else {
    const list = getLocalItem(STORAGE_KEYS.FORMS, [INITIAL_DEMO_FUNNEL]);
    return list.find(f => (f.slug || '').toLowerCase() === cleanSlug) || null;
  }
}

export async function saveFunnel(funnelData) {
  const payload = {
    ...funnelData,
    updatedAt: new Date().toISOString()
  };

  if (!payload.id) {
    payload.id = 'fn_' + Math.random().toString(36).substring(2, 10);
    payload.createdAt = new Date().toISOString();
  }

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'public_forms', payload.id), payload, { merge: true });
    return payload;
  } else {
    const list = getLocalItem(STORAGE_KEYS.FORMS, [INITIAL_DEMO_FUNNEL]);
    const idx = list.findIndex(f => f.id === payload.id);
    if (idx >= 0) {
      list[idx] = payload;
    } else {
      list.push(payload);
    }
    setLocalItem(STORAGE_KEYS.FORMS, list);
    return payload;
  }
}

export async function deleteFunnel(funnelId) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'public_forms', funnelId));
  } else {
    let list = getLocalItem(STORAGE_KEYS.FORMS, [INITIAL_DEMO_FUNNEL]);
    list = list.filter(f => f.id !== funnelId);
    setLocalItem(STORAGE_KEYS.FORMS, list);
  }
  return true;
}

export async function duplicateFunnel(funnelId) {
  const funnels = await getFunnels();
  const source = funnels.find(f => f.id === funnelId);
  if (!source) throw new Error('Funil original não encontrado');

  const copy = JSON.parse(JSON.stringify(source));
  delete copy.id;
  copy.slug = `${source.slug}-copia-${Math.floor(Math.random() * 900 + 100)}`;
  copy.design.headline = `[Cópia] ${source.design.headline}`;
  return await saveFunnel(copy);
}

// -------------------------------------------------------------
// ANALYTICS & MÉTRICAS
// -------------------------------------------------------------

export async function logAnalyticsEvent(formId, eventType, metadata = {}) {
  const entry = {
    formId,
    eventType, // 'view' | 'qualified' | 'disqualified'
    metadata: {
      ...metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString()
    }
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'form_analytics'), entry);
    } catch (err) {
      console.warn('[Analytics] Falha ao registrar evento:', err);
    }
  } else {
    const list = getLocalItem(STORAGE_KEYS.ANALYTICS, []);
    list.push(entry);
    // Limita tamanho no localStorage para não estourar cota
    if (list.length > 500) list.shift();
    setLocalItem(STORAGE_KEYS.ANALYTICS, list);
  }
}

export async function getFunnelMetrics(formId) {
  let views = 0;
  let qualified = 0;
  let disqualified = 0;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'form_analytics'), where('formId', '==', formId));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const type = d.data().eventType;
        if (type === 'view') views++;
        if (type === 'qualified') qualified++;
        if (type === 'disqualified') disqualified++;
      });
    } catch (err) {
      console.warn('Erro ao ler métricas do Firestore:', err);
    }
  } else {
    const list = getLocalItem(STORAGE_KEYS.ANALYTICS, []);
    list.filter(e => e.formId === formId).forEach(e => {
      if (e.eventType === 'view') views++;
      if (e.eventType === 'qualified') qualified++;
      if (e.eventType === 'disqualified') disqualified++;
    });
  }

  // Se views forem 0 mas existirem conversões (ou em mock), normaliza
  const totalLeads = qualified + disqualified;
  if (views < totalLeads) views = totalLeads;
  const rate = totalLeads > 0 ? ((qualified / totalLeads) * 100).toFixed(1) : '0.0';

  return {
    views,
    qualified,
    disqualified,
    rate
  };
}

// -------------------------------------------------------------
// SUBMISSÕES DE LEADS (PLANILHA DE RESPOSTAS)
// -------------------------------------------------------------

export async function saveFormSubmission(formId, data) {
  const submission = {
    formId,
    formTitle: data.formTitle || 'Formulário',
    status: data.status || 'qualified', // 'qualified' | 'disqualified'
    answers: data.answers || [],
    tracking: data.tracking || {},
    submittedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'form_submissions'), submission);
      return { id: docRef.id, ...submission };
    } catch (err) {
      console.warn('[Submissions] Erro ao salvar submissão no Firestore:', err);
    }
  } else {
    const list = getLocalItem(STORAGE_KEYS.SUBMISSIONS, INITIAL_DEMO_SUBMISSIONS);
    const newEntry = { id: 'sub_' + Math.random().toString(36).substring(2, 9), ...submission };
    list.unshift(newEntry);
    setLocalItem(STORAGE_KEYS.SUBMISSIONS, list);
    return newEntry;
  }
}

export async function getFormSubmissions(formId = null) {
  if (isFirebaseConfigured && db) {
    try {
      let q;
      if (formId) {
        q = query(collection(db, 'form_submissions'), where('formId', '==', formId));
      } else {
        q = collection(db, 'form_submissions');
      }
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    } catch (err) {
      console.warn('Erro ao buscar respostas do Firestore:', err);
      return [];
    }
  } else {
    const list = getLocalItem(STORAGE_KEYS.SUBMISSIONS, INITIAL_DEMO_SUBMISSIONS);
    if (formId) {
      return list.filter(s => s.formId === formId);
    }
    return list;
  }
}

