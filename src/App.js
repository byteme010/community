import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Home from "./pages/home";
import Community from "./pages/community";
import CreateCommunity from "./pages/createcommunity";
import Communities from "./pages/communities";
import Sidebar from "./sidebar";

function App() {
  // ✅ state FIRST
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // 🔥 auth resolved
    });

    return () => unsub();
  }, []);

  // ✅ single, clean login function
  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  // ✅ prevent rendering before auth ready
  if (loading) {
    return (
      <div style={{ background: "#020617", color: "white", padding: 20 }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div
        style={{
          background: "#020617",
          minHeight: "100vh",
          color: "white"
        }}
      >
        <h1 style={{ padding: 20 }}>Community</h1>

        {user ? (
          <>
            <div style={{ padding: "0 20px 20px" }}>
              <p>Logged in as {user.displayName}</p>
              <button onClick={() => signOut(auth)}>Logout</button>
            </div>

            {/* 🔥 MAIN LAYOUT WITH SIDEBAR */}
            <div
              style={{
                display: "flex",
                gap: 24,
                padding: 20
              }}
            >
              {/* SIDEBAR */}
              <Sidebar />

              {/* MAIN CONTENT */}
              <div style={{ flex: 1 }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/r/:name" element={<Community />} />
                  <Route path="/create-community" element={<CreateCommunity />} />
                  <Route path="/communities" element={<Communities />} />
                </Routes>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 20 }}>
            <button onClick={login}>Login with Google</button>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
