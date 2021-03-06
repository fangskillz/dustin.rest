import { fromBuffer as typeFromBuffer } from 'file-type';
import { createHash } from 'crypto';
import * as stream from 'stream';

import { AlllowedTypes, UploadFile, UploadType } from 'utils/gcs';
import { GoogleStorage } from 'modules/config';

export async function Upload(base64: string, type: UploadType, name?: string): Promise<string> {
  // Decode the base64 value into a file buffer
  const file_uri = base64.split(';base64,')[1];

  // Get buffer and file type
  const buffer = Buffer.from(file_uri, 'base64');
  const file_type = await typeFromBuffer(buffer);

  // Ignore mimetypes that are not allowed
  if (!file_type?.mime || !AlllowedTypes.includes(file_type?.mime)) throw { code: 'invalid_file_type' };

  // Create the sha1 hash for the file name
  const hash = createHash('sha1').update(buffer).digest('hex').substring(0, 16);

  // Folder and file path
  const folder = type == 'image' ? GoogleStorage.ImagesFolder : GoogleStorage.UploadsFolder;
  const file_path = `${name || hash}.${file_type.ext}`;

  // Create the buffer stream
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer, 'base64');

  // Upload file using the upload utility
  await UploadFile({
    file: bufferStream,
    path: `${folder}/${file_path}`,
    public: true,
    type: file_type.mime
  });

  // Custom domain responses
  let url = `${GoogleStorage.Host}/${folder}/${file_path}`;
  if (type == 'image' && GoogleStorage.ImagesDomain) url = `${GoogleStorage.ImagesDomain}/${file_path}`;
  if (type == 'file' && GoogleStorage.UploadsDomain) url = `${GoogleStorage.UploadsDomain}/${file_path}`;

  return url;
}
