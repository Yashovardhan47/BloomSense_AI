import { useState } from "react";
import { ArrowRight, Flower2, History, Home, LogIn, LogOut, Menu, ScanLine, Sprout, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const signOut = async () => {
    await logout();
    close();
    navigate("/");
  };

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Primary navigation">
        <Link to={user ? "/home" : "/"} className="brand" onClick={close}>
          <span className="brand-icon"><Flower2 size={21} /></span>
          <span>BloomSense <strong>AI</strong></span>
        </Link>
        <button className="mobile-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
        <div className={`nav-links ${open ? "is-open" : ""}`}>
          {!user && <NavLink to="/" end onClick={close}>Project overview</NavLink>}
          {user && <NavLink to="/home" onClick={close}><Home size={16} /> Home</NavLink>}
          {user && <NavLink to="/discover" onClick={close}><ScanLine size={16} /> Discover</NavLink>}
          {user && <NavLink to="/garden" onClick={close}><Sprout size={16} /> My garden</NavLink>}
          {user && <NavLink to="/history" onClick={close}><History size={16} /> History</NavLink>}
          {user ? (
            <>
              <div className="user-chip">
                {user.avatar_url ? <img src={user.avatar_url} alt="" /> : <span>{user.name?.[0]?.toUpperCase()}</span>}
                <div><b>{user.name}</b><small>{user.provider === "demo" ? "Demo explorer" : "Bloom explorer"}</small></div>
              </div>
              <button className="nav-action subtle" onClick={signOut}><LogOut size={16} /> Sign out</button>
            </>
          ) : (
            <>
              <Link className="nav-action subtle" to="/auth" onClick={close}><LogIn size={16} /> Sign in</Link>
              <Link className="nav-action nav-primary" to="/auth?mode=register" onClick={close}>Get started <ArrowRight size={16} /></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
