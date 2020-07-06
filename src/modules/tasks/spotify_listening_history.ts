import { CassandraClient, Types } from '@dustinrouillard/database/cassandra';

import { Log } from '@dustinrouillard/fastify-utilities/modules/logger';

import { GetCurrentPlaying } from 'helpers/spotify';
import { DatabaseSpotifyHistory } from 'modules/interfaces/ISpotify';

const MS = 10000;

async function LogSpotifyListenHistory(): Promise<void> {
  // Pull spotify now playing data
  const spotify_playing = await GetCurrentPlaying();

  // Ignore if nothing is playing
  if (!spotify_playing.is_playing) return;

  // Get the last spotify entry where the id matches (if one does)
  const last_spotify_entry: DatabaseSpotifyHistory | Types.Row = (
    await CassandraClient.execute('SELECT item_id, item_length_ms, date FROM spotify_song_history WHERE item_id = ?  ALLOW FILTERING', [spotify_playing.item_id])
  ).first();

  // Ignore the entry if it's the same id
  if (last_spotify_entry && new Date(last_spotify_entry.date).getTime() + last_spotify_entry.item_length_ms < new Date().getTime()) return;

  // Store the entry in the database
  await CassandraClient.execute(
    'INSERT INTO spotify_song_history (date, device_name, device_type, item_name, item_author, item_type, item_id, item_image, item_length_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      new Date(spotify_playing.started_at || Date.now()),
      spotify_playing.device_name,
      spotify_playing.device_type,
      spotify_playing.item_name,
      spotify_playing.item_author,
      spotify_playing.item_type,
      spotify_playing.item_id,
      spotify_playing.item_image,
      spotify_playing.item_length_ms,
    ],
  );
}

(async (): Promise<void> => {
  Log(`Starting task runner for tracking spotify listen history [${MS} ms]`);
  LogSpotifyListenHistory();
  setInterval(LogSpotifyListenHistory, MS);
})();