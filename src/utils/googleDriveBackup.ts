interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
}

async function driveJson<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Google Drive returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  return payload as T;
}

async function getOrCreateBackupFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent("name='Pretty Little Fantasies Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  const result = await driveJson<{ files?: DriveFile[] }>(
    `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=10&fields=files(id,name)`,
    accessToken,
  );
  if (result.files?.[0]?.id) return result.files[0].id;

  const folder = await driveJson<DriveFile>(
    'https://www.googleapis.com/drive/v3/files?fields=id,name',
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pretty Little Fantasies Backups', mimeType: 'application/vnd.google-apps.folder' }),
    },
  );
  return folder.id;
}

export async function saveBackupToGoogleDrive(data: unknown, accessToken: string): Promise<DriveFile> {
  const folderId = await getOrCreateBackupFolder(accessToken);
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  const metadata = {
    name: `Pretty_Little_Fantasies_Backup_${date}.json`,
    mimeType: 'application/json',
    parents: [folderId],
  };
  const body = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const start = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': 'application/json',
      'X-Upload-Content-Length': String(body.size),
    },
    body: JSON.stringify(metadata),
  });
  if (!start.ok) {
    const payload = await start.json().catch(() => ({}));
    throw new Error(payload?.error?.message || `Google Drive could not start the backup upload (HTTP ${start.status}).`);
  }
  const uploadUrl = start.headers.get('Location');
  if (!uploadUrl) throw new Error('Google Drive did not return an upload link. Reconnect Drive and try again.');

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error?.message || `Google Drive could not save the backup (HTTP ${response.status}).`);
  }
  return result as DriveFile;
}
