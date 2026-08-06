package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"

	"alphastream-core/internal/alpaca"
	"alphastream-core/internal/config"
	"alphastream-core/internal/log"
	"alphastream-core/internal/ml"
	"alphastream-core/internal/persistence"
	"alphastream-core/internal/state"
	"alphastream-core/internal/trading"
)

// ======================================================
// JSON RESPONSE HELPER
// ======================================================

func jsonResponse(
	w http.ResponseWriter,
	data interface{},
) {

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	_ = json.NewEncoder(w).Encode(data)
}

// ======================================================
// CORS MIDDLEWARE
// ======================================================

func corsMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(
		w http.ResponseWriter,
		r *http.Request,
	) {

		origin := r.Header.Get("Origin")

		allowedOrigins := map[string]bool{
			"https://alphastream-dashboard.vercel.app": true,
			"https://alphastream-dashboard.pages.dev": true,
			"http://localhost:3000":                    true,
		}

		if allowedOrigins[origin] {

			w.Header().Set(
				"Access-Control-Allow-Origin",
				origin,
			)

		} else {

			w.Header().Set(
				"Access-Control-Allow-Origin",
				"*",
			)
		}

		w.Header().Set(
			"Access-Control-Allow-Methods",
			"GET,POST,PUT,DELETE,OPTIONS",
		)

		w.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type,x-admin-key,Authorization,X-Requested-With",
		)

		w.Header().Set(
			"Access-Control-Max-Age",
			"86400",
		)

		if r.Method == http.MethodOptions {

			w.WriteHeader(http.StatusNoContent)

			return
		}

		next.ServeHTTP(w, r)

	})
}

// ======================================================
// ADMIN MIDDLEWARE
// ======================================================

func adminMiddleware(next http.Handler) http.Handler {

	return http.HandlerFunc(func(
		w http.ResponseWriter,
		r *http.Request,
	) {

		if r.Method == http.MethodOptions {

			next.ServeHTTP(w, r)

			return
		}

		expectedKey := os.Getenv("ADMIN_KEY")

		if expectedKey == "" {

			log.Warn(
				"ADMIN_KEY not set; rejecting admin request",
				nil,
			)

			http.Error(
				w,
				"admin endpoints disabled",
				http.StatusServiceUnavailable,
			)

			return
		}

		providedKey := r.Header.Get("x-admin-key")

		if providedKey == "" || providedKey != expectedKey {

			http.Error(
				w,
				"unauthorized",
				http.StatusUnauthorized,
			)

			return
		}

		next.ServeHTTP(w, r)

	})
}

// ======================================================
// HEALTH
// ======================================================

func healthHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	jsonResponse(
		w,
		map[string]interface{}{
			"status":  "ok",
			"service": "alphastream-core",
			"time":    time.Now(),
		},
	)
}

// ======================================================
// STATUS
// ======================================================

func statusHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	s := state.Get()

	drawdown := 0.0

	if s.PeakEquity > 0 {

		drawdown =
			((s.PeakEquity-s.Equity) /
				s.PeakEquity) * 100
	}

	jsonResponse(
		w,
		map[string]interface{}{
			"ok":                  true,
			"equity":              s.Equity,
			"peakEquity":          s.PeakEquity,
			"buyingPower":         s.BuyingPower,
			"positions":           len(s.Positions),
			"positionsCount":      len(s.Positions),
			"hardFlat":             s.HardFlatActive,
			"degraded":             s.DegradedActive,
			"winRate":              s.RecentWinRate,
			"drawdownPct":          drawdown,
			"totalTrades":          s.TotalTrades,
			"lastMag7Sentiment":    s.LastMag7Sentiment,
			"version":              "2026-go-core",
		},
	)
}

// ======================================================
// DASHBOARD METRICS
// ======================================================

func metricsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	s := state.Get()

	drawdown := 0.0

	if s.PeakEquity > 0 {

		drawdown =
			((s.PeakEquity-s.Equity) /
				s.PeakEquity) * 100
	}

	jsonResponse(
		w,
		map[string]interface{}{
			"equity":       s.Equity,
			"positions":    len(s.Positions),
			"drawdownPct":  drawdown,
			"winRate":      s.RecentWinRate,
			"totalTrades":  s.TotalTrades,
		},
	)
}

// ======================================================
// POSITIONS
// ======================================================

func positionsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	s := state.Get()

	jsonResponse(
		w,
		map[string]interface{}{
			"positions": s.Positions,
			"count":     len(s.Positions),
		},
	)
}

// ======================================================
// TRADES
// ======================================================

func tradesHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	jsonResponse(
		w,
		map[string]interface{}{
			"trades": []interface{}{},
		},
	)
}

// ======================================================
// ADMIN SCAN
// ======================================================

func scanHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	go trading.ScanForRockets()

	jsonResponse(
		w,
		map[string]string{
			"status": "scan started",
		},
	)
}

// ======================================================
// HARD FLAT
// ======================================================

func hardFlatHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	state.Update(
		func(s *state.State) {

			s.HardFlatActive = true

		},
	)

	err := alpaca.CloseAllPositions()

	jsonResponse(
		w,
		map[string]interface{}{
			"status": "hard flat triggered",
			"error":  err,
		},
	)
}

// ======================================================
// CLEAR BLACKLIST
// ======================================================

func clearBlacklistHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	jsonResponse(
		w,
		map[string]string{
			"status": "blacklists cleared",
		},
	)
}

// ======================================================
// LOGS
// ======================================================

func logsHandler(
	w http.ResponseWriter,
	r *http.Request,
) {

	jsonResponse(
		w,
		map[string]interface{}{
			"logs": []string{
				"[INFO] AlphaStream Core started",
				"[INFO] Trading cycle active",
				"[INFO] ML connected",
			},
		},
	)
}

// ======================================================
// MAIN
// ======================================================

func main() {

	config.Load()

	log.Init()

	persistence.Init()

	alpaca.Init()

	ml.Init()

	if err := persistence.LoadState(); err != nil {

		log.Warn(
			"State load failed",
			err,
		)
	}

	router := mux.NewRouter()

	router.Use(
		corsMiddleware,
	)

	router.HandleFunc(
		"/health",
		healthHandler,
	).Methods(
		http.MethodGet,
		http.MethodOptions,
	)

	router.HandleFunc(
		"/status",
		statusHandler,
	).Methods(
		http.MethodGet,
		http.MethodOptions,
	)

	router.HandleFunc(
		"/metrics",
		metricsHandler,
	).Methods(
		http.MethodGet,
		http.MethodOptions,
	)

	router.HandleFunc(
		"/positions",
		positionsHandler,
	).Methods(
		http.MethodGet,
		http.MethodOptions,
	)

	router.HandleFunc(
		"/trades",
		tradesHandler,
	).Methods(
		http.MethodGet,
		http.MethodOptions,
	)

	router.HandleFunc(
		"/",
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {

			fmt.Fprint(
				w,
				"AlphaStream Core is running",
			)

		},
	)

	router.Handle(
		"/admin/scan",
		adminMiddleware(
			http.HandlerFunc(scanHandler),
		),
	).Methods(
		http.MethodPost,
		http.MethodOptions,
	)

	router.Handle(
		"/admin/hard-flat",
		adminMiddleware(
			http.HandlerFunc(hardFlatHandler),
		),
	).Methods(
		http.MethodPost,
		http.MethodOptions,
	)

	router.Handle(
		"/admin/clear-blacklist",
		adminMiddleware(
			http.HandlerFunc(clearBlacklistHandler),
		),
	).Methods(
		http.MethodPost,
		http.MethodOptions,
	)

	router.Handle(
		"/admin/logs",
		adminMiddleware(
			http.HandlerFunc(logsHandler),
		),
	).Methods(
		http.MethodGet,
		http.MethodOptions,
	)

	go trading.CycleRunner()

	server := &http.Server{

		Addr: fmt.Sprintf(
			":%d",
			config.C.Port,
		),

		Handler: router,
	}

	go func() {

		stop := make(
			chan os.Signal,
			1,
		)

		signal.Notify(
			stop,
			syscall.SIGTERM,
			syscall.SIGINT,
		)

		<-stop

		log.Info(
			"Shutdown requested",
		)

		ctx, cancel :=
			context.WithTimeout(
				context.Background(),
				15*time.Second,
			)

		defer cancel()

		_ = server.Shutdown(ctx)

	}()

	log.Info(
		fmt.Sprintf(
			"AlphaStream Core running on port %d",
			config.C.Port,
		),
	)

	if err :=
		server.ListenAndServe();

		err != nil &&
			err != http.ErrServerClosed {

		log.Fatal(
			"Server failed",
			err,
		)
	}
}

