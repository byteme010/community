import { useParams } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  getDocs
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { useEffect, useState } from "react";

export default function Community() {
  const { name } = useParams();

  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [joined, setJoined] = useState(false);

  /* ===============================
     POSTS (SOURCE OF TRUTH)
     =============================== */
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("communityId", "==", name),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, async (snap) => {
      const enriched = await Promise.all(
        snap.docs.map(async (d) => {
          const voteSnap = await getDocs(
            query(collection(db, "votes"), where("postId", "==", d.id))
          );

          const voteCount = voteSnap.docs.reduce(
            (s, v) => s + v.data().value,
            0
          );

          return { id: d.id, ...d.data(), voteCount };
        })
      );

      setPosts(enriched);
    });
  }, [name]);

  /* ===============================
     JOIN STATUS (UI ONLY)
     =============================== */
  useEffect(() => {
    if (!auth.currentUser) return;

    const refDoc = doc(
      db,
      "communityMembers",
      `${name}_${auth.currentUser.uid}`
    );

    return onSnapshot(refDoc, (snap) => {
      setJoined(snap.exists());
    });
  }, [name]);

  /* ===============================
     CREATE POST
     =============================== */
const addPost = async () => {
  if (!auth.currentUser || (!text && !image)) return;

  const tempId = `temp-${Date.now()}`;

  // ✅ OPTIMISTIC UI (instant)
  setPosts(prev => [
    {
      id: tempId,
      text,
      imageUrl: "",
      communityId: name ?? "general",
      authorName: auth.currentUser.displayName,
      authorId: auth.currentUser.uid,
      createdAt: new Date(),
      voteCount: 0,
      __optimistic: true
    },
    ...prev
  ]);

  let imageUrl = "";
  if (image) {
    const imgRef = ref(storage, `posts/${Date.now()}`);
    await uploadBytes(imgRef, image);
    imageUrl = await getDownloadURL(imgRef);
  }

  // ✅ REAL SAVE
  await addDoc(collection(db, "posts"), {
    text,
    imageUrl,
    communityId: name ?? "general",
    authorName: auth.currentUser.displayName,
    authorId: auth.currentUser.uid,
    createdAt: serverTimestamp()
  });

  setText("");
  setImage(null);
};


  /* ===============================
     JOIN / LEAVE
     =============================== */
  const joinCommunity = async () => {
    await setDoc(
      doc(db, "communityMembers", `${name}_${auth.currentUser.uid}`),
      {
        community: name,
        userId: auth.currentUser.uid,
        joinedAt: serverTimestamp()
      }
    );
  };

  const leaveCommunity = async () => {
    await deleteDoc(
      doc(db, "communityMembers", `${name}_${auth.currentUser.uid}`)
    );
  };

  /* ===============================
     VOTING (FIXED)
     =============================== */
  const vote = async (postId, value) => {
    if (!auth.currentUser) return;

    const voteRef = doc(db, "votes", `${postId}_${auth.currentUser.uid}`);
    const snap = await getDoc(voteRef);

    if (!snap.exists()) {
      await setDoc(voteRef, {
        postId,
        userId: auth.currentUser.uid,
        value
      });
      return;
    }

    if (snap.data().value === value) {
      await deleteDoc(voteRef);
      return;
    }

    await updateDoc(voteRef, { value });
  };

  /* ===============================
     DELETE POST
     =============================== */
  const deletePost = async (postId) => {
    await deleteDoc(doc(db, "posts", postId));
  };

  return (
    <div>
      <h2>/r/{name}</h2>

      {joined ? (
        <button onClick={leaveCommunity}>Leave</button>
      ) : (
        <button onClick={joinCommunity}>Join</button>
      )}

      <hr />

      <textarea
        placeholder={`Post to /r/${name}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", padding: 8 }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />

      <button onClick={addPost} style={{ marginTop: 6 }}>
        Post
      </button>

      <hr />

      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          vote={vote}
          deletePost={deletePost}
        />
      ))}
    </div>
  );
}

/* ===============================
   POST CARD + COMMENTS
   =============================== */
function PostCard({ post, vote, deletePost }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  /* COMMENTS LISTENER */
  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", post.id),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [post.id]);

  /* ADD COMMENT */
  const addComment = async () => {
    if (!auth.currentUser || !commentText) return;

    await addDoc(collection(db, "comments"), {
      postId: post.id,
      text: commentText,
      authorName: auth.currentUser.displayName,
      authorId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    setCommentText("");
  };

  return (
    <div className="glass" style={{ padding: 18, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <button onClick={() => vote(post.id, 1)}>⬆</button>
          <div>{post.voteCount}</div>
          <button onClick={() => vote(post.id, -1)}>⬇</button>
        </div>

        <div>
          <strong>{post.authorName}</strong>
          <p>{post.text}</p>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt=""
              style={{ maxWidth: 300, borderRadius: 8 }}
            />
          )}

          {auth.currentUser?.uid === post.authorId && (
            <button onClick={() => deletePost(post.id)}>Delete</button>
          )}

          {/* COMMENTS */}
          <div style={{ marginTop: 10 }}>
            {comments.map((c) => (
              <div key={c.id}>
                <b>{c.authorName}:</b> {c.text}
              </div>
            ))}

            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
            />
            <button onClick={addComment}>Comment</button>
          </div>
        </div>
      </div>
    </div>
  );
}
