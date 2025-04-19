import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';

@Table({
  tableName: 'messages',
  underscored: true
})
export class Message extends Model<Message> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @ForeignKey(() => ChatRoom)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'chat_room_id'
  })
  chatRoomId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'sender_id'
  })
  senderId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  content: string;

  // Relationships will be handled in the entity but not in migrations
  @BelongsTo(() => ChatRoom)
  chatRoom: ChatRoom;

  @BelongsTo(() => User)
  sender: User;
} 