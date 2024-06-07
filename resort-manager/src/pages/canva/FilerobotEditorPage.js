import React, { useState } from 'react';
import { ImageEditor } from '@filerobot/image-editor';
import 'react-image-editor/dist/index.css'; // Import the necessary CSS

const FilerobotEditorPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [src, setSrc] = useState('https://cdn.scaleflex.it/filerobot/assets/filerobot.jpg');

  return (
    <div style={{ padding: '50px' }}>
      <button onClick={() => setIsVisible(true)}>Open Image Editor</button>
      {isVisible && (
        <ImageEditor
          src={src}
          config={{
            cloudimage: {
              token: 'demo'
            }
          }}
          closeOnLoad
          onComplete={(newUrl) => {
            console.log('Edited image URL:', newUrl);
            setIsVisible(false);
          }}
          onClose={() => setIsVisible(false)}
        />
      )}
    </div>
  );
};

export default FilerobotEditorPage;
