import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
  updateDoc,
  increment,
  where,
  getDoc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth, storage } from "../firebase";
import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/* ===============================
   HOME PAGE (GENERAL COMMUNITY)
   =============================== */
export default function Home() {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);

  /* ===============================
     CREATE POST (FIXED)
     =============================== */
 const addPost = async () => {
  if (!auth.currentUser || (!text && !image)) return;

  let imageUrl = "";

  if (image) {
    const imageRef = ref(
      storage,
      `posts/${auth.currentUser.uid}/${Date.now()}`
    );
    await uploadBytes(imageRef, image);
    imageUrl = await getDownloadURL(imageRef);
  }

  // 🔥 ONLY add to Firestore — NO local fake post
  await addDoc(collection(db, "posts"), {
    text,
    imageUrl,
    authorName: auth.currentUser.displayName,
    authorId: auth.currentUser.uid,
    communityId: "general",
    voteCount: 0,
    createdAt: serverTimestamp()
  });

  setText("");
  setImage(null);
};

  /* ===============================
     VOTING (UNCHANGED)
     =============================== */
  const vote = async (postId, value) => {
    if (!auth.currentUser) return;

    const voteRef = doc(db, "votes", `${postId}_${auth.currentUser.uid}`);
    const postRef = doc(db, "posts", postId);
    const snap = await getDoc(voteRef);

    if (!snap.exists()) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, voteCount: p.voteCount + value } : p
        )
      );

      await setDoc(voteRef, {
        postId,
        userId: auth.currentUser.uid,
        value
      });

      await updateDoc(postRef, { voteCount: increment(value) });
      return;
    }

    const oldValue = snap.data().value;

    if (oldValue === value) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, voteCount: p.voteCount - oldValue } : p
        )
      );
      await deleteDoc(voteRef);
      await updateDoc(postRef, { voteCount: increment(-oldValue) });
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, voteCount: p.voteCount + (value - oldValue) }
          : p
      )
    );

    await updateDoc(voteRef, { value });
    await updateDoc(postRef, {
      voteCount: increment(value - oldValue)
    });
  };

  /* ===============================
     POSTS SNAPSHOT (UNCHANGED)
     =============================== */
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("communityId", "==", "general"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div>
      <h2>Create Post</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind?"
        style={{ width: "100%", padding: 8 }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
      />

      <button onClick={addPost}>Post</button>

      <hr />

      <h2>Feed</h2>

      {posts.map((p) => (
        <PostCard key={p.id} post={p} vote={vote} />
      ))}
    </div>
  );
}

/* ===============================
   POST CARD (UNCHANGED)
   =============================== */
function PostCard({ post, vote }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", post.id),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [post.id]);

  const submitComment = async () => {
    if (!text || !auth.currentUser) return;

    await addDoc(collection(db, "comments"), {
      postId: post.id,
      parentId: replyTo,
      text,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.displayName,
      createdAt: serverTimestamp(),
      edited: false
    });

    setText("");
    setReplyTo(null);
    setEditing(null);
  };

  return (
    
    
    <div style={{ padding: 12, borderBottom: "1px solid #444" }}>
      <strong>{post.authorName}</strong>
      <p>{post.text}</p>

      <div>
        <button onClick={() => vote(post.id, 1)}>⬆</button>
        {post.voteCount}
        <button onClick={() => vote(post.id, -1)}>⬇</button>
      </div>
      

      <div style={{ marginTop: 12 }}>
        {comments.map((c) => (
          <div key={c.id}>
            <b>{c.authorName}:</b> {c.text}
          </div>
        ))}
        

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
        />
        <button onClick={submitComment}>Comment</button>
      </div>
    </div>
    
  );
}
