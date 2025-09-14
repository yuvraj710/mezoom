#!/bin/bash

echo "Starting MeZoom Video Conferencing Application..."
echo

echo "Installing dependencies..."
npm run install-all

echo
echo "Starting the application..."
npm run dev
