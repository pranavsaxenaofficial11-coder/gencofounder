// ============================================================================
// src/firebase.js — Firebase configuration
// ============================================================================
// Paste your config values from Firebase Console → Project Settings → Your apps
// These are safe to commit — they're public identifiers, not secrets.
// Security comes from Firestore Rules + Auth, not from hiding these.
// ============================================================================

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, addDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";

// ─── PASTE YOUR FIREBASE CONFIG HERE ────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDK_bKYqiDO939IBHKQ7-9Vru-iFaKtVjc",
  authDomain: "gencopilot-78024.firebaseapp.com",
  projectId: "gencopilot-78024",
  storageBucket: "gencopilot-78024.firebasestorage.app",
  messagingSenderId: "17803400199",
  appId: "1:17803400199:web:14b3350c731d2aca6ec6a2",
  measurementId: "G-74TZ9T3KD1",
};
// ─────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ============================================================================
// Auth helpers
// ============================================================================

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  // Create or update user profile in Firestore
  await ensureUserDoc(user);
  return user;
}

export async function loginWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signupWithEmail(email, password, displayName, role = "Founder") {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await ensureUserDoc(result.user, role);
  return result.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ============================================================================
// Firestore: User profile
// ============================================================================

async function ensureUserDoc(user, role = "Founder") {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name: user.displayName || user.email.split("@")[0],
      email: user.email,
      photoURL: user.photoURL || null,
      role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, { lastLogin: serverTimestamp() });
  }
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}

// ============================================================================
// Firestore: Company data
// ============================================================================

