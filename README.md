# Figma to VTEX IO Converter

A tool to convert Figma designs into VTEX IO components and styles.

## Features

- Convert Figma designs to VTEX IO components
- Extract CSS styles from Figma layers
- Interactive web interface for easy conversion
- Support for various Figma component types

## Setup

1. Clone the repository
2. Install dependencies:
3. Start the server:

## Usage

1. Open the web interface at http://localhost:3000
2. Enter your Figma Access Token and File Key
3. Select a page and layer from your Figma file
4. Click "Convert" to generate VTEX IO components
5. Click "Get Styles" to extract CSS styles

## Deployment

This project is configured for easy deployment on Render.

### Deploy to Render

1. Fork or clone this repository to your GitHub account
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Use the following settings:
- Build Command: `npm install`
- Start Command: `npm start`
- Node.js version: 18.x
5. Click "Create Web Service"