export type CharacterType = 'miacchiato' | 'americano' | 'cafeaulandon' | 'allanchino';
export type WeaponType = 'coffee_bean' | 'steam_blast' | 'milk_frother';
export type ScreenName = 'home' | 'join' | 'lobby' | 'game' | 'win';
export type AnimationState = 'idle' | 'walk' | 'attack';

export interface PlayerInfo {
  player_id: string;
  display_name: string;
  character: CharacterType | null;
  is_host: boolean;
  is_ready: boolean;
}

export interface PlayerGameState {
  player_id: string;
  x: number;
  y: number;
  velocity_x: number;
  velocity_y: number;
  direction: number;
  animation_state: AnimationState;
  health: number;
  alive: boolean;
}

export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface GameOverData {
  winner_id: string;
  placements: string[];
}

export interface LobbyStateMsg {
  type: 'lobby_state';
  players: PlayerInfo[];
}
