interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
}

async function driveJson<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(url, { ...init, headers });
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

/** Creates or updates one private journal backup file in the app's Drive backup folder. */
export async function saveJournalToGoogleDrive(pages: unknown, accessToken: string): Promise<DriveFile> {
  const folderId = await getOrCreateBackupFolder(accessToken);
  const name = 'Pretty_Little_Fantasies_Digital_Junk_Journal.json';
  const query = encodeURIComponent(`name='${name}' and '${folderId}' in parents and trashed=false`);
  const existing = await driveJson<DriveFileList>(
    `https://www.googleapis.com/drive/v3/files?q=${query}&pageSize=1&fields=files(id,name,webViewLink)`,
    accessToken,
  );
  const contents = JSON.stringify({ app: 'Pretty Little Fantasies', kind: 'digital-junk-journal', updatedAt: new Date().toISOString(), pages }, null, 2);
  const file = existing.files?.[0];
  if (file?.id) {
    return driveJson<DriveFile>(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(file.id)}?uploadType=media&fields=id,name,webViewLink`,
      accessToken,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: contents },
    );
  }

  const metadata = JSON.stringify({ name, mimeType: 'application/json', parents: [folderId] });
  const boundary = 'plf_journal_boundary_2026';
  const multipart = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`,
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${contents}`,
    `--${boundary}--`,
  ].join('\r\n');
  return driveJson<DriveFile>(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    accessToken,
    { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart },
  );
}
