import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
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
  updateDoc,
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
        let isAdmin = await checkIsAdmin(user.email);
        const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com');
        const isOwnerEmail = user.email?.toLowerCase().trim() === 'johnrenneradm@gmail.com';
        const isMaster = isGoogleUser || isOwnerEmail;

        // Proprietário Master (Google): nunca é bloqueado e é adicionado automaticamente
        if (!isAdmin && isMaster) {
          try {
            await addAuthorizedUser(user.email, {
              canViewFunnels: true,
              canCreateFunnels: true,
              canEditFunnels: true,
              canViewSubmissions: true
            }, user.displayName || 'Proprietário Master', 'Google Master Login');
            isAdmin = true;
          } catch (e) {
            isAdmin = true;
          }
        }

        // Busca permissões específicas se existir doc em authorized_users
        let userPermissions = {
          canViewFunnels: true,
          canCreateFunnels: true,
          canEditFunnels: true,
          canViewSubmissions: true
        };
        let mustChangePassword = false;

        if (db && !isMaster) {
          try {
            const userDoc = await getDoc(doc(db, 'authorized_users', user.email.toLowerCase().trim()));
            if (userDoc.exists()) {
              const uData = userDoc.data();
              if (uData.permissions) {
                userPermissions = uData.permissions;
              }
              if (uData.mustChangePassword === true) {
                mustChangePassword = true;
              }
            }
          } catch (e) {
            console.warn('Erro ao carregar permissões do usuário:', e);
          }
        }

        callback({ 
          ...user, 
          isAdmin: isAdmin || isMaster,
          isMaster: isMaster,
          cpf: isMaster ? MASTER_CPF : null,
          permissions: userPermissions,
          mustChangePassword
        });
      } else {
        const localUser = getLocalItem(STORAGE_KEYS.CURRENT_USER, null);
        if (localUser) {
          callback(localUser);
        } else {
          callback(null);
        }
      }
    });
  } else {
    // Modo Demonstração Local
    const mockUser = getLocalItem(STORAGE_KEYS.CURRENT_USER, null);
    callback(mockUser);
    return () => {};
  }
}

