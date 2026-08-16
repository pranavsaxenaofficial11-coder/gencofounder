// ============================================================================
// src/org.js — the shared workspace: members, invites, and the usage ledger
// ============================================================================
// Why this exists at all: every user already gets a private workspace at
// companies/{uid}, and the Firestore rules restrict that subtree to its owner.
// That is the right shape for a founder's own company data — and it makes it
// impossible for a founder to see a teammate's API spend, because the two live
// in mutually unreadable trees.
//
// So team-wide data gets its own home:
//
//   orgs/{orgId}                    { ownerUid, name, joinCode, createdAt }
//   orgs/{orgId}/members/{memberId} { uid, name, email, role, title, dept,
//                                     phone, startedAt, status,
//                                     monthlyBudgetUsd, mailUpn }
//   orgs/{orgId}/usage/{autoId}     append-only cost ledger
//   orgs/{orgId}/settings/rates     the editable price card
//   org_invites/{code}              { orgId, orgName, ownerUid }
//
// companies/{uid} is untouched, so every existing module keeps working exactly
// as it does today.
//
// orgId is the founder's own uid. One founder, one workspace, no id allocation
// and no chance of collision.
//
// memberId is the teammate's uid once they have signed in and joined, or
// "invite_<random>" for someone the founder added who hasn't joined yet. The
// Team view reconciles the two by email address.
//
// Two conventions inherited from the rest of the codebase:
//
//   Firebase is imported dynamically, never statically. App.jsx does this in
//   ~35 places deliberately: a static import anywhere pulls the whole SDK into
//   the entry chunk and roughly doubles it, for visitors who may never sign
//   in. The subscription helpers below therefore resolve the SDK before
//   attaching, and return a cleanup that works whether or not that resolved.
//
//   Queries never combine `where` with `orderBy`. That needs a composite index
//   which does not exist by default, and its absence fails silently at
//   runtime — the same trap documented on onMyConversations in firebase.js.
//   Sorting happens client-side instead.
// ============================================================================

let _fbPromise = null;

/** The Firestore layer, loaded on first use and cached thereafter. */
function fb() {
  if (!_fbPromise) _fbPromise = import("./firebase.js");
  return _fbPromise;
}

/**
 * Shared shape for the live subscriptions below: attach once the SDK has
 * loaded, and hand back a cleanup that is safe to call before that happens.
 */
function subscribe(attach, onError) {
  let unsub = null;
  let cancelled = false;
  (async () => {
    try {
      const sdk = await fb();
      if (cancelled) return;
      unsub = attach(sdk);
    } catch (e) {
      if (!cancelled) onError?.(e);
    }
  })();
  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

export const MEMBER_ROLES = ["Founder", "Admin", "Team Member"];

// No 0/O/1/I/L — these codes get read aloud and typed by hand.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newJoinCode(len = 6) {
  const bytes = new Uint32Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export class OrgError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "OrgError";
    this.code = code; // bad-code | not-signed-in
  }
}

// -------------------------------------------------------------- workspace ---

/** The workspace this user belongs to, or null. */
export async function getMyOrgId(uid) {
  if (!uid) return null;
  try {
    const { db, doc, getDoc } = await fb();
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data().orgId || null : null;
  } catch {
    return null;
  }
}

/**
 * The founder's workspace, created on first use. Idempotent — safe to call on
 * every visit to Team or Billing.
 */
