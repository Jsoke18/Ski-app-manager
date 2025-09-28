# Copilot Instructions for Ski Resort Manager

## Project Overview
This is a React-based ski resort management system with five main modules: Resorts, Users, Scraping, Overpass Turbo, and Ski Passes. The application provides CRUD operations for managing ski resort data with image uploads, GeoJSON file handling, and external API integrations.

## Architecture & Tech Stack
- **Frontend**: React 18 + Ant Design UI components
- **Backend API**: Node.js server running on `localhost:3000`  
- **File Storage**: Google Cloud Storage for images
- **Data**: Complex nested objects with FormData for file uploads
- **External Tools**: Overpass Turbo for OpenStreetMap ski piste data, Filerobot image editor

## Key Service Patterns

### API Communication
All services follow a consistent pattern with axios and error handling:
- Base URL: `http://localhost:3000`
- Use FormData for file uploads (images, GeoJSON)
- JSON for simple data operations
- Always include comprehensive error logging

### File Upload Strategy
The project uses two different upload approaches:
1. **With files**: FormData with individual field appends (not JSON objects)
2. **Without files**: JSON payload
3. **Ingest endpoints**: Try `/ingest` first, fallback to regular endpoints

Example from `skiPassService.js`:
```javascript
// Append nested objects as JSON strings
requestData.append('price', JSON.stringify(skiPassData.price || {}));
requestData.append('restrictions', JSON.stringify(skiPassData.restrictions || {}));
```

## Component Structure

### Page-Component Pattern
Each major feature follows this structure:
```
pages/
  feature-name/
    FeaturePage.js          // Main container with state management
    components/
      FeatureForm.js        // Complex form with file uploads
      FeatureTable.js       // Data table with inline editing
```

### Form Handling Conventions
- Use Ant Design Form with `form.setFieldsValue()` for updates
- Separate image file state from form data
- Handle file uploads with controlled `fileList` state
- Clear file lists when switching between add/edit modes

### Table Features
All data tables implement:
- Inline editing with pending changes tracking
- Bulk actions with confirmation dialogs
- Advanced filtering (country, province, data quality metrics)
- Copy-to-clipboard functionality for data fields
- Status indicators with colored tags

## Critical Development Patterns

### Environment Setup
```bash
cd resort-manager
npm start    # Runs on localhost:3001 (note: different from API port)
```

### Data Models
Resort objects contain complex nested structures:
- `location: { lat, lng, country, province }`
- `lifts: { open, total }` and `runs: { open, total }`
- `skiPasses: [array of ski pass IDs]`
- Equipment counts: `helicopters`, `snowCats`, `gondolas`

### Google Cloud Integration
- Service account key: `just-lore-401104-6e9d4171dc44.json`
- Bucket: `ski-resorts-bucket`
- Upload function handles FormData posting to GCS

### Scraping Workflow
The scraping page implements a 2-step process:
1. Scrape data from external URL via backend
2. Edit/refine data in ResortsForm before final submission

### Overpass Turbo Integration
Embedded iframe with pre-configured query for ski piste data:
```javascript
const query = `[out:json][timeout:25];
(way["piste:type"]({{bbox}});relation["piste:type"]({{bbox}}););
out body;>;out skel qt;`;
```

## Common Pitfalls to Avoid
1. **File uploads**: Never mix JSON and FormData - use one or the other
2. **Form state**: Always clear `imageFileList` when switching add/edit modes
3. **Nested objects**: Stringify complex objects when using FormData
4. **API endpoints**: Try ingest endpoints first, fallback to regular CRUD
5. **Table editing**: Track pending changes separately from main data state

## Debugging Tips
- All services include comprehensive console logging
- Check Network tab for FormData vs JSON content-type issues
- Verify file upload states in component logs
- Monitor pending changes tracking in table components