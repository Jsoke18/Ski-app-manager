// OverpassTurboPage.js
import React from 'react';

const OverpassTurboPage = () => {
  const query = `
    // @name sunshine-village
    [out:json][timeout:25];
    // gather results
    (  
      // query part for: "piste:type"  
      way["piste:type"]({{bbox}});  
      relation["piste:type"]({{bbox}});
    );
    // print results
    out body;
    >;
    out skel qt;
  `;

  const encodedQuery = encodeURIComponent(query.trim());
  const overpassTurboUrl = `https://overpass-turbo.eu/?Q=${encodedQuery}&C=0`;

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
      <iframe
        src={overpassTurboUrl}
        title="Overpass Turbo"
        width="100%"
        height="100%"
        frameBorder="0"
      />
    </div>
  );
};

export default OverpassTurboPage;