export function generateTemporaryPassword() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Lead@${rand}`;
}

export async function loginWithEmail(email, password) {
  if (!email || !password) throw new Error('E-mail e senha são obrigatórios.');
  const cleanEmail = email.toLowerCase().trim();

  if (isFirebaseConfigured && auth) {
    let authUser = null;
    let mustChangePassword = false;

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      authUser = cred.user;
    } catch (err) {
      // 1. Caso o provedor E-mail/Senha não esteja ativo no Firebase Console OU usuário com temporaryPassword no Firestore
      if (
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password'
      ) {
        if (db) {
          try {
            const userDoc = await getDoc(doc(db, 'authorized_users', cleanEmail));
            if (userDoc.exists()) {
              const data = userDoc.data();
              const validPassword = data.temporaryPassword || data.password;

              if (validPassword && validPassword === password) {
                // Autenticação direta validada via Firestore com sucesso (sem depender do switch do console)
                const sessionUser = {
                  uid: 'usr_' + cleanEmail.replace(/[^a-z0-9]/g, '_'),
                  email: cleanEmail,
                  displayName: data.name || cleanEmail.split('@')[0],
                  isAdmin: true,
                  isMaster: cleanEmail === 'johnrenneradm@gmail.com',
                  mustChangePassword: data.mustChangePassword === true,
                  permissions: data.permissions || {
                    canViewFunnels: true,
                    canCreateFunnels: true,
                    canEditFunnels: true,
                    canViewSubmissions: true
                  }
                };
                setLocalItem(STORAGE_KEYS.CURRENT_USER, sessionUser);
                return sessionUser;
              } else {
                throw new Error('E-mail ou senha incorretos.');
              }
            }
          } catch (directErr) {
            if (directErr.message === 'E-mail ou senha incorretos.') throw directErr;
            console.warn('Erro ao autenticar direto via Firestore:', directErr);
          }
        }
      }

      if (!authUser) {
        if (err.code === 'auth/operation-not-allowed') {
          throw new Error('No Firebase Console, vá em Authentication > Método de login e ative "E-mail/senha".');
        }
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          throw new Error('E-mail ou senha incorretos.');
        }
        if (err.code === 'auth/too-many-requests') {
          throw new Error('Muitas tentativas sem sucesso. Aguarde alguns minutos ou redefina a senha.');
        }
        throw err;
      }
    }

    const isAdmin = await checkIsAdmin(authUser.email);
    if (!isAdmin) {
      await firebaseSignOut(auth);
      throw new Error(`Acesso negado: O e-mail ${cleanEmail} não está cadastrado na lista de administradores autorizados.`);
    }

    if (db) {
      try {
        const uDoc = await getDoc(doc(db, 'authorized_users', cleanEmail));
        if (uDoc.exists()) {
          mustChangePassword = uDoc.data().mustChangePassword === true;
        }
      } catch (e) {
        console.warn('Erro ao verificar flag mustChangePassword:', e);
      }
    }

    const sessionUser = { 
      ...authUser, 
      isAdmin: true, 
      mustChangePassword,
      isMaster: cleanEmail === 'johnrenneradm@gmail.com'
    };
    setLocalItem(STORAGE_KEYS.CURRENT_USER, sessionUser);
    return sessionUser;
  } else {
    // Modo Demonstração Local
    const localUsers = getLocalItem('ag_authorized_users_detail_v1', []);
    const found = localUsers.find(u => u.email === cleanEmail);
    const mustChange = found ? found.mustChangePassword === true : false;

    const mock = {
      uid: 'demo_user_123',
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanEmail}`,
      isAdmin: true,
      mustChangePassword: mustChange
    };
    setLocalItem(STORAGE_KEYS.CURRENT_USER, mock);
    const users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    if (!users.includes(cleanEmail)) {
      users.push(cleanEmail);
      setLocalItem(STORAGE_KEYS.USERS, users);
    }
    return mock;
  }
}