export async function getCompanyData(uid) {
  const snap = await getDoc(doc(db, "companies", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveCompanyData(uid, data) {
  await setDoc(doc(db, "companies", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ============================================================================
// Firestore: Feedback items
// ============================================================================

export async function getFeedback(uid) {
  const q = query(collection(db, "companies", uid, "feedback"), orderBy("createdAt", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addFeedback(uid, item) {
  await addDoc(collection(db, "companies", uid, "feedback"), {
    ...item,
    createdAt: serverTimestamp(),
  });
}

// ============================================================================
// Firestore: Tasks (Kanban)
// ============================================================================

export async function getTasks(uid) {
  const q = query(collection(db, "companies", uid, "tasks"), orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveTask(uid, task) {
  if (task.id && !task.id.startsWith("k")) {
    await updateDoc(doc(db, "companies", uid, "tasks", task.id), task);
  } else {
    await addDoc(collection(db, "companies", uid, "tasks"), {
      ...task,
      createdAt: serverTimestamp(),
    });
  }
}

export async function deleteTask(uid, taskId) {
  await deleteDoc(doc(db, "companies", uid, "tasks", taskId));
}

// ============================================================================
// Firestore: Contact form submissions
// ============================================================================

export async function saveContactSubmission(data) {
  await addDoc(collection(db, "contacts"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

// ============================================================================
// Firestore: Chat history
// ============================================================================

export async function saveChatMessage(uid, module, message) {
  await addDoc(collection(db, "companies", uid, "chats"), {
    module,
    ...message,
    createdAt: serverTimestamp(),
  });
}

export async function getChatHistory(uid, module, max = 20) {
  const q = query(
    collection(db, "companies", uid, "chats"),
    where("module", "==", module),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
}

// ============================================================================
// Firestore: Real-time listener for company data
// ============================================================================

export function onCompanyDataChange(uid, callback) {
  return onSnapshot(doc(db, "companies", uid), (snap) => {
    if (snap.exists()) callback(snap.data());
  }, (err) => console.error("[firestore] company listener:", err?.message || err));
}

// ============================================================================
// COMMUNITY — posts, comments, likes
// ============================================================================

// Live feed of all community posts, newest first
export function onCommunityFeed(callback, max = 50) {
  const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (err) => { console.error("[firestore] community feed:", err?.message || err); callback([], err); });
}

export async function createPost(user, { text, projectName, tag }) {
  return addDoc(collection(db, "community_posts"), {
    authorId: user.uid,
    authorName: user.name || user.email?.split("@")[0] || "Founder",
    authorRole: user.role || "Founder",
    text,
    projectName: projectName || null,
    tag: tag || "General",
    likes: [],
    commentCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function deletePost(postId) {
  return deleteDoc(doc(db, "community_posts", postId));
}

export async function toggleLike(postId, uid, currentLikes = []) {
  const has = currentLikes.includes(uid);
  const next = has ? currentLikes.filter((x) => x !== uid) : [...currentLikes, uid];
  await updateDoc(doc(db, "community_posts", postId), { likes: next });
  return next;
}

// Comments live under each post
export function onComments(postId, callback) {
  const q = query(collection(db, "community_posts", postId, "comments"), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[firestore] comments:", err?.message || err); callback([], err); });
}

export async function addComment(postId, user, text) {
  await addDoc(collection(db, "community_posts", postId, "comments"), {
    authorId: user.uid,
    authorName: user.name || user.email?.split("@")[0] || "Founder",
    text,
    createdAt: serverTimestamp(),
  });
  // bump comment count + notify the post author (real notification)
  try {
    const ref = doc(db, "community_posts", postId);
    const snap = await getDoc(ref);
    const n = (snap.data()?.commentCount || 0) + 1;
    await updateDoc(ref, { commentCount: n });
    const authorId = snap.data()?.authorId;
    if (authorId && authorId !== user.uid) {
      await notifyUser(authorId, {
        type: "comment",
        text: (user.name || "Someone") + " commented on your post: \u201C" + text.slice(0, 60) + (text.length > 60 ? "\u2026" : "") + "\u201D",
        to: "community",
      });
    }
  } catch {}
}

// ============================================================================
// HIRING — public profiles
// ============================================================================

// A public profile doc mirrors the private user doc but is world-readable
export async function savePublicProfile(uid, data) {
  await setDoc(doc(db, "public_profiles", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getPublicProfile(uid) {
  const snap = await getDoc(doc(db, "public_profiles", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Directory: everyone open to work OR hiring
export function onTalentDirectory(callback, max = 60) {
  const q = query(collection(db, "public_profiles"), orderBy("updatedAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[firestore] talent directory:", err?.message || err); callback([], err); });
}

// ============================================================================
// DIRECT MESSAGES — 1:1 chat
// ============================================================================

// deterministic conversation id from two uids
export function convoId(a, b) {
  return [a, b].sort().join("__");
}

export async function sendDM(fromUser, toUid, text) {
  const cid = convoId(fromUser.uid, toUid);
  // ensure conversation doc exists with participant list
  await setDoc(doc(db, "conversations", cid), {
    participants: [fromUser.uid, toUid],
    lastMessage: text,
    lastAt: serverTimestamp(),
  }, { merge: true });
  await addDoc(collection(db, "conversations", cid, "messages"), {
    fromId: fromUser.uid,
    fromName: fromUser.name || "User",
    text,
    createdAt: serverTimestamp(),
  });
  await notifyUser(toUid, {
    type: "dm",
    text: (fromUser.name || "Someone") + " sent you a message: \u201C" + text.slice(0, 50) + (text.length > 50 ? "\u2026" : "") + "\u201D",
    to: "messages",
  });
}

export function onDMThread(cid, callback) {
  const q = query(collection(db, "conversations", cid, "messages"), orderBy("createdAt", "asc"), limit(100));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[firestore] dm thread:", err?.message || err); callback([], err); });
}

export function onMyConversations(uid, callback) {
  // No orderBy here: array-contains + orderBy needs a composite index that
  // doesn't exist by default and silently breaks the page. Sort client-side.
  const q = query(collection(db, "conversations"), where("participants", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rows.sort((a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0));
    callback(rows);
  }, (err) => { console.error("[firestore] conversations:", err?.message || err); callback([], err); });
}

// ============================================================================
// GENERIC per-user collections (clients, leads, investors, meetings, etc.)
// ============================================================================

export async function getItems(uid, coll, max = 100) {
  const q = query(collection(db, "companies", uid, coll), orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function onItems(uid, coll, callback, max = 100) {
  const q = query(collection(db, "companies", uid, coll), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[firestore] " + coll + ":", err?.message || err); callback([], err); });
}

export async function addItem(uid, coll, item) {
  const ref = await addDoc(collection(db, "companies", uid, coll), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateItem(uid, coll, id, data) {
  await updateDoc(doc(db, "companies", uid, coll, id), data);
}

export async function deleteItem(uid, coll, id) {
  await deleteDoc(doc(db, "companies", uid, coll, id));
}

// ============================================================================
// AI COMPANY PROFILE (from the interview)
// ============================================================================

export async function saveAiProfile(uid, { aiProfile, aiInterview }) {
  await setDoc(doc(db, "companies", uid), {
    aiProfile: aiProfile || null,
    aiInterview: aiInterview || null,
    aiProfileAt: serverTimestamp(),
  }, { merge: true });
}

// ============================================================================
// GENERIC SUBCOLLECTIONS — live user data (tasks, clients, leads, …)
// ============================================================================

export function onSub(uid, coll, callback, max = 200) {
  const q = query(collection(db, "companies", uid, coll), orderBy("createdAt", "asc"), limit(max));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[firestore] " + coll + ":", err?.message || err); callback([], err); });
}

export async function addSub(uid, coll, data) {
  return addDoc(collection(db, "companies", uid, coll), { ...data, createdAt: serverTimestamp() });
}

export async function updSub(uid, coll, id, data) {
  return updateDoc(doc(db, "companies", uid, coll, id), data);
}

export async function delSub(uid, coll, id) {
  return deleteDoc(doc(db, "companies", uid, coll, id));
}

// ============================================================================
// METRICS HISTORY — one doc per month, powers real charts
// ============================================================================

export function monthKey(d = new Date()) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}

export async function saveMetricSnapshot(uid, snap) {
  const key = snap.monthKey || monthKey();
  await setDoc(doc(db, "companies", uid, "metrics", key), {
    monthKey: key,
    mrr: snap.mrr || 0,
    customers: snap.customers || 0,
    churn: snap.churn || 0,
    netBurn: snap.netBurn || 0,
    cash: snap.cash || 0,
    at: serverTimestamp(),
  }, { merge: true });
}

export function onMetrics(uid, callback) {
  const q = query(collection(db, "companies", uid, "metrics"), orderBy("monthKey", "asc"), limit(36));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[firestore] metrics:", err?.message || err); callback([], err); });
}

// ============================================================================
// USER NOTIFICATIONS — written by real events (DMs, comments)
// ============================================================================

export async function notifyUser(toUid, payload) {
  if (!toUid) return;
  try {
    await addDoc(collection(db, "users", toUid, "notifications"), {
      ...payload, read: false, createdAt: serverTimestamp(),
    });
  } catch { /* best-effort */ }
}

export function onUserNotifications(uid, callback, max = 30) {
  const q = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[firestore] notifications:", err?.message || err); callback([], err); });
}

export async function markNotifsRead(uid, ids) {
  await Promise.all(ids.map((id) => updateDoc(doc(db, "users", uid, "notifications", id), { read: true }).catch(() => {})));
}

// Re-export for convenience
export {
  doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy,
  limit, getDocs, addDoc, deleteDoc, serverTimestamp, onSnapshot,
};
