
export interface MessageRecipientInfo {
  teamId: string;
  teamName: string;
  teamAdminUsername: string; // Para referencia
  readAt?: string | null; // ISO string de cuándo fue leído, o null/undefined si no leído
}

export interface Message {
  id: string;
  title: string;
  content: string;
  senderId: 'gestorfenix'; // Podría ser el user.id del fenix_master en el futuro
  sentAt: string; // ISO date string
  recipients: MessageRecipientInfo[]; // Lista de todos los destinatarios individuales, incluso si se envió a "todos"
  isGlobal: boolean; // True si la intención original fue enviar a "Todos"
}

export const GESTOR_FENIX_MESSAGES_STORAGE_KEY = 'gestorFenix_messages_v1';


// --- New types for Club internal messages ---

export interface ClubMessageRecipient {
    id: string; // Coach ID
    name: string;
    readAt: string | null;
}

export interface ClubMessage {
    id: string;
    teamId?: string; // Para mensajes de team_admin, undefined para admin global
    title: string;
    content: string;
    sender: {
        id: string;
        name: string;
    };
    sentAt: string; // ISO date string
    recipientIds: string[]; // Array of coach IDs
    recipients: ClubMessageRecipient[]; // Detailed info for display
    isToAllCoaches: boolean;
}

export const CLUB_MESSAGES_STORAGE_KEY = 'club_messages_v1';
