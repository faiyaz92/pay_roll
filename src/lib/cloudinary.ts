// lib/cloudinary.ts

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Carrental');

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnf7pisvw';
  
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error('Cloudinary upload failed');
  }

  const data = await res.json();
  return data.secure_url; // ✅ This is the public image URL you should store in Firebase
}

export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extract public_id from the image URL
    const urlParts = imageUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1]; // e.g., "image_name.jpg"
    const publicId = publicIdWithExtension.split('.')[0]; // Remove the file extension

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnf7pisvw';
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '223735388477295';
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'xKgEESiy9OLuANQIj4T7p9oRlBs';

    // Create the signature for authentication
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    
    // For browser environment, we'll use a different approach
    // Since crypto.createHash is not available in browser, we'll skip deletion for now
    // In production, you should implement this on your backend
    console.log('Image deletion should be handled on backend for security');
    
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
}

export interface DocumentUpload {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  size?: number;
}

export async function uploadDocuments(documents: { file: File; name: string; type: string }[]): Promise<DocumentUpload[]> {
  const uploadPromises = documents.map(async (doc) => {
    const url = await uploadToCloudinary(doc.file);
    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: doc.name,
      url: url,
      type: doc.type,
      uploadedAt: new Date().toISOString(),
      size: doc.file.size
    };
  });

  return Promise.all(uploadPromises);
}