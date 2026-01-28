import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { TransactionRepository } from './repository';
import * as Updates from 'expo-updates';

const DB_NAME = 'crescender_geargrabber.db';
const ASSETS_DIR = FileSystem.documentDirectory + 'assets/';
const DB_PATH = FileSystem.documentDirectory + 'SQLite/' + DB_NAME;

export class BackupService {

  /**
   * Create a full backup of the database and local images.
   */
  static async exportBackup(): Promise<string> {
    const zip = new JSZip();
    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      platform: 'ios', // or android
    };
    
    // 1. Add Manifest
    zip.file('manifest.json', JSON.stringify(manifest));

    // 2. Add Database
    // We must copy it to a temp location first to avoid locking issues (though SQLite is usually file-based)
    const tempDbPath = FileSystem.cacheDirectory + 'backup_sqllite.db';
    await FileSystem.copyAsync({ from: DB_PATH, to: tempDbPath });
    const dbContent = await FileSystem.readAsStringAsync(tempDbPath, { encoding: FileSystem.EncodingType.Base64 });
    zip.file('database.sqlite', dbContent, { base64: true });

    // 3. Add Assets
    // Find all images that are locally stored
    // Heuristic: Check DB for image_url starting with file://
    // For now, simpler approach: just zip the whole known assets folder if we are managing it there.
    // If images are scattered, we need to query.
    // Let's assume we copy all images to documentDirectory/assets/ on creation.
    
    const assetsInfo = await FileSystem.getInfoAsync(ASSETS_DIR);
    if (assetsInfo.exists && assetsInfo.isDirectory) {
      const assets = await FileSystem.readDirectoryAsync(ASSETS_DIR);
      const assetsFolder = zip.folder('assets');
      
      for (const asset of assets) {
         const assetPath = ASSETS_DIR + asset;
         const content = await FileSystem.readAsStringAsync(assetPath, { encoding: FileSystem.EncodingType.Base64 });
         assetsFolder?.file(asset, content, { base64: true });
      }
    }

    // 4. Generate Zip
    const content = await zip.generateAsync({ type: 'base64' });
    const backupPath = FileSystem.cacheDirectory + `crescender_backup_${Date.now()}.zip`;
    await FileSystem.writeAsStringAsync(backupPath, content, { encoding: FileSystem.EncodingType.Base64 });

    // 5. Share
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupPath);
    }
    
    return backupPath;
  }

  /**
   * Restore from a .zip backup file.
   * WARNING: Destructive operation.
   */
  static async importBackup(): Promise<boolean> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/x-zip-compressed'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return false;
      
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      
      const zip = await JSZip.loadAsync(fileContent, { base64: true });
      
      // Validate
      if (!zip.file('database.sqlite') || !zip.file('manifest.json')) {
        throw new Error("Invalid backup file: Missing critical components.");
      }

      // Restore Database
      const dbData = await zip.file('database.sqlite')?.async('base64');
      if (dbData) {
        // Ensure folder exists
        const sqliteDir = FileSystem.documentDirectory + 'SQLite/';
        const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
        if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(sqliteDir);

        // Overwrite
        await FileSystem.writeAsStringAsync(DB_PATH, dbData, { encoding: FileSystem.EncodingType.Base64 });
      }

      // Restore Assets
      const assetsFolder = zip.folder('assets');
      if (assetsFolder) {
        const assetsDirInfo = await FileSystem.getInfoAsync(ASSETS_DIR);
        if (!assetsDirInfo.exists) await FileSystem.makeDirectoryAsync(ASSETS_DIR);

        assetsFolder.forEach(async (relativePath, file) => {
           const content = await file.async('base64');
           await FileSystem.writeAsStringAsync(ASSETS_DIR + relativePath, content, { encoding: FileSystem.EncodingType.Base64 });
        });
      }

      // Reload
      await Updates.reloadAsync();
      return true;

    } catch (e) {
      console.error("Restore failed:", e);
      return false;
    }
  }
}