export async function changeUserPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }

  const cur = getLocalItem(STORAGE_KEYS.CURRENT_USER, null);
  const email = (auth?.currentUser?.email || cur?.email || '').toLowerCase().trim();

  if (isFirebaseConfigured && auth && auth.currentUser) {
    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (e) {
      console.warn('Erro updatePassword Auth:', e);
    }
  }

  if (db && email) {
    try {
      await setDoc(doc(db, 'authorized_users', email), {
        mustChangePassword: false,
        temporaryPassword: null,
        password: newPassword,
        passwordChangedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Erro ao atualizar flag de troca de senha no Firestore:', e);
    }
  }

  if (cur) {
    cur.mustChangePassword = false;
    setLocalItem(STORAGE_KEYS.CURRENT_USER, cur);
  }

  let localUsers = getLocalItem('ag_authorized_users_detail_v1', []);
  localUsers = localUsers.map(u => u.email === email ? { ...u, mustChangePassword: false, temporaryPassword: null, password: newPassword } : u);
  setLocalItem('ag_authorized_users_detail_v1', localUsers);

  return true;
}

export async function registerWithEmail(email, password) {
  if (!email || !password) throw new Error('E-mail e senha são obrigatórios.');
  if (password.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres.');
  const cleanEmail = email.toLowerCase().trim();

  if (isFirebaseConfigured && auth) {
    try {
      // 1. Cria o usuário no Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      
      // 2. Registra na coleção de authorized_users se for o primeiro usuário ou admin
      const isAlreadyAdmin = await checkIsAdmin(cleanEmail);
      if (!isAlreadyAdmin) {
        // Se ainda não existir nenhum admin, torna este usuário o primeiro admin
        const allAdmins = await getAuthorizedUsers();
        if (allAdmins.length === 0 || allAdmins.some(a => a.email === cleanEmail)) {
          await addAuthorizedUser(cleanEmail, 'Auto Cadastro Inicial');
        } else {
          // Permite auto-cadastro se for o e-mail pré-autorizado no console
          await addAuthorizedUser(cleanEmail, 'Cadastro com Senha');
        }
      }
      return { ...cred.user, isAdmin: true };
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Este e-mail já está cadastrado. Faça login ou solicite recuperação de senha.');
      }
      throw err;
    }
  } else {
    return await loginWithEmail(email, password);
  }
}

export async function resetPassword(email) {
  if (!email) throw new Error('Informe seu e-mail para recuperar a senha.');
  const cleanEmail = email.toLowerCase().trim();

  if (isFirebaseConfigured && auth) {
    await sendPasswordResetEmail(auth, cleanEmail);
    return true;
  } else {
    return true;
  }
}

export const MASTER_CPF = '07624228319';

export async function loginWithGoogle() {
  if (isFirebaseConfigured && auth && googleProvider) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email.toLowerCase().trim();

      // Registra/atualiza automaticamente o perfil Master no Firestore para garantir acesso
      if (db) {
        try {
          const docRef = doc(db, 'authorized_users', email);
          const snap = await getDoc(docRef);
          if (!snap.exists()) {
            await setDoc(docRef, {
              email: email,
              role: 'super_admin',
              cpf: MASTER_CPF,
              displayName: result.user.displayName || 'Proprietário Master',
              addedAt: serverTimestamp(),
              addedBy: 'Google Master Login'
            });
          }
        } catch (dbErr) {
          console.warn('[Firestore] Erro ao assegurar perfil master no banco:', dbErr);
        }
      }

      return { 
        ...result.user, 
        isAdmin: true, 
        isMaster: true,
        cpf: MASTER_CPF 
      };
    } catch (err) {
      console.error('[Auth Google] Erro:', err);
      throw err;
    }
  } else {
    // Simulação no modo demo
    const mock = {
      uid: 'master_user_076',
      email: 'proprietario@master.com',
      displayName: 'Proprietário Master',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master',
      isAdmin: true,
      isMaster: true,
      cpf: MASTER_CPF
    };
    setLocalItem(STORAGE_KEYS.CURRENT_USER, mock);
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
    return snap.docs.map(d => {
      const data = d.data();
      return {
        email: d.id,
        name: data.name || (d.id === 'johnrenneradm@gmail.com' ? 'Proprietário Master' : d.id.split('@')[0]),
        role: data.role || (d.id === 'johnrenneradm@gmail.com' ? 'super_admin' : 'user'),
        temporaryPassword: data.temporaryPassword || null,
        mustChangePassword: data.mustChangePassword === true,
        permissions: data.permissions || {
          canViewFunnels: true,
          canCreateFunnels: true,
          canEditFunnels: true,
          canViewSubmissions: true
        },
        addedAt: data.addedAt?.toDate ? data.addedAt.toDate().toISOString() : data.addedAt || null,
        addedBy: data.addedBy || null
      };
    });
  } else {
    const users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    return users.map(u => ({
      email: u,
      name: u.split('@')[0],
      role: u === 'johnrenneradm@gmail.com' ? 'super_admin' : 'user',
      permissions: {
        canViewFunnels: true,
        canCreateFunnels: true,
        canEditFunnels: true,
        canViewSubmissions: true
      },
      addedAt: new Date().toISOString(),
      addedBy: 'Sistema Local'
    }));
  }
}

