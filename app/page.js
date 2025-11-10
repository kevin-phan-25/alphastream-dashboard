// app/page.js
export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1f3d 0%, #001529 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '4.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
        AlphaStream LIVE
      </h1>
      <p style={{ fontSize: '2rem', marginBottom: '3rem', opacity: 0.9 }}>
        @Kevin_Phan25 • November 10, 2025
      </p>
      <a
        href="/dashboard"
        style={{
          padding: '1.5rem 4rem',
          background: '#00ff9d',
          color: '#0a1f3d',
          borderRadius: '50px',
          fontWeight: 'bold',
          fontSize: '1.8rem',
          textDecoration: 'none',
          boxShadow: '0 0 40px #00ff9d88',
          transition: 'all 0.3s'
        }}
        onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={e => e.target.style.transform = 'scale(1)'}
      >
        ENTER LIVE DASHBOARD
      </a>
      <p style={{ marginTop: '3rem', fontSize: '1.2rem', opacity: 0.7 }}>
        Ross Cameron's $99/month scanner — built by you — for free.
      </p>
    </div>
  );
}
