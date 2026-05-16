import { pool } from '../db/pool';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export class DbService {
  
//   // 1. Fetching a server by ID safely
//   async getServerById(id: number): Promise<GameServer | null> {
//     const [rows] = await pool.execute<RowDataPacket[]>(
//       'SELECT * FROM game_servers WHERE server_id = ?', 
//       [id]
//     );

//     if (rows.length === 0) return null;

//     // Use Zod parsing to clean, parse, validate, and convert timestamps back to raw JS Dates
//     return CoreServerSettingsSchema.parse(rows[0]);
//   }

//   // 2. Creating a new game instance entries
//   async createServer(server: NewGameServerInput): Promise<number> {
//     const [result] = await pool.execute<ResultSetHeader>(
//       `INSERT INTO game_servers (
//         name, game_container, container_id, ram_alloc_mb, 
//         max_num_players, status, host_port, default_host_port, created_by
//        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         server.name,
//         server.game_container,
//         server.container_id,
//         server.ram_alloc_mb,
//         server.max_num_players ?? 5,
//         server.status ?? 'starting',
//         server.host_port,
//         server.default_host_port || null, // Convert optional undefined variables to SQL NULL values
//         server.created_by
//       ]
//     );

//     return result.insertId;
//   }

//   // 3. Modifying active server status shifts (e.g., stopping/running)
//   async updateContainerStatus(id: number, containerId: string, status: string): Promise<boolean> {
//     const [result] = await pool.execute<ResultSetHeader>(
//       'UPDATE game_servers SET container_id = ?, status = ? WHERE server_id = ?',
//       [containerId, status, id]
//     );
//     return result.affectedRows > 0;
//   }
}