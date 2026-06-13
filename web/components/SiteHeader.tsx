import Link from 'next/link';
import { MEMBER_COLORS } from '@/lib/layout';
import LangToggle from './LangToggle';

// Global header (title + JP subtitle + 12-color rainbow border), rendered on
// every page from the root layout. Same structure as the old in-page header.
export default function SiteHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <LangToggle />
        <Link href="/" className="app-header-link">
          <div className="poster-title">MY PICK NIJIGASAKI</div>
          <div className="poster-subtitle">虹ヶ咲学園スクールアイドル同好会 お気に入り楽曲選</div>
        </Link>
      </div>
      {/* full-bleed, square rainbow border spanning edge to edge */}
      <div className="rainbow-border">
        {MEMBER_COLORS.map((c, i) => (
          <span key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>
    </header>
  );
}
