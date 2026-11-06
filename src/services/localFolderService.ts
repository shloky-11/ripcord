/**
 * Local Folder Storage Service using the File System Access API
 * Allows saving downloaded media files directly to the user's designated local directory.
 */

const DB_NAME = 'pulsetube_fs_db';
const STORE_NAME = 'handles';
const KEY_DIR_HANDLE = 'saved_directory_handle';

// Open or create IndexedDB for directory handle persistence
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store directory handle in IndexedDB
async function storeHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(handle, KEY_DIR_HANDLE);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Retrieve stored directory handle from IndexedDB
async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_DIR_HANDLE);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

class LocalFolderService {
  private dirHandle: FileSystemDirectoryHandle | null = null;
  private folderName: string = '';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('pulsetube_folder_name');
      if (savedName) this.folderName = savedName;
      this.tryRestoreHandle();
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public getFolderName(): string {
    return this.folderName || (this.isSupported ? 'System Downloads' : 'Default Downloads');
  }

  public hasSelectedDirectory(): boolean {
    return Boolean(this.dirHandle);
  }

  // Attempt to restore directory handle from IndexedDB on startup
  public async tryRestoreHandle(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      const handle = await getStoredHandle();
      if (handle) {
        // Query if permission is still granted
        const queryOpts = { mode: 'readwrite' as const };
        const perm = await (handle as any).queryPermission(queryOpts);
        if (perm === 'granted') {
          this.dirHandle = handle;
          this.folderName = handle.name;
          localStorage.setItem('pulsetube_folder_name', handle.name);
          return true;
        } else {
          // Keep handle cached, user may re-verify on click
          this.dirHandle = handle;
          this.folderName = handle.name;
          return false;
        }
      }
    } catch (err) {
      console.warn('Failed restoring directory handle:', err);
    }
    return false;
  }

  // Prompt user to select a folder on their computer
  public async selectFolder(): Promise<{ success: boolean; name?: string; error?: string }> {
    if (!this.isSupported) {
      return {
        success: false,
        error: 'Your browser does not support the File System Access API. Standard browser downloads will be used instead.',
      };
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        id: 'pulsetube-downloads-folder',
        mode: 'readwrite',
        startIn: 'downloads',
      });

      this.dirHandle = handle;
      this.folderName = handle.name;
      localStorage.setItem('pulsetube_folder_name', handle.name);
      await storeHandle(handle);

      return { success: true, name: handle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Folder selection was cancelled.' };
      }
      return { success: false, error: err.message || 'Failed to select folder.' };
    }
  }

  // Save file to chosen directory via File System Access API or fallback
  public async saveFileToFolder(
    fileName: string,
    fileBlobOrUrl: Blob | string
  ): Promise<{ success: boolean; savedPath?: string; error?: string }> {
    // If directory handle is available, write directly to the local folder
    if (this.dirHandle) {
      try {
        // Check/request permission if needed
        const permStatus = await (this.dirHandle as any).requestPermission({ mode: 'readwrite' });
        if (permStatus === 'granted') {
          const fileHandle = await this.dirHandle.getFileHandle(fileName, { create: true });
          const writable = await (fileHandle as any).createWritable();

          if (typeof fileBlobOrUrl === 'string') {
            const resp = await fetch(fileBlobOrUrl);
            if (!resp.body) throw new Error('No stream body');
            await resp.body.pipeTo(writable);
          } else {
            await writable.write(fileBlobOrUrl);
            await writable.close();
          }

          return { success: true, savedPath: `${this.folderName}/${fileName}` };
        }
      } catch (err: any) {
        console.warn('Direct FS write failed, falling back to browser download:', err);
      }
    }

    // Fallback: standard automatic browser download
    try {
      const url = typeof fileBlobOrUrl === 'string' ? fileBlobOrUrl : URL.createObjectURL(fileBlobOrUrl);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (typeof fileBlobOrUrl !== 'string') {
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }

      return { success: true, savedPath: fileName };
    } catch (err: any) {
      return { success: false, error: err.message || 'Download failed.' };
    }
  }
}

export const localFolderService = new LocalFolderService();
