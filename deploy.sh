#!/bin/bash
git add .
git commit -m "v5.9 live"
git push origin main
echo "Deployed! Visit: https://alphastream-dashboard.vercel.app"
