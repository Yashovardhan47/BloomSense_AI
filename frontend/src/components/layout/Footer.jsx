import { Flower2, Github, Heart, Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-icon"><Flower2 size={20} /></span> BloomSense <strong>AI</strong></div>
          <p>Making botanical knowledge visual, multilingual, and accessible.</p>
        </div>
        <div className="footer-status"><Leaf size={16} /> Built for responsible plant discovery</div>
        <a href="https://github.com/Yashovardhan47/BloomSense_AI" target="_blank" rel="noreferrer"><Github size={17} /> Source</a>
      </div>
      <div className="container footer-bottom">Made with <Heart size={14} /> for curious minds · Recognition is informational, not medical or foraging advice.</div>
    </footer>
  );
}
