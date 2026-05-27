import { CoreServerSettingsS, CoreServerSettingsSchema, GameE, ServerSettingsS, ServerSettingsSchema, StatusE } from '@hightower/shared';
import { pool } from '../db/pool';
import type { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2';
import { Server } from 'http';

export class DbService {
  
  async getServerByName(name: string): Promise<ServerSettingsS | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM servers WHERE name = ?',
      [name]
    );
    if (rows.length === 0) return null;
    return rowToServerSettings(rows[0]);
  }

  async getServersByGame(game_container:GameE): Promise<ServerSettingsS[]> {
    try{
      const result:[RowDataPacket[],FieldPacket[]] = await pool.execute("SELECT * FROM servers WHERE game_container = ?;", [game_container]);
      const rows = result[0];
      let servers:ServerSettingsS[] = [];

      for( const server of rows){
        servers.push(rowToServerSettings(server));
      }

      return servers;

    } catch (err) {
      throw err;
    }
  }

  async logNewServer(server: ServerSettingsS): Promise<number> {
    try {
      const { core_settings, game_settings } = server;
      const gameSettingsJson = JSON.stringify(game_settings ?? {});

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO servers(
            name, game_container, container_id, ram_alloc_mb, 
            max_num_players, status, host_port, default_host_port, 
            created_by, created_at, game_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            core_settings.created_at,
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

  async getServerList(): Promise<ServerSettingsS[] | null>{
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM servers'
    );
    if(rows.length === 0){
      return null;
    }
    let results:ServerSettingsS[] = [];
    rows.forEach(element => {

      let parsedGameSettings = {};
      if (element.game_settings) {
        try {
          parsedGameSettings = typeof element.game_settings === 'string' 
            ? JSON.parse(element.game_settings) 
            : element.game_settings;
        } catch (e) {
          console.error("Failed to parse game_settings JSON:", e);
        }
      }

      const transformedData = {
        core_settings: {
          server_id: element.server_id,
          name: element.name,
          game_container: element.game_container, 
          container_id: element.container_id,
          ram_alloc_mb: element.ram_alloc_mb,
          max_num_players: element.max_num_players,
          status: element.status,
          host_port: element.host_port,
          default_host_port: element.default_host_port,
          created_by: element.created_by,
          created_at: element.created_at
        },
        game_settings: parsedGameSettings
      };

      results.push(ServerSettingsSchema.parse(transformedData));
    });

    return results;
  }

}  
function rowToServerSettings(row: RowDataPacket): ServerSettingsS {
  return ServerSettingsSchema.parse({
    core_settings: {
      server_id:        row.server_id,
      name:             row.name,
      game_container:   row.game_container,
      container_id:     row.container_id,
      ram_alloc_mb:     row.ram_alloc_mb,
      max_num_players:  row.max_num_players,
      status:           row.status,
      host_port:        row.host_port,
      default_host_port: row.default_host_port,
      created_by:       row.created_by,
      created_at:       row.created_at,
    },
    game_settings: typeof row.game_settings === 'string'
      ? JSON.parse(row.game_settings)
      : row.game_settings,
  });
}