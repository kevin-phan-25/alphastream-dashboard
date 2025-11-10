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
      fontFamily: "system-ui",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: "5rem" }}>ALPHASTREAM LIVE</h1>
      <p style={{ fontSize: "2.5rem", color: "#00ff9d" }}>@Kevin_Phan25</p>
      <a href="/dashboard" style={{
        marginTop: "3rem",
        padding: "1.5rem 4rem",
        background: "#00ff9d",
        color: "black",
        borderRadius: "50px",
        fontWeight: "bold",
        fontSize: "2rem",
        textDecoration: "none"
      }}>
        ENTER LIVE DASHBOARD
      </a>
    </div>
  );
}
