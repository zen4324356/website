import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = path.join(process.cwd(), 'temp_emails');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export const saveTempEmail = async (emailContent: string) => {
  const tempId = uuidv4();
  const filePath = path.join(TEMP_DIR, `${tempId}.eml`);
  
  await fs.promises.writeFile(filePath, emailContent, 'utf8');
  return tempId;
};

export const readTempEmail = async (tempId: string) => {
  const filePath = path.join(TEMP_DIR, `${tempId}.eml`);
  
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading temp email:', error);
    return null;
  }
};

export const deleteTempEmail = async (tempId: string) => {
  const filePath = path.join(TEMP_DIR, `${tempId}.eml`);
  
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting temp email:', error);
    return false;
  }
};

// Cleanup old temp files (older than 1 hour)
export const cleanupTempEmails = async () => {
  const files = await fs.promises.readdir(TEMP_DIR);
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  for (const file of files) {
    const filePath = path.join(TEMP_DIR, file);
    const stats = await fs.promises.stat(filePath);
    
    if (stats.mtimeMs < oneHourAgo) {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.error('Error cleaning up temp email:', error);
      }
    }
  }
}; 