import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div
      className="glass"
      style={{
        width: 240,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}
    >
      <h3>🌌 Navigation</h3>

      <Link to="/" className="btn btn-secondary">Home</Link>
      <Link to="/communities" className="btn btn-secondary">Communities</Link>
      <Link to="/create-community" className="btn">+ Create Community</Link>
    </div>
  );
}
