import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Communities() {
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "communities"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setCommunities(snap.docs.map(d => d.data()));
    });
  }, []);

  return (
    <div>
      <h2>All Communities</h2>

      {communities.length === 0 && <p>No communities yet.</p>}

      {communities.map((c, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <Link to={`/r/${c.name}`}>/r/{c.name}</Link>
        </div>
      ))}
    </div>
  );
}
