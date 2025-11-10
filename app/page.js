// app/page.js
export default function Home() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1f3d 0%, #001529 100%)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "5rem", margin: 0 }}>ALPHASTREAM LIVE</h1>
      <p style={{ fontSize: "2.5rem", color: "#00ff9d", margin: "1rem 0" }}>@Kevin_Phan25</p>
      <a href="/dashboard" style={{
        marginTop: "3rem",
        padding: "1.5rem 4rem",
        background: "#00ff9d",
        color: "#000",
        borderRadius: "50px",
        fontWeight: "bold",
        fontSize: "2rem",
        textDecoration: "none",
        boxShadow: "0 0 40px #00ff9d88"
      }}>
        ENTER LIVE DASHBOARD
      </a>
    </div>
  );
}
