import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function CreateCommunity() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const createCommunity = async () => {
    if (!name || !auth.currentUser) return;

    const cleanName = name.toLowerCase().replace(/\s+/g, "");

    await addDoc(collection(db, "communities"), {
      name: cleanName,
      createdBy: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });

    navigate(`/r/${cleanName}`);
  };

  return (
    <div>
      <h2>Create Community</h2>

      <input
        placeholder="Community name (eg: physics)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={createCommunity} style={{ marginLeft: 8 }}>
        Create
      </button>
    </div>
  );
}
