import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';

@Table({
  tableName: 'chat_room_members',
  underscored: true
})
export class ChatRoomMember extends Model<ChatRoomMember> {
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
    field: 'user_id'
  })
  userId: number;

  // Relationships will be handled in the entity but not in migrations
  @BelongsTo(() => ChatRoom)
  chatRoom: ChatRoom;

  @BelongsTo(() => User)
  user: User;
} 