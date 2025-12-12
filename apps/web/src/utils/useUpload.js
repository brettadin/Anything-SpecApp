import * as React from 'react';

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      
      // For simplicity, create a data URL from the file
      // This allows us to pass the file content to our backend
      if ("file" in input && input.file) {
        const file = input.file;
        
        // Read file as text or data URL
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            resolve({ 
              url: result, // data URL that can be parsed
              mimeType: file.type || 'text/plain'
            });
          };
          reader.onerror = () => {
            resolve({ error: 'Failed to read file' });
          };
          
          // For text files, read as text. For binary, read as data URL
          if (file.type.startsWith('text/') || 
              file.name.match(/\.(csv|tsv|txt|jdx|dx|jcamp)$/i)) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsDataURL(file);
          }
        });
      }
      
      // Fallback for other input types
      return { error: 'Unsupported upload type' };
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;