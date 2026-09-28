import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { notifyAdmins } from './admin';
import type { Feedback, Report } from '../types/moderation';

const reportsCollection = collection(db, 'reports');
const feedbackCollection = collection(db, 'feedback');

// --- Détection des propos grossiers ---------------------------------------
// Pas de blocage : le message est publié normalement, mais un signalement
// automatique part vers les admins pour qu'ils jugent sur pièce.

// Mots isolés, comparés au mot entier (trop courts ou trop ambigus pour un
// préfixe : « con » dans « conditions », « pede » dans « pédestre »…).
const EXACT_WORDS = new Set([
  'con', 'cons', 'conne', 'connes', 'cul', 'bite', 'bites', 'pute', 'putes', 'putain',
  'salope', 'salopes', 'salopard', 'salopards', 'salaud', 'salauds', 'suce', 'sucer',
  'bordel', 'debile', 'debiles', 'pd', 'pede', 'pedes', 'ntm', 'fdp', 'tg', 'vtff',
  'shit', 'chiasse', 'catin',
]);

// Racines : tout mot qui commence ainsi est signalé (couvre pluriels,
// féminins et conjugaisons).
const PREFIXES = [
  'connard', 'connass', 'encul', 'niqu', 'merd', 'enfoir', 'batard', 'abruti', 'cretin',
  'couill', 'branl', 'pouffias', 'poufias', 'grognass', 'gouine', 'negre', 'negro',
  'bougnoul', 'youpin', 'fuck', 'bitch', 'asshole', 'nigg',
];

// Expressions de plusieurs mots (menaces, insultes composées).
const PHRASES = [
  'ta gueule', 'trou du cul', 'va crever', 'va mourir', 'te tuer', 'te buter',
  'te frapper', 'te defoncer', 'casse toi',
];

// Minuscules, sans accents, chiffres « leet » ramenés à leur lettre.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4|@/g, 'a')
    .replace(/\$/g, 's');
}

// Renvoie les mots/expressions problématiques trouvés (vide si rien).
export function findOffensiveWords(text: string): string[] {
  const tokens = normalize(text).split(/[^a-z]+/).filter(Boolean);
  const found = new Set<string>();
  for (const token of tokens) {
    if (EXACT_WORDS.has(token) || PREFIXES.some((p) => token.startsWith(p))) found.add(token);
  }
  const joined = ` ${tokens.join(' ')} `;
  for (const phrase of PHRASES) {
    if (joined.includes(` ${phrase} `)) found.add(phrase);
  }
  return [...found];
}

// --- Signalements ---------------------------------------------------------

// Firestore refuse les champs `undefined`.
function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

const TARGET_LABELS: Record<Report['targetType'], string> = {
  post: 'un sujet du forum',
  comment: 'une réponse du forum',
  trip: 'un covoiturage',
  member: 'un membre',
  other: 'un problème',
};

export async function sendReport(report: Omit<Report, 'id' | 'reporterUid' | 'date'>): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Aucun utilisateur connecté');
  const full: Report = { ...report, id: `${Date.now()}_${uid}`, reporterUid: uid, date: new Date().toISOString() };
  await setDoc(doc(reportsCollection, full.id), withoutUndefined(full));

  const who = report.targetPrenom ? ` (${report.targetPrenom})` : '';
  await notifyAdmins(
    report.kind === 'auto' ? 'Propos à vérifier' : 'Nouveau signalement',
    report.kind === 'auto'
      ? `Mots détectés${who} : ${(report.matchedWords ?? []).join(', ')}`
      : `${report.reporterPrenom ?? 'Un membre'} signale ${TARGET_LABELS[report.targetType]}${who}.`
  );
}

// À appeler après la publication d'un texte : s'il contient des mots
// grossiers, un signalement automatique part vers les admins. Ne fait
// jamais échouer la publication.
export async function autoFlagIfOffensive(
  text: string,
  context: Pick<Report, 'targetType' | 'postId' | 'commentId' | 'tripId' | 'targetPrenom'>
): Promise<void> {
  const matchedWords = findOffensiveWords(text);
  if (matchedWords.length === 0) return;
  try {
    await sendReport({
      ...context,
      kind: 'auto',
      targetUid: auth.currentUser?.uid,
      excerpt: text.slice(0, 500),
      matchedWords,
    });
  } catch {
    // ignoré volontairement
  }
}

export async function getReports(): Promise<Report[]> {
  const snap = await getDocs(query(reportsCollection, orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as Report);
}

// Signalement traité (classé ou contenu supprimé) : il disparaît de la liste.
export async function dismissReport(reportId: string): Promise<void> {
  await deleteDoc(doc(reportsCollection, reportId));
}

// --- Retours / avis --------------------------------------------------------

export async function sendFeedback(message: string, prenom?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Aucun utilisateur connecté');
  const feedback: Feedback = {
    id: `${Date.now()}_${user.uid}`,
    uid: user.uid,
    prenom,
    email: user.email ?? undefined,
    message,
    date: new Date().toISOString(),
  };
  await setDoc(doc(feedbackCollection, feedback.id), withoutUndefined(feedback));
  await notifyAdmins('Nouvel avis', `${prenom ?? 'Un membre'} : ${message.slice(0, 120)}`);
}

export async function getFeedback(): Promise<Feedback[]> {
  const snap = await getDocs(query(feedbackCollection, orderBy('date', 'desc')));
  return snap.docs.map((d) => d.data() as Feedback);
}

export async function deleteFeedback(feedbackId: string): Promise<void> {
  await deleteDoc(doc(feedbackCollection, feedbackId));
}
