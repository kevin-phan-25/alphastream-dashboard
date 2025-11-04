#!/bin/bash
echo "Deploying ALPHASTREAM DASHBOARD..."

# Install
npm install

# Set env
echo "POLYGON_KEY=your_polygon_key_here" > .env

# Start
node server.js
