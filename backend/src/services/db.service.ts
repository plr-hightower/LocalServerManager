import { CoreServerSettingsS, ServerSettingsS, ServerSettingsSchema, StatusE } from '@hightower/shared';
import { pool } from '../db/pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export class DbService {
  
  async getServerById(id: number): Promise< ServerSettingsS | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM game_servers WHERE server_id = ?', 
      [id]
    );
    if (rows.length === 0) return null;
    return ServerSettingsSchema.parse(rows[0]);
  }

  async createServer(server: ServerSettingsS): Promise<number> {
    try {
      const { core_settings, game_settings } = server;
      const gameSettingsJson = JSON.stringify(game_settings ?? {});

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO servers(
          name, game_container, container_id, ram_alloc_mb, 
          max_num_players, status, host_port, default_host_port, 
          created_by, game_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          core_settings.name,
          core_settings.game_container, // Matches your schema's typo
          core_settings.container_id,
          core_settings.ram_alloc_mb,
          core_settings.max_num_players ?? 5,
          core_settings.status ?? 'starting',
          core_settings.host_port,
          core_settings.default_host_port ?? null,
          core_settings.created_by,
          gameSettingsJson
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Failed to create game server in DB:', error);
      throw error;
    }
  }

  async updateContainerStatus(serverId: number, status: StatusE): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      'UPDATE game_servers SET status = ? WHERE server_id = ?',
      [ status, serverId]
    );
    return result.affectedRows > 0;
  }
}