export async function addAuthorizedUser(email, permissions = null, name = '', currentUserEmail = 'admin', customPassword = null) {
  if (!email) throw new Error('E-mail obrigatório');
  const cleanEmail = email.toLowerCase().trim();
  const tempPassword = customPassword || generateTemporaryPassword();

  const userPerms = permissions || {
    canViewFunnels: true,
    canCreateFunnels: true,
    canEditFunnels: true,
    canViewSubmissions: true
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'authorized_users', cleanEmail), {
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      role: 'user',
      temporaryPassword: tempPassword,
      mustChangePassword: true,
      permissions: userPerms,
      addedAt: serverTimestamp(),
      addedBy: currentUserEmail
    }, { merge: true });
  } else {
    const users = getLocalItem(STORAGE_KEYS.USERS, ['admin@empresa.com']);
    if (!users.includes(cleanEmail)) {
      users.push(cleanEmail);
      setLocalItem(STORAGE_KEYS.USERS, users);
    }
    let localUsers = getLocalItem('ag_authorized_users_detail_v1', []);
    localUsers = localUsers.filter(u => u.email !== cleanEmail);
    localUsers.push({
      email: cleanEmail,
      name: name.trim() || cleanEmail.split('@')[0],
      temporaryPassword: tempPassword,
      mustChangePassword: true,
      permissions: userPerms,
      addedAt: new Date().toISOString(),
      addedBy: currentUserEmail
    });
    setLocalItem('ag_authorized_users_detail_v1', localUsers);
  }
  return { email: cleanEmail, temporaryPassword: tempPassword };
}

export async function updateUserPermissions(email, permissions) {
  if (!email) throw new Error('E-mail obrigatório');
  const cleanEmail = email.toLowerCase().trim();

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, 'authorized_users', cleanEmail), {
      permissions: permissions
    });
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

  if (cleanEmail === 'johnrenneradm@gmail.com') {
    throw new Error('Operação bloqueada: O proprietário master não pode ser removido.');
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

// -------------------------------------------------------------
// GESTÃO DE CLIENTES & VENDA DE ACESSOS (SAAS / REVENDA)
// -------------------------------------------------------------

const INITIAL_DEMO_CLIENTS = [
  {
    id: 'cli_demo_1',
    name: 'Dr. Lucas Silveira (Advocacia)',
    email: 'lucas@silveiraadv.com',
    passwordInitial: 'Adv@2025!',
    whatsapp: '5511988887777',
    plan: 'Plano Pro Anual',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export async function createClientAccount(data) {
  if (!data.email || !data.passwordInitial) {
    throw new Error('E-mail e senha inicial são obrigatórios.');
  }
  const cleanEmail = data.email.toLowerCase().trim();

  const client = {
    id: 'cli_' + Math.random().toString(36).substring(2, 9),
    name: data.name || cleanEmail.split('@')[0],
    email: cleanEmail,
    passwordInitial: data.passwordInitial,
    whatsapp: data.whatsapp || '',
    plan: data.plan || 'Plano Padrão',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  // Garante que o cliente esteja na coleção authorized_users para ter acesso ao painel
  await addAuthorizedUser(cleanEmail, `Venda para ${client.name}`);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'client_accounts', client.id), client);
      return client;
    } catch (err) {
      console.warn('Erro ao salvar cliente no Firestore:', err);
    }
  } else {
    const list = getLocalItem('ag_funnels_clients_v1', INITIAL_DEMO_CLIENTS);
    list.unshift(client);
    setLocalItem('ag_funnels_clients_v1', list);
    return client;
  }
}

export async function getClientAccounts() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'client_accounts'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (err) {
      console.warn('Erro ao ler clientes do Firestore:', err);
      return [];
    }
  } else {
    return getLocalItem('ag_funnels_clients_v1', INITIAL_DEMO_CLIENTS);
  }
}

export async function deleteClientAccount(clientId, email) {
  if (email) {
    try {
      await removeAuthorizedUser(email, 'admin');
    } catch {
      // Ignorar fallback
    }
  }

  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'client_accounts', clientId));
  } else {
    let list = getLocalItem('ag_funnels_clients_v1', INITIAL_DEMO_CLIENTS);
    list = list.filter(c => c.id !== clientId);
    setLocalItem('ag_funnels_clients_v1', list);
  }
  return true;
}

export async function toggleClientStatus(clientId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'client_accounts', clientId), { status: newStatus }, { merge: true });
  } else {
    const list = getLocalItem('ag_funnels_clients_v1', INITIAL_DEMO_CLIENTS);
    const item = list.find(c => c.id === clientId);
    if (item) item.status = newStatus;
    setLocalItem('ag_funnels_clients_v1', list);
  }
  return newStatus;
}


