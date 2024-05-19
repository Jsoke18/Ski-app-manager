const bucketName = 'ski-resorts-bucket';
const bucketUrl = `https://storage.googleapis.com/${bucketName}`;

async function uploadImageToGCS(file) {
  console.log('Uploading image:', file.name);

  const formData = new FormData();
  formData.append('file', file);

  console.log('Form data:', formData);

  const response = await fetch(`${bucketUrl}/${file.name}`, {
    method: 'POST',
    body: formData,
  });

  console.log('Response status:', response.status);
  console.log('Response ok:', response.ok);

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  const publicUrl = `${bucketUrl}/${file.name}`;
  console.log('Public URL:', publicUrl);

  return publicUrl;
}

export { uploadImageToGCS };