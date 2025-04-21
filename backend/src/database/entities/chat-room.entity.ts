import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Message } from './message.entity';
import { ChatRoomMember } from './chat-room-member.entity';

@Table({
  tableName: 'chat_rooms',
  underscored: true
})
export class ChatRoom extends Model<ChatRoom> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_system'
  })
  isSystem: boolean;

  // Relationships will be handled in the entity but not in migrations
  @HasMany(() => Message, 'chat_room_id')
  messages: Message[];

  @HasMany(() => ChatRoomMember, 'chat_room_id')
  members: ChatRoomMember[];
} 