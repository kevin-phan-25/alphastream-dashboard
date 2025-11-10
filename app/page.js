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
      textAlign: "center",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ fontSize: "5rem", marginBottom: "1rem" }}>AlphaStream LIVE</h1>
      <p style={{ fontSize: "2rem", marginBottom: "3rem" }}>@Kevin_Phan25</p>
      <a href="/dashboard" style={{
        padding: "1.5rem 4rem",
        background: "#00ff9d",
        color: "#0a1f3d",
        borderRadius: "50px",
        fontWeight: "bold",
        fontSize: "1.8rem",
        textDecoration: "none",
        boxShadow: "0 0 40px #00ff9d88"
      }}>
        ENTER LIVE DASHBOARD
      </a>
    </div>
  );
}