export async function ensureOrg(user, companyName) {
  if (!user?.uid) throw new OrgError("not-signed-in", "Sign in with a cloud account first.");
  const uid = user.uid;

  const existing = await getMyOrgId(uid);
  if (existing) return existing;

  const { db, doc, getDoc, setDoc, serverTimestamp } = await fb();
  const orgId = uid;
  const name = companyName || user.name || "My workspace";
  const orgRef = doc(db, "orgs", orgId);
  const snap = await getDoc(orgRef);

  let joinCode;
  if (snap.exists()) {
    joinCode = snap.data().joinCode || newJoinCode();
  } else {
    joinCode = newJoinCode();
    await setDoc(orgRef, {
      ownerUid: uid,
      name,
      joinCode,
      createdAt: serverTimestamp(),
    });
  }

  // The invite doc is what a joining teammate can actually read — they have no
  // access to the workspace document itself until they are a member.
  await setDoc(doc(db, "org_invites", joinCode), { orgId, orgName: name, ownerUid: uid });

  await setDoc(
    doc(db, "orgs", orgId, "members", uid),
    {
      uid,
      name: user.name || "Founder",
      email: (user.email || "").toLowerCase() || null,
      role: "Founder",
      title: "Account owner",
      status: "active",
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(doc(db, "users", uid), { orgId }, { merge: true });
  return orgId;
}

export function onOrg(orgId, callback) {
  if (!orgId) return () => {};
  return subscribe(
    ({ db, doc, onSnapshot }) =>
      onSnapshot(
        doc(db, "orgs", orgId),
        (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
        (err) => {
          console.error("[org] workspace:", err?.message || err);
          callback(null, err);
        }
      ),
    (e) => callback(null, e)
  );
}

export async function renameOrg(orgId, name) {
  const { db, doc, updateDoc, serverTimestamp } = await fb();
  await updateDoc(doc(db, "orgs", orgId), { name, updatedAt: serverTimestamp() });
}

/**
 * Issue a fresh join code and retire the old one, so a code that leaked stops
 * working.
 */
export async function rotateJoinCode(orgId, { orgName, ownerUid, oldCode } = {}) {
  const { db, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } = await fb();
  const joinCode = newJoinCode();
  await setDoc(doc(db, "org_invites", joinCode), {
    orgId,
    orgName: orgName || "Workspace",
    ownerUid: ownerUid || orgId,
  });
  await updateDoc(doc(db, "orgs", orgId), { joinCode, updatedAt: serverTimestamp() });
  if (oldCode && oldCode !== joinCode) {
    await deleteDoc(doc(db, "org_invites", oldCode)).catch(() => {});
  }
  return joinCode;
}

// ---------------------------------------------------------------- members ---

export function onMembers(orgId, callback) {
  if (!orgId) {
    callback([]);
    return () => {};
  }
  return subscribe(
    ({ db, collection, onSnapshot }) =>
      onSnapshot(
        collection(db, "orgs", orgId, "members"),
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // Founder first, then admins, then everyone alphabetically.
          const rank = (m) => MEMBER_ROLES.indexOf(m.role || "Team Member");
          rows.sort((a, b) => rank(a) - rank(b) || (a.name || "").localeCompare(b.name || ""));
          callback(rows);
        },
        (err) => {
          console.error("[org] members:", err?.message || err);
          callback([], err);
        }
      ),
    (e) => callback([], e)
  );
}

/** Add someone the founder knows about who hasn't signed in yet. */
export async function addInvitedMember(orgId, data) {
  const { db, doc, setDoc, serverTimestamp } = await fb();
  const memberId = "invite_" + newJoinCode(10).toLowerCase();
  await setDoc(doc(db, "orgs", orgId, "members", memberId), {
    uid: null,
    name: data.name || "",
    email: (data.email || "").toLowerCase() || null,
    role: data.role || "Team Member",
    title: data.title || null,
    dept: data.dept || null,
    phone: data.phone || null,
    startedAt: data.startedAt || null,
    monthlyBudgetUsd: Number(data.monthlyBudgetUsd) || 0,
    status: "invited",
    invitedAt: serverTimestamp(),
  });
  return memberId;
}

export async function updateMember(orgId, memberId, data) {
  const { db, doc, updateDoc, serverTimestamp } = await fb();
  await updateDoc(doc(db, "orgs", orgId, "members", memberId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeMember(orgId, memberId) {
  const { db, doc, deleteDoc } = await fb();
  await deleteDoc(doc(db, "orgs", orgId, "members", memberId));
}

/**
 * Join a workspace with a code. The code is the secret: the rules verify that
 * it resolves to this workspace and pin the new member to "Team Member", so a
 * joiner can neither pick their own role nor join a workspace they weren't
 * given the code for.
 */
export async function joinOrgByCode(user, code) {
  if (!user?.uid) throw new OrgError("not-signed-in", "Sign in with a cloud account first.");
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) throw new OrgError("bad-code", "Enter the invite code your founder gave you.");

  const { db, doc, getDoc, setDoc, serverTimestamp } = await fb();
  const inviteSnap = await getDoc(doc(db, "org_invites", clean));
  if (!inviteSnap.exists()) throw new OrgError("bad-code", "That invite code isn't valid.");
  const { orgId, orgName } = inviteSnap.data();

  await setDoc(doc(db, "orgs", orgId, "members", user.uid), {
    uid: user.uid,
    name: user.name || user.email?.split("@")[0] || "Team member",
    email: (user.email || "").toLowerCase() || null,
    role: "Team Member",
    joinCode: clean,
    status: "active",
    joinedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", user.uid), { orgId }, { merge: true });
  return { orgId, orgName };
}

/** Note that this member connected a Microsoft mailbox, for the Team view. */
export async function setMemberMailbox(orgId, uid, mailUpn) {
  if (!orgId || !uid) return;
  try {
    const { db, doc, updateDoc, serverTimestamp } = await fb();
    await updateDoc(doc(db, "orgs", orgId, "members", uid), {
      mailUpn: mailUpn || null,
      mailConnectedAt: mailUpn ? serverTimestamp() : null,
    });
  } catch {
    /* not a member of this workspace, or offline — not worth surfacing */
  }
}

// ------------------------------------------------------------------ usage ---

/** Append one row to the cost ledger. The ledger is never updated or deleted. */
export async function addUsage(orgId, row) {
  const { db, collection, addDoc, serverTimestamp } = await fb();
  return addDoc(collection(db, "orgs", orgId, "usage"), {
    ...row,
    createdAt: serverTimestamp(),
  });
}

/**
 * Live cost ledger.
 * @param scopeUid  pass a uid to see only that person's rows (what a Team
 *                  Member is allowed to read); omit for the whole workspace.
 */
export function onUsage(orgId, { scopeUid, max = 1000 } = {}, callback) {
  if (!orgId) {
    callback([]);
    return () => {};
  }
  return subscribe(
    ({ db, collection, query, where, orderBy, limit, onSnapshot }) => {
      const col = collection(db, "orgs", orgId, "usage");
      // One filter or one sort, never both — see the header note on indexes.
      const q = scopeUid
        ? query(col, where("uid", "==", scopeUid), limit(max))
        : query(col, orderBy("createdAt", "desc"), limit(max));
      return onSnapshot(
        q,
        (snap) => {
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          callback(rows);
        },
        (err) => {
          console.error("[org] usage:", err?.message || err);
          callback([], err);
        }
      );
    },
    (e) => callback([], e)
  );
}

// ------------------------------------------------------------------ rates ---

export function onRates(orgId, callback) {
  if (!orgId) {
    callback(null);
    return () => {};
  }
  return subscribe(
    ({ db, doc, onSnapshot }) =>
      onSnapshot(
        doc(db, "orgs", orgId, "settings", "rates"),
        (snap) => callback(snap.exists() ? snap.data().models || {} : {}),
        (err) => {
          console.error("[org] rates:", err?.message || err);
          callback({}, err);
        }
      ),
    (e) => callback({}, e)
  );
}

export async function saveRates(orgId, models) {
  const { db, doc, setDoc, serverTimestamp } = await fb();
  await setDoc(
    doc(db, "orgs", orgId, "settings", "rates"),
    { models: models || {}, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
