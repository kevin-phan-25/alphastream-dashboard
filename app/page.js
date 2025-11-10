// app/page.js
export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a1f3d', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>AlphaStream LIVE</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>@Kevin_Phan25</p>
      <a 
        href="/dashboard" 
        style={{ 
          padding: '1rem 2rem', 
          background: '#00ff9d', 
          color: '#0a1f3d', 
          borderRadius: '50px', 
          fontWeight: 'bold', 
          textDecoration: 'none',
          fontSize: '1.2rem'
        }}
      >
        ENTER LIVE DASHBOARD
      </a>
    </div>
  );
}
