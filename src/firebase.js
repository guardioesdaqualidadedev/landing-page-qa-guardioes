// Configuração e inicialização do Firebase para o site da comunidade.
//
// As chaves vêm do .env (veja .env.example). Elas NÃO são segredo — ficam no
// bundle do frontend e são visíveis para qualquer visitante. A segurança real
// vem das Security Rules (firestore.rules) e dos domínios autorizados no
// console do Firebase. O .env existe para separar ambientes, não para esconder.
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Sem .env preenchido o site continua funcionando — apenas sem contador e sem
// analytics. Isso mantém `npm run dev` e os testes rodando em qualquer máquina.
export const firebaseAtivo = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let db = null;
let analytics = null;

if (firebaseAtivo) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  if (typeof window !== "undefined") {
    isSupported()
      .then((suportado) => {
        if (suportado) analytics = getAnalytics(app);
      })
      .catch(() => {
        /* Analytics indisponível — segue sem rastreamento. */
      });
  }
}

// Helper de rastreamento usado pelas páginas. Faz no-op seguro enquanto o
// Analytics ainda não inicializou (ou quando o Firebase não está configurado).
export function track(eventName, params = {}) {
  if (analytics) {
    logEvent(analytics, eventName, params);
  } else if (typeof console !== "undefined" && import.meta.env.DEV) {
    console.log("[analytics]", eventName, params);
  }
}

export { app, db, analytics };
export default app